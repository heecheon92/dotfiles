return {
  {
    "stevearc/oil.nvim",
    lazy = false,
    opts = {
      default_file_explorer = false,
      view_options = { show_hidden = true },
      -- Use native sign columns so LazyVim's statuscolumn does not hide a Git status.
      win_options = { signcolumn = "yes:2", statuscolumn = "" },
      keymaps = {
        ["g."] = false,
        ["<C-h>"] = false,
        ["<C-l>"] = false,
        ["<C-s>"] = { "actions.select", opts = { horizontal = true } },
        ["<C-v>"] = { "actions.select", opts = { vertical = true } },
        ["gR"] = { "actions.refresh", mode = "n" },
      },
    },
  },
  {
    "refractalize/oil-git-status.nvim",
    dependencies = { "stevearc/oil.nvim" },
    opts = {},
  },
  {
    "folke/snacks.nvim",
    opts = {
      image = { enabled = true },
      picker = {
        sources = {
          files = { hidden = true },
          grep = { hidden = true },
          grep_word = { hidden = true },
          explorer = {
            hidden = true,
            win = { list = { keys = { ["H"] = false } } },
          },
        },
        win = {
          input = { keys = { ["<a-h>"] = false } },
          list = { keys = { ["<a-h>"] = false } },
        },
      },
    },
  },
  {
    "folke/flash.nvim",
    opts = { modes = { search = { enabled = true } } },
  },
  {
    "lewis6991/gitsigns.nvim",
    opts = { current_line_blame = true },
  },
  {
    "kevinhwang91/nvim-hlslens",
    event = "VeryLazy",
    opts = {},
  },
}
