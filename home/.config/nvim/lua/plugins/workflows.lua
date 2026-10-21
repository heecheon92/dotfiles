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
            layout = { preset = "sidebar", preview = "main" },
            actions = {
              toggle_preview_placement = function(picker)
                local layout = vim.deepcopy(picker.resolved_layout)
                if layout.preview == "main" then
                  layout.preview = nil
                else
                  layout.preview = "main"
                end
                layout.hidden = vim.tbl_filter(function(win)
                  return win ~= "preview"
                end, layout.hidden or {})
                picker:set_layout(layout)
                picker:focus("list")
              end,
            },
            win = {
              input = {
                keys = {
                  ["<a-p>"] = { "toggle_preview_placement", mode = { "i", "n" }, desc = "Switch preview placement" },
                },
              },
              list = {
                keys = {
                  ["H"] = false,
                  ["<a-p>"] = { "toggle_preview_placement", desc = "Switch preview placement" },
                },
              },
            },
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
