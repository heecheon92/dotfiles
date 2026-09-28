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
TAB_BAR = """# >>> herdr-radar tab-bar block
[ui.tab_bar]
position = "top"
# <<< herdr-radar tab-bar block"""
SIDEBAR = """# >>> herdr-radar sidebar block
[ui.sidebar]
width = 42
transparent = true

[ui.sidebar.agents]
# keep sidebar comment
row_gap = 2
rows = [
  [{ token = "$group_parent", fg = "#parent", bold = true, dim = true }],
  [{ token = "$group", fg = "#group", bold = true, dim = true }, { token = "$group_stale", fg = "#stale", bold = true, dim = true }],
  [{ token = "$split_mark", fg = "#split", bold = false, dim = true }, { token = "$logo_stale", fg = "#logo-stale", bold = false, dim = true, rules = [{ contains = "x", fg = "#brand" }] }],
  [{ token = "$title_idle_stale", fg = "#title-stale", italic = true, dim = true }, { token = "$logo", fg = "#brand", dim = false }, { token = "$status", fg = "#status", dim = false }]
]

[ui.sidebar.agents.rows_by_agent]
claude = [[{ token = "$group", fg = "#claude", bold = true, dim = true }]]
gemini = [[{ token = "$title_idle_stale", fg = "#gemini", italic = true, dim = true }]]

[ui.sidebar.spaces]
rows = [[{ token = "$group", fg = "#space", bold = true, dim = true }]]
# <<< herdr-radar sidebar block"""
OVERRIDES = """[agents]
"$group_parent" = { fg = "#9a9eb3", dim = false }
"$group" = { fg = "#9a9eb3", dim = false }
"$group_stale" = { fg = "#9a9eb3", dim = false }
"$split_mark" = { fg = "#9a9eb3", dim = false }
"$logo_stale" = { fg = "#9a9eb3", dim = false }
"$title_idle_stale" = { fg = "#9a9eb3", dim = false }
"""


class HerdrKeySyncTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.shared = self.root / "shared.toml"
        self.active = self.root / "config.toml"
        self.overrides = self.root / "sidebar-overrides.toml"
        self.overrides.write_text(OVERRIDES)
        self.shared.write_text(SHARED)

    def sync(self, success=True, overrides=False):
        command = [sys.executable, str(SCRIPT), str(self.shared), str(self.active)]
        if overrides:
            command.append(str(self.overrides))
        result = subprocess.run(command, capture_output=True, text=True)
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
        self.active.write_text(SHARED + "\n" + RADAR + "\n\n" + SIDEBAR + "\n")
        self.sync()
        self.shared.write_text(SHARED + EXTRA)
        self.sync()
        text = self.active.read_text()
        self.assertIn(RADAR, text)
        self.assertIn(SIDEBAR, text)
        self.assertLess(text.index('key = "prefix+f"'), text.index('# >>> herdr-radar'))
        self.shared.write_text('onboarding = false\n')
        self.sync()
        text = self.active.read_text()
        self.assertIn(RADAR, text)
        self.assertIn(SIDEBAR, text)
        self.assertNotIn("prefix+t", text)
        self.assertNotIn("prefix+f", text)
        self.assertEqual(self.config()["theme"]["custom"]["active_row_bg"], "#123456")

    def test_incomplete_radar_block_fails_without_changing_active_file(self):
        self.active.write_text(SHARED + "\n" + RADAR.split('# <<<')[0])
        before = self.active.read_bytes()
        self.shared.write_text(SHARED + EXTRA)
        self.sync(success=False)
        self.assertEqual(self.active.read_bytes(), before)

    def test_sidebar_overrides_patch_agent_rows_and_preserve_everything_else(self):
        local = (
            SHARED
            + "\n[state.local]\nvalue = \"keep\"\n\n[ui.layout]\nmode = \"keep\"\n\n"
            + TAB_BAR
            + "\n\n"
            + RADAR
            + "\n\n"
            + SIDEBAR
            + "\n"
        )
        self.active.write_text(local)

        self.sync(overrides=True)
        document = self.config()
        agents = document["ui"]["sidebar"]["agents"]
        default_styles = {
            style["token"]: style
            for row in agents["rows"]
            for style in row
        }
        for token in (
            "$group_parent",
            "$group",
            "$group_stale",
            "$split_mark",
            "$logo_stale",
            "$title_idle_stale",
        ):
            self.assertEqual(default_styles[token]["fg"], "#9a9eb3")
            self.assertFalse(default_styles[token]["dim"])

        claude = agents["rows_by_agent"]["claude"][0][0]
        gemini = agents["rows_by_agent"]["gemini"][0][0]
        self.assertEqual((claude["fg"], claude["dim"]), ("#9a9eb3", False))
        self.assertEqual((gemini["fg"], gemini["dim"]), ("#9a9eb3", False))
        self.assertTrue(claude["bold"])
        self.assertTrue(gemini["italic"])
        self.assertEqual(default_styles["$logo_stale"]["rules"][0]["fg"], "#brand")
        self.assertEqual(default_styles["$logo"]["fg"], "#brand")
        self.assertEqual(default_styles["$status"]["fg"], "#status")
        self.assertEqual(document["ui"]["sidebar"]["spaces"]["rows"][0][0]["fg"], "#space")
        self.assertEqual(document["ui"]["sidebar"]["width"], 42)
        self.assertTrue(document["ui"]["sidebar"]["transparent"])
        self.assertEqual(document["state"]["local"]["value"], "keep")
        self.assertEqual(document["ui"]["layout"]["mode"], "keep")
        text = self.active.read_text()
        self.assertIn(TAB_BAR, text)
        self.assertIn(RADAR, text)
        self.assertIn("# keep sidebar comment", text)
        self.assertLess(text.index("row_gap = 2"), text.index("rows = ["))

        first = self.active.read_bytes()
        self.sync(overrides=True)
        self.assertEqual(self.active.read_bytes(), first)

        self.active.write_text(local)
        self.sync(overrides=True)
        self.assertEqual(self.active.read_bytes(), first)

    def test_override_is_noop_without_marked_sidebar_block(self):
        local = SHARED + "\n[ui.sidebar.agents]\nrows = [[{ token = \"$group\", fg = \"#local\", dim = true }]]\n"
        self.active.write_text(local)
        self.sync(overrides=True)
        style = self.config()["ui"]["sidebar"]["agents"]["rows"][0][0]
        self.assertEqual((style["fg"], style["dim"]), ("#local", True))

    def test_herdr_kit_sidebar_marker_is_supported(self):
        self.active.write_text(
            SHARED + "\n" + SIDEBAR.replace("herdr-radar", "herdr-kit") + "\n"
        )
        self.sync(overrides=True)
        style = self.config()["ui"]["sidebar"]["agents"]["rows"][0][0]
        self.assertEqual((style["fg"], style["dim"]), ("#9a9eb3", False))

    def test_invalid_override_fails_before_mutating_active_or_state(self):
        self.active.write_text(SHARED + "\n" + SIDEBAR + "\n")
        before = self.active.read_bytes()
        self.overrides.write_text('[agents]\n"$group" = { fg = "#fff", bold = true }\n')
        self.sync(success=False, overrides=True)
        self.assertEqual(self.active.read_bytes(), before)
        self.assertFalse(Path(str(self.active) + ".before-dotfiles-sync").exists())
        self.assertFalse(Path(str(self.active) + ".dotfiles-keys.json").exists())


if __name__ == "__main__":
    unittest.main()
