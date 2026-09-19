# Dotfiles agent guidance

## Neovim foreground visibility

Use this procedure for hard-to-read text or guides over transparent, blurred
terminal backgrounds. Preserve the user's transparency, blur, theme, and useful
editor features unless the user explicitly asks to change them.

### Diagnose the actual display layer

- Read the relevant section of [the editor guide](docs/editor.md) and the current
  [appearance configuration](home/.config/nvim/lua/plugins/appearance.lua).
  The Lua configuration is the source of truth for colors; do not rely on an old
  transcript or duplicate its palette in another configuration file.
- Distinguish actual buffer text from LSP inlay hints, other virtual text,
  indentation guides, and picker labels. Do not assume every faint label is code.
- For actual text, place the cursor on it and use `:Inspect` to identify syntax,
  Treesitter, and semantic-token highlights. Virtual text/extmarks may not appear
  there; inspect the rendering plugin's configured highlight group instead.
- For suspected inlay hints, `Space u h` toggles their visibility. Restore the
  original state after diagnosis; disabling hints is not a contrast fix.
- Use `:verbose highlight LspInlayHint` to inspect a candidate definition and any
  available last-set information. Resolve links with
  `:lua vim.print(vim.api.nvim_get_hl(0, { name = "LspInlayHint", link = false }))`.
  Check `:set termguicolors?` before assuming RGB overrides are effective.

### Known groups from the recent fixes

- Comments: `Comment`, `SpecialComment`. In the current theme, `@comment` and
  `@lsp.type.comment` resolve through `Comment`; check language-specific overrides.
- Line numbers: `LineNr`; inferred type/parameter annotations: `LspInlayHint`.
- Regular Snacks indent guides: `SnacksIndent`; active scope: `SnacksIndentScope`.
  Preserve a visible distinction between ordinary guides and the active scope.
- Picker labels: `SnacksPickerPathHidden`, `SnacksPickerPathIgnored`,
  `SnacksPickerGitStatusIgnored`, `SnacksPickerGitStatusUntracked`. These currently
  link to `Grey`; preserve the working filename fix when changing editor colors.

### Apply the narrowest override

- Extend the existing `ColorScheme` callback in `appearance.lua`. For a foreground
  adjustment, add the target group to its existing foreground table. Do not add
  duplicate callbacks or edit installed/generated colorscheme files.
- Read the resolved attributes with `nvim_get_hl(..., { link = false })`, change
  only `fg`, then call `nvim_set_hl`. Preserve existing italic/bold/background
  attributes rather than replacing the whole definition with `{ fg = ... }`.
- Target the affected leaf group. Do not brighten `Grey`, `NonText`, all syntax
  colors, or the entire theme palette to fix one surface. The indent fix targeted
  `SnacksIndent`, not `NonText`, to avoid brightening unrelated whitespace markers.
- A temporary trial can use the following command; the color is illustrative,
  not a universal contrast target:

  ```vim
  :lua local g="LspInlayHint"; local h=vim.api.nvim_get_hl(0,{name=g,link=false}); h.fg="#b0b6c2"; vim.api.nvim_set_hl(0,g,h)
  ```

- `:colorscheme sonokai` resets the trial using the already-loaded theme callback.
  It does **not** reload edited plugin `init` code. Restart Neovim after changing
  `appearance.lua` to verify the persistent configuration. No Nix rebuild is
  needed for these Lua-only changes through the existing out-of-store config link.

### Verify and report

- Exercise a representative file/picker in a fresh, isolated Neovim session.
  Check the effective foreground and linked captures, preserved attributes, and
  theme reapplication. Use the repository's StyLua configuration for Lua changes.
- Inspect the actual surface against the usual opacity/blur background, including
  active/inactive windows where relevant. Watch for opaque rectangles, lost scope
  distinction, and unintended changes to syntax, whitespace, or picker colors.
- If the user's real composited background is unavailable, say so: runtime color
  checks prove the override applied, not that subjective readability is solved.
  A variable background cannot support a universal contrast guarantee.
- If all foregrounds remain washed out, discuss terminal opacity/background as
  a separate choice. Do not silently disable transparency, blur, or annotations.
- Update the editor guide when behavior changes, remove temporary fixtures, and
  close only verification sessions created for the task. Do not commit or push
  unless requested.
