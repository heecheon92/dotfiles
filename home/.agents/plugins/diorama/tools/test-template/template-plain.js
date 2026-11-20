/*
 * A test-only template ("plain"): no steps and no stage. It shows a walkthrough's title, question
 * and one paragraph of "text" at a single position, has a one-tile contact sheet and one check.
 * It exists to prove that a template plugs into the shell without changing the shell, the stage
 * or the step story, and is not shipped inside the skill. See references/templates.md.
 */
Diorama.defineTemplate('plain', { stage: null }, (kit) => {
  'use strict';

  const { esc, isObject, sheetChecks } = kit;
  const AT = 'page';   // the one position, written #/<id>/page
  const found = new WeakMap();

  function unusable(w) {
    if (!isObject(w)) return 'it is missing or is not a JSON object';
    if (typeof w.text !== 'string' || !w.text.trim()) return 'it has no "text"';
    return null;
  }

  // The automatic checks, run and printed to the console once per walkthrough object.
  function checks(w) {
    if (!found.has(w)) {
      const out = { warnings: [], notes: [] };
      if (typeof w.question !== 'string' || !w.question.trim()) out.warnings.push('it has no "question"; say what the page answers');
      found.set(w, out);
      for (const m of out.warnings) console.warn(`[diorama] ${w.id}: ${m}`);
    }
    return found.get(w);
  }

  // One position. In a collection (loose) any segment means the page.
  const positions = () => ({
    count: 1,
    first: AT,
    last: AT,
    parse: (seg, loose) => (seg === AT || loose ? AT : null),
    format: () => AT,
    label: () => 'the page',
  });

  const head = (w, crumb) => `${crumb ? `<p class="crumb">${esc(crumb)}</p>` : ''}<h1 tabindex="-1">${esc(w.title || '')}</h1>`
    + `${w.question ? `<p class="question">${esc(w.question)}</p>` : ''}`;

  function mount(host, w, opts) {
    const L = opts.labels;
    document.title = opts.docTitle || w.title || 'Walkthrough';
    host.innerHTML = `<div class="page plain-page">
  <header class="wt-head"><div>${head(w, opts.crumb)}</div></header>
  <section class="card plain-card">
    <p class="plain-text">${esc(w.text)}</p>
    <div class="plain-nav">${opts.prev ? `<button class="btn" type="button" data-go="prev">${esc(L.back)}: ${esc(opts.prev.title)}</button>` : ''}`
      + `${opts.end ? `<button class="btn primary" type="button" data-go="end">${esc(opts.end.label)}</button>` : ''}</div>
  </section>
</div>`;
    const onClick = (e) => {
      const b = e.target.closest('[data-go]');
      if (b) (b.dataset.go === 'prev' ? opts.prev : opts.end).go();
    };
    host.addEventListener('click', onClick);
    const go = () => { if (opts.onMove) opts.onMove(AT); };
    go();
    return {
      get position() { return AT; },
      go,
      key: () => false,
      focusTitle: () => host.querySelector('h1').focus({ preventScroll: true }),
      destroy: () => { host.removeEventListener('click', onClick); host.innerHTML = ''; },
    };
  }

  function mountSheet(host, w, opts) {
    document.title = opts.docTitle || `${w.title || 'Walkthrough'} · contact sheet`;
    host.innerHTML = `<div class="sheet">
  <header class="wt-head sheet-head"><div>${head(w, `${opts.crumb ? `${opts.crumb} · ` : ''}Contact sheet`)}</div></header>
  ${sheetChecks(checks(w), 'Not checked automatically: whether the text is right. Read the page for that.')}
  <ol class="sheet-grid" aria-label="The page"><li class="tile card">
    <p class="tile-head"><span class="tile-id">${AT}</span></p>
    <h2 class="tile-title"><a href="#/${encodeURIComponent(w.id)}/${AT}">${esc(w.title || '')}</a></h2>
    <p class="plain-text">${esc(w.text)}</p>
  </li></ol>
</div>`;
    return {
      focusTitle: () => host.querySelector('h1').focus({ preventScroll: true }),
      destroy: () => { host.innerHTML = ''; },
    };
  }

  const search = (w) => [{ at: AT, title: String(w.question || w.title || ''), sub: w.text.slice(0, 90), text: `${w.question || ''} ${w.text}` }];

  return { labels: { back: 'Back' }, unusable, prepare: checks, checks, positions, mount, mountSheet, search };
});
