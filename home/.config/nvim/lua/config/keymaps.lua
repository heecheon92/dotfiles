-- Keymaps are automatically loaded on the VeryLazy event
-- Default keymaps that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add any additional keymaps here

vim.keymap.set("n", "<leader>e", function()
  require("oil").open(LazyVim.root())
end, { desc = "Explorer Oil (root dir)" })

vim.keymap.set("n", "<leader>E", function()
  require("oil").open(vim.fn.getcwd())
end, { desc = "Explorer Oil (cwd)" })

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
