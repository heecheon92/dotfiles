-- A normal, unnamed buffer: no plugin manager, dashboard, or session restore.
vim.opt.loadplugins = false
vim.opt.hidden = true
vim.opt.confirm = true
vim.opt.clipboard = "unnamedplus"
vim.opt.guifont = "Hack Nerd Font Mono:h14"

vim.keymap.set("v", "<D-c>", '"+y', { silent = true })
vim.keymap.set("n", "<D-v>", '"+p', { silent = true })
vim.keymap.set({ "i", "c" }, "<D-v>", "<C-r>+", { silent = true })

if vim.g.neovide then
  vim.g.neovide_confirm_quit = true
  vim.g.neovide_remember_window_position = false
  vim.g.neovide_remember_window_size = false
  vim.g.neovide_position_animation_length = 0
  vim.g.neovide_scroll_animation_length = 0
  vim.g.neovide_cursor_animation_length = 0
  vim.g.neovide_cursor_short_animation_length = 0
  vim.g.neovide_cursor_vfx_mode = ""
end
