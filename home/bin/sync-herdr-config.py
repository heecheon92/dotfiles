#!/usr/bin/env python3
"""Synchronize shared Herdr key bindings into a writable local config."""

from __future__ import annotations

import copy
import json
import os
import re
import stat
import sys
import tempfile
from pathlib import Path
from typing import Any

import tomlkit
from tomlkit.items import AoT, Table

STATE_VERSION = 1
BACKUP_SUFFIX = ".before-dotfiles-sync"
STATE_SUFFIX = ".dotfiles-keys.json"
RADAR_NAMES = ("herdr-radar", "herdr-kit")
RADAR_BLOCKS = ("tab-bar", "theme", "sidebar")
RADAR_GUARD_PREFIX = "__dotfiles_sync_radar_guard_"


class SyncError(Exception):
    pass


def read_bytes(path: Path, label: str) -> bytes:
    try:
        return path.read_bytes()
    except OSError as exc:
        raise SyncError(f"cannot read {label} {path}: {exc.strerror or exc}") from exc


def parse_toml(raw: bytes, path: Path) -> Any:
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise SyncError(f"{path} is not valid UTF-8") from exc
    try:
        return tomlkit.parse(text)
    except Exception as exc:
        raise SyncError(f"malformed TOML in {path}: {exc}") from exc

def shield_radar_blocks(raw: bytes, path: Path) -> tuple[bytes, list[tuple[str, str]]]:
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise SyncError(f"{path} is not valid UTF-8") from exc
    if RADAR_GUARD_PREFIX in text:
        raise SyncError(f"reserved Radar guard name already exists in {path}")

    spans: list[tuple[int, int, str]] = []
    for name in RADAR_NAMES:
        for block in RADAR_BLOCKS:
            start = f"# >>> {name} {block} block"
            end = f"# <<< {name} {block} block"
            start_count = len(re.findall(rf"^{re.escape(start)}[ \t]*\r?$", text, re.MULTILINE))
            end_count = len(re.findall(rf"^{re.escape(end)}[ \t]*\r?$", text, re.MULTILINE))
            if start_count != end_count or start_count > 1:
                raise SyncError(f"unmatched or duplicate Radar {block} markers in {path}")
            if start_count == 0:
                continue
            match = re.search(
                rf"^{re.escape(start)}[ \t]*\r?\n.*?^{re.escape(end)}[ \t]*\r?(?=\n|$)",
                text,
                re.MULTILINE | re.DOTALL,
            )
            if match is None:
                raise SyncError(f"malformed Radar {block} block in {path}")
            spans.append((match.start(), match.end(), match.group(0)))

    spans.sort()
    if any(left[1] > right[0] for left, right in zip(spans, spans[1:])):
        raise SyncError(f"overlapping Radar blocks in {path}")

    guards: list[tuple[str, str]] = []
    for index, (start, end, block) in reversed(list(enumerate(spans))):
        guard = f"[{RADAR_GUARD_PREFIX}{index}]\nvalue = true"
        text = text[:start] + guard + text[end:]
        guards.append((guard, block))
    guards.reverse()
    return text.encode("utf-8"), guards


def restore_radar_blocks(text: str, guards: list[tuple[str, str]], path: Path) -> str:
    for guard, block in guards:
        if text.count(guard) != 1:
            raise SyncError(f"Radar guard was not preserved while updating {path}")
        text = text.replace(guard, block)
    return text


def plain_binding(
    binding: Table, path: Path, mode: str, allow_aliases: bool
) -> tuple[dict[str, Any], list[str]]:
    value = binding.unwrap()
    if not isinstance(value, dict):
        raise SyncError(f"unexpected binding in {path}: keys.{mode} entries must be tables")
    key = value.get("key")
    if isinstance(key, str) and key:
        aliases = [key]
    elif (
        allow_aliases
        and isinstance(key, list)
        and key
        and all(isinstance(alias, str) and alias for alias in key)
        and len(set(key)) == len(key)
    ):
        aliases = key
    elif isinstance(key, list) and not allow_aliases:
        raise SyncError(f"unsupported shared alias binding in {path}: keys.{mode}")
    else:
        raise SyncError(f"unexpected binding in {path}: keys.{mode} entry has an invalid key")
    try:
        json.dumps(value, allow_nan=False)
    except (TypeError, ValueError) as exc:
        raise SyncError(f"unsupported value in {path}: keys.{mode}") from exc
    return value, aliases


def inspect_keys(
    document: Any, path: Path, allow_aliases: bool = True
) -> tuple[Table | None, dict[tuple[str, str], tuple[AoT, int, Table, dict[str, Any]]]]:
    keys = document.get("keys")
    if keys is None:
        return None, {}
    if not isinstance(keys, Table):
        raise SyncError(f"unexpected structure in {path}: keys must be a table")

    records: dict[tuple[str, str], tuple[AoT, int, Table, dict[str, Any]]] = {}
    for mode, bindings in keys.items():
        if not isinstance(mode, str) or not mode:
            raise SyncError(f"unexpected structure in {path}: key mode must be a non-empty string")
        if not isinstance(bindings, AoT):
            if mode == "command":
                raise SyncError(f"unexpected structure in {path}: keys.command must be an array of tables")
            if not allow_aliases:
                raise SyncError(f"unsupported shared key setting in {path}: keys.{mode}; only command arrays are synchronized")
            continue
        for index, binding in enumerate(bindings):
            if not isinstance(binding, Table):
                raise SyncError(f"unexpected structure in {path}: keys.{mode} entries must be tables")
            value, aliases = plain_binding(binding, path, mode, allow_aliases)
            for alias in aliases:
                identity = (mode, alias)
                if identity in records:
                    raise SyncError(f"duplicate key identity in {path}: {mode}/{alias}")
                records[identity] = (bindings, index, binding, value)
    return keys, records


def state_records(path: Path) -> dict[tuple[str, str], dict[str, Any]] | None:
    if not os.path.lexists(path):
        return None
    raw = read_bytes(path, "state file")
    try:
        state = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise SyncError(f"malformed state file {path}: {exc}") from exc
    if not isinstance(state, dict) or set(state) != {"version", "records"}:
        raise SyncError(f"unexpected structure in state file {path}")
    if state["version"] != STATE_VERSION or not isinstance(state["records"], list):
        raise SyncError(f"unsupported state file {path}")

    result: dict[tuple[str, str], dict[str, Any]] = {}
    for entry in state["records"]:
        if not isinstance(entry, dict) or set(entry) != {"mode", "key", "binding"}:
            raise SyncError(f"unexpected record in state file {path}")
        mode, key, binding = entry["mode"], entry["key"], entry["binding"]
        if not isinstance(mode, str) or not mode or not isinstance(key, str) or not key or not isinstance(binding, dict):
            raise SyncError(f"unexpected record in state file {path}")
        if binding.get("key") != key:
            raise SyncError(f"inconsistent record in state file {path}: {mode}/{key}")
        try:
            json.dumps(binding, allow_nan=False)
        except (TypeError, ValueError) as exc:
            raise SyncError(f"unsupported record in state file {path}: {mode}/{key}") from exc
        identity = (mode, key)
        if identity in result:
            raise SyncError(f"duplicate record in state file {path}: {mode}/{key}")
        result[identity] = binding
    return result


def ensure_mode(keys: Table | None, document: Any, mode: str) -> AoT:
    if keys is None:
        keys = tomlkit.table()
        document["keys"] = keys
    bindings = keys.get(mode)
    if bindings is None:
        bindings = tomlkit.aot()
        keys[mode] = bindings
    if not isinstance(bindings, AoT):
        raise SyncError(f"unexpected structure while creating keys.{mode}")
    return bindings


def remove_binding(document: Any, identity: tuple[str, str], path: Path) -> bool:
    _, records = inspect_keys(document, path)
    record = records.get(identity)
    if record is None:
        return False
    bindings, index, _, _ = record
    del bindings[index]
    return True


def replace_binding(document: Any, identity: tuple[str, str], source: Table, path: Path) -> None:
    _, records = inspect_keys(document, path)
    target = records[identity][2]
    source_value = source.unwrap()
    target_value = target.unwrap()
    for name in list(target):
        if name not in source_value:
            del target[name]
    for name in source:
        if name in target_value and target_value[name] == source_value[name]:
            continue
        replacement = copy.deepcopy(source.item(name))
        if name in target:
            local_item = target.item(name)
            local_trivia = getattr(local_item, "trivia", None)
            replacement_trivia = getattr(replacement, "trivia", None)
            if local_trivia is not None and replacement_trivia is not None and local_trivia.comment:
                replacement_trivia.comment_ws = local_trivia.comment_ws
                replacement_trivia.comment = local_trivia.comment
        target[name] = replacement


def add_binding(document: Any, mode: str, source: Table, path: Path) -> None:
    keys, _ = inspect_keys(document, path)
    ensure_mode(keys, document, mode).append(copy.deepcopy(source))


def remove_obsolete_setting(document: Any, path: Path) -> bool:
    experimental = document.get("experimental")
    if experimental is None:
        return False
    if not isinstance(experimental, Table):
        raise SyncError(f"unexpected structure in {path}: experimental must be a table")
    if "kitty_graphics" not in experimental:
        return False
    del experimental["kitty_graphics"]
    return True


def serialized_state(shared: dict[tuple[str, str], tuple[AoT, int, Table, dict[str, Any]]]) -> bytes:
    records = [
        {"mode": mode, "key": key, "binding": shared[(mode, key)][3]}
        for mode, key in sorted(shared)
    ]
    return (json.dumps({"version": STATE_VERSION, "records": records}, indent=2, sort_keys=True, allow_nan=False) + "\n").encode()


def fsync_directory(directory: Path) -> None:
    try:
        descriptor = os.open(directory, os.O_RDONLY)
    except OSError:
        return
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def atomic_write(path: Path, data: bytes) -> None:
    try:
        descriptor, temporary_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    except OSError as exc:
        raise SyncError(f"cannot create temporary file for {path}: {exc.strerror or exc}") from exc
    temporary = Path(temporary_name)
    try:
        os.fchmod(descriptor, 0o600)
        with os.fdopen(descriptor, "wb") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
        fsync_directory(path.parent)
    except Exception:
        try:
            os.close(descriptor)
        except OSError:
            pass
        try:
            temporary.unlink()
        except FileNotFoundError:
            pass
        raise


def ensure_backup(path: Path, original: bytes) -> str:
    backup = Path(f"{path}{BACKUP_SUFFIX}")
    if os.path.lexists(backup):
        try:
            metadata = backup.lstat()
        except OSError as exc:
            raise SyncError(f"cannot inspect backup {backup}: {exc.strerror or exc}") from exc
        if not stat.S_ISREG(metadata.st_mode):
            raise SyncError(f"refusing unexpected backup path {backup}")
        if stat.S_IMODE(metadata.st_mode) != 0o600:
            try:
                backup.chmod(0o600)
            except OSError as exc:
                raise SyncError(f"cannot secure backup {backup}: {exc.strerror or exc}") from exc
        return "kept"

    try:
        descriptor, temporary_name = tempfile.mkstemp(prefix=f".{backup.name}.", dir=backup.parent)
    except OSError as exc:
        raise SyncError(f"cannot create backup for {path}: {exc.strerror or exc}") from exc
    temporary = Path(temporary_name)
    try:
        os.fchmod(descriptor, 0o600)
        with os.fdopen(descriptor, "wb") as stream:
            stream.write(original)
            stream.flush()
            os.fsync(stream.fileno())
        try:
            os.link(temporary, backup)
            status = "created"
            fsync_directory(backup.parent)
        except FileExistsError:
            status = "kept"
        temporary.unlink()
        return status
    except Exception:
        try:
            os.close(descriptor)
        except OSError:
            pass
        try:
            temporary.unlink()
        except FileNotFoundError:
            pass
        raise


def needs_write(path: Path, data: bytes) -> bool:
    if not os.path.lexists(path) or path.is_symlink():
        return True
    try:
        metadata = path.stat()
    except OSError as exc:
        raise SyncError(f"cannot inspect {path}: {exc.strerror or exc}") from exc
    if not stat.S_ISREG(metadata.st_mode):
        raise SyncError(f"refusing to replace non-file {path}")
    return stat.S_IMODE(metadata.st_mode) != 0o600 or read_bytes(path, "file") != data


def sync(shared_path: Path, active_path: Path) -> str:
    if shared_path == active_path:
        raise SyncError("SHARED and ACTIVE must be different paths")
    if not shared_path.is_file():
        raise SyncError(f"shared config is not a regular file: {shared_path}")
    if not active_path.parent.is_dir():
        raise SyncError(f"active config directory does not exist: {active_path.parent}")

    shared_document = parse_toml(read_bytes(shared_path, "shared config"), shared_path)
    _, shared = inspect_keys(shared_document, shared_path, allow_aliases=False)

    active_exists = os.path.lexists(active_path)
    original_active: bytes | None = None
    radar_guards: list[tuple[str, str]] = []
    if active_exists:
        original_active = read_bytes(active_path, "active config")
        shielded_active, radar_guards = shield_radar_blocks(original_active, active_path)
        active_document = parse_toml(shielded_active, active_path)
    else:
        active_document = copy.deepcopy(shared_document)
    _, active = inspect_keys(active_document, active_path)

    state_path = Path(f"{active_path}{STATE_SUFFIX}")
    previous = state_records(state_path)

    added = updated = removed = preserved = adopted = 0
    if not active_exists:
        added = len(shared)
    elif previous is None:
        for identity, (_, _, _, shared_value) in shared.items():
            active_record = active.get(identity)
            if active_record is None:
                add_binding(active_document, identity[0], shared[identity][2], active_path)
                added += 1
            elif active_record[3] == shared_value:
                adopted += 1
            else:
                preserved += 1
    else:
        for identity, old_value in previous.items():
            active_record = active.get(identity)
            shared_record = shared.get(identity)
            if active_record is None:
                preserved += 1
            elif active_record[3] != old_value:
                preserved += 1
            elif shared_record is None:
                if remove_binding(active_document, identity, active_path):
                    removed += 1
            elif active_record[3] != shared_record[3]:
                replace_binding(active_document, identity, shared_record[2], active_path)
                updated += 1

        _, active_after_updates = inspect_keys(active_document, active_path)
        for identity, shared_record in shared.items():
            if identity in previous:
                continue
            if identity in active_after_updates:
                if active_after_updates[identity][3] == shared_record[3]:
                    adopted += 1
                else:
                    preserved += 1
            else:
                add_binding(active_document, identity[0], shared_record[2], active_path)
                added += 1
                _, active_after_updates = inspect_keys(active_document, active_path)

    obsolete_removed = remove_obsolete_setting(active_document, active_path)
    active_text = restore_radar_blocks(tomlkit.dumps(active_document), radar_guards, active_path)
    active_data = active_text.encode("utf-8")
    parse_toml(active_data, active_path)
    state_data = serialized_state(shared)

    backup_status = "none"
    if original_active is not None:
        backup_status = ensure_backup(active_path, original_active)

    active_changed = needs_write(active_path, active_data)
    if active_changed:
        atomic_write(active_path, active_data)
    state_changed = needs_write(state_path, state_data)
    if state_changed:
        atomic_write(state_path, state_data)

    return (
        f"herdr key sync: added={added} updated={updated} removed={removed} "
        f"preserved={preserved} adopted={adopted} obsolete_removed={int(obsolete_removed)}; "
        f"backup={backup_status}; active={'updated' if active_changed else 'unchanged'}; "
        f"state={'updated' if state_changed else 'unchanged'}"
    )


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print(f"Usage: {Path(argv[0]).name} SHARED ACTIVE", file=sys.stderr)
        return 2
    try:
        summary = sync(Path(argv[1]), Path(argv[2]))
    except SyncError as exc:
        print(f"sync-herdr-config: {exc}", file=sys.stderr)
        return 1
    except OSError as exc:
        print(f"sync-herdr-config: {exc}", file=sys.stderr)
        return 1
    print(summary)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
