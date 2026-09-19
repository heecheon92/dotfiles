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
}
