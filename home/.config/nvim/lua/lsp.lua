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

vim.opt.completeopt = { 'menu', 'menuone', 'noselect' }
vim.api.nvim_create_autocmd('LspAttach', {
  group = vim.api.nvim_create_augroup('native_lsp_completion', { clear = true }),
  callback = function(event)
    local client = vim.lsp.get_client_by_id(event.data.client_id)
    if client and client:supports_method('textDocument/completion') then
      vim.lsp.completion.enable(true, client.id, event.buf, { autotrigger = true })
    end
  end,
})
vim.lsp.enable({ 'lua_ls', 'pyrefly' })
vim.diagnostic.config({ virtual_text = true })
