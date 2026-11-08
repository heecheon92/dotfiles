#!/usr/bin/env python3
"""Shared Tern release-review checkpoints; reads app metadata, never runs or updates Tern."""

import argparse
import contextlib
import datetime
import fcntl
import hashlib
import json
import os
from pathlib import Path
import plistlib
import re
import stat
import sys
import tempfile
from xml.parsers.expat import ExpatError

BUNDLE_ID = 'so.stencil.tern'
VERSION = re.compile(r'(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?', re.ASCII)


def version_parts(value):
    if not isinstance(value, str):
        raise ValueError('Semantic version must be a string')
    match = VERSION.fullmatch(value)
    if not match:
        raise ValueError(f'Invalid semantic version: {value!r}')
    for group in (match[4], match[5]):
        if group and any(not part for part in group.split('.')):
            raise ValueError('Empty version identifier')
    prerelease = match[4].split('.') if match[4] else []
    if any(part.isdigit() and len(part) > 1 and part.startswith('0') for part in prerelease):
        raise ValueError('Leading zero in numeric prerelease identifier')
    return tuple(map(int, match.group(1, 2, 3))), prerelease


def release_version(value, channel):
    _, prerelease = version_parts(value)
    if channel not in ('stable', 'canary'):
        raise ValueError('Invalid checkpoint channel')
    if channel == 'stable' and prerelease:
        raise ValueError('Stable review checkpoints cannot contain prerelease versions')


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


def default_app_paths():
    return (Path.home() / 'Applications/Tern.app', Path('/Applications/Tern.app'))


def inspect_bundle(app):
    resolved = app.expanduser().resolve(strict=True)
    if not resolved.is_dir():
        raise ValueError('Tern app path must be an application bundle directory')
    metadata = resolved / 'Contents/Info.plist'
    fd = os.open(metadata, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(fd, 'rb') as stream:
        if not stat.S_ISREG(os.fstat(stream.fileno()).st_mode):
            raise ValueError('Tern Info.plist must be a regular file')
        try:
            info = plistlib.load(stream)
        except (plistlib.InvalidFileException, ExpatError) as error:
            raise ValueError('Invalid Tern Info.plist') from error
    if not isinstance(info, dict) or info.get('CFBundleIdentifier') != BUNDLE_ID:
        raise ValueError(f'Tern bundle identity mismatch; expected {BUNDLE_ID}')
    version = info.get('CFBundleShortVersionString')
    version_parts(version)
    build = info.get('CFBundleVersion')
    if not isinstance(build, str) or not build.strip():
        raise ValueError('Tern CFBundleVersion must be a nonempty string')
    return {'version': version, 'build': build, 'bundleIdentifier': BUNDLE_ID,
            'appPath': str(resolved), 'metadataPath': str(metadata),
            'channel': 'unverified', 'installOwner': 'unverified', 'liveVersion': 'unverified'}


def discover(app=None):
    source = 'explicit' if app is not None else 'default-locations'
    candidates = [app.expanduser()] if app is not None else list(default_app_paths())
    existing = {}
    for candidate in candidates:
        # A dangling alias is invalid, not evidence that no app is installed.
        if app is not None or candidate.exists() or candidate.is_symlink():
            resolved = candidate.resolve(strict=True)
            existing.setdefault(resolved, candidate)
    if len(existing) > 1:
        raise ValueError('Ambiguous distinct Tern bundles; select the intended bundle with --app')
    observation = {'status': 'found' if existing else 'not-found', 'source': source,
                   'candidates': [str(candidate) for candidate in candidates]}
    installed = inspect_bundle(next(iter(existing))) if existing else None
    return {'installed': installed, 'discovery': observation,
            'runtimeCompatibility': 'not-attested'}


def validate_directory(directory):
    # Do not resolve explicit state paths: that would silently accept symlinked state.
    for component in (directory, *directory.parents):
        if component.is_symlink():
            raise ValueError('Checkpoint directory and its parents must not be symlinks')
        if component.exists() and not component.is_dir():
            raise ValueError('Checkpoint directory must be a directory')


def read_state(path):
    try:
        fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    except FileNotFoundError:
        return None, 'missing'
    with os.fdopen(fd, 'rb') as stream:
        if not stat.S_ISREG(os.fstat(stream.fileno()).st_mode):
            raise ValueError('Checkpoint must be a regular file, not a symlink or special file')
        raw = stream.read()
    data = json.loads(raw)
    if not isinstance(data, dict) or set(data) != {'schemaVersion', 'lastReviewed'} or data['schemaVersion'] != 2:
        raise ValueError('Unsupported shared checkpoint schema; expected schemaVersion 2')
    reviewed = data['lastReviewed']
    if not isinstance(reviewed, dict) or set(reviewed) != {'version', 'channel', 'completedAt'}:
        raise ValueError('Invalid shared checkpoint fields')
    release_version(reviewed['version'], reviewed['channel'])
    if not isinstance(reviewed['completedAt'], str):
        raise ValueError('Checkpoint timestamp must be a string')
    timestamp = datetime.datetime.fromisoformat(reviewed['completedAt'].replace('Z', '+00:00'))
    if timestamp.tzinfo is None:
        raise ValueError('Checkpoint timestamp must include a timezone')
    return data, hashlib.sha256(raw).hexdigest()


def review_status(installed, state):
    if installed is None:
        return 'no-install'
    if state is None:
        return 'uninitialized'
    difference = compare_versions(installed['version'], state['lastReviewed']['version'])
    return 'catch-up' if difference > 0 else 'installed-behind' if difference < 0 else 'current'


def validate_channel_scope(channel, directory, shared_directory, explicit):
    if channel == 'canary' and (not explicit or directory.resolve() == shared_directory):
        raise ValueError('Canary reviews require a separate explicit --state-dir; shared default is stable-only')


@contextlib.contextmanager
def checkpoint_lock(directory):
    validate_directory(directory)
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    fd = os.open(directory / '.review-state.lock', os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW | os.O_NONBLOCK, 0o600)
    try:
        if not stat.S_ISREG(os.fstat(fd).st_mode):
            raise ValueError('Checkpoint lock must be a regular file')
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


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--app', type=Path, help='Explicit Tern.app bundle; inspect Info.plist only')
    parser.add_argument('--state-dir', type=Path, help='Separate explicit checkpoint directory; required for canary')
    sub = parser.add_subparsers(dest='action', required=True)
    sub.add_parser('status', help='Read-only metadata/review comparison; creates no files')
    complete = sub.add_parser('complete', help='Record an explicitly completed release review')
    complete.add_argument('--version', required=True)
    complete.add_argument('--channel', choices=('stable', 'canary'), required=True)
    complete.add_argument('--expected-revision', required=True, help='Exact original status token; missing for first use')
    complete.add_argument('--confirm-reviewed', action='store_true', required=True,
                          help='Attest that the release review is complete; never invent an initial historical baseline')
    args = parser.parse_args(argv)
    shared_directory = Path(__file__).resolve().parents[1]
    directory = args.state_dir.expanduser().absolute() if args.state_dir is not None else shared_directory
    validate_directory(directory)
    path = directory / 'review-state.json'
    observation = discover(args.app)
    state, revision = read_state(path)
    if state:
        validate_channel_scope(state['lastReviewed']['channel'], directory, shared_directory, args.state_dir is not None)
    if args.action == 'status':
        print(json.dumps({'status': review_status(observation['installed'], state), **observation,
                          'lastReviewed': state['lastReviewed'] if state else None,
                          'statePath': str(path), 'revision': revision}, indent=2))
        return
    release_version(args.version, args.channel)
    validate_channel_scope(args.channel, directory, shared_directory, args.state_dir is not None)
    with checkpoint_lock(directory):
        state, revision = read_state(path)
        if args.expected_revision != revision:
            raise ValueError('Checkpoint changed since status; re-read and reconcile before completing')
        observation = discover(args.app)
        if state:
            if state['lastReviewed']['channel'] != args.channel:
                raise ValueError('Shared channel mismatch requires a separate explicitly scoped state directory')
            if compare_versions(args.version, state['lastReviewed']['version']) < 0:
                raise ValueError('Refusing to move the review checkpoint backward')
        record = {'schemaVersion': 2, 'lastReviewed': {
            'version': args.version, 'channel': args.channel,
            'completedAt': datetime.datetime.now(datetime.timezone.utc).isoformat()}}
        atomic_save(path, record)
    print(json.dumps({'statePath': str(path), **record, **observation}, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError, AttributeError, plistlib.InvalidFileException) as error:
        print(f'tern-update checkpoint: {error}', file=sys.stderr)
        sys.exit(1)
