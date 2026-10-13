return {
  {
    "neovim/nvim-lspconfig",
    opts = {
      servers = {
        html = {},
        cssls = {},
        pyrefly = {
          settings = {
            python = {
              pyrefly = { typeCheckingMode = "default" },
            },
          },
        },
      },
    },
  },
  {
    "mfussenegger/nvim-lint",
    opts = function(_, opts)
      opts.linters = opts.linters or {}
      local markdownlint = opts.linters["markdownlint-cli2"] or {}
      -- cli2 has no --disable flag; preserve its args and project configuration.
      markdownlint.parser = require("lint.util").wrap(require("lint").linters["markdownlint-cli2"], function(diagnostic)
        -- The errorformat parser keeps the rule identifier in the message.
        if not diagnostic.message:match("^error MD013/") then
          return diagnostic
        end
      end).parser
      opts.linters["markdownlint-cli2"] = markdownlint
    end,
  },
  {
    "stevearc/conform.nvim",
    opts = {
      formatters_by_ft = {
        python = { "ruff_fix", "ruff_format" },
      },
      formatters = {
        ruff_fix = {
          append_args = { "--select", "F401,I001" },
        },
      },
    },
  },
}
