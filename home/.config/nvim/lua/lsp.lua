-- Language servers are installed through Nix, not a Neovim package manager.
vim.lsp.config('lua_ls', {
  cmd = { 'lua-language-server' },
  filetypes = { 'lua' },
  root_markers = { '.luarc.json', '.luarc.jsonc', '.git' },
  settings = {
    Lua = {
      runtime = { version = 'LuaJIT' },
      workspace = {
        checkThirdParty = false,
        library = { vim.env.VIMRUNTIME },
      },
    },
  },
})

vim.lsp.config('pyrefly', {
  cmd = { 'pyrefly', 'lsp' },
  init_options = {
    pyrefly = { typeCheckingMode = 'default' },
  },
  filetypes = { 'python' },
  root_markers = {
    'pyrefly.toml',
    'pyproject.toml',
    'setup.py',
    'setup.cfg',
    'requirements.txt',
    'Pipfile',
    '.git',
  },
})

vim.lsp.config('yamlls', {
  cmd = { 'yaml-language-server', '--stdio' },
  filetypes = { 'yaml' },
  root_markers = { '.git' },
})

vim.lsp.config('jsonls', {
  cmd = { 'vscode-json-language-server', '--stdio' },
  filetypes = { 'json', 'jsonc' },
  root_markers = { '.git' },
  init_options = { provideFormatter = true },
  settings = {
    json = { validate = { enable = true } },
  },
})

vim.opt.completeopt = { 'menu', 'menuone', 'noselect', 'popup' }
vim.api.nvim_create_autocmd('LspAttach', {
  group = vim.api.nvim_create_augroup('native_lsp_completion', { clear = true }),
  callback = function(event)
    local client = vim.lsp.get_client_by_id(event.data.client_id)
    if client and client:supports_method('textDocument/completion') then
      local icons = require('mini.icons')
      vim.lsp.completion.enable(true, client.id, event.buf, {
        autotrigger = true,
        convert = function(item)
          local kind = vim.lsp.protocol.CompletionItemKind[item.kind] or 'Text'
          local icon, hl = icons.get('lsp', kind)
          return { kind = icon .. ' ' .. kind, kind_hlgroup = hl }
        end,
      })
    end
  end,
})
vim.lsp.enable({ 'lua_ls', 'pyrefly', 'yamlls', 'jsonls' })
vim.diagnostic.config({ virtual_text = true })
