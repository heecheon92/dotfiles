return {
  {
    'stevearc/conform.nvim',
    event = 'BufWritePre',
    cmd = 'ConformInfo',
    opts = {
      formatters_by_ft = {
        javascript = { 'prettier' },
        javascriptreact = { 'prettier' },
        typescript = { 'prettier' },
        typescriptreact = { 'prettier' },
        html = { 'prettier' },
        css = { 'prettier' },
        json = { 'prettier' },
        lua = { 'stylua' },
        python = { 'ruff_format' },
      },
      format_on_save = {
        timeout_ms = 2000,
        lsp_format = 'fallback',
      },
    },
  },
}
