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
