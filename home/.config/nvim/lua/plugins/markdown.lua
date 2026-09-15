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
      vim.api.nvim_create_autocmd('FileType', {
        pattern = { 'javascriptreact', 'typescriptreact', 'html' },
        callback = function()
          vim.bo.indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
        end,
      })
    end,
  },
  {
    'windwp/nvim-autopairs',
    event = 'InsertEnter',
    opts = {
      -- Keep visible completion text when expanding a pair with Enter.
      map_cr = false,
    },
    config = function(_, opts)
      local autopairs = require('nvim-autopairs')
      autopairs.setup(opts)

      local newline = autopairs.esc('<CR>')
      vim.keymap.set('i', '<CR>', function()
        local keys = vim.bo.buftype == '' and autopairs.autopairs_cr() or newline
        if keys ~= newline and vim.fn.pumvisible() == 1 then
          -- End completion without Ctrl-E rolling back visible tag punctuation.
          vim.fn.complete(vim.fn.col('.'), {})
        end
        vim.api.nvim_feedkeys(keys, 'ni', false)
      end, { desc = 'Smart newline with native indentation' })
    end,
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
