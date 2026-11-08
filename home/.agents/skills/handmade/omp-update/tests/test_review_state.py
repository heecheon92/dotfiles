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
        self.root = Path(self.temporary.name).resolve()
        self.package = self.root / 'skill'
        self.helper = self.package / 'scripts/review_state.py'
        self.helper.parent.mkdir(parents=True)
        self.helper.write_bytes(HELPER.read_bytes())
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
    if 'nextDiscovery' in value:
        Path(os.environ['OMP_TEST_DISCOVERY']).write_text(json.dumps(value['nextDiscovery']))
else:
    sys.exit(9)
''')
        self.binary.chmod(0o755)
        self.env = {key: value for key, value in os.environ.items() if key != 'PI_PROFILE'}
        self.env.update({'OMP_TEST_DISCOVERY': str(self.discovery), 'HOME': str(self.root / 'home'),
                         'OMP_PROFILE': 'default', 'XDG_STATE_HOME': str(self.root / 'xdg')})
        self.set_installed('1.10.0')

    def set_installed(self, version, channel='stable'):
        self.discovery.write_text(json.dumps({'version': version, 'channel': channel}))

    def args(self, *command, isolated=True, helper=None):
        args = [sys.executable, str(helper or self.helper), '--omp', str(self.binary)]
        if isolated:
            args.extend(['--state-dir', str(self.state_dir)])
        return [*args, *command]

    def call(self, *command, success=True, env=None, isolated=True, helper=None):
        result = subprocess.run(self.args(*command, isolated=isolated, helper=helper),
                                env=env or self.env, capture_output=True, text=True)
        self.assertEqual(result.returncode == 0, success, result.stderr)
        return json.loads(result.stdout) if success else result

    def record(self, action='baseline', version='1.9.0', revision='missing',
               channel='stable', success=True, **kwargs):
        return self.call(action, '--version', version, '--channel', channel,
                         '--expected-revision', revision, '--confirm-reviewed',
                         success=success, **kwargs)

    def test_first_status_is_read_only_and_identifies_manager(self):
        result = self.call('status')
        self.assertEqual(result['status'], 'uninitialized')
        self.assertEqual(result['revision'], 'missing')
        self.assertEqual(result['installed']['externalManager'], 'tern')
        self.assertEqual(result['runtimeCompatibility'], 'not-attested')
        self.assertFalse(result['localChannelMismatch'])
        self.assertFalse(self.state_dir.exists())
        self.assertFalse((self.root / 'xdg').exists())
        self.assertFalse((self.root / 'home').exists())

    def test_catch_up_complete_and_private_permissions(self):
        self.record()
        pending = self.call('status')
        self.assertEqual(pending['status'], 'catch-up')
        self.record('complete', '1.10.0', pending['revision'])
        self.assertEqual(self.call('status')['status'], 'current')
        record = json.loads(self.state.read_bytes())
        self.assertEqual(set(record), {'schemaVersion', 'lastReviewed'})
        self.assertEqual(record['schemaVersion'], 2)
        self.assertEqual(set(record['lastReviewed']), {'version', 'channel', 'completedAt'})
        self.assertEqual(self.state.stat().st_mode & 0o777, 0o600)
        self.assertEqual(self.state_dir.stat().st_mode & 0o777, 0o700)
        self.assertEqual(sorted(path.name for path in self.state_dir.iterdir()),
                         ['.review-state.lock', 'review-state.json'])

    def test_default_checkpoint_is_shared_across_profiles_xdg_and_skill_symlinks(self):
        link = self.root / 'linked-helper.py'
        link.symlink_to(self.helper)
        legacy = self.root / 'xdg/omp-update/review-state.json'
        legacy.parent.mkdir(parents=True)
        old_record = '{"schemaVersion":1,"profile":"default","lastReviewed":{"version":"1.8.0"}}'
        legacy.write_text(old_record)
        baseline = self.record(isolated=False)
        shared = self.package / 'review-state.json'
        self.assertEqual(Path(baseline['statePath']), shared)
        alternate = {**self.env, 'OMP_PROFILE': 'work', 'XDG_STATE_HOME': str(self.root / 'alternate-state')}
        token = self.call('status', isolated=False)['revision']
        self.record('complete', '1.11.0', token, isolated=False, env=alternate)
        before = shared.read_bytes()
        stat_before = shared.stat()
        lock_before = (self.package / '.review-state.lock').stat()
        for profile in ('default', 'work', '..', 'team/../other'):
            env = {**self.env, 'OMP_PROFILE': profile, 'XDG_STATE_HOME': str(self.root / profile / 'state')}
            result = self.call('status', env=env, isolated=False, helper=link)
            self.assertEqual(Path(result['statePath']), shared)
            self.assertEqual(result['profile'], profile)
            self.assertEqual(result['lastReviewed']['version'], '1.11.0')
        env = {key: value for key, value in self.env.items() if key != 'OMP_PROFILE'}
        env.update({'PI_PROFILE': 'legacy-profile', 'XDG_STATE_HOME': 'ignored-relative-path'})
        result = self.call('status', env=env, isolated=False)
        self.assertEqual(result['profile'], 'legacy-profile')
        self.assertEqual(Path(result['statePath']), shared)
        self.assertEqual(shared.read_bytes(), before)
        self.assertEqual(shared.stat().st_mtime_ns, stat_before.st_mtime_ns)
        self.assertEqual((self.package / '.review-state.lock').stat().st_mtime_ns, lock_before.st_mtime_ns)
        self.assertEqual(legacy.read_text(), old_record)
        self.assertEqual(list(legacy.parent.iterdir()), [legacy])
        self.assertFalse((self.root / 'home').exists())
        self.assertFalse(self.state_dir.exists())
        self.assertFalse((self.root / 'work').exists())
        self.assertFalse((self.root / 'alternate-state').exists())
        self.assertFalse((legacy.parent / 'profiles').exists())

    def test_first_default_status_does_not_create_shared_or_local_artifacts(self):
        result = self.call('status', isolated=False)
        self.assertEqual(result['status'], 'uninitialized')
        self.assertEqual(Path(result['statePath']), self.package / 'review-state.json')
        self.assertEqual(sorted(path.name for path in self.package.iterdir()), ['scripts'])
        self.assertFalse((self.root / 'xdg').exists())
        self.assertFalse((self.root / 'home').exists())

    def test_stale_writer_cannot_overwrite_completed_review(self):
        self.record()
        token = self.call('status')['revision']
        self.record('complete', '1.10.0', token)
        saved = self.state.read_bytes()
        result = self.record('complete', '1.10.0', token, success=False)
        self.assertIn('changed since status', result.stderr)
        self.assertEqual(self.state.read_bytes(), saved)

    def test_older_install_is_normal_and_review_can_advance_beyond_it(self):
        self.record(version='1.11.0')
        pending = self.call('status')
        self.assertEqual(pending['status'], 'installed-behind')
        self.assertFalse(pending['localChannelMismatch'])
        result = self.record('complete', '1.12.0', pending['revision'])
        self.assertEqual(result['installed']['version'], '1.10.0')
        self.assertEqual(result['lastReviewed']['version'], '1.12.0')
        self.assertEqual(result['runtimeCompatibility'], 'not-attested')
        self.assertEqual(self.call('status')['status'], 'installed-behind')

    def test_installed_discovery_drift_is_observation_not_runtime_attestation(self):
        self.record()
        token = self.call('status')['revision']
        self.discovery.write_text(json.dumps({
            'version': '1.10.0', 'channel': 'stable',
            'nextDiscovery': {'version': '1.12.0-rc.1', 'channel': 'canary'}}))
        result = self.record('complete', '1.11.0', token)
        self.assertEqual(result['lastReviewed']['version'], '1.11.0')
        self.assertEqual(result['installed']['version'], '1.12.0-rc.1')
        self.assertTrue(result['localChannelMismatch'])
        self.assertEqual(result['runtimeCompatibility'], 'not-attested')
        saved = json.loads(self.state.read_bytes())
        self.assertNotIn('installed', saved)
        self.assertNotIn('profile', saved)
        self.assertNotIn('runtimeCompatibility', saved)

    def test_rollback_and_shared_channel_change_are_rejected(self):
        self.record(version='1.11.0')
        token = self.call('status')['revision']
        saved = self.state.read_bytes()
        result = self.record('complete', '1.10.0', token, success=False)
        self.assertIn('backward', result.stderr)
        result = self.record('complete', '1.12.0-rc.1', token, channel='canary', success=False)
        self.assertIn('Shared channel mismatch', result.stderr)
        self.assertEqual(self.state.read_bytes(), saved)

    def test_local_channel_mismatch_does_not_block_independent_stable_review(self):
        self.set_installed('1.10.0-rc.1', 'canary')
        self.record(version='1.11.0')
        pending = self.call('status')
        self.assertEqual(pending['status'], 'local-channel-mismatch')
        self.assertTrue(pending['localChannelMismatch'])
        self.assertEqual(pending['lastReviewed']['channel'], 'stable')
        self.record('complete', '1.12.0', pending['revision'])
        self.assertEqual(self.call('status')['lastReviewed']['version'], '1.12.0')

    def test_canary_ordering_in_explicit_isolation(self):
        self.set_installed('1.10.0-rc.10', 'canary')
        self.record(version='1.10.0-rc.2', channel='canary')
        pending = self.call('status')
        self.assertEqual(pending['status'], 'catch-up')
        self.record('complete', '1.10.0-rc.10', pending['revision'], channel='canary')
        self.assertEqual(self.call('status')['status'], 'current')
        self.assertFalse((self.package / 'review-state.json').exists())

    def test_invalid_release_versions_are_rejected_without_creating_checkpoint(self):
        for version in ('1.10.0-rc.1', '01.10.0', '1.10', '1.10.0-01', '1.10.0-a..b',
                        '1.10.0+', '1.١.0', 'v1.10.0'):
            with self.subTest(version=version):
                self.record(version=version, success=False)
                self.assertFalse(self.state_dir.exists())
        self.record(version='1.11.0+review.1')
        self.assertEqual(self.call('status')['status'], 'installed-behind')

    def test_baseline_cannot_reset_existing_review(self):
        self.record(version='1.11.0')
        token = self.call('status')['revision']
        saved = self.state.read_bytes()
        self.record(version='1.12.0', revision=token, success=False)
        self.assertEqual(self.state.read_bytes(), saved)

    def test_corrupt_or_unsupported_checkpoints_are_preserved(self):
        self.state_dir.mkdir()
        valid = {'schemaVersion': 2, 'lastReviewed': {
            'version': '1.9.0', 'channel': 'stable', 'completedAt': '2026-11-02T23:02:13+00:00'}}
        fixtures = ['{broken', '[]', json.dumps({**valid, 'schemaVersion': 1, 'profile': 'default'}),
                    json.dumps({**valid, 'profile': 'default'}),
                    json.dumps({**valid, 'lastReviewed': {**valid['lastReviewed'], 'version': '1.9.0-rc.1'}}),
                    json.dumps({**valid, 'lastReviewed': {**valid['lastReviewed'], 'completedAt': '2026-11-02'}})]
        for raw in fixtures:
            with self.subTest(raw=raw):
                self.state.write_text(raw)
                self.call('status', success=False)
                self.record('complete', '1.10.0', success=False)
                self.assertEqual(self.state.read_text(), raw)
                self.assertFalse((self.state_dir / '.review-state.lock').exists())

    def test_checkpoint_symlink_and_special_file_are_rejected(self):
        self.state_dir.mkdir()
        target = self.root / 'user-file'
        target.write_text('preserve')
        self.state.symlink_to(target)
        self.call('status', success=False)
        self.record('complete', '1.10.0', success=False)
        self.assertEqual(target.read_text(), 'preserve')
        self.state.unlink()
        os.mkfifo(self.state)
        self.call('status', success=False)
        self.record('complete', '1.10.0', success=False)

    def test_lock_contention_cannot_advance_state_but_status_remains_read_only(self):
        self.record()
        saved = self.state.read_bytes()
        token = self.call('status')['revision']
        with (self.state_dir / '.review-state.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            self.assertEqual(self.call('status')['revision'], token)
            self.record('complete', '1.10.0', token, success=False)
        self.assertEqual(self.state.read_bytes(), saved)

    def test_lock_symlink_and_directory_symlink_cannot_advance_state(self):
        self.record()
        token = self.call('status')['revision']
        saved = self.state.read_bytes()
        lock = self.state_dir / '.review-state.lock'
        lock.unlink()
        target = self.root / 'lock-target'
        target.write_text('preserve')
        lock.symlink_to(target)
        self.record('complete', '1.10.0', token, success=False)
        self.assertEqual(target.read_text(), 'preserve')
        self.assertEqual(self.state.read_bytes(), saved)
        alias = self.root / 'review-alias'
        alias.symlink_to(self.state_dir, target_is_directory=True)
        self.state_dir = alias
        self.record('complete', '1.10.0', token, success=False)
        self.assertEqual(self.state.read_bytes(), saved)

    def test_discovery_failure_cannot_write_review(self):
        self.record()
        token = self.call('status')['revision']
        saved = self.state.read_bytes()
        self.discovery.write_text('{"version":"invalid","channel":"stable"}')
        self.call('status', success=False)
        self.record('complete', '1.11.0', token, success=False)
        self.assertEqual(self.state.read_bytes(), saved)

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
