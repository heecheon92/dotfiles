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

vim.lsp.config('ts_ls', {
  cmd = { 'typescript-language-server', '--stdio' },
  filetypes = { 'typescript', 'typescriptreact', 'javascript', 'javascriptreact' },
  root_markers = { 'tsconfig.json', 'jsconfig.json', 'package.json', '.git' },
  init_options = {
    preferences = {
      includeCompletionsForModuleExports = true,
      includeCompletionsForImportStatements = true,
      -- Keep dependency auto-imports enabled beyond TypeScript's automatic size limit.
      includePackageJsonAutoImports = 'on',
    },
  },
})

vim.lsp.config('tailwindcss', {
  cmd = { 'tailwindcss-language-server', '--stdio' },
  filetypes = { 'html', 'css', 'javascript', 'javascriptreact', 'typescript', 'typescriptreact' },
  root_markers = {
    {
      'tailwind.config.js',
      'tailwind.config.cjs',
      'tailwind.config.mjs',
      'tailwind.config.ts',
      'tailwind.config.cts',
      'tailwind.config.mts',
    },
    'package.json',
    '.git',
  },
  settings = {
    tailwindCSS = {
      classAttributes = { 'class', 'className', 'class:list', 'classList' },
      classFunctions = { 'cn', 'clsx', 'cva' },
    },
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
      if client.name == 'ts_ls' or client.name == 'tailwindcss' or client.name == 'pyrefly' then
        -- Native autotrigger otherwise only requests on server-defined punctuation,
        -- not while typing identifiers or Tailwind class tokens.
        local completion = client.server_capabilities.completionProvider
        local triggers = completion.triggerCharacters or {}
        for char in ('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$'):gmatch('.') do
          if not vim.list_contains(triggers, char) then
            triggers[#triggers + 1] = char
          end
        end
        completion.triggerCharacters = triggers
      end
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

vim.api.nvim_create_autocmd('InsertCharPre', {
  group = vim.api.nvim_create_augroup('native_python_signature_help', { clear = true }),
  callback = function(event)
    if vim.bo[event.buf].filetype ~= 'python' then
      return
    end
    for _, client in ipairs(vim.lsp.get_clients({ bufnr = event.buf, method = 'textDocument/signatureHelp' })) do
      local provider = client.server_capabilities.signatureHelpProvider
      if provider and vim.list_contains(provider.triggerCharacters or {}, vim.v.char) then
        -- Wait until the character (and any automatic closing pair) is inserted.
        vim.schedule(function()
          if vim.api.nvim_get_current_buf() == event.buf and vim.fn.mode() == 'i' then
            vim.lsp.buf.signature_help({ focusable = false, silent = true })
          end
        end)
        return
      end
    end
  end,
})

vim.lsp.enable({ 'lua_ls', 'pyrefly', 'ts_ls', 'tailwindcss', 'yamlls', 'jsonls' })
vim.diagnostic.config({ virtual_text = true })
