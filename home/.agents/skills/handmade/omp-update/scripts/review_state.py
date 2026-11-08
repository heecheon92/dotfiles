#!/usr/bin/env python3
"""Shared release-review checkpoints; never installs OMP or attests runtime compatibility."""

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
import stat
import subprocess
import sys
import tempfile

VERSION = re.compile(r"(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?", re.ASCII)


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
    timestamp = datetime.datetime.fromisoformat(reviewed['completedAt'].replace('Z', '+00:00'))
    if timestamp.tzinfo is None:
        raise ValueError('Checkpoint timestamp must include a timezone')
    return data, hashlib.sha256(raw).hexdigest()


def review_status(current, state):
    if state is None:
        return 'uninitialized'
    previous = state['lastReviewed']
    if current['channel'] != previous['channel']:
        return 'local-channel-mismatch'
    difference = compare_versions(current['version'], previous['version'])
    return 'catch-up' if difference > 0 else 'installed-behind' if difference < 0 else 'current'


def local_observation(current, channel):
    return {'installed': current, 'localChannelMismatch': current['channel'] != channel if channel else False,
            'runtimeCompatibility': 'not-attested'}


@contextlib.contextmanager
def checkpoint_lock(directory):
    if directory.is_symlink():
        raise ValueError('Checkpoint directory must not be a symlink')
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    flags = os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW
    fd = os.open(directory / '.review-state.lock', flags, 0o600)
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


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--omp', default='omp', help='Executable to inspect; no shell command strings')
    parser.add_argument('--state-dir', type=Path, help='Explicit isolated checkpoint directory; default is the resolved skill root')
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
    directory = args.state_dir if args.state_dir is not None else Path(__file__).resolve().parents[1]
    path = directory / 'review-state.json'
    current = discover(args.omp)
    state, revision = read_state(path)
    if args.action == 'status':
        channel = state['lastReviewed']['channel'] if state else None
        print(json.dumps({'status': review_status(current, state), **local_observation(current, channel),
                          'lastReviewed': state['lastReviewed'] if state else None,
                          'profile': profile, 'statePath': str(path), 'revision': revision}, indent=2))
        return
    release_version(args.version, args.channel)
    with checkpoint_lock(directory):
        state, revision = read_state(path)
        if args.expected_revision != revision:
            raise ValueError('Checkpoint changed since status; re-read and reconcile before completing')
        current = discover(args.omp)
        if args.action == 'baseline' and state is not None:
            raise ValueError('Baseline already exists; it cannot be reset implicitly')
        if state:
            if state['lastReviewed']['channel'] != args.channel:
                raise ValueError('Shared channel mismatch requires a separate explicitly scoped state directory')
            if compare_versions(args.version, state['lastReviewed']['version']) < 0:
                raise ValueError('Refusing to move the review checkpoint backward')
        record = {'schemaVersion': 2, 'lastReviewed': {
            'version': args.version, 'channel': args.channel,
            'completedAt': datetime.datetime.now(datetime.timezone.utc).isoformat()}}
        atomic_save(path, record)
    print(json.dumps({'statePath': str(path), **record,
                      **local_observation(current, args.channel)}, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError, AttributeError, subprocess.TimeoutExpired) as error:
        print(f'omp-update checkpoint: {error}', file=sys.stderr)
        sys.exit(1)
