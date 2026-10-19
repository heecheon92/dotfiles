import fcntl
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

PACKAGE = Path(__file__).resolve().parents[1]
HELPER = PACKAGE / 'scripts/review_state.py'


class CheckpointTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.state_dir = self.root / 'review'
        self.state = self.state_dir / 'review-state.json'
        self.discovery = self.root / 'discovery.json'
        self.install = self.root / 'managed'
        self.binary = self.install / 'versions/omp'
        self.binary.parent.mkdir(parents=True)
        (self.install / 'manager.json').write_text('{"manager":"tern"}')
        self.binary.write_text('#!' + sys.executable + '\n' + '''import json, os, sys
from pathlib import Path
value = json.loads(Path(os.environ['OMP_TEST_DISCOVERY']).read_text())
if sys.argv[1:] == ['--version']:
    print('omp/' + value['version'])
elif sys.argv[1:] == ['config', 'get', 'update.channel', '--json']:
    print(json.dumps({'value': value['channel']}))
else:
    sys.exit(9)
''')
        self.binary.chmod(0o755)
        self.env = {**os.environ, 'OMP_TEST_DISCOVERY': str(self.discovery),
                    'OMP_PROFILE': 'default', 'XDG_STATE_HOME': str(self.root / 'xdg')}
        self.set_installed('1.10.0')

    def set_installed(self, version, channel='stable'):
        self.discovery.write_text(json.dumps({'version': version, 'channel': channel}))

    def args(self, *command):
        return [sys.executable, str(HELPER), '--omp', str(self.binary),
                '--state-dir', str(self.state_dir), *command]

    def call(self, *command, success=True):
        result = subprocess.run(self.args(*command), env=self.env, capture_output=True, text=True)
        self.assertEqual(result.returncode == 0, success, result.stderr)
        return json.loads(result.stdout) if success else result

    def record(self, action='baseline', version='1.9.0', revision='missing', success=True):
        return self.call(action, '--version', version, '--channel', 'stable',
                         '--expected-revision', revision, '--confirm-reviewed', success=success)

    def test_first_status_is_read_only_and_identifies_manager(self):
        result = self.call('status')
        self.assertEqual(result['status'], 'uninitialized')
        self.assertEqual(result['revision'], 'missing')
        self.assertEqual(result['installed']['externalManager'], 'tern')
        self.assertFalse(self.state_dir.exists())

    def test_catch_up_complete_and_private_permissions(self):
        self.record()
        pending = self.call('status')
        self.assertEqual(pending['status'], 'catch-up')
        self.record('complete', '1.10.0', pending['revision'])
        self.assertEqual(self.call('status')['status'], 'current')
        self.assertEqual(self.state.stat().st_mode & 0o777, 0o600)
        self.assertEqual(self.state_dir.stat().st_mode & 0o777, 0o700)

    def test_stale_writer_cannot_overwrite_completed_review(self):
        self.record()
        token = self.call('status')['revision']
        self.record('complete', '1.10.0', token)
        saved = self.state.read_bytes()
        self.record('complete', '1.10.0', token, success=False)
        self.assertEqual(self.state.read_bytes(), saved)

    def test_installed_version_drift_preserves_checkpoint(self):
        self.record()
        token = self.call('status')['revision']
        saved = self.state.read_bytes()
        self.set_installed('1.11.0')
        self.record('complete', '1.10.0', token, success=False)
        self.assertEqual(self.state.read_bytes(), saved)

    def test_downgrade_and_channel_mismatch_fail_closed(self):
        self.record(version='1.10.0')
        saved = self.state.read_bytes()
        self.set_installed('1.9.0')
        result = self.call('status')
        self.assertEqual(result['status'], 'version-regression')
        self.record('complete', '1.9.0', result['revision'], success=False)
        self.set_installed('1.11.0-rc.1', 'canary')
        self.assertEqual(self.call('status')['status'], 'channel-mismatch')
        self.record('complete', '1.11.0-rc.1', result['revision'], success=False)
        self.assertEqual(self.state.read_bytes(), saved)

    def test_prerelease_ordering_and_newer_baseline_rejection(self):
        self.set_installed('1.10.0-rc.10')
        self.record(version='1.10.0-rc.2')
        self.assertEqual(self.call('status')['status'], 'catch-up')
        self.set_installed('1.10.0')
        self.assertEqual(self.call('status')['status'], 'catch-up')
        self.record(version='2.0.0', success=False)

    def test_corrupt_checkpoint_and_symlink_are_not_replaced(self):
        self.state_dir.mkdir()
        self.state.write_text('{broken')
        self.record('complete', '1.10.0', success=False)
        self.assertEqual(self.state.read_text(), '{broken')
        self.state.unlink()
        target = self.root / 'user-file'
        target.write_text('preserve')
        self.state.symlink_to(target)
        self.record('complete', '1.10.0', success=False)
        self.assertEqual(target.read_text(), 'preserve')

    def test_lock_contention_cannot_advance_state(self):
        self.record()
        saved = self.state.read_bytes()
        token = self.call('status')['revision']
        with (self.state_dir / '.review-state.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            self.record('complete', '1.10.0', token, success=False)
        self.assertEqual(self.state.read_bytes(), saved)

    def test_profile_state_does_not_escape_namespace(self):
        env = {**self.env, 'OMP_PROFILE': '..'}
        result = subprocess.run([sys.executable, str(HELPER), '--omp', str(self.binary), 'status'],
                                env=env, capture_output=True, text=True, check=True)
        path = Path(json.loads(result.stdout)['statePath'])
        self.assertEqual(path.parent.name, 'profile-..')
        self.assertEqual(path.parent.parent.name, 'profiles')
        self.assertFalse(path.exists())

    def test_installer_is_idempotent_and_preserves_conflicts(self):
        destination = self.root / 'skills'
        command = [sys.executable, str(PACKAGE / 'install.py'), '--skills-dir', str(destination)]
        subprocess.run(command, capture_output=True, check=True)
        link = destination / 'omp-update'
        self.assertEqual(link.resolve(), PACKAGE)
        subprocess.run(command, capture_output=True, check=True)
        link.unlink()
        link.mkdir()
        authored = link / 'SKILL.md'
        authored.write_text('user-authored skill')
        result = subprocess.run(command, capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(authored.read_text(), 'user-authored skill')
        self.assertFalse(self.state_dir.exists())


if __name__ == '__main__':
    unittest.main()
