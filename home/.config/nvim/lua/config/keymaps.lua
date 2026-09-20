-- Keymaps are automatically loaded on the VeryLazy event
-- Default keymaps that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add any additional keymaps here

vim.keymap.set("n", "<leader>e", function()
  require("oil").open(LazyVim.root())
end, { desc = "Explorer Oil (root dir)" })

vim.keymap.set("n", "<leader>E", function()
  require("oil").open(vim.fn.getcwd())
end, { desc = "Explorer Oil (cwd)" })

vim.keymap.set("n", "<leader>fh", function()
  local view_options = require("oil.config").view_options
  local previous = view_options.show_hidden
  require("oil").toggle_hidden()
  local hidden = view_options.show_hidden
  -- Oil refuses to refresh when a directory buffer has unsaved edits.
  if hidden == previous then
    return
  end

  for _, source in ipairs({ "files", "grep", "grep_word", "explorer" }) do
    Snacks.config.picker.sources[source].hidden = hidden
    for _, picker in ipairs(Snacks.picker.get({ source = source, tab = false })) do
      picker.opts.hidden = hidden
      picker.list:set_target()
      picker:find()
    end
  end
end, { desc = "Files Toggle Hidden (Oil/Snacks)" })

for _, motion in ipairs({ "n", "N", "*", "#", "g*", "g#" }) do
  vim.keymap.set("n", motion, function()
    local command = motion
    if motion == "n" or motion == "N" then
      command = command .. "zv"
    end
    vim.cmd(("normal! %d%s"):format(vim.v.count1, command))
    require("hlslens").start()
  end, { desc = "Search " .. motion .. " with hlslens" })
end
