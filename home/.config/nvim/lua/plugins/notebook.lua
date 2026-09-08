return {
  {
    'sheng-tse/jupynvim',
    version = '*',
    -- Register BufReadCmd before Neovim opens an .ipynb as ordinary JSON.
    lazy = false,
    build = function(plugin)
      local install = loadfile(plugin.dir .. '/lua/jupynvim/install.lua')()
      install.run(plugin)
    end,
    opts = {
      -- WezTerm/iTerm2 do not support the Kitty placeholders used by this plugin.
      -- v0.4.5 still gates code-cell images on Kitty detection; see README.
      image_renderer = 'chafa',
    },
  },
}
