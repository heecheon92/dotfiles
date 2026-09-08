local function search_motion(motion)
  return function()
    vim.cmd(('normal! %d%s'):format(vim.v.count1, motion))
    require('hlslens').start()
  end
end

return {
  {
    'HiPhish/rainbow-delimiters.nvim',
    lazy = false,
    dependencies = { 'nvim-treesitter/nvim-treesitter' },
  },
  {
    'folke/which-key.nvim',
    lazy = false,
    config = true,  -- popup that shows what my leader keys do
  },
  {
    'rachartier/tiny-cmdline.nvim',
    lazy = false,
    init = function()
      vim.o.cmdheight = 0
      require('vim._core.ui2').enable({})
    end,
    opts = {
      width = { value = '70%' },
    },
  },
  {
    'mawkler/modicator.nvim',
    lazy = false,
    opts = {},
  },
  {
    'kevinhwang91/nvim-hlslens',
    lazy = false,
    opts = {},
    keys = {
      { 'n', search_motion('n'), desc = 'Next search result' },
      { 'N', search_motion('N'), desc = 'Previous search result' },
      { '*', search_motion('*'), desc = 'Search word forward' },
      { '#', search_motion('#'), desc = 'Search word backward' },
      { 'g*', search_motion('g*'), desc = 'Search word forward (partial)' },
      { 'g#', search_motion('g#'), desc = 'Search word backward (partial)' },
      { '<leader>l', '<cmd>nohlsearch<cr>', desc = 'Clear search highlights' },
    },
  },
}
