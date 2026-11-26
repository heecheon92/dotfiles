/*
 * Diorama engine shell: presents one walkthrough as a single-file page, or a collection of
 * walkthroughs behind one shell page. How a walkthrough is presented (its template) and how its
 * picture is drawn (the template's stage) live in files next to this one, which the shell loads
 * when a walkthrough needs them: template-<name>.js/.css and stage-<name>.js/.css.
 *
 * Public API (one global):
 *   Diorama.collection(obj)        collection.js registers the outline
 *   Diorama.walkthrough(obj)       walkthroughs/<id>.js registers one walkthrough
 *   Diorama.startCollection()      index.html starts the collection shell
 *   Diorama.startSingle(obj)       the single-file page starts one walkthrough
 *   Diorama.defineTemplate(name, { stage }, factory)   a template file defines its template
 *   Diorama.defineStage(name, factory)                 a stage file defines its stage
 *
 * No dependencies, no network, works from file://. The data formats are described in the
 * diorama-maker skill: references/walkthrough-schema.md and references/collection.md; the
 * template and stage contracts in references/templates.md.
 */
(() => {
  'use strict';

  const VERSION = '0.7.0';
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const warn = (m) => console.warn(`[diorama] ${m}`);
  const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  // The folder this file was loaded from, where template and stage files are looked for. The
  // single-file page carries everything inline and never loads one.
  const ENGINE = document.currentScript && document.currentScript.src ? new URL('.', document.currentScript.src).href : 'engine/';

  /* ================= Small helpers ================= */

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const linear = (t) => t;
  const inOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const outCubic = (t) => 1 - Math.pow(1 - t, 3);
  const outBack = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
  const n1 = (v) => Math.round(v * 10) / 10;
  const n2 = (v) => Math.round(v * 100) / 100;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  /* ================= Icons (24px box, stroked) ================= */

  const GLYPH = {
    server: '<rect x="4" y="4" width="16" height="7" rx="2"/><rect x="4" y="13" width="16" height="7" rx="2"/><path d="M7.5 7.5h.01M7.5 16.5h.01M11 7.5h5.5M11 16.5h5.5"/>',
    balancer: '<circle cx="12" cy="5.5" r="2.3"/><path d="M12 7.8V12M12 12l-6.5 4.6M12 12l6.5 4.6M12 12v4.6"/><circle cx="5" cy="18.6" r="1.8"/><circle cx="12" cy="18.6" r="1.8"/><circle cx="19" cy="18.6" r="1.8"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c-3 3.2-3 13.8 0 17M12 3.5c3 3.2 3 13.8 0 17"/>',
    database: '<ellipse cx="12" cy="6" rx="7.5" ry="2.8"/><path d="M4.5 6v12c0 1.6 3.4 2.8 7.5 2.8s7.5-1.2 7.5-2.8V6M4.5 12c0 1.6 3.4 2.8 7.5 2.8s7.5-1.2 7.5-2.8"/>',
    cache: '<path d="M12 3.8 20 8l-8 4.2L4 8z"/><path d="m4 12 8 4.2 8-4.2M4 16l8 4.2 8-4.2"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.4v2.4"/>',
    key: '<circle cx="7.5" cy="12" r="3.8"/><path d="M11.3 12h9.2M17.4 12v3M20.5 12v2.3"/>',
    cloud: '<path d="M7 18.5h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.1 9.6 4.5 4.5 0 0 0 7 18.5z"/>',
    chip: '<rect x="6.5" y="6.5" width="11" height="11" rx="1.8"/><rect x="9.8" y="9.8" width="4.4" height="4.4" rx=".6"/><path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3"/>',
    queue: '<rect x="3" y="8.5" width="4.4" height="7" rx="1.2"/><rect x="9.6" y="8.5" width="4.4" height="7" rx="1.2"/><path d="M16.8 12h4.2M18.8 9.8 21 12l-2.2 2.2"/>',
    mail: '<rect x="3.5" y="6" width="17" height="12.5" rx="2"/><path d="m4 7 8 6.2L20 7"/>',
    user: '<circle cx="12" cy="8.2" r="3.7"/><path d="M4.8 20c.6-3.9 3.6-6.3 7.2-6.3s6.6 2.4 7.2 6.3"/>',
    users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.5-3.3 2.8-5.3 5.5-5.3s5 2 5.5 5.3M15.5 5.6a3.2 3.2 0 0 1 0 6.2M17.5 13.9c1.7.7 2.8 2.4 3 5.1"/>',
    door: '<path d="M6.5 20.5V4.8c0-.7.6-1.3 1.3-1.3h8.4c.7 0 1.3.6 1.3 1.3v15.7M4 20.5h16M14.3 12.3h.01"/>',
    card: '<rect x="3" y="6" width="18" height="12.5" rx="2.2"/><path d="M3 10h18M6.5 14.5h4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.3V12l3.2 2"/>',
    shield: '<path d="M12 3.5 19 6v5.6c0 4.4-3 7.5-7 8.9-4-1.4-7-4.5-7-8.9V6z"/>',
    bolt: '<path d="M13 3 5.5 13.5h6L10.5 21l8-10.5h-6z"/>',
    file: '<path d="M14 3.5H7.3c-.9 0-1.6.7-1.6 1.6v13.8c0 .9.7 1.6 1.6 1.6h9.4c.9 0 1.6-.7 1.6-1.6V7.8z"/><path d="M14 3.5v4.3h4.3M9 12.5h6M9 16h4"/>',
    search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>',
    gear: '<circle cx="12" cy="12" r="2.8"/><circle cx="12" cy="12" r="6"/><path d="M12 3.2V6M12 18v2.8M3.2 12H6M18 12h2.8M5.8 5.8l2 2M16.2 16.2l2 2M5.8 18.2l2-2M16.2 7.8l2-2"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    alert: '<path d="M12 4.2 21 19.5H3z"/><path d="M12 10v4.2M12 16.9h.01"/>',
    gauge: '<path d="M4.5 16.5a7.5 7.5 0 0 1 15 0"/><path d="m12 16.5 3.6-4.4"/>',
    bulb: '<path d="M9.2 17.5h5.6M10.2 20.5h3.6M12 3.5a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2v.2h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3.5z"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8h.01"/>',
    arrow: '<path d="M4.5 12h15M13.5 6l6 6-6 6"/>',
    back: '<path d="M19.5 12h-15M10.5 6l-6 6 6 6"/>',
    replay: '<path d="M4.6 12a7.4 7.4 0 1 0 2.2-5.2L4.6 9"/><path d="M4.6 4.6V9H9"/>',
    pause: '<path d="M9 5.5v13M15 5.5v13"/>',
    play: '<path d="M7.5 5v14l11-7z"/>',
    laptop: '<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M3 19h18"/>',
    phone: '<rect x="7" y="3" width="10" height="18" rx="2.2"/><path d="M11 17.5h2"/>',
    layers: '<path d="M12 4 20 8l-8 4-8-4z"/><path d="m4 12 8 4 8-4"/>',
    level: '<path d="M5 19v-4M10 19v-8M15 19V8M20 19V4"/>',
    home: '<path d="M4 11.5 12 4.5l8 7"/><path d="M6.5 9.8v9.7h11V9.8"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    sidebar: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9.5 4.5v15"/>',
    close: '<path d="m6.5 6.5 11 11M17.5 6.5l-11 11"/>',
    sun: '<circle cx="12" cy="12" r="3.8"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"/>',
    moon: '<path d="M19.5 14.2A8 8 0 0 1 9.8 4.5a8 8 0 1 0 9.7 9.7z"/>',
    monitor: '<rect x="3.5" y="4.5" width="17" height="11.5" rx="2"/><path d="M9 20h6M12 16v4"/>',
  };
  const FALLBACK_GLYPH = '<circle cx="12" cy="12" r="2.8" class="gl-dot"/>';
  function iconHtml(name, set = GLYPH) {
    return `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${set[name] || FALLBACK_GLYPH}</svg>`;
  }

  /* ================= Theme ================= */

  // The reader picks light, dark or the system's theme with the theme button. The choice lives in
  // this browser and is shared by every Diorama page. The shell writes the theme in effect to
  // <html data-theme="light|dark">, which is what the stylesheets read: a stylesheet never asks
  // the system itself. <html data-theme-choice> holds the choice and picks the button's icon.
  const THEME_KEY = 'diorama:theme';
  const THEME_ICON = { system: 'monitor', light: 'sun', dark: 'moon' };
  const darkQuery = matchMedia('(prefers-color-scheme: dark)');
  const systemTheme = () => (darkQuery.matches ? 'dark' : 'light');
  let themeChoice = 'system';
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') themeChoice = saved;
  } catch (err) { /* storage blocked: follow the system */ }
  const themeNow = () => (themeChoice === 'system' ? systemTheme() : themeChoice);
  // The first press always changes the page: from the system's theme to the other one, then to
  // the system's own theme as a fixed choice, then back to following the system.
  function themeAfter(choice) {
    const order = ['system', systemTheme() === 'dark' ? 'light' : 'dark', systemTheme()];
    return order[(order.indexOf(choice) + 1) % order.length];
  }
  function paintTheme() {
    const root = document.documentElement;
    root.dataset.theme = themeNow();
    root.dataset.themeChoice = themeChoice;
    const title = `Theme: ${themeChoice}`;
    for (const b of document.querySelectorAll('.theme-btn')) {
      b.title = title;
      b.lastElementChild.textContent = `${title}. Switch to ${themeAfter(themeChoice)}.`;
    }
  }
  function setTheme(choice, from) {
    const before = themeNow();
    themeChoice = choice;
    try {
      if (choice === 'system') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, choice);
    } catch (err) { /* storage blocked: the choice lasts until the page closes */ }
    if (themeNow() === before || motionQuery.matches || !document.startViewTransition) { paintTheme(); return; }
    // The new theme spreads over the page in a circle that grows from the button.
    const root = document.documentElement, r = from.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const reach = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('theme-turn');
    const turn = document.startViewTransition(paintTheme);
    turn.ready.then(() => root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${reach}px at ${x}px ${y}px)`] },
      { duration: 480, easing: 'cubic-bezier(.4, 0, .2, 1)', pseudoElement: '::view-transition-new(root)' },
    )).catch(() => { /* the transition was skipped; the theme is set all the same */ });
    turn.finished.catch(() => {}).then(() => root.classList.remove('theme-turn'));
  }
  // One button with an icon per choice; the stylesheet shows the chosen one. Call paintTheme()
  // after putting it on the page, which names it.
  const themeButtonHtml = () => `<button class="icon-btn theme-btn" type="button">${Object.entries(THEME_ICON).map(([choice, icon]) => iconHtml(icon).replace('class="ic"', `class="ic theme-ic-${choice}"`)).join('')}<span class="sr-only"></span></button>`;
  paintTheme();
  darkQuery.addEventListener('change', () => { if (themeChoice === 'system') paintTheme(); });
  document.addEventListener('click', (e) => {
    const b = e.target.closest ? e.target.closest('.theme-btn') : null;
    if (b) setTheme(themeAfter(themeChoice), b);
  });

  /* ================= Shared page pieces ================= */

  const typingIn = (t) => !!(t && (t.isContentEditable || (t.closest && t.closest('input, textarea, select'))));
  const pillHtml = (icon, text, tone) => `<span class="pill tone-${tone}">${icon ? iconHtml(icon) : ''}${esc(text)}</span>`;
  const tagHtml = (text, tone) => `<span class="tag tone-${tone}">${esc(text)}</span>`;
  const TONES = ['paper', 'green', 'amber', 'red', 'violet', 'gray'];
  const toneOf = (t) => (TONES.includes(t) ? t : 'paper');

  // Plays a CSS animation on el again (a value that changed, a card that came back).
  function restartAnim(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  // Timeouts, animation frames and listeners of one view, so that end() cancels all of them.
  function lifetime() {
    const timeouts = new Set(), frames = new Set(), offs = [];
    return {
      later(fn, ms) {
        const t = setTimeout(() => { timeouts.delete(t); fn(); }, ms);
        timeouts.add(t);
      },
      frame(fn) {
        const f = requestAnimationFrame((now) => { frames.delete(f); fn(now); });
        frames.add(f);
      },
      listen(target, type, fn, o) {
        target.addEventListener(type, fn, o);
        offs.push(() => target.removeEventListener(type, fn, o));
      },
      end() {
        for (const t of timeouts) clearTimeout(t);
        for (const f of frames) cancelAnimationFrame(f);
        timeouts.clear();
        frames.clear();
        for (const off of offs) off();
        offs.length = 0;
      },
    };
  }

  // The checks section of a contact sheet: what the automatic checks found, then what they do not
  // cover (`uncovered` is HTML).
  function sheetChecks(checks, uncovered) {
    const findings = checks.warnings.map((m) => ['red', 'warning', m]).concat(checks.notes.map((m) => ['amber', 'note', m]));
    const list = findings.length
      ? `<ul class="sheet-findings">${findings.map(([tone, kind, m]) => `<li>${tagHtml(kind, tone)}<span>${esc(m)}</span></li>`).join('')}</ul>`
      : '<p class="sheet-clear">The automatic checks found nothing.</p>';
    return `<section class="sheet-checks card" aria-labelledby="dio-checks-head">
    <h2 id="dio-checks-head" class="section-h">Checks · ${plural(checks.warnings.length, 'warning')} · ${plural(checks.notes.length, 'note')}</h2>
    ${list}<p class="sheet-uncovered">${uncovered}</p>
  </section>`;
  }

  // Keys go to the walkthrough on screen unless they are typed into a field, held with a modifier
  // or already used; a contact sheet takes none. Returns true when the walkthrough used the key.
  function pieceKey(e, view) {
    if (!view || view.sheet || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || typingIn(e.target)) return false;
    if (!view.v.key(e)) return false;
    e.preventDefault();
    return true;
  }

  // A message in place of the stage: loading, a broken file, an item that cannot be opened.
  // `body` is HTML; callers escape what they put in it.
  function statusMarkup(s) {
    return `<div class="page status-page">
  <header class="wt-head"><div>${s.crumb ? `<p class="crumb">${esc(s.crumb)}</p>` : ''}<h1 tabindex="-1">${esc(s.title)}</h1>${s.summary ? `<p class="summary">${esc(s.summary)}</p>` : ''}</div></header>
  <section class="status card tone-${s.tone || 'paper'}" role="${s.alert ? 'alert' : 'status'}"${s.busy ? ' aria-busy="true"' : ''}>
    <span class="status-icon">${iconHtml(s.icon || 'info')}</span>
    <div class="status-text"><h2>${esc(s.heading)}</h2>${s.body || ''}${s.actions ? `<div class="status-actions">${s.actions}</div>` : ''}</div>
  </section>
</div>`;
  }

  let started = false;
  function claimStart(kind) {
    if (started) { warn(`${kind}() was called again; the page is already running`); return false; }
    started = true;
    return true;
  }

  function appRoot(cls) {
    const app = document.createElement('div');
    app.className = `dio-app ${cls}`;
    document.body.appendChild(app);
    return app;
  }

  /* ================= Labels ================= */

  // The words the shell itself shows; a template adds its own (its labels).
  const SHELL_LABELS = { next: 'Next', sections: 'Sections', home: 'Overview', continue: 'Continue', planned: 'planned', draft: 'draft' };

  // Later layers win: the shell's and the template's defaults, then the collection's labels, then
  // the walkthrough's own. A default that is an object (such as the story's chapter names) is
  // merged key by key; every other label is a string.
  function mergeLabels(defaults, ...layers) {
    const out = { ...SHELL_LABELS };
    for (const k in defaults || {}) out[k] = isObject(defaults[k]) ? { ...defaults[k] } : defaults[k];
    for (const l of layers) {
      if (!l || typeof l !== 'object') continue;
      for (const k in l) {
        if (isObject(out[k])) { if (l[k] && typeof l[k] === 'object') Object.assign(out[k], l[k]); }
        else if (typeof l[k] === 'string') out[k] = l[k];
      }
    }
    return out;
  }

  /* ================= Templates and stages ================= */
  // A template file calls Diorama.defineTemplate(name, { stage }, factory) and a stage file
  // Diorama.defineStage(name, factory). Each factory runs once, on first use: a stage's with the
  // kit, a template's with the kit and its stage. What they must return is described in
  // references/templates.md; the shell uses nothing else of them.

  const DEFAULT_TEMPLATE = 'story';
  const stageDefs = new Map(), stages = new Map();         // name → factory; name → what it returned
  const templateDefs = new Map(), templates = new Map();   // name → { stage, factory }; name → what it returned
  const files = new Map();                                 // url → its load, pending or done
  const fromFiles = new Set();                             // 'template-x', 'stage-y' defined by a file loaded here

  function defineStage(name, factory) {
    if (typeof name !== 'string' || !KEBAB.test(name) || typeof factory !== 'function') { warn('Diorama.defineStage() expects a kebab-case name and a function'); return; }
    if (stageDefs.has(name)) { warn(`the stage "${name}" is defined twice; the first definition is kept`); return; }
    stageDefs.set(name, factory);
  }

  function defineTemplate(name, meta, factory) {
    const stage = isObject(meta) ? meta.stage ?? null : undefined;
    const stageOk = stage === null || (typeof stage === 'string' && KEBAB.test(stage));
    if (typeof name !== 'string' || !KEBAB.test(name) || !stageOk || typeof factory !== 'function') {
      warn('Diorama.defineTemplate() expects a kebab-case name, { stage: "<name>" or null } and a function');
      return;
    }
    if (templateDefs.has(name)) { warn(`the template "${name}" is defined twice; the first definition is kept`); return; }
    templateDefs.set(name, { stage, factory });
  }

  // The template a walkthrough names; none means the step story.
  const templateOf = (w) => (w.template === undefined ? DEFAULT_TEMPLATE : w.template);

  // What every walkthrough must be before a template reads it: an object that names a template
  // in a form a file can have.
  function pieceProblem(w) {
    if (!isObject(w)) return 'it is missing or is not a JSON object';
    if (w.template !== undefined && (typeof w.template !== 'string' || !KEBAB.test(w.template))) return `"template" ${JSON.stringify(w.template)} is not a template name such as "story"`;
    return null;
  }

  // A stage or template, created on first use; null while it is not defined (for a template, also
  // while its stage is not). Throws { file, reason } when its factory fails.
  function create(name, kind, factory, args) {
    try {
      return factory(...args);
    } catch (err) {
      console.error(err);
      throw { file: `engine/${kind}-${name}.js`, reason: `failed to start (${err && err.message ? err.message : err})` };
    }
  }
  function stageNow(name) {
    if (!stages.has(name)) {
      if (!stageDefs.has(name)) return null;
      stages.set(name, create(name, 'stage', stageDefs.get(name), [kit]));
    }
    return stages.get(name);
  }
  function templateNow(name) {
    if (!templates.has(name)) {
      const d = templateDefs.get(name);
      const stage = d && d.stage ? stageNow(d.stage) : null;
      if (!d || (d.stage && !stage)) return null;
      templates.set(name, create(name, 'template', d.factory, [kit, stage]));
    }
    return templates.get(name);
  }

  // Loads one engine file with a <script> or <link> tag (fetch is not allowed from file://).
  // Rejects with { file, reason }; a failed load is tried again the next time it is asked for.
  function loadFile(name) {
    const url = ENGINE + name;
    if (files.has(url)) return files.get(url);
    const css = name.endsWith('.css');
    const p = new Promise((resolve, reject) => {
      const el = document.createElement(css ? 'link' : 'script');
      let timer = 0;
      const finish = (reason) => {
        clearTimeout(timer);
        el.onload = el.onerror = null;
        if (!css || reason) el.remove();
        if (!reason) { resolve(); return; }
        files.delete(url);
        reject({ file: `engine/${name}`, reason });
      };
      el.onload = () => finish(null);
      el.onerror = () => finish('is missing or could not be read');
      timer = setTimeout(() => finish(`did not load within ${LOAD_TIMEOUT / 1000} seconds`), LOAD_TIMEOUT);
      if (css) { el.rel = 'stylesheet'; el.href = url; } else el.src = url;
      document.head.appendChild(el);
    });
    files.set(url, p);
    return p;
  }

  // A stage, loading stage-<name>.css and .js first unless the page already defines it.
  async function ensureStage(name) {
    const base = `stage-${name}`;
    if (!stageDefs.has(name)) fromFiles.add(base);
    if (fromFiles.has(base)) await Promise.all([loadFile(`${base}.css`), stageDefs.has(name) ? null : loadFile(`${base}.js`)]);
    if (!stageDefs.has(name)) throw { file: `engine/${base}.js`, reason: `loaded but did not call Diorama.defineStage("${name}", ...)` };
    return stageNow(name);
  }

  // A template with its stage, loading their files first unless the page already defines them.
  // The stage's stylesheet goes in before the template's, as in the single-file page.
  async function ensureTemplate(name) {
    const base = `template-${name}`;
    if (!templateDefs.has(name)) {
      fromFiles.add(base);
      await loadFile(`${base}.js`);
      if (!templateDefs.has(name)) throw { file: `engine/${base}.js`, reason: `loaded but did not call Diorama.defineTemplate("${name}", ...)` };
    }
    const d = templateDefs.get(name);
    await Promise.all([d.stage ? ensureStage(d.stage) : null, fromFiles.has(base) ? loadFile(`${base}.css`) : null]);
    return templateNow(name);
  }

  // The template of a walkthrough if it is ready to use now, else null.
  function readyTemplate(w) {
    if (pieceProblem(w)) return null;
    try {
      const tpl = templateNow(templateOf(w));
      return tpl && !tpl.unusable(w) ? tpl : null;
    } catch (err) {
      return null;
    }
  }

  // Why a walkthrough cannot be drawn by its template, or null. prepare() reads and checks all of
  // the data, so a fault the checks did not foresee still ends on the problem panel, never on an
  // empty page.
  function undrawable(tpl, w) {
    try {
      const bad = tpl.unusable(w);
      if (bad) return bad;
      tpl.prepare(w);
      return null;
    } catch (err) {
      console.error(err);
      return `the engine could not read it (${err && err.message ? err.message : err})`;
    }
  }

  // A walkthrough's positions (its template's), made once per walkthrough object.
  const positionCache = new WeakMap();
  function positionsOf(tpl, w) {
    if (!positionCache.has(w)) positionCache.set(w, tpl.positions(w));
    return positionCache.get(w);
  }
  // A position stored in this browser, checked by its template: written out and read back.
  function restore(ps, at) {
    try { return ps.parse(String(ps.format(at)), true); } catch (err) { return null; }
  }

  /* ================= Single-file page ================= */

  function startSingle(w) {
    if (!claimStart('startSingle')) return;
    const app = appRoot('dio-single');
    app.innerHTML = `${themeButtonHtml()}<main class="dio-main"></main>`;
    paintTheme();
    const main = app.lastChild;
    const stop = (body) => {
      main.innerHTML = statusMarkup({ title: 'Walkthrough', heading: 'This walkthrough cannot be shown', tone: 'red', icon: 'alert', alert: true, body });
    };
    let bad = pieceProblem(w), tpl = null;
    if (!bad) {
      const name = templateOf(w), d = templateDefs.get(name);
      let missing = null;
      try {
        tpl = templateNow(name);
      } catch (err) {
        missing = `${err.file} ${err.reason}`;
      }
      if (!tpl) {
        missing = missing || (d ? `this page does not include the stage "${d.stage}" it needs` : 'this page does not include it');
        warn(`${typeof w.id === 'string' ? w.id : 'walkthrough'}: the template "${name}" cannot be used: ${missing}`);
        stop(`<p>It uses the template <code>${esc(name)}</code>, and ${esc(missing)}.</p>`
          + `<p class="muted">A single-file page carries only the template it was built with. Build one for this template with <code>python3 tools/build-single.py --template ${esc(name)}</code>.</p>`);
        return;
      }
      bad = undrawable(tpl, w);
    }
    if (bad) {
      warn(`the walkthrough cannot be shown: ${bad}`);
      stop(`<p>The <code>&lt;script type="application/json" id="walkthrough"&gt;</code> block in this file cannot be used: ${esc(bad)}. The browser console has details.</p>`);
      return;
    }
    const ps = positionsOf(tpl, w);
    const hashOf = (at) => `#/${encodeURIComponent(w.id)}/${ps.format(at)}`;
    // { at } for a position of this walkthrough, 'sheet', or null when the hash is not about it.
    const parseHash = () => {
      const m = /^#\/([^/]+)\/([^/]+)$/.exec(location.hash);
      if (!m || decodeURIComponent(m[1]) !== w.id) return null;
      if (m[2] === 'sheet') return 'sheet';
      const at = ps.parse(m[2], false);
      return at === null ? null : { at };
    };
    const labels = mergeLabels(tpl.labels, w.labels);
    let view = null;
    const show = (to) => {
      if (view) view.v.destroy();
      main.scrollTop = 0;
      const sheet = to === 'sheet';
      const v = sheet
        ? tpl.mountSheet(main, w, { labels })
        : tpl.mount(main, w, { labels, start: to ? to.at : ps.first, onMove: (at) => { if (location.hash !== hashOf(at)) location.replace(hashOf(at)); } });
      view = { sheet, v };
    };
    show(parseHash());
    window.addEventListener('hashchange', () => {
      const to = parseHash();
      if (to === null) return;
      if (to === 'sheet' || view.sheet) show(to);
      else view.v.go(to.at);
    });
    document.addEventListener('keydown', (e) => pieceKey(e, view));
  }

  /* ================= Collection: registration and loading ================= */

  const STATUSES = ['planned', 'drafted', 'reviewed', 'awaiting-approval', 'approved'];
  const LOAD_TIMEOUT = 10000;
  let collectionData = null;
  const walkthroughs = new Map();   // id → walkthrough data accepted by the loader
  const registered = new WeakMap(); // loader <script> → the object it registered while running
  const loading = new Map();        // id → pending promise
  const fileOf = (id) => `walkthroughs/${id}.js`;
  const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

  function registerCollection(obj) {
    if (!isObject(obj)) { warn('Diorama.collection() expects one object'); return; }
    if (collectionData) warn('Diorama.collection() was called more than once; the last call wins');
    collectionData = obj;
  }

  // A walkthrough file loaded by the shell is matched to the <script> that ran it, so a file that
  // registers the wrong id is reported instead of silently filling another slot.
  function registerWalkthrough(obj) {
    if (!isObject(obj)) { warn('Diorama.walkthrough() expects one object'); return; }
    const s = document.currentScript;
    if (s && s.dataset.dioramaFor !== undefined) { registered.set(s, obj); return; }
    if (typeof obj.id !== 'string') { warn('Diorama.walkthrough() received an object without an "id"'); return; }
    walkthroughs.set(obj.id, obj);
  }

  // Loads walkthroughs/<id>.js with a <script> tag (fetch is not allowed from file://).
  // Rejects with { file, reason } when the file is missing, does not register, or registers another id.
  function loadWalkthrough(id) {
    if (walkthroughs.has(id)) return Promise.resolve(walkthroughs.get(id));
    if (loading.has(id)) return loading.get(id);
    const file = fileOf(id);
    const p = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.dataset.dioramaFor = id;
      let timer = 0;
      const finish = (reason, data) => {
        clearTimeout(timer);
        s.onload = s.onerror = null;
        s.remove();
        loading.delete(id);
        if (reason) { reject({ file, reason }); return; }
        walkthroughs.set(id, data);
        resolve(data);
      };
      s.onload = () => {
        const data = registered.get(s);
        if (!data) finish('the file loaded but did not call Diorama.walkthrough({...}); look for a syntax error in the browser console.');
        else if (data.id !== id) finish(`the file registered the id ${JSON.stringify(data.id)} instead of "${id}"; the file name and the "id" must match.`);
        else finish(null, data);
      };
      s.onerror = () => finish('the file is missing or could not be read.');
      timer = setTimeout(() => finish(`the file did not load within ${LOAD_TIMEOUT / 1000} seconds.`), LOAD_TIMEOUT);
      s.src = file;
      document.head.appendChild(s);
    });
    loading.set(id, p);
    return p;
  }

  /* ================= Collection: outline and progress ================= */

  // Flattens collection.js into what the shell shows: visible sections and items with their numbers.
  function buildOutline(c) {
    const o = isObject(c.options) ? c.options : {};
    const opt = { ordered: !!o.ordered, progress: !!o.progress, showPlanned: !!o.showPlanned, showDrafts: !!o.showDrafts };
    const sections = Array.isArray(c.sections) ? c.sections : [];
    if (!sections.length) warn('collection.js has no sections');
    if (sections.length > 9) warn(`collection.js has ${sections.length} sections; use at most 9`);
    if (c.explain !== undefined && c.explain !== 'inside' && c.explain !== 'side') warn(`collection.js: explain ${JSON.stringify(c.explain)} is not "inside" or "side"; the explanation is shown inside the stage card`);
    const byId = new Map(), shown = [];
    sections.forEach((sec, si) => {
      if (!isObject(sec)) { warn(`section ${si + 1} is not an object`); return; }
      if (typeof sec.title !== 'string' || !sec.title) warn(`section ${si + 1} has no title`);
      const out = { id: sec.id, title: String(sec.title || ''), num: '', items: [] };
      (Array.isArray(sec.items) ? sec.items : []).forEach((it, k) => {
        if (!isObject(it) || typeof it.id !== 'string' || !KEBAB.test(it.id)) { warn(`section ${si + 1}, item ${k + 1}: "id" must be a kebab-case string`); return; }
        if (byId.has(it.id)) { warn(`item "${it.id}" is listed twice; only the first is used`); return; }
        let status = it.status;
        if (!STATUSES.includes(status)) { warn(`item "${it.id}" has unknown status ${JSON.stringify(status)}; treated as "drafted"`); status = 'drafted'; }
        for (const f of ['title', 'summary']) if (typeof it[f] !== 'string' || !it[f]) warn(`item "${it.id}" has no ${f}`);
        const visible = status === 'approved' || (status === 'planned' ? opt.showPlanned : opt.showDrafts);
        const e = {
          id: it.id, title: String(it.title || it.id), summary: String(it.summary || ''), status, minutes: it.minutes, level: it.level,
          section: out, visible, openable: visible && status !== 'planned', draft: status !== 'approved' && status !== 'planned', num: '',
        };
        byId.set(e.id, e);
        if (visible) out.items.push(e);
      });
      if (out.items.length) shown.push(out);
    });
    const entries = [];
    shown.forEach((sec, si) => {
      if (opt.ordered && shown.length > 1) sec.num = String(si + 1);
      sec.items.forEach((e, k) => {
        if (opt.ordered) e.num = shown.length > 1 ? `${si + 1}.${k + 1}` : String(k + 1);
        entries.push(e);
      });
    });
    return { opt, sections: shown, entries, open: entries.filter((e) => e.openable), byId };
  }

  // Reading progress lives in this browser only, under a key derived from the collection id.
  function progressStore(cid, enabled) {
    const key = `diorama:${cid}:progress`;
    const data = { read: {}, last: {}, recent: null, at: {} };
    if (enabled) {
      try {
        const v = JSON.parse(localStorage.getItem(key) || 'null');
        if (isObject(v)) {
          if (isObject(v.read)) Object.assign(data.read, v.read);
          if (isObject(v.last)) Object.assign(data.last, v.last);
          if (typeof v.recent === 'string') data.recent = v.recent;
          // Where each walkthrough was left, as its template writes it: { seg, label, first }.
          for (const [id, a] of Object.entries(isObject(v.at) ? v.at : {})) {
            if (isObject(a) && typeof a.seg === 'string' && typeof a.label === 'string') data.at[id] = { seg: a.seg, label: a.label, first: !!a.first };
          }
        }
      } catch (err) { /* storage blocked or unreadable: start with no progress */ }
    }
    return {
      data,
      save() {
        if (!enabled) return;
        try { localStorage.setItem(key, JSON.stringify(data)); } catch (err) { /* storage blocked or full */ }
      },
    };
  }

  const plainText = (html) => String(html).replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

  // A walkthrough's entries for search, from its template, made once per walkthrough object.
  const searchCache = new WeakMap();
  function searchIndex(tpl, w) {
    if (!searchCache.has(w)) searchCache.set(w, tpl.search(w));
    return searchCache.get(w);
  }

  function highlight(text, tokens) {
    const low = text.toLowerCase(), on = new Array(text.length).fill(false);
    for (const t of tokens) {
      for (let k = low.indexOf(t); k >= 0; k = low.indexOf(t, k + t.length)) on.fill(true, k, k + t.length);
    }
    let s = '', open = false;
    for (let j = 0; j < text.length; j++) {
      if (on[j] !== open) { s += open ? '</mark>' : '<mark>'; open = on[j]; }
      s += esc(text[j]);
    }
    return s + (open ? '</mark>' : '');
  }

  /* ================= Collection shell ================= */

  function startCollection() {
    if (!claimStart('startCollection')) return;
    const app = appRoot('dio-collection');
    if (!collectionData) {
      warn('collection.js did not register a collection');
      app.innerHTML = `<main class="dio-main">${statusMarkup({
        title: 'Collection', heading: 'collection.js did not load', tone: 'red', icon: 'alert', alert: true,
        body: '<p>The file <code>collection.js</code> next to <code>index.html</code> is missing, has a syntax error, or does not call <code>Diorama.collection({...})</code>. The browser console names the problem.</p>',
      })}</main>`;
      return;
    }
    createShell(app, collectionData);
  }

  function createShell(app, c) {
    if (typeof c.id !== 'string' || !KEBAB.test(c.id)) warn('collection.js: "id" should be a kebab-case string; reading progress is stored under it');
    const cid = typeof c.id === 'string' && c.id ? c.id : 'collection';
    const L = mergeLabels(null, c.labels);
    const outline = buildOutline(c);
    const opt = outline.opt;
    const progress = progressStore(cid, opt.progress);
    const P = progress.data;
    const isRead = (e) => opt.progress && !!P.read[e.id];
    const mapKey = `diorama:${cid}:map`;
    const drawerQuery = matchMedia('(max-width: 899px)');
    const list = opt.ordered ? 'ol' : 'ul';
    const checked = new Set();   // ids whose title and summary were compared with collection.js

    let view = null;             // { id, sheet, v (the template's view), ps (its positions) } on screen, if any
    let currentId = null;        // the item shown in the main area (loading, open or failed)
    let navToken = 0;            // invalidates loads that finish after the reader moved on
    let pendingAt = null;        // { id, at: 'first' | 'last' } for Next and Back into another walkthrough
    let firstRoute = true, wantFocus = false, gAt = 0, drawerOpen = false;
    let collapsed = false;
    try { collapsed = localStorage.getItem(mapKey) === 'collapsed'; } catch (err) { /* storage blocked */ }

    app.innerHTML = `<header class="app-bar">
  <button class="icon-btn" type="button" data-ref="drawerBtn" aria-controls="dio-map" aria-expanded="false">${iconHtml('menu')}<span class="sr-only">Contents</span></button>
  <a class="app-bar-title" href="#/">${esc(c.title || '')}</a>
  <button class="icon-btn" type="button" data-ref="barSearch" aria-haspopup="dialog">${iconHtml('search')}<span class="sr-only">Search</span></button>
  ${themeButtonHtml()}
</header>
<div class="app-scrim" data-ref="scrim" hidden></div>
<nav class="map card" id="dio-map" data-ref="map" aria-label="Contents">
  <div class="map-top">
    <a class="map-title" href="#/"><span class="map-kicker">${esc(L.home)}</span><span class="map-name">${esc(c.title || '')}</span></a>
    ${themeButtonHtml()}
    <button class="icon-btn" type="button" data-ref="mapToggle" aria-controls="dio-map-body"></button>
  </div>
  <div class="map-rail">
    <a class="icon-btn" href="#/" title="${esc(L.home)}">${iconHtml('home')}<span class="sr-only">${esc(L.home)}</span></a>
    <button class="icon-btn" type="button" data-ref="railSearch" title="Search (/)" aria-haspopup="dialog">${iconHtml('search')}<span class="sr-only">Search</span></button>
  </div>
  <div class="map-body" id="dio-map-body">
    <button class="map-search" type="button" data-ref="mapSearch" aria-haspopup="dialog">${iconHtml('search')}<span>Search</span><kbd>/</kbd></button>
    <div data-ref="mapList"></div>
  </div>
</nav>
<main class="dio-main" data-ref="main"></main>
<div class="search-layer" data-ref="search" hidden>
  <div class="search-scrim" data-ref="searchScrim"></div>
  <div class="search-box card" role="dialog" aria-modal="true" aria-label="Search">
    <div class="search-row">${iconHtml('search')}<input data-ref="searchInput" type="search" placeholder="Search titles, steps and terms" autocomplete="off" spellcheck="false" aria-label="Search" aria-controls="dio-search-results" aria-describedby="dio-search-status"><kbd>Esc</kbd></div>
    <p class="search-status" id="dio-search-status" data-ref="searchStatus" aria-live="polite"></p>
    <ul class="search-results" id="dio-search-results" data-ref="searchResults"></ul>
  </div>
</div>`;
    paintTheme();
    const R = {};
    for (const el of app.querySelectorAll('[data-ref]')) R[el.dataset.ref] = el;
    const $ = (name) => R[name];

    /* ---------- Map ---------- */

    function itemMarks(e) {
      if (e.status === 'planned') return tagHtml(L.planned, 'gray');
      let s = e.draft ? tagHtml(L.draft, 'amber') : '';
      if (isRead(e)) s += `<span class="tick">${iconHtml('check')}<span class="sr-only"> (read)</span></span>`;
      return s;
    }

    function readCount(items) {
      const open = items.filter((e) => e.openable);
      return { read: open.filter(isRead).length, total: open.length };
    }

    function renderMap() {
      const multi = outline.sections.length > 1;
      let s = '';
      for (const sec of outline.sections) {
        s += '<section class="map-sec">';
        if (multi) {
          const n = readCount(sec.items);
          s += `<h2 class="map-sec-h">${sec.num ? `<span class="num">${sec.num}</span>` : ''}<span class="map-sec-t">${esc(sec.title)}</span>`
            + `${opt.progress && n.total ? `<span class="map-count">${n.read}/${n.total}<span class="sr-only"> read</span></span>` : ''}</h2>`;
        }
        s += `<${list} class="map-items">`;
        for (const e of sec.items) {
          const inner = `${e.num ? `<span class="num">${e.num}</span>` : ''}<span class="map-item-t">${esc(e.title)}</span>${itemMarks(e)}`;
          s += e.openable
            ? `<li><a class="map-item" href="#/${e.id}"${currentId === e.id ? ' aria-current="page"' : ''}>${inner}</a></li>`
            : `<li><span class="map-item planned" aria-disabled="true">${inner}</span></li>`;
        }
        s += `</${list}></section>`;
      }
      if (opt.progress && outline.open.length) {
        const n = readCount(outline.open);
        s += `<p class="map-progress">${n.read} of ${n.total} read</p>`;
      }
      $('mapList').innerHTML = s;
    }

    function applyMap() {
      app.dataset.map = collapsed ? 'collapsed' : 'open';
      const drawer = drawerQuery.matches;
      const label = drawer ? 'Close contents' : collapsed ? 'Show contents' : 'Hide contents';
      const t = $('mapToggle');
      t.innerHTML = `${iconHtml(drawer ? 'close' : 'sidebar')}<span class="sr-only">${label}</span>`;
      t.title = label;
      t.setAttribute('aria-expanded', String(drawer ? drawerOpen : !collapsed));
    }

    function openDrawer() {
      drawerOpen = true;
      app.dataset.drawer = 'open';
      $('scrim').hidden = false;
      $('drawerBtn').setAttribute('aria-expanded', 'true');
      applyMap();
      ($('map').querySelector('[aria-current]') || $('map').querySelector('a')).focus();
    }

    function closeDrawer(restore) {
      if (!drawerOpen) return;
      drawerOpen = false;
      delete app.dataset.drawer;
      $('scrim').hidden = true;
      $('drawerBtn').setAttribute('aria-expanded', 'false');
      applyMap();
      if (restore) $('drawerBtn').focus();
    }

    $('mapToggle').addEventListener('click', () => {
      if (drawerQuery.matches) { closeDrawer(true); return; }
      collapsed = !collapsed;
      try { localStorage.setItem(mapKey, collapsed ? 'collapsed' : 'open'); } catch (err) { /* storage blocked */ }
      applyMap();
    });
    $('drawerBtn').addEventListener('click', () => (drawerOpen ? closeDrawer(true) : openDrawer()));
    $('scrim').addEventListener('click', () => closeDrawer(true));
    $('map').addEventListener('click', (e) => { if (drawerOpen && e.target.closest('a')) closeDrawer(false); });
    drawerQuery.addEventListener('change', () => { closeDrawer(false); applyMap(); });

    /* ---------- Main area ---------- */

    function teardown() {
      if (view) { view.v.destroy(); view = null; }
    }

    function resetScroll() {
      $('main').scrollTop = 0;
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
    }

    function focusMain() {
      const h = $('main').querySelector('h1');
      if (h) h.focus({ preventScroll: true });
    }

    // Where Continue leads: the walkthrough last visited if unfinished, else the next unread one,
    // at the place it was left (as stored by moved()).
    function continueTarget() {
      const open = outline.open;
      const recent = open.find((e) => e.id === P.recent);
      if (recent && !P.read[recent.id]) return { e: recent, at: P.at[recent.id] };
      const from = recent ? open.indexOf(recent) + 1 : 0;
      const e = open.slice(from).concat(open.slice(0, from)).find((x) => !P.read[x.id]);
      return e ? { e, at: P.at[e.id] } : null;
    }

    function renderHome() {
      teardown();
      currentId = null;
      document.title = c.title || 'Collection';
      const multi = outline.sections.length > 1;
      let s = `<div class="home"><header class="home-head"><h1 tabindex="-1">${esc(c.title || '')}</h1>`;
      if (c.summary) s += `<p class="summary">${esc(c.summary)}</p>`;
      if (c.note) s += `<p class="note"># ${esc(c.note)}</p>`;
      if (opt.progress && outline.open.length) {
        const t = continueTarget(), n = readCount(outline.open);
        s += '<div class="home-actions">';
        if (t) s += `<a class="btn primary" href="#/${t.e.id}${t.at ? `/${esc(t.at.seg)}` : ''}"><span>${esc(L.continue)}: ${esc(t.e.title)}${t.at && !t.at.first ? ` · ${esc(t.at.label)}` : ''}</span>${iconHtml('arrow')}</a>`;
        s += `<span class="home-count">${n.read} of ${n.total} read</span></div>`;
      }
      s += '</header>';
      if (!outline.entries.length) s += '<p class="home-empty">Nothing is listed yet.</p>';
      for (const sec of outline.sections) {
        s += `<section class="home-sec"${multi ? '' : ' aria-label="Walkthroughs"'}>`;
        if (multi) {
          const n = readCount(sec.items);
          s += `<h2 class="home-sec-h">${sec.num ? `<span class="num">${sec.num}</span>` : ''}<span>${esc(sec.title)}</span>`
            + `${opt.progress && n.total ? pillHtml(n.read === n.total ? 'check' : '', `${n.read} / ${n.total} read`, n.read === n.total ? 'green' : 'paper') : ''}</h2>`;
        }
        s += `<${list} class="cards">`;
        for (const e of sec.items) {
          const meta = [];
          if (e.minutes) meta.push(pillHtml('clock', `${e.minutes} min`, 'amber'));
          if (e.level) meta.push(pillHtml('level', e.level, 'green'));
          if (e.status === 'planned') meta.push(tagHtml(L.planned, 'gray'));
          else if (e.draft) meta.push(tagHtml(L.draft, 'amber'));
          if (isRead(e)) meta.push(pillHtml('check', 'read', 'green'));
          const inner = `<span class="item-top">${e.num ? `<span class="num">${e.num}</span>` : ''}<span class="item-title">${esc(e.title)}</span></span>`
            + `<span class="item-summary">${esc(e.summary)}</span>${meta.length ? `<span class="item-meta">${meta.join('')}</span>` : ''}`;
          s += e.openable
            ? `<li><a class="item-card" href="#/${e.id}">${inner}</a></li>`
            : `<li><div class="item-card planned" aria-disabled="true">${inner}</div></li>`;
        }
        s += `</${list}></section>`;
      }
      $('main').innerHTML = s + '</div>';
      renderMap();
    }

    function showUnavailable(id, e) {
      teardown();
      currentId = e && e.visible ? e.id : null;
      renderMap();
      document.title = `${e ? e.title : id} · ${c.title || ''}`;
      let heading, body;
      if (!e) {
        heading = 'Not in this collection';
        body = `<p>No walkthrough with the id <code>${esc(id)}</code> is listed in this collection.</p>`;
      } else if (e.status === 'planned' && e.visible) {
        heading = 'Not written yet';
        body = `<p>“${esc(e.title)}” is planned for this collection but has not been written yet.</p>`;
      } else {
        heading = 'Not available yet';
        body = `<p>“${esc(e.title)}” is still being worked on and is not shared in this collection yet.</p>`;
      }
      $('main').innerHTML = statusMarkup({
        title: e && e.visible ? e.title : c.title || '', summary: e && e.visible ? e.summary : '', heading, body, icon: 'info',
        actions: `<a class="btn" href="#/">${iconHtml('home')}<span>${esc(L.home)}</span></a>`,
      });
    }

    function crumbOf(e) {
      const parts = [];
      if (e.num) parts.push(e.num);
      if (outline.sections.length > 1) parts.push(e.section.title);
      if (e.draft) parts.push(L.draft);
      return parts.join(' · ');
    }

    // `at` is the route that failed (as for openItem), so Try again opens the same place: a sheet
    // stays a sheet. It reads the file again, in case the data it holds was the problem.
    function showLoadError(e, reason, focus, at) {
      const file = fileOf(e.id);
      warn(`could not open ${file}: ${reason}`);
      $('main').innerHTML = statusMarkup({
        crumb: crumbOf(e), title: e.title, summary: e.summary, heading: 'This walkthrough could not be opened', tone: 'red', icon: 'alert', alert: true,
        body: `<p>File <code>${esc(file)}</code>: ${esc(reason)}</p><p class="muted">The rest of the collection still works. Fix the file, then try again.</p>`,
        actions: `<button class="btn primary" type="button" data-act="retry">${iconHtml('replay')}<span>Try again</span></button><a class="btn" href="#/">${iconHtml('home')}<span>${esc(L.home)}</span></a>`,
      });
      $('main').querySelector('[data-act="retry"]').addEventListener('click', () => { currentId = null; walkthroughs.delete(e.id); openItem(e.id, at, true, true); });
      if (focus) focusMain();
    }

    // A walkthrough whose template, or the template's stage, cannot be loaded or started.
    function showTemplateError(e, name, err, focus, at) {
      const file = err && err.file ? err.file : `engine/template-${name}.js`, reason = err && err.reason ? err.reason : String(err);
      warn(`${e.id}: the template "${name}" cannot be used: ${file} ${reason}`);
      $('main').innerHTML = statusMarkup({
        crumb: crumbOf(e), title: e.title, summary: e.summary, heading: 'This walkthrough cannot be shown', tone: 'red', icon: 'alert', alert: true,
        body: `<p>It uses the template <code>${esc(name)}</code>, and <code>${esc(file)}</code> ${esc(reason)}.</p><p class="muted">The rest of the collection still works. Put the template's files in the engine folder, then try again.</p>`,
        actions: `<button class="btn primary" type="button" data-act="retry">${iconHtml('replay')}<span>Try again</span></button><a class="btn" href="#/">${iconHtml('home')}<span>${esc(L.home)}</span></a>`,
      });
      $('main').querySelector('[data-act="retry"]').addEventListener('click', () => { currentId = null; openItem(e.id, at, true, true); });
      if (focus) focusMain();
    }

    // The template moved to position `at`: the address and the reading progress follow it.
    function moved(e, ps, at) {
      const seg = ps.format(at), h = `#/${e.id}/${seg}`;
      if (location.hash !== h) location.replace(h);
      if (!opt.progress) return;
      P.last[e.id] = at;
      P.at[e.id] = { seg, label: ps.label(at), first: seg === ps.format(ps.first) };
      P.recent = e.id;
      if (seg === ps.format(ps.last) && !P.read[e.id]) { P.read[e.id] = true; renderMap(); }
      progress.save();
    }

    // The position to open at: the one the address names, the first or the last, or else where the
    // reader left off (`current` while it is open, otherwise as stored in this browser).
    function placeOf(ps, at, id, current) {
      if (at === 'first') return ps.first;
      if (at === 'last') return ps.last;
      const named = at && typeof at.seg === 'string' ? ps.parse(at.seg, true) : null;
      if (named !== null) return named;
      if (current !== null && current !== undefined) return current;
      const stored = opt.progress && Object.hasOwn(P.last, id) ? restore(ps, P.last[id]) : null;
      return stored === null ? ps.first : stored;
    }

    // at: { seg } from the address, 'first', 'last', 'sheet', or null for "where the reader left off".
    async function openItem(id, at, focusNew, focusSame) {
      const e = outline.byId.get(id);
      if (!e || !e.openable) { showUnavailable(id, e); if (focusNew) focusMain(); return; }
      if (view && view.id === id && currentId === id && view.sheet === (at === 'sheet')) {
        // A bare #/<id> for the open walkthrough keeps its place (and restores the place in the URL).
        if (!view.sheet) view.v.go(placeOf(view.ps, at, id, view.v.position));
        if (focusSame) view.v.focusTitle();
        return;
      }
      teardown();
      currentId = id;
      renderMap();
      const token = ++navToken;
      const file = fileOf(id);
      document.title = `${e.title} · ${c.title || ''}`;
      const loading = (what) => {
        $('main').innerHTML = statusMarkup({ crumb: crumbOf(e), title: e.title, summary: e.summary, heading: 'Loading…', body: `<p>Reading <code>${esc(what)}</code>.</p>`, icon: 'clock', busy: true });
      };
      if (!walkthroughs.has(id)) loading(file);
      let w;
      try {
        w = await loadWalkthrough(id);
      } catch (err) {
        if (token === navToken) showLoadError(e, err && err.reason ? err.reason : String(err), focusNew, at);
        return;
      }
      if (token !== navToken) return;
      let bad = pieceProblem(w);
      if (bad) { showLoadError(e, `the walkthrough cannot be drawn: ${bad}.`, focusNew, at); return; }
      // Its template is loaded on first use; once loaded, opening is immediate.
      const name = templateOf(w);
      let tpl = templates.get(name);
      if (!tpl) {
        if (!templateDefs.has(name)) loading(`engine/template-${name}.js`);
        try {
          tpl = await ensureTemplate(name);
        } catch (err) {
          if (token === navToken) showTemplateError(e, name, err, focusNew, at);
          return;
        }
        if (token !== navToken) return;
      }
      bad = undrawable(tpl, w);
      if (bad) { showLoadError(e, `the walkthrough cannot be drawn: ${bad}.`, focusNew, at); return; }
      if (!checked.has(id)) {
        checked.add(id);
        if (w.title !== e.title) warn(`collection.js calls "${id}" ${JSON.stringify(e.title)} but ${file} says ${JSON.stringify(w.title)}; keep the titles identical`);
        if (w.summary !== e.summary) warn(`collection.js and ${file} give different summaries for "${id}"; keep them identical`);
      }
      const labels = mergeLabels(tpl.labels, c.labels, w.labels);
      if (at === 'sheet') {
        resetScroll();
        view = { id, sheet: true, v: tpl.mountSheet($('main'), w, { labels, crumb: crumbOf(e), docTitle: `${w.title || e.title} · contact sheet · ${c.title || ''}` }) };
        if (focusNew) view.v.focusTitle();
        return;
      }
      const ps = positionsOf(tpl, w);
      const k = outline.open.indexOf(e);
      const prevE = opt.ordered && k > 0 ? outline.open[k - 1] : null;
      const nextE = opt.ordered && k < outline.open.length - 1 ? outline.open[k + 1] : null;
      resetScroll();
      const v = tpl.mount($('main'), w, {
        labels, start: placeOf(ps, at, id, null), crumb: crumbOf(e), searchHint: true,
        docTitle: `${w.title || e.title} · ${c.title || ''}`, minutes: e.minutes, level: e.level, explain: c.explain,
        prev: prevE ? { title: prevE.title, go: () => navigate(prevE.id, 'last') } : null,
        end: nextE
          ? { label: `${labels.next}: ${nextE.title}`, icon: 'arrow', go: () => navigate(nextE.id, 'first') }
          : { label: L.home, icon: 'home', go: navigateHome },
        onMove: (pos) => moved(e, ps, pos),
      });
      view = { id, sheet: false, v, ps };
      if (focusNew) view.v.focusTitle();
    }

    /* ---------- Routing: #/ home, #/<id> where the reader left off, #/<id>/<place>, #/<id>/sheet ---------- */

    function parseRoute() {
      const m = /^#\/([^/]+)(?:\/([^/]+))?\/?$/.exec(location.hash);
      if (!m) return { home: true };
      return { id: decodeURIComponent(m[1]), at: m[2] === 'sheet' ? 'sheet' : m[2] ? { seg: m[2] } : null };
    }

    function route() {
      const r = parseRoute();
      const focusSame = wantFocus, focusNew = wantFocus || !firstRoute;
      wantFocus = false;
      firstRoute = false;
      closeDrawer(false);
      if (r.home) {
        navToken++;
        renderHome();
        resetScroll();
        if (focusNew) focusMain();
        return;
      }
      let at = r.at;
      if (at === null && pendingAt && pendingAt.id === r.id) at = pendingAt.at;
      pendingAt = null;
      openItem(r.id, at, focusNew, focusSame);
    }

    // Opens another walkthrough at its first or last position. Only its template knows how to write
    // that, so the address names the walkthrough alone until it opens and writes its place.
    function navigate(id, at) {
      wantFocus = true;
      pendingAt = { id, at };
      const h = `#/${id}`;
      if (location.hash === h) route(); else location.hash = h;
    }

    function navigateHome() {
      wantFocus = true;
      if (location.hash === '#/') route(); else location.hash = '#/';
    }

    /* ---------- Search ---------- */

    const search = { open: false, opener: null, primed: false, pending: 0, failed: 0 };

    // The first search reads every listed walkthrough and its template, so the contents of unopened
    // ones are found too.
    function primeSearch() {
      search.primed = true;
      for (const e of outline.open) {
        const known = walkthroughs.get(e.id);
        if (known && (pieceProblem(known) || templates.has(templateOf(known)))) continue;
        search.pending++;
        loadWalkthrough(e.id)
          .then(
            (w) => (pieceProblem(w) ? null : ensureTemplate(templateOf(w)).catch((err) => warn(`search cannot read inside ${fileOf(e.id)}: ${err && err.file ? `${err.file} ${err.reason}` : err}`))),
            (err) => { search.failed++; warn(`search could not read ${fileOf(e.id)}: ${err && err.reason ? err.reason : err}`); },
          )
          .finally(() => { search.pending--; if (search.open) renderResults(); });
      }
    }

    function findHits(q) {
      const tokens = q.split(/\s+/).filter(Boolean);
      const has = (text) => { const low = text.toLowerCase(); return tokens.every((t) => low.includes(t)); };
      const hits = [];
      for (const e of outline.open) {
        if (has(`${e.title} ${e.summary}`)) hits.push({ e, where: null, title: e.title, sub: e.summary, href: `#/${e.id}`, rank: e.title.toLowerCase().includes(q) ? 0 : 1 });
        const w = walkthroughs.get(e.id), tpl = w && readyTemplate(w);
        if (!tpl) continue;
        const ps = positionsOf(tpl, w);
        for (const st of searchIndex(tpl, w)) {
          if (!has(st.text)) continue;
          hits.push({ e, where: ps.label(st.at), title: st.title, sub: st.sub, href: `#/${e.id}/${ps.format(st.at)}`, rank: st.title.toLowerCase().includes(q) ? 2 : 3 });
        }
      }
      return { tokens, hits: hits.sort((a, b) => a.rank - b.rank).slice(0, 40) };
    }

    function renderResults() {
      const q = $('searchInput').value.trim().toLowerCase();
      const { tokens, hits } = q ? findHits(q) : { tokens: [], hits: outline.open.map((e) => ({ e, where: null, title: e.title, sub: e.summary, href: `#/${e.id}` })) };
      $('searchResults').innerHTML = hits.map((h) => {
        const where = h.where === null ? `${h.e.num ? `${h.e.num} · ` : ''}walkthrough` : `${h.e.title} · ${h.where}`;
        return `<li><a class="hit" href="${h.href}"><span class="hit-where">${esc(where)}</span><span class="hit-title">${highlight(h.title, tokens)}</span>`
          + `${h.sub ? `<span class="hit-sub">${highlight(h.sub, tokens)}</span>` : ''}</a></li>`;
      }).join('');
      let status = !q ? 'Type to search titles, summaries, steps and marked terms.' : hits.length ? `${hits.length} ${hits.length === 1 ? 'match' : 'matches'}` : 'No matches.';
      if (search.pending) status += ` Reading ${search.pending} more ${search.pending === 1 ? 'walkthrough' : 'walkthroughs'}…`;
      if (search.failed) status += ` ${search.failed} could not be read.`;
      $('searchStatus').textContent = status;
    }

    function openSearch() {
      if (search.open) { $('searchInput').focus(); return; }
      closeDrawer(false);
      search.open = true;
      search.opener = document.activeElement;
      $('search').hidden = false;
      $('searchInput').focus();
      $('searchInput').select();
      if (!search.primed) primeSearch();
      renderResults();
    }

    function closeSearch(restore) {
      if (!search.open) return;
      search.open = false;
      $('search').hidden = true;
      if (restore && search.opener && search.opener.isConnected) search.opener.focus({ preventScroll: true });
      search.opener = null;
    }

    $('searchInput').addEventListener('input', renderResults);
    $('searchScrim').addEventListener('click', () => closeSearch(true));
    $('searchResults').addEventListener('click', (ev) => {
      const a = ev.target.closest('a');
      if (!a) return;
      closeSearch(false);
      wantFocus = true;
      if (a.getAttribute('href') === location.hash) { ev.preventDefault(); route(); }
    });
    // Inside the dialog: Escape closes, arrows move between the field and the results, Tab stays inside.
    $('search').addEventListener('keydown', (ev) => {
      const input = $('searchInput'), links = [...$('searchResults').querySelectorAll('a')];
      const at = links.indexOf(document.activeElement);
      if (ev.key === 'Escape') { ev.preventDefault(); closeSearch(true); }
      else if (ev.key === 'ArrowDown') { ev.preventDefault(); (links[at + 1] || links[links.length - 1] || input).focus(); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); (at > 0 ? links[at - 1] : input).focus(); }
      else if (ev.key === 'Enter' && document.activeElement === input && links.length) { ev.preventDefault(); links[0].click(); }
      else if (ev.key === 'Tab') {
        const ring = [input, ...links], k = ring.indexOf(document.activeElement);
        if (ev.shiftKey && k <= 0) { ev.preventDefault(); ring[ring.length - 1].focus(); }
        else if (!ev.shiftKey && k === ring.length - 1) { ev.preventDefault(); ring[0].focus(); }
      } else return;
      ev.stopPropagation();
    });
    for (const b of ['barSearch', 'railSearch', 'mapSearch']) $(b).addEventListener('click', openSearch);

    /* ---------- Keys ---------- */

    document.addEventListener('keydown', (ev) => {
      if (search.open) return;
      if (ev.key === 'Escape' && drawerOpen) { ev.preventDefault(); closeDrawer(true); return; }
      if (ev.defaultPrevented) return;
      const k = ev.key;
      if ((k === 'k' || k === 'K') && (ev.metaKey || ev.ctrlKey) && !ev.altKey && !ev.shiftKey) { ev.preventDefault(); openSearch(); return; }
      if (ev.altKey || ev.ctrlKey || ev.metaKey || typingIn(ev.target)) return;
      if (k === '/') { ev.preventDefault(); openSearch(); return; }
      if (k === 'g') { gAt = performance.now(); return; }
      if (k === 'h' && gAt && performance.now() - gAt < 1500) { gAt = 0; ev.preventDefault(); navigateHome(); return; }
      gAt = 0;
      pieceKey(ev, view);
    });

    /* ---------- Start ---------- */

    applyMap();
    window.addEventListener('hashchange', route);
    route();
  }

  /* ================= The kit: what templates and stages may use ================= */

  const kit = Object.freeze({
    version: VERSION,
    esc, clamp, lerp, n1, n2, linear, inOut, outCubic, outBack, plural,
    isObject, KEBAB, warn, plainText, typingIn,
    GLYPH: Object.freeze(GLYPH), FALLBACK_GLYPH, iconHtml, pillHtml, tagHtml, TONES, toneOf,
    motion: motionQuery,
    restartAnim, lifetime, sheetChecks,
  });

  window.Diorama = Object.freeze({
    version: VERSION,
    collection: registerCollection,
    walkthrough: registerWalkthrough,
    startCollection,
    startSingle,
    defineTemplate,
    defineStage,
  });
})();
