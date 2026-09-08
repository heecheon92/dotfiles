return {
  {
    'nvim-treesitter/nvim-treesitter',
    lazy = false,
    build = ':TSUpdate',
    config = function()
      require('nvim-treesitter').install({
        'html',
        'javascript',
        'json',
        'lua',
        'python',
        'markdown',
        'markdown_inline',
        'tsx',
        'typescript',
        'yaml',
      }):wait(300000)
      vim.api.nvim_create_autocmd('FileType', {
        pattern = 'markdown',
        callback = function() vim.treesitter.start() end,
      })
    end,
  },
  {
    'windwp/nvim-autopairs',
    event = 'InsertEnter',
    opts = {
      -- Keep native completion's <C-Y> acceptance and Enter newline behavior.
      map_cr = false,
    },
  },
  {
    'windwp/nvim-ts-autotag',
    event = { 'BufReadPre', 'BufNewFile' },
    dependencies = { 'nvim-treesitter/nvim-treesitter' },
    opts = {
      opts = {
        enable_close = true,
        enable_rename = true,
        enable_close_on_slash = false,
      },
    },
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
