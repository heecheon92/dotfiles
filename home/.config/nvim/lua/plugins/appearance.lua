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
            SnacksDashboardHeader = "#7199ff",
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
  {
    "folke/snacks.nvim",
    opts = function(_, opts)
      local header = [[
        ▄██████▄ ▄████▄
      ▄██████████████████▄
    ▄██████████████████████▄
    ████▀              ▀████
    ████   ▀▄           ████
    ████    ▄▀    ▄▄▄   ████
    ████   ▀            ████
     ███▄              ▄███
      ▀██████████████████▀
          ▄██████████▄
        ▄███  › ▄▄  ███▄
        ███ ████████ ███
        ▀▀  ███  ███  ▀▀
            ███  ███
            ▀▀▀  ▀▀▀

           ▄▄▄▄▄▄▄▄▄▄
]]
      -- Snacks centers each row separately; equal widths preserve the silhouette.
      local lines = vim.split(header, "\n", { trimempty = true })
      local width = 0
      for _, line in ipairs(lines) do
        width = math.max(width, vim.fn.strdisplaywidth(line))
      end
      for i, line in ipairs(lines) do
        lines[i] = line .. string.rep(" ", width - vim.fn.strdisplaywidth(line))
      end
      opts.dashboard.preset.header = table.concat(lines, "\n")
    end,
  },
}
