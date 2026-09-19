return {
  {
    "sheng-tse/jupynvim",
    version = "*",
    -- Register BufReadCmd before Neovim opens an .ipynb as ordinary JSON.
    lazy = false,
    build = function(plugin)
      local install = loadfile(plugin.dir .. "/lua/jupynvim/install.lua")()
      install.run(plugin)
    end,
    opts = {
      -- WezTerm and iTerm2 need the static terminal-image fallback.
      image_renderer = "chafa",
      -- Keep LazyVim's global explorer, terminal, and picker mappings.
      explorer_keys = {},
      explorer_cwd_keys = {},
      terminal_keys = {},
      terminal_right_keys = {},
      pick_keys = {
        files = {},
        grep = {},
      },
    },
  },
}
