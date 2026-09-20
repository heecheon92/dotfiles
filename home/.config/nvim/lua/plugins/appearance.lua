return {
  {
    "sainnhe/sonokai",
    init = function()
      vim.g.sonokai_style = "atlantis"
      vim.g.sonokai_transparent_background = 1
      vim.g.sonokai_better_performance = 1

      vim.api.nvim_create_autocmd("ColorScheme", {
        pattern = "sonokai",
        callback = function()
          -- Lift dim editor text without changing syntax colors or backgrounds.
          for group, foreground in pairs({
            Comment = "#b0b6c2",
            SpecialComment = "#b0b6c2",
            LineNr = "#9299a8",
            LspInlayHint = "#a0a7b4",
            SnacksIndent = "#9299a8",
            SnacksIndentScope = "#d6bdff",
          }) do
            local highlight = vim.api.nvim_get_hl(0, { name = group, link = false })
            highlight.fg = foreground
            vim.api.nvim_set_hl(0, group, highlight)
          end

          for _, group in ipairs({
            "SnacksPickerPathHidden",
            "SnacksPickerPathIgnored",
            "SnacksPickerGitStatusIgnored",
            "SnacksPickerGitStatusUntracked",
          }) do
            vim.api.nvim_set_hl(0, group, { link = "Grey" })
          end
        end,
      })
    end,
  },
  {
    "LazyVim/LazyVim",
    opts = { colorscheme = "sonokai" },
  },
}
