return {
	{
		"sainnhe/sonokai",
		lazy = false,
		priority = 1000,
		config = function()
			vim.g.sonokai_style = "atlantis"
			vim.g.sonokai_better_performance = 1
			vim.g.sonokai_transparent_background = 1
			vim.cmd.colorscheme("sonokai")
			-- Keep subdued filenames readable without changing transparent backgrounds.
			for _, group in ipairs({
				"SnacksPickerPathHidden",
				"SnacksPickerPathIgnored",
				"SnacksPickerGitStatusIgnored",
				"SnacksPickerGitStatusUntracked",
			}) do
				vim.api.nvim_set_hl(0, group, { link = "Grey" })
			end
		end,
	},
}
