"""Run with Python 3.11+ and tomlkit available to the interpreter."""
import subprocess
import sys
import tempfile
import tomllib
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "home/bin/sync-herdr-config.py"
SHARED = '[[keys.command]]\nkey = "prefix+t"\ntype = "popup"\ncommand = "shared"\n'
EXTRA = '\n[[keys.command]]\nkey = "prefix+f"\ntype = "popup"\ncommand = "new"\n'
RADAR = '# >>> herdr-radar theme block\n[theme.custom]\nactive_row_bg = "#123456"\n# <<< herdr-radar theme block'


class HerdrKeySyncTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.shared = self.root / "shared.toml"
        self.active = self.root / "config.toml"
        self.shared.write_text(SHARED)

    def sync(self, success=True):
        result = subprocess.run(
            [sys.executable, str(SCRIPT), str(self.shared), str(self.active)],
            capture_output=True, text=True,
        )
        if success:
            self.assertEqual(result.returncode, 0, result.stderr)
        else:
            self.assertNotEqual(result.returncode, 0)
        return result

    def config(self):
        return tomllib.loads(self.active.read_text())

    def test_symlink_migration_and_local_override_survive_shared_updates(self):
        self.active.symlink_to(self.shared)
        self.sync()
        self.assertFalse(self.active.is_symlink())
        self.assertEqual(self.shared.read_text(), SHARED)
        self.assertEqual(Path(str(self.active) + ".before-dotfiles-sync").read_text(), SHARED)
        self.shared.write_text(SHARED.replace('"shared"', '"updated"'))
        self.sync()
        self.assertEqual(self.config()["keys"]["command"][0]["command"], "updated")
        self.active.write_text(self.active.read_text().replace('"updated"', '"local"'))
        self.shared.write_text(SHARED.replace('"shared"', '"newer"'))
        self.sync()
        self.assertEqual(self.config()["keys"]["command"][0]["command"], "local")
        before = self.active.read_bytes()
        self.sync()
        self.assertEqual(self.active.read_bytes(), before)

    def test_local_builtin_bindings_and_aliases_are_preserved(self):
        local = ('[keys]\nprefix = "ctrl+a"\nnext_tab = ["prefix+n", "ctrl+alt+n"]\n'
                 '[keys.indexed]\nswitch_tab = "alt"\n'
                 '[[keys.command]]\nkey = ["prefix+t", "ctrl+alt+t"]\n'
                 'type = "popup"\ncommand = "local"\n')
        self.active.write_text(local)
        self.sync()
        self.assertEqual(self.config(), tomllib.loads(local))
        self.shared.write_text(SHARED.replace('"shared"', '"changed"') + EXTRA)
        self.sync()
        commands = self.config()["keys"]["command"]
        self.assertEqual(commands[0]["key"], ["prefix+t", "ctrl+alt+t"])
        self.assertEqual(commands[0]["command"], "local")
        self.assertEqual([item["key"] for item in commands[1:]], ["prefix+f"])
        self.assertEqual(self.config()["keys"]["prefix"], "ctrl+a")

    def test_radar_owned_block_stays_verbatim_outside_added_and_removed_keys(self):
        self.active.write_text(SHARED + "\n" + RADAR + "\n")
        self.sync()
        self.shared.write_text(SHARED + EXTRA)
        self.sync()
        text = self.active.read_text()
        self.assertIn(RADAR, text)
        self.assertLess(text.index('key = "prefix+f"'), text.index('# >>> herdr-radar'))
        self.shared.write_text('onboarding = false\n')
        self.sync()
        text = self.active.read_text()
        self.assertIn(RADAR, text)
        self.assertNotIn("prefix+t", text)
        self.assertNotIn("prefix+f", text)
        self.assertEqual(self.config()["theme"]["custom"]["active_row_bg"], "#123456")

    def test_incomplete_radar_block_fails_without_changing_active_file(self):
        self.active.write_text(SHARED + "\n" + RADAR.split('# <<<')[0])
        before = self.active.read_bytes()
        self.shared.write_text(SHARED + EXTRA)
        self.sync(success=False)
        self.assertEqual(self.active.read_bytes(), before)


if __name__ == "__main__":
    unittest.main()
