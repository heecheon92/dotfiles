#!/usr/bin/env python3
"""Local review checkpoints; never installs OMP or makes model requests."""

import argparse
import contextlib
import datetime
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from urllib.parse import quote

VERSION = re.compile(r"(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?")


def version_parts(value):
    match = VERSION.fullmatch(value)
    if not match:
        raise ValueError(f"Invalid semantic version: {value!r}")
    for group in (match[4], match[5]):
        if group and any(not part for part in group.split('.')):
            raise ValueError("Empty version identifier")
    pre = match[4].split('.') if match[4] else []
    if any(part.isdigit() and len(part) > 1 and part.startswith('0') for part in pre):
        raise ValueError("Leading zero in numeric prerelease identifier")
    return tuple(map(int, match.group(1, 2, 3))), pre


def compare_versions(left, right):
    a, ap = version_parts(left)
    b, bp = version_parts(right)
    if a != b:
        return (a > b) - (a < b)
    if not ap or not bp:
        return (not ap) - (not bp)
    for x, y in zip(ap, bp):
        if x == y:
            continue
        if x.isdigit() and y.isdigit():
            return (int(x) > int(y)) - (int(x) < int(y))
        if x.isdigit() != y.isdigit():
            return -1 if x.isdigit() else 1
        return (x > y) - (x < y)
    return (len(ap) > len(bp)) - (len(ap) < len(bp))


def run(command):
    result = subprocess.run(command, capture_output=True, text=True, timeout=30)
    if result.returncode:
        # Do not relay arbitrary process output that might contain private settings.
        raise ValueError(f"OMP discovery command failed (exit {result.returncode}): {command[1:]}")
    return result.stdout.strip()


def discover(executable):
    invoked = shutil.which(executable)
    if not invoked:
        raise ValueError(f"OMP executable not found: {executable}")
    real = Path(invoked).resolve(strict=True)
    output = run([invoked, '--version'])
    version = re.sub(r'^omp(?:/|\s+v?)', '', output)
    version_parts(version)
    channel = json.loads(run([invoked, 'config', 'get', 'update.channel', '--json']))['value']
    if channel not in ('stable', 'canary'):
        raise ValueError(f"Unsupported channel: {channel!r}")
    marker = real.parent.parent / 'manager.json'
    manager = None
    if marker.exists():
        metadata = json.loads(marker.read_text())
        manager = metadata.get('manager')
        if not isinstance(manager, str) or not manager:
            raise ValueError('Invalid external-manager metadata')
    return {'version': version, 'channel': channel, 'executable': str(real),
            'invokedPath': invoked, 'externalManager': manager}


def read_state(path, profile):
    if path.is_symlink():
        raise ValueError('Checkpoint must be a local regular file, not a symlink')
    try:
        raw = path.read_bytes()
    except FileNotFoundError:
        return None, 'missing'
    data = json.loads(raw)
    if data.get('schemaVersion') != 1 or data.get('profile') != profile:
        raise ValueError('Unsupported checkpoint schema or profile mismatch')
    reviewed = data['lastReviewed']
    version_parts(reviewed['version'])
    if reviewed['channel'] not in ('stable', 'canary'):
        raise ValueError('Invalid checkpoint channel')
    timestamp = datetime.datetime.fromisoformat(reviewed['completedAt'].replace('Z', '+00:00'))
    if timestamp.tzinfo is None:
        raise ValueError('Checkpoint timestamp must include a timezone')
    return data, hashlib.sha256(raw).hexdigest()


def review_status(current, state):
    if state is None:
        return 'uninitialized'
    previous = state['lastReviewed']
    if current['channel'] != previous['channel']:
        return 'channel-mismatch'
    difference = compare_versions(current['version'], previous['version'])
    return 'catch-up' if difference > 0 else 'version-regression' if difference < 0 else 'current'


@contextlib.contextmanager
def checkpoint_lock(directory):
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    flags = os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW
    fd = os.open(directory / '.review-state.lock', flags, 0o600)
    try:
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield
    finally:
        os.close(fd)


def atomic_save(path, data):
    fd, temporary = tempfile.mkstemp(prefix='.review-state-', dir=path.parent)
    try:
        with os.fdopen(fd, 'w') as stream:
            json.dump(data, stream, indent=2)
            stream.write('\n')
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--omp', default='omp', help='Executable to inspect; no shell command strings')
    parser.add_argument('--state-dir', type=Path, help='Explicit local state directory')
    sub = parser.add_subparsers(dest='action', required=True)
    sub.add_parser('status', help='Read-only installed/reviewed comparison; creates no files')
    for action in ('baseline', 'complete'):
        command = sub.add_parser(action, help='Record an explicitly confirmed baseline' if action == 'baseline' else 'Record a completed review')
        command.add_argument('--version', required=True)
        command.add_argument('--channel', choices=('stable', 'canary'), required=True)
        command.add_argument('--expected-revision', required=True, help='Exact token returned by status; missing for first use')
        command.add_argument('--confirm-reviewed', action='store_true', required=True,
                             help='Attest that the review is complete, or the initial historical baseline was explicitly confirmed')
    args = parser.parse_args()
    profile = os.environ.get('OMP_PROFILE', os.environ.get('PI_PROFILE', 'default')).strip() or 'default'
    base = Path(os.environ.get('XDG_STATE_HOME') or Path.home() / '.local/state')
    if not base.is_absolute():
        raise ValueError('XDG_STATE_HOME must be absolute')
    directory = args.state_dir or base / 'omp-update'
    if args.state_dir is None and profile != 'default':
        directory = directory / 'profiles' / ('profile-' + quote(profile, safe=''))
    path = directory / 'review-state.json'
    current = discover(args.omp)
    state, revision = read_state(path, profile)
    if args.action == 'status':
        print(json.dumps({'status': review_status(current, state), 'installed': current,
                          'lastReviewed': state['lastReviewed'] if state else None,
                          'profile': profile, 'statePath': str(path), 'revision': revision}, indent=2))
        return
    version_parts(args.version)
    with checkpoint_lock(directory):
        state, revision = read_state(path, profile)
        if args.expected_revision != revision:
            raise ValueError('Checkpoint changed since status; re-read and reconcile before completing')
        current = discover(args.omp)
        if current['channel'] != args.channel:
            raise ValueError('Installed channel changed or does not match the reviewed channel')
        if args.action == 'baseline':
            if state is not None:
                raise ValueError('Baseline already exists; it cannot be reset implicitly')
            if compare_versions(args.version, current['version']) > 0:
                raise ValueError('Baseline cannot be newer than the installed version')
        elif args.version != current['version']:
            raise ValueError('Installed version changed or does not match the reviewed version')
        if state:
            if state['lastReviewed']['channel'] != args.channel:
                raise ValueError('Channel mismatch requires a separate explicitly scoped state directory')
            if compare_versions(args.version, state['lastReviewed']['version']) < 0:
                raise ValueError('Refusing to move the review checkpoint backward')
        record = {'schemaVersion': 1, 'profile': profile, 'lastReviewed': {
            'version': args.version, 'channel': args.channel,
            'completedAt': datetime.datetime.now(datetime.timezone.utc).isoformat()}}
        atomic_save(path, record)
    print(json.dumps({'statePath': str(path), **record}, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError, AttributeError, subprocess.TimeoutExpired) as error:
        print(f'omp-update checkpoint: {error}', file=sys.stderr)
        sys.exit(1)
