return {
  {
    'nvim-treesitter/nvim-treesitter',
    lazy = false,
    build = ':TSUpdate',
    config = function()
      require('nvim-treesitter').install({ 'markdown', 'markdown_inline' }):wait(300000)
      vim.api.nvim_create_autocmd('FileType', {
        pattern = 'markdown',
        callback = function() vim.treesitter.start() end,
      })
    end,
  },
  {
    'nvim-mini/mini.icons',
    opts = {},
  },
  {
    'MeanderingProgrammer/render-markdown.nvim',
    ft = { 'markdown' },
    dependencies = {
      'nvim-treesitter/nvim-treesitter',
      'nvim-mini/mini.icons',
    },
    opts = {
      completions = {
        lsp = { enabled = true },
      },
    },
    keys = {
      { '<leader>mr', '<cmd>RenderMarkdown toggle<cr>', desc = 'Toggle Rendered Markdown' },
      { '<leader>mp', '<cmd>RenderMarkdown preview<cr>', desc = 'Preview Markdown' },
    },
  },
}
