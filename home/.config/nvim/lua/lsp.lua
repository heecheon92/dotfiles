-- Language servers are installed through Nix, not a Neovim package manager.
vim.lsp.config("lua_ls", {
	cmd = { "lua-language-server" },
	filetypes = { "lua" },
	root_markers = { ".luarc.json", ".luarc.jsonc", ".git" },
	settings = {
		Lua = {
			runtime = { version = "LuaJIT" },
			workspace = {
				checkThirdParty = false,
				library = { vim.env.VIMRUNTIME },
			},
		},
	},
})

vim.lsp.config("pyrefly", {
	cmd = { "pyrefly", "lsp" },
	init_options = {
		pyrefly = { typeCheckingMode = "default" },
	},
	filetypes = { "python" },
	root_markers = {
		"pyrefly.toml",
		"pyproject.toml",
		"setup.py",
		"setup.cfg",
		"requirements.txt",
		"Pipfile",
		".git",
	},
})

vim.lsp.config("ts_ls", {
	cmd = { "typescript-language-server", "--stdio" },
	filetypes = { "typescript", "typescriptreact", "javascript", "javascriptreact" },
	root_markers = { "tsconfig.json", "jsconfig.json", "package.json", ".git" },
	init_options = {
		preferences = {
			includeCompletionsForModuleExports = true,
			includeCompletionsForImportStatements = true,
			-- Keep dependency auto-imports enabled beyond TypeScript's automatic size limit.
			includePackageJsonAutoImports = "on",
		},
	},
})

vim.lsp.config("tailwindcss", {
	cmd = { "tailwindcss-language-server", "--stdio" },
	filetypes = { "html", "css", "javascript", "javascriptreact", "typescript", "typescriptreact" },
	root_markers = {
		{
			"tailwind.config.js",
			"tailwind.config.cjs",
			"tailwind.config.mjs",
			"tailwind.config.ts",
			"tailwind.config.cts",
			"tailwind.config.mts",
		},
		"package.json",
		".git",
	},
	settings = {
		tailwindCSS = {
			classAttributes = { "class", "className", "class:list", "classList" },
			classFunctions = { "cn", "clsx", "cva" },
		},
	},
})

vim.lsp.config("html", {
	cmd = { "vscode-html-language-server", "--stdio" },
	filetypes = { "html" },
	root_markers = { "package.json", ".git" },
})

vim.lsp.config("cssls", {
	cmd = { "vscode-css-language-server", "--stdio" },
	filetypes = { "css", "scss", "less" },
	root_markers = { "package.json", ".git" },
})

vim.lsp.config("yamlls", {
	cmd = { "yaml-language-server", "--stdio" },
	filetypes = { "yaml" },
	root_markers = { ".git" },
})

vim.lsp.config("jsonls", {
	cmd = { "vscode-json-language-server", "--stdio" },
	filetypes = { "json", "jsonc" },
	root_markers = { ".git" },
	init_options = { provideFormatter = true },
	settings = {
		json = { validate = { enable = true } },
	},
})

vim.opt.completeopt = { "menu", "menuone", "noselect", "popup" }
vim.api.nvim_create_autocmd("LspAttach", {
	group = vim.api.nvim_create_augroup("native_lsp_completion", { clear = true }),
	callback = function(event)
		local client = vim.lsp.get_client_by_id(event.data.client_id)
		if client and client:supports_method("textDocument/completion") then
			-- Native autotrigger otherwise only requests on server-defined punctuation.
			-- Extend it with the current buffer's keyword characters for identifiers.
			local completion = client.server_capabilities.completionProvider
			local triggers = completion.triggerCharacters or {}
			vim.api.nvim_buf_call(event.buf, function()
				for byte = 33, 126 do
					local char = string.char(byte)
					if vim.fn.match(char, [[\k]]) == 0 and not vim.list_contains(triggers, char) then
						triggers[#triggers + 1] = char
					end
				end
			end)
			completion.triggerCharacters = triggers
			local icons = require("mini.icons")
			vim.lsp.completion.enable(true, client.id, event.buf, {
				autotrigger = true,
				convert = function(item)
					local kind = vim.lsp.protocol.CompletionItemKind[item.kind] or "Text"
					local icon, hl = icons.get("lsp", kind)
					return { kind = icon .. " " .. kind, kind_hlgroup = hl }
				end,
			})
		end
	end,
})

vim.api.nvim_create_autocmd("InsertCharPre", {
	group = vim.api.nvim_create_augroup("native_lsp_signature_help", { clear = true }),
	callback = function(event)
		local bufnr = event.buf
		local char = vim.v.char
		local should_trigger = false
		for _, client in ipairs(vim.lsp.get_clients({ bufnr = bufnr, method = "textDocument/signatureHelp" })) do
			local provider = client.server_capabilities.signatureHelpProvider
			if
				provider
				and (
					vim.list_contains(provider.triggerCharacters or {}, char)
					or vim.list_contains(provider.retriggerCharacters or {}, char)
				)
			then
				should_trigger = true
				break
			end
		end
		if not should_trigger then
			return
		end

		-- Wait until the character (and any automatic closing pair) is inserted.
		vim.schedule(function()
			if
				vim.api.nvim_buf_is_valid(bufnr)
				and vim.api.nvim_get_current_buf() == bufnr
				and vim.fn.mode() == "i"
			then
				vim.lsp.buf.signature_help({ focusable = false, silent = true })
			end
		end)
	end,
})

vim.lsp.enable({ "lua_ls", "pyrefly", "ts_ls", "tailwindcss", "html", "cssls", "yamlls", "jsonls" })
vim.diagnostic.config({ virtual_text = true })
