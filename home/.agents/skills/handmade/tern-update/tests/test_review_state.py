import contextlib
import fcntl
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import plistlib
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

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
        shutil.copyfile(HELPER, self.helper)
        spec = importlib.util.spec_from_file_location('tern_review_test', self.helper)
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)
        self.state_dir = self.root / 'review'
        self.state = self.state_dir / 'review-state.json'
        self.app = self.root / 'Tern.app'
        self.make_app(self.app)
        self.defaults = (self.root / 'home/Applications/Tern.app', self.root / 'Applications/Tern.app')
        self.env = {**os.environ, 'HOME': str(self.root / 'home'), 'OMP_PROFILE': 'default',
                    'XDG_STATE_HOME': str(self.root / 'xdg')}

    def make_app(self, path, version='0.9.13', build='347', identity='so.stencil.tern'):
        contents = path / 'Contents'
        contents.mkdir(parents=True, exist_ok=True)
        with (contents / 'Info.plist').open('wb') as stream:
            plistlib.dump({'CFBundleIdentifier': identity, 'CFBundleShortVersionString': version,
                          'CFBundleVersion': build}, stream)
        executable = contents / 'MacOS/Tern'
        executable.parent.mkdir(exist_ok=True)
        executable.write_text('#!/bin/sh\ntouch "' + str(self.root / 'executed') + '"\nexit 9\n')
        executable.chmod(0o755)
        return path

    def arguments(self, *command, isolated=True, app=True):
        args = ['--app', str(self.app)] if app else []
        if isolated:
            args.extend(['--state-dir', str(self.state_dir)])
        return [*args, *command]

    def call(self, *command, success=True, isolated=True, app=True, env=None):
        output = io.StringIO()
        with mock.patch.object(self.module, 'default_app_paths', return_value=self.defaults), \
                mock.patch.dict(os.environ, env or self.env, clear=True), contextlib.redirect_stdout(output):
            if not success:
                with self.assertRaises((OSError, ValueError, TypeError, AttributeError, plistlib.InvalidFileException)) as raised:
                    self.module.main(self.arguments(*command, isolated=isolated, app=app))
                return str(raised.exception)
            self.module.main(self.arguments(*command, isolated=isolated, app=app))
        return json.loads(output.getvalue())

    def record(self, version='0.9.12', revision='missing', channel='stable', **kwargs):
        return self.call('complete', '--version', version, '--channel', channel,
                         '--expected-revision', revision, '--confirm-reviewed', **kwargs)

    def test_first_status_reads_only_metadata_and_preserves_build_separately(self):
        result = self.call('status')
        self.assertEqual(result['status'], 'uninitialized')
        self.assertEqual(result['revision'], 'missing')
        self.assertIsNone(result['lastReviewed'])
        installed = result['installed']
        self.assertEqual(installed['version'], '0.9.13')
        self.assertEqual(installed['build'], '347')
        self.assertEqual(installed['bundleIdentifier'], 'so.stencil.tern')
        self.assertEqual(Path(installed['appPath']), self.app)
        self.assertEqual(installed['channel'], 'unverified')
        self.assertEqual(installed['installOwner'], 'unverified')
        self.assertEqual(installed['liveVersion'], 'unverified')
        self.assertEqual(result['runtimeCompatibility'], 'not-attested')
        self.assertEqual(result['discovery']['status'], 'found')
        self.assertFalse(self.state_dir.exists())
        self.assertFalse((self.root / 'executed').exists())
        self.assertFalse((self.root / 'xdg').exists())

    def test_default_paths_and_initial_shared_status_create_no_checkpoint(self):
        with mock.patch.object(Path, 'home', return_value=self.root / 'home'):
            self.assertEqual(self.module.default_app_paths(),
                             (self.root / 'home/Applications/Tern.app', Path('/Applications/Tern.app')))
        result = self.call('status', isolated=False)
        self.assertEqual(result['status'], 'uninitialized')
        self.assertEqual(Path(result['statePath']), self.package / 'review-state.json')
        self.assertFalse((self.package / 'review-state.json').exists())
        self.assertFalse((self.package / '.review-state.lock').exists())
        self.assertFalse(self.state_dir.exists())
        self.assertFalse((self.root / 'xdg').exists())

    def test_default_discovery_missing_and_absent_app_completion(self):
        result = self.call('status', app=False)
        self.assertEqual(result['status'], 'no-install')
        self.assertIsNone(result['installed'])
        self.assertEqual(result['discovery']['status'], 'not-found')
        self.assertEqual(result['discovery']['source'], 'default-locations')
        self.assertEqual(result['runtimeCompatibility'], 'not-attested')
        self.assertFalse(self.state_dir.exists())
        recorded = self.record(version='0.10.0', app=False)
        self.assertIsNone(recorded['installed'])
        self.assertEqual(recorded['lastReviewed']['version'], '0.10.0')
        self.assertEqual(self.call('status', app=False)['status'], 'no-install')

    def test_default_locations_and_same_bundle_aliases(self):
        self.make_app(self.defaults[0])
        result = self.call('status', app=False)
        self.assertEqual(Path(result['installed']['appPath']), self.defaults[0])
        self.defaults[1].parent.mkdir(parents=True)
        self.defaults[1].symlink_to(self.defaults[0], target_is_directory=True)
        result = self.call('status', app=False)
        self.assertEqual(Path(result['installed']['appPath']), self.defaults[0])
        self.assertEqual(len(result['discovery']['candidates']), 2)

    def test_distinct_default_bundles_are_ambiguous_even_with_same_version(self):
        for candidate in self.defaults:
            self.make_app(candidate)
        self.assertIn('Ambiguous', self.call('status', app=False, success=False))
        self.record(app=False, success=False)
        self.assertFalse(self.state_dir.exists())
        self.call('status')  # Explicit selection removes ambiguity.

    def test_explicit_missing_broken_alias_and_wrong_identity_fail_closed(self):
        self.app = self.root / 'missing.app'
        self.call('status', success=False)
        self.record(success=False)
        self.assertFalse(self.state_dir.exists())
        self.app.symlink_to(self.root / 'does-not-exist')
        self.call('status', success=False)
        self.defaults[0].parent.mkdir(parents=True)
        self.defaults[0].symlink_to(self.root / 'does-not-exist')
        self.call('status', app=False, success=False)
        self.app.unlink()
        self.make_app(self.app, identity='build.tern.wrong-product')
        self.assertIn('identity mismatch', self.call('status', success=False))
        self.record(success=False)
        self.assertFalse(self.state_dir.exists())

    def test_invalid_plist_version_build_and_nonregular_metadata_fail(self):
        metadata = self.app / 'Contents/Info.plist'
        for field, value in (('CFBundleShortVersionString', '0.9'),
                             ('CFBundleShortVersionString', 913),
                             ('CFBundleVersion', ''), ('CFBundleVersion', 347)):
            self.make_app(self.app)
            info = plistlib.loads(metadata.read_bytes())
            info[field] = value
            metadata.write_bytes(plistlib.dumps(info))
            self.call('status', success=False)
            self.record(success=False)
            self.assertFalse(self.state_dir.exists())
        for raw in ('not a plist', '<?xml version="1.0"?><plist><dict><key>broken</dict></plist>'):
            metadata.write_text(raw)
            self.call('status', success=False)
        metadata.unlink()
        target = self.root / 'metadata'
        target.write_text('preserve')
        metadata.symlink_to(target)
        self.call('status', success=False)
        self.assertEqual(target.read_text(), 'preserve')
        metadata.unlink()
        os.mkfifo(metadata)
        self.call('status', success=False)

    def test_complete_catch_up_current_permissions_and_minimal_persisted_schema(self):
        self.record()
        pending = self.call('status')
        self.assertEqual(pending['status'], 'catch-up')
        self.record('0.9.13', pending['revision'])
        self.assertEqual(self.call('status')['status'], 'current')
        data = json.loads(self.state.read_bytes())
        self.assertEqual(set(data), {'schemaVersion', 'lastReviewed'})
        self.assertEqual(data['schemaVersion'], 2)
        self.assertEqual(set(data['lastReviewed']), {'version', 'channel', 'completedAt'})
        self.assertEqual(self.state.stat().st_mode & 0o777, 0o600)
        self.assertEqual(self.state_dir.stat().st_mode & 0o777, 0o700)
        self.assertEqual(sorted(path.name for path in self.state_dir.iterdir()),
                         ['.review-state.lock', 'review-state.json'])

    def test_default_state_is_shared_across_cwd_profiles_xdg_and_helper_alias(self):
        self.record(isolated=False)
        shared = self.package / 'review-state.json'
        self.assertTrue(shared.is_file())
        token = self.call('status', isolated=False)['revision']
        self.record('0.10.0', token, isolated=False)
        raw = shared.read_bytes()
        mtime = shared.stat().st_mtime_ns
        lock_mtime = (self.package / '.review-state.lock').stat().st_mtime_ns
        alias = self.root / 'linked-helper.py'
        alias.symlink_to(self.helper)
        alternate = self.root / 'elsewhere'
        alternate.mkdir()
        old_cwd = Path.cwd()
        try:
            os.chdir(alternate)
            with mock.patch.object(self.module, '__file__', str(alias)):
                for profile in ('default', 'work', '..', 'team/../other'):
                    env = {**self.env, 'OMP_PROFILE': profile, 'PI_PROFILE': profile,
                           'XDG_STATE_HOME': str(self.root / profile / 'state')}
                    result = self.call('status', isolated=False, env=env)
                    self.assertEqual(Path(result['statePath']), shared)
                    self.assertEqual(result['lastReviewed']['version'], '0.10.0')
        finally:
            os.chdir(old_cwd)
        self.assertEqual(shared.read_bytes(), raw)
        self.assertEqual(shared.stat().st_mtime_ns, mtime)
        self.assertEqual((self.package / '.review-state.lock').stat().st_mtime_ns, lock_mtime)
        self.assertFalse(self.state_dir.exists())
        self.assertFalse((self.root / 'xdg').exists())
        self.assertFalse((self.root / 'home').exists())

    def test_newer_reviewed_older_local_and_completion_beyond_installed(self):
        self.record('0.10.0')
        pending = self.call('status')
        self.assertEqual(pending['status'], 'installed-behind')
        result = self.record('0.11.0', pending['revision'])
        self.assertEqual(result['installed']['version'], '0.9.13')
        self.assertEqual(result['lastReviewed']['version'], '0.11.0')
        self.assertEqual(result['runtimeCompatibility'], 'not-attested')
        self.assertEqual(self.call('status')['status'], 'installed-behind')

    def test_original_revision_not_a_fresh_token_is_required(self):
        self.record()
        token = self.call('status')['revision']
        self.record('0.9.13', token)
        saved = self.state.read_bytes()
        self.assertIn('changed since status', self.record('0.10.0', token, success=False))
        self.assertEqual(self.state.read_bytes(), saved)
        self.assertEqual(self.call('status')['revision'], hashlib.sha256(saved).hexdigest())

    def test_rollback_and_channel_change_preserve_record(self):
        self.record('0.10.0')
        token = self.call('status')['revision']
        saved = self.state.read_bytes()
        self.assertIn('backward', self.record('0.9.13', token, success=False))
        self.assertIn('channel mismatch', self.record('0.11.0-rc.1', token, 'canary', success=False))
        self.assertEqual(self.state.read_bytes(), saved)

    def test_canary_requires_separate_explicit_scope_and_semver_ordering(self):
        self.assertIn('separate explicit', self.record('0.10.0-rc.1', channel='canary', isolated=False, success=False))
        original = self.state_dir
        self.state_dir = self.package
        self.record('0.10.0-rc.1', channel='canary', success=False)
        self.state_dir = original
        self.make_app(self.app, version='0.10.0-rc.10')
        self.record('0.10.0-rc.2', channel='canary')
        pending = self.call('status')
        self.assertEqual(pending['status'], 'catch-up')
        self.record('0.10.0-rc.10', pending['revision'], 'canary')
        self.assertEqual(self.call('status')['status'], 'current')
        self.assertFalse((self.package / 'review-state.json').exists())

    def test_semver_rejects_invalid_stable_versions_before_creating_state(self):
        for version in ('0.10.0-rc.1', '00.10.0', '0.10', '0.10.0-01', '0.10.0-a..b',
                        '0.10.0+', '0.١.0', 'v0.10.0'):
            with self.subTest(version=version):
                self.record(version, success=False)
                self.assertFalse(self.state_dir.exists())
        self.record('0.10.0+review.1')
        self.assertEqual(self.call('status')['status'], 'installed-behind')
        compare = self.module.compare_versions
        ordered = ['1.0.0-alpha', '1.0.0-alpha.1', '1.0.0-alpha.beta', '1.0.0-beta',
                   '1.0.0-beta.2', '1.0.0-beta.11', '1.0.0-rc.1', '1.0.0']
        for left, right in zip(ordered, ordered[1:]):
            self.assertLess(compare(left, right), 0)
        self.assertEqual(compare('1.0.0+one', '1.0.0+two'), 0)

    def test_corrupt_checkpoints_are_never_reset_or_overwritten(self):
        self.state_dir.mkdir()
        valid = {'schemaVersion': 2, 'lastReviewed': {
            'version': '0.9.12', 'channel': 'stable', 'completedAt': '2026-11-02T23:02:13+00:00'}}
        fixtures = ['{broken', '[]', json.dumps({**valid, 'schemaVersion': 1}),
                    json.dumps({**valid, 'profile': 'work'}),
                    json.dumps({**valid, 'lastReviewed': {**valid['lastReviewed'], 'version': '0.9.0-rc.1'}}),
                    json.dumps({**valid, 'lastReviewed': {**valid['lastReviewed'], 'completedAt': '2026-11-02'}}),
                    json.dumps({**valid, 'lastReviewed': {**valid['lastReviewed'], 'completedAt': None}})]
        for raw in fixtures:
            with self.subTest(raw=raw):
                self.state.write_text(raw)
                self.call('status', success=False)
                self.record(success=False)
                self.assertEqual(self.state.read_text(), raw)
                self.assertFalse((self.state_dir / '.review-state.lock').exists())

    def test_checkpoint_and_directory_symlinks_and_special_files_fail_closed(self):
        self.state_dir.mkdir()
        target = self.root / 'user-file'
        target.write_text('preserve')
        self.state.symlink_to(target)
        self.call('status', success=False)
        self.record(success=False)
        self.assertEqual(target.read_text(), 'preserve')
        self.state.unlink()
        os.mkfifo(self.state)
        self.call('status', success=False)
        self.record(success=False)
        self.state.unlink()
        self.record()
        saved = self.state.read_bytes()
        alias = self.root / 'review-alias'
        alias.symlink_to(self.state_dir, target_is_directory=True)
        self.state_dir = alias
        self.call('status', success=False)
        self.record(success=False)
        self.assertEqual(self.state.read_bytes(), saved)

    def test_lock_contention_and_nonregular_locks_do_not_advance_state(self):
        self.record()
        token = self.call('status')['revision']
        saved = self.state.read_bytes()
        lock_path = self.state_dir / '.review-state.lock'
        with lock_path.open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            self.assertEqual(self.call('status')['revision'], token)
            self.record('0.9.13', token, success=False)
        lock_path.unlink()
        target = self.root / 'lock-target'
        target.write_text('preserve')
        lock_path.symlink_to(target)
        self.record('0.9.13', token, success=False)
        self.assertEqual(target.read_text(), 'preserve')
        lock_path.unlink()
        os.mkfifo(lock_path)
        self.record('0.9.13', token, success=False)
        self.assertEqual(self.state.read_bytes(), saved)

    def test_atomic_failure_preserves_record_and_removes_temporary_file(self):
        self.record()
        token = self.call('status')['revision']
        saved = self.state.read_bytes()
        with mock.patch.object(self.module.os, 'replace', side_effect=OSError('simulated replace failure')):
            self.record('0.9.13', token, success=False)
        self.assertEqual(self.state.read_bytes(), saved)
        self.assertEqual(list(self.state_dir.glob('.review-state-*')), [])

    def test_discovery_is_rechecked_inside_lock_before_write(self):
        self.record()
        token = self.call('status')['revision']
        saved = self.state.read_bytes()
        observation = self.module.discover(self.app)
        with mock.patch.object(self.module, 'discover', side_effect=[observation, ValueError('identity changed')]):
            self.assertIn('identity changed', self.record('0.9.13', token, success=False))
        self.assertEqual(self.state.read_bytes(), saved)

    def test_competing_processes_with_one_original_token_only_one_can_write(self):
        self.record()
        token = self.call('status')['revision']
        command = [sys.executable, str(self.helper), *self.arguments(
            'complete', '--version', '0.10.0', '--channel', 'stable',
            '--expected-revision', token, '--confirm-reviewed')]
        processes = [subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                      text=True, env=self.env) for _ in range(2)]
        results = [process.communicate(timeout=15) for process in processes]
        self.assertEqual(sorted(process.returncode for process in processes), [0, 1], results)
        self.assertEqual(self.call('status')['lastReviewed']['version'], '0.10.0')
        self.assertFalse((self.root / 'executed').exists())

    def test_cli_requires_confirmation_and_rejects_removed_baseline_action(self):
        command = [sys.executable, str(self.helper), *self.arguments(
            'complete', '--version', '0.10.0', '--channel', 'stable', '--expected-revision', 'missing')]
        result = subprocess.run(command, capture_output=True, text=True, env=self.env)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('--confirm-reviewed', result.stderr)
        self.assertFalse(self.state_dir.exists())
        result = subprocess.run([sys.executable, str(self.helper), 'baseline'],
                                capture_output=True, text=True, env=self.env)
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((self.package / 'review-state.json').exists())

    def test_installer_is_idempotent_and_preserves_directory_file_and_broken_link_conflicts(self):
        shutil.copyfile(PACKAGE / 'install.py', self.package / 'install.py')
        (self.package / 'SKILL.md').write_text('fixture skill')
        destination = self.root / 'skills'
        command = [sys.executable, str(self.package / 'install.py'), '--skills-dir', str(destination)]
        for _ in range(2):
            result = subprocess.run(command, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
        link = destination / 'tern-update'
        self.assertEqual(link.resolve(), self.package)
        link.unlink()
        link.mkdir()
        authored = link / 'SKILL.md'
        authored.write_text('user-authored skill')
        result = subprocess.run(command, capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(authored.read_text(), 'user-authored skill')
        authored.unlink()
        link.rmdir()
        link.write_text('user-owned file')
        result = subprocess.run(command, capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(link.read_text(), 'user-owned file')
        link.unlink()
        link.symlink_to(self.root / 'missing-skill')
        result = subprocess.run(command, capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue(link.is_symlink())
        self.assertFalse((self.package / 'review-state.json').exists())
        self.assertFalse(self.state_dir.exists())


if __name__ == '__main__':
    unittest.main()
