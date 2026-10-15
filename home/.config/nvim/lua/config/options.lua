-- Options are automatically loaded before lazy.nvim startup
-- Default options that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/options.lua
-- Add any additional options here

vim.g.lazyvim_python_lsp = "pyrefly"

-- ############################################################################
--                             Neovide section
-- ############################################################################

-- Neovide uses the same LazyVim configuration, with these GUI-only additions.
if vim.g.neovide then
  -- Font and system clipboard.
  vim.opt.clipboard = "unnamedplus"
  vim.opt.guifont = "Hack Nerd Font Mono:h14"

  local function save()
    vim.cmd.write()
  end
  local function copy()
    vim.cmd([[normal! "+y]])
  end
  local function paste()
    vim.api.nvim_paste(vim.fn.getreg("+"), true, -1)
  end

  -- macOS save, copy, and paste shortcuts.
  vim.keymap.set({ "n", "i", "v" }, "<D-s>", save, { desc = "Save" })
  vim.keymap.set("v", "<D-c>", copy, { silent = true, desc = "Copy" })
  vim.keymap.set({ "n", "i", "v", "c", "t" }, "<D-v>", paste, { silent = true, desc = "Paste" })

  -- Confirm quitting and let the launcher handle initial window placement.
  vim.g.neovide_confirm_quit = true
  vim.g.neovide_remember_window_position = false
  vim.g.neovide_remember_window_size = false

  -- This is limited by the refresh rate of your physical hardware, but can be
  -- lowered to increase battery life
  -- This setting is only effective when not using vsync,
  -- for example by passing --no-vsync on the commandline.
  --
  -- Refresh-rate cap; only effective when Neovide's vsync is disabled.
  -- This Lua setting does not itself disable vsync.
  -- https://github.com/wez/wezterm/issues/6334
  vim.g.neovide_refresh_rate = 120

  -- Cursor animation duration in seconds; longer durations make motion more visible.
  vim.g.neovide_cursor_animation_length = 0.18
  -- Short horizontal cursor movements, such as typing.
  vim.g.neovide_cursor_short_animation_length = 0.15
  -- Window-position animation duration, such as when creating a split.
  vim.g.neovide_position_animation_length = 0.20
  -- Cursor trail size, kept at the requested value.
  vim.g.neovide_cursor_trail_size = 7

  -- Disable Neovide's scroll animation; leave Snacks animation settings unchanged.
  -- Related rendering issue: https://github.com/neovide/neovide/issues/1550
  vim.g.neovide_scroll_animation_length = 0

  -- Cursor effects: railgun, torpedo, pixiedust, sonicboom, ripple, wireframe.
  -- Set to "" to disable cursor effects.
  vim.g.neovide_cursor_vfx_mode = "railgun"
  -- vim.g.neovide_cursor_vfx_mode = "torpedo"
  -- vim.g.neovide_cursor_vfx_mode = "pixiedust"
  -- vim.g.neovide_cursor_vfx_mode = "sonicboom"
  -- vim.g.neovide_cursor_vfx_mode = "ripple"
  -- vim.g.neovide_cursor_vfx_mode = "wireframe"

  -- Treat right Option as Meta inside Neovide; AeroSpace global bindings take priority.
  vim.g.neovide_input_macos_option_key_is_meta = "only_right"
end

-- ############################################################################
--                           End of Neovide section
-- ############################################################################
