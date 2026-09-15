-- select all
vim.keymap.set('n', '<C-a>', 'ggVG', { desc = 'Select All' })
-- pasting over a selection no longer clobbers your clipboard
vim.cmd([[ xnoremap <expr> p 'pgv"'.v:register.'y' ]])

vim.keymap.set({ 'n', 'x', 'i' }, '<C-.>', vim.lsp.buf.code_action, { desc = 'Code actions' })

vim.keymap.set('i', '<C-y>', function()
  if vim.fn.pumvisible() == 1
      and vim.fn.complete_info({ 'selected' }).selected == -1 then
    return '<C-n><C-y>'
  end
  return '<C-y>'
end, { expr = true, desc = 'Accept selected or first completion' })
