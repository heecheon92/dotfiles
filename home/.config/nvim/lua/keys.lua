-- select all
vim.keymap.set('n', '<C-a>', 'ggVG', { desc = 'Select All' })
-- pasting over a selection no longer clobbers your clipboard
vim.cmd([[ xnoremap <expr> p 'pgv"'.v:register.'y' ]])

vim.keymap.set({ 'n', 'x', 'i' }, '<C-.>', vim.lsp.buf.code_action, { desc = 'Code actions' })
