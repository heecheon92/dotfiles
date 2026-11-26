/*
 * Diorama step story ("story"): presents a walkthrough as numbered steps on the isometric stage,
 * the explanation in a pane beside the picture inside the stage card,
 * with try steps, goals, sources, a step strip, word budgets, automatic checks and a contact sheet.
 * It is the default template: a walkthrough that names no "template" is a step story.
 *
 * The shell (engine/diorama.js) loads this file on demand and calls it through the format
 * contract described in the diorama-maker skill: references/templates.md. The picture is drawn
 * by the stage the template names, here "iso" (engine/stage-iso.js).
 */
Diorama.defineTemplate('story', { stage: 'iso' }, (kit, stage) => {
  'use strict';

  const { esc, clamp, lerp, n1, n2, outCubic, isObject, KEBAB, plainText, iconHtml, tagHtml, TONES, toneOf, lifetime, restartAnim, plural, sheetChecks } = kit;
  const motionQuery = kit.motion;

  // A metric value as the reader and the sheet show it: up to two decimals, thousands separated.
  const decimalsOf = (v) => Math.min(2, (String(v).split('.')[1] || '').length);
  const fmtNum = (v, dec = decimalsOf(v)) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  /* ================= Walkthrough view ================= */
  // One walkthrough in three regions: header, stage card and step strip. The stage card holds the
  // picture and, beside it (under it on a narrow page), the explanation pane. A view owns its
  // DOM, timers and listeners and the stage view inside it; destroy() releases all of them, so
  // views can be created and thrown away as often as the reader switches walkthroughs.

  // The words this template shows. The shell adds its own, and the collection and the
  // walkthrough may replace any of them.
  const LABELS = {
    goals: "What you'll learn", strip: 'In this walkthrough', changes: 'What changed', back: 'Back', restart: 'Start again', chapters: {},
    sources: 'Where this comes from', sourced: 'sourced', assumed: 'assumption', try: 'Try it', reset: 'Reset',
    numbers: 'Running numbers',
  };

  // Returns a reason when the data cannot be drawn at all; smaller mistakes are only warned about.
  function unusable(w) {
    if (!w || typeof w !== 'object' || Array.isArray(w)) return 'it is missing or is not a JSON object';
    if (!Array.isArray(w.steps) || !w.steps.length) return 'it has no steps';
    const k = w.steps.findIndex((s) => !isObject(s));
    if (k >= 0) return `step ${k + 1} is not an object`;
    return stage.unusable({ nodes: w.nodes, links: w.links });
  }

  // The explanation: one step's text in a slot as tall as the walkthrough's longest step, so that
  // Back and Next stay in one place from step to step, then the buttons, then goals and sources.
  // Inside the stage card ("inside", the default) all of it is one pane over the picture; in
  // "side" it is a column of three cards beside the stage card: the step, the running numbers
  // and the goals with the sources.
  function viewMarkup(opts) {
    const S = stage.parts({ replayTitle: 'Replay this step (R)' });
    const side = !!opts.side;
    const metrics = `<div data-ref="metrics" class="metrics" role="list" aria-label="${esc(opts.labels.numbers)}"></div>`;
    const step = `<div class="guide-slot">
            <div data-ref="guide" class="guide still" aria-live="polite"></div>
            <div data-ref="sizers" class="guide-sizers" aria-hidden="true" inert></div>
          </div>
      <div class="nav">
        <button data-ref="backBtn" class="btn" type="button"></button>
        <button data-ref="nextBtn" class="btn primary" type="button"></button>
      </div>
      <p class="kbd-hint"><span><kbd>←</kbd> <kbd>→</kbd> step</span> · <span data-ref="tryHint" hidden></span><span><kbd>R</kbd> replay</span> · <span><kbd>Space</kbd> pause</span>${opts.searchHint ? ' · <span><kbd>/</kbd> search</span>' : ''}</p>
      <p data-ref="tryLive" class="sr-only" aria-live="polite"></p>`;
    const more = `<details data-ref="goals" class="goals" hidden>
        <summary data-ref="goalsHead"></summary>
        <ul data-ref="goalsList"></ul>
      </details>
      <details data-ref="sources" class="sources" hidden>
        <summary data-ref="sourcesHead"></summary>
        <ul data-ref="sourcesList"></ul>
      </details>`;
    return `<div class="page">
  <header class="wt-head">
    <div>
      ${opts.crumb ? `<p class="crumb">${esc(opts.crumb)}</p>` : ''}
      <h1 data-ref="title" tabindex="-1"></h1>
      <p data-ref="question" class="question" hidden></p>
      <p data-ref="summary" class="summary"></p>
      <p data-ref="note" class="note" hidden></p>
    </div>
    <ul data-ref="pills" class="pills" aria-label="About this walkthrough"></ul>
  </header>
  <div class="layout${side ? ' side' : ''}" data-explain="${side ? 'side' : 'inside'}">
    <section class="stage card" aria-label="Stage">
      <div class="stage-top">
        ${side ? '' : metrics}
        <div class="stage-controls">
          ${S.controls}
        </div>
      </div>
      <div class="stage-body">
        ${S.scene}
        ${side ? '' : `<aside data-ref="pane" class="explain" aria-label="Explanation">
          ${step}
          ${more}
        </aside>`}
      </div>
      <ul data-ref="legend" class="legend" aria-label="Legend"></ul>
      ${S.text}
    </section>
${side ? `
    <aside class="rail" aria-label="Explanation">
      <section data-ref="pane" class="explain card">
          ${step}
      </section>
      <section data-ref="numbersCard" class="numbers card" hidden>
        <h3 class="section-h">${esc(opts.labels.numbers)}</h3>
        ${metrics}
      </section>
      <section data-ref="moreCard" class="more card" hidden>
        ${more}
      </section>
    </aside>
` : ''}
    <nav class="strip card" aria-label="Steps">
      <div class="strip-head"><span data-ref="stripHead"></span><span data-ref="stripCount"></span></div>
      <div data-ref="stripScroll" class="strip-scroll">
        <ol data-ref="stepStrip" class="still"></ol>
      </div>
    </nav>
  </div>
</div>`;
  }

  /* ================= Walkthrough model ================= */
  // What follows from the data alone: the steps, the scenes the stage draws (one per step, then
  // one per try option) and the automatic checks. The walkthrough view and the contact sheet both
  // draw from it. It is built once per walkthrough object, which is also why its checks print
  // only once.

  const models = new WeakMap();
  const OPTION_LETTERS = 'abcde';
  const BUBBLE_WORDS = 20;
  const UNSPACED = /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Thai}/gu;

  function modelOf(w) {
    let m = models.get(w);
    if (!m) {
      m = buildModel(w);
      models.set(w, m);
      m.report();
    }
    return m;
  }

  function buildModel(w) {
    /* ================= Shapes ================= */
    // Everything below reads cleaned copies of the data. A field of the wrong type is reported here,
    // naming the step, the option and the field, and is then treated as absent, so one malformed
    // field never stops a walkthrough from drawing. These reports open the list of warnings; the
    // stage reports those of the nodes, the links and each scene.

    const lists = [], own = [];   // problems of the top-level lists, and of each scene's own fields
    let into = lists;
    const bad = (where, field, what, end = 'so it is ignored') => into.push(`${where}: ${field} ${what}, ${end}`);
    const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

    const listOf = (key, keep, what) => {
      if (w[key] == null) return [];
      if (!Array.isArray(w[key])) { bad('the walkthrough', `"${key}"`, 'is not a list', 'so it is ignored'); return []; }
      return w[key].filter((x, k) => keep(x) || (bad(`${key} entry ${k + 1}`, 'the entry', what, 'so it is left out'), false));
    };
    const METRICS = listOf('metrics', (m) => isObject(m) && typeof m.id === 'string', 'is not an object with an "id"');
    const GOALS = listOf('goals', isObject, 'is not an object');
    const LEGEND = listOf('legend', isObject, 'is not an object');

    // Metrics of a step (null stays null) or of an option (absent or null inherits the step's).
    function cleanMetrics(raw, where, inherit) {
      if (raw == null) return inherit ? undefined : raw;
      if (!isObject(raw)) { bad(where, 'metrics', 'is not an object', inherit ? "so it is ignored and the step's metrics are used" : 'so it is ignored'); return undefined; }
      const out = {};
      for (const [id, v] of Object.entries(raw)) {
        if (v === null || isNum(v)) out[id] = v;
        else bad(where, `metrics.${id}`, 'is not a number or null', 'so it is shown as —');
      }
      return out;
    }

    const STEPS = w.steps.map((s, i) => {
      const where = `step ${i + 1}`;
      into = own[i] = [];
      const out = { ...s, metrics: cleanMetrics(s.metrics, where, false) };
      for (const key of ['body', 'changes']) if (s[key] != null && !Array.isArray(s[key])) { bad(where, key, 'is not a list'); delete out[key]; }
      if (s.callout != null && !isObject(s.callout)) { bad(where, 'callout', 'is not an object'); delete out.callout; }
      return out;
    });

    /* ================= Scenes: steps and try options ================= */
    // SCENES[i] is step i. Each try option adds one scene after the steps: its step with the
    // option's scene keys and metrics in place of the step's own; everything else is inherited.
    // The stage gets the same list (RAW), so scene k means the same thing on both sides.

    const SCENES = STEPS.slice();
    const META = STEPS.map((s, i) => ({ step: i, opt: -1, id: String(i + 1), name: `step ${i + 1}` }));
    const RAW = STEPS.map((s, i) => ({ scene: s.scene, name: `step ${i + 1}` }));
    const tries = STEPS.map((s, i) => {
      const t = s.try;
      if (!isObject(t) || !Array.isArray(t.options) || !t.options.length) return null;
      const options = t.options.slice(0, 5).map((raw, k) => {
        const o = isObject(raw) ? raw : {}, v = isObject(o.verdict) ? o.verdict : {};
        const label = typeof o.label === 'string' && o.label.trim() ? o.label : `Option ${k + 1}`;
        const index = SCENES.length, id = `${i + 1}${OPTION_LETTERS[k]}`, name = `step ${id} (option ${JSON.stringify(label)})`;
        into = own[index] = [];
        const om = cleanMetrics(o.metrics, name, true);
        SCENES.push({ ...s, metrics: om === undefined ? s.metrics : om });
        META.push({ step: i, opt: k, id, name, raw: o });
        RAW.push({ scene: o.scene, name, base: i });
        return { label, scene: index, verdict: { tone: toneOf(v.tone), text: String(v.text ?? ''), why: String(v.why ?? '') } };
      });
      return { prompt: String(t.prompt ?? ''), options };
    });

    // The picture: a try step's base and its options form one group, framed by one camera, so
    // choosing an option never moves it.
    const groups = STEPS.map((_, i) => [i, ...(tries[i] ? tries[i].options.map((o) => o.scene) : [])]);
    const picture = stage.model({ nodes: w.nodes, links: w.links, scenes: RAW, groups });
    // In reading order: the nodes and links, the lists, then each scene (the stage's part first).
    const shapes = picture.shapes.concat(lists, ...SCENES.map((_, k) => picture.sceneShapes[k].concat(own[k])));

    /* ================= Automatic checks ================= */
    // Warnings: the data breaks a rule of the format (rules 1, 2, 3, 7, 8, 9, sources).
    // Notes: text or layout over its budget. Both are listed on the contact sheet and printed to
    // the console once per walkthrough.

    const q = (s) => JSON.stringify(String(s ?? ''));
    const isList = (para) => /^\s*<(ul|ol)\b/i.test(String(para));
    // Words as a reader sees them; null for text written mostly without spaces (Chinese, Japanese, Thai).
    // Plain-text fields are shown exactly as written, so nothing in them is markup. Body HTML loses its
    // tags, but a paragraph, list item or line break still separates the words on either side.
    function countWords(t) {
      t = t.replace(/\s+/g, ' ').trim();
      if (!t) return 0;
      const chars = t.replace(/ /g, ''), unspaced = (chars.match(UNSPACED) || []).length;
      return unspaced * 2 > chars.length ? null : t.split(' ').length;
    }
    const words = {
      text: (s) => countWords(String(s ?? '')),
      html: (h) => countWords(plainText(String(h ?? '').replace(/<\/?(?:p|li|ul|ol|div|br|h[1-6])\b[^>]*>/gi, ' '))),
    };

    // Rules 1, 2 and 7 come from the stage; rule 3 (the metrics add up) is the story's own.
    function checkScene(k, warn) {
      picture.rules(k).forEach(warn);
      const n = META[k].name, s = SCENES[k];
      if (METRICS.length > 1 && s.metrics) {
        const total = METRICS[METRICS.length - 1].id, tv = s.metrics[total];
        const parts = METRICS.slice(0, -1).map((m) => s.metrics[m.id]).filter((v) => typeof v === 'number');
        const sum = parts.reduce((a, b) => a + b, 0);
        if (typeof tv === 'number' ? Math.abs(tv - sum) > 1e-9 : parts.length > 0) warn(`${n}: metrics.${total} is ${tv} but the other metrics add up to ${sum} (rule 3)`);
      }
    }

    // What scene k shows, in a fixed form for rule 9: the stage's picture and the metrics.
    const signature = (k) => `${picture.signature(k)}|${JSON.stringify(METRICS.map((m) => { const v = (SCENES[k].metrics || {})[m.id]; return typeof v === 'number' ? v : null; }))}`;

    function runChecks() {
      const warnings = [], notes = [];
      const warn = (m) => warnings.push(m), note = (m) => notes.push(m);
      const order = STEPS.flatMap((_, i) => [i, ...(tries[i] ? tries[i].options.map((o) => o.scene) : [])]);
      // Every scene, steps first with their options after them. An option repeats what its step
      // already reported for the parts it inherits, so only its new findings are kept.
      const perScene = (find) => {
        const found = SCENES.map((_, k) => { const out = []; find(k, (m) => out.push(m)); return out; });
        for (const k of order) {
          const m = META[k];
          const seen = m.opt < 0 ? null : new Set(found[m.step].map((x) => x.replace(META[m.step].name, m.name)));
          for (const x of found[k]) if (!seen || !seen.has(x)) warn(x);
        }
      };

      shapes.forEach(warn);
      if (typeof w.id !== 'string' || !KEBAB.test(w.id)) warn(`id ${JSON.stringify(w.id)} should be a kebab-case string`);
      if (w.explain !== undefined && w.explain !== 'inside' && w.explain !== 'side') warn(`explain ${JSON.stringify(w.explain)} is not "inside" or "side"; the explanation is shown inside the stage card`);
      picture.wiring().forEach(warn);
      perScene(checkScene);
      GOALS.forEach((g, k) => {
        if (!Number.isInteger(g.step) || g.step < 0 || g.step >= STEPS.length) warn(`goal ${k + 1} points at step index ${g.step}, which does not exist (rule 1)`);
      });
      picture.spacing().forEach(warn);
      perScene((k, out) => {
        const hits = picture.layout(k).overlaps;
        hits.slice(0, 4).forEach((h) => out(`${META[k].name}: ${h}; move a node or shorten the text (rule 8)`));
        if (hits.length > 4) out(`${META[k].name}: ${hits.length - 4} more overlap${hits.length === 5 ? '' : 's'} like these (rule 8)`);
      });

      STEPS.forEach((s, i) => {
        if (s.try === undefined) return;
        const t = s.try, n = `step ${i + 1}`;
        if (!isObject(t) || !Array.isArray(t.options)) { warn(`${n}: "try" needs an "options" array with 2 to 5 options (rule 9)`); return; }
        const count = t.options.length;
        if (count < 2 || count > 5) warn(`${n}: the try has ${count} option${count === 1 ? '' : 's'}; give it 2 to 5${count > 5 ? ' (only the first 5 are shown)' : ''} (rule 9)`);
        const base = signature(i);
        (tries[i] ? tries[i].options : []).forEach((opt) => {
          const m = META[opt.scene], o = m.raw, v = isObject(o.verdict) ? o.verdict : {};
          if (typeof o.label !== 'string' || !o.label.trim()) warn(`${m.name}: the option has no "label" (rule 9)`);
          if (typeof v.text !== 'string' || !v.text.trim()) warn(`${m.name}: the option has no verdict.text (rule 9)`);
          if (v.tone === undefined) warn(`${m.name}: the option has no verdict.tone; give it one of ${TONES.join(', ')} (rule 9)`);
          else if (!TONES.includes(v.tone)) warn(`${m.name}: verdict.tone ${JSON.stringify(v.tone)} is not one of ${TONES.join(', ')} (rule 9)`);
          if (signature(opt.scene) === base) warn(`${m.name}: the option is identical to the base scene, so choosing it changes nothing; give it its own value of the variable (rule 9)`);
        });
      });

      if (w.sources !== undefined) {
        if (!Array.isArray(w.sources)) warn('"sources" should be an array of { claim, kind, source, url } entries (sources)');
        else w.sources.forEach((src, k) => {
          const claim = isObject(src) && typeof src.claim === 'string' ? src.claim.trim() : '';
          const n = `sources entry ${k + 1}${claim ? ` (${q(claim.length > 48 ? `${claim.slice(0, 47)}…` : claim)})` : ''}`;
          if (!isObject(src)) { warn(`${n} is not an object (sources)`); return; }
          if (!claim) warn(`${n} has no "claim" (sources)`);
          if (src.kind === 'data') {
            if (typeof src.source !== 'string' || !src.source.trim()) warn(`${n}: kind "data" needs a "source" that says where the value comes from; add one, or mark the entry "assumption" (sources)`);
          } else if (src.kind !== 'assumption') warn(`${n}: unknown kind ${JSON.stringify(src.kind)}; use "data" or "assumption" (sources)`);
        });
      }

      const isRecap = (s) => s.chapter === 'recap';
      STEPS.forEach((s, i) => {
        const n = `step ${i + 1}`, body = Array.isArray(s.body) ? s.body : [];
        if (!isRecap(s) && body.length !== 2) note(`${n}: the body has ${body.length} paragraph${body.length === 1 ? '' : 's'}; a step has exactly 2`);
        body.forEach((para, k) => {
          const c = isList(para) ? null : words.html(para);
          if (c !== null && c > 40) note(`${n}: paragraph ${k + 1} has ${c} words; keep each to 40 or fewer`);
        });
        const sw = words.text(s.short), tw = words.text(s.title);
        if (sw !== null && sw > 2) note(`${n}: "short" ${q(s.short)} has ${sw} words; use 1 or 2`);
        if (tw !== null && tw > 8) note(`${n}: the title has ${tw} words; keep it to 8 or fewer`);
        if (Array.isArray(s.changes) && s.changes.length > 3) note(`${n}: "changes" has ${s.changes.length} lines; keep it to 3 or fewer`);
      });
      // A bubble is a short note; an option is checked only when its bubble is its own.
      SCENES.forEach((_, k) => {
        const b = picture.bubble(k), m = META[k], base = m.opt >= 0 ? picture.bubble(m.step) : null;
        if (!b || (base && base.text === b.text)) return;
        const bw = words.text(b.text);
        if (bw !== null && bw > BUBBLE_WORDS) note(`${m.name}: the bubble has ${bw} words; keep it to ${BUBBLE_WORDS} or fewer, in one or two short sentences`);
      });
      const first = picture.objects(0);
      if (first.length > 2) note(`step 1 shows ${first.length} nodes; start with 1 or 2 and bring in the rest as the story needs them`);
      for (let i = 1; i < STEPS.length; i++) {
        const before = new Set(picture.objects(i - 1)), added = picture.objects(i).filter((id) => !before.has(id));
        if (added.length > 2) note(`step ${i + 1} adds ${added.length} nodes (${added.join(', ')}); add at most 2 per step`);
      }
      if (!isRecap(STEPS[STEPS.length - 1])) note('the last step is not a recap; end on a step with chapter "recap"');
      const ref = picture.reference;
      STEPS.forEach((_, i) => {
        const size = Math.min(...[i, ...(tries[i] ? tries[i].options.map((o) => o.scene) : [])].map((k) => picture.layout(k).smallest));
        const z = picture.layout(i).zoom, px = size * z;
        if (size < Infinity && px < 8) note(`step ${i + 1}: at the reference stage size (${ref.W} × ${ref.H} px) the camera zooms out to ×${n2(z)}, so ${size} px labels show at ${n1(px)} px (under 8); move nodes closer together or show fewer at once`);
      });
      const tried = STEPS.map((s, i) => (s.try !== undefined ? i + 1 : 0)).filter(Boolean);
      if (tried.length > 2) note(`${tried.length} steps have a try (steps ${tried.join(', ')}); keep it to 2 or fewer`);
      for (const t of tries) {
        for (const o of t ? t.options : []) {
          const name = META[o.scene].name, tw = words.text(o.verdict.text), yw = words.text(o.verdict.why);
          if (tw !== null && tw > 4) note(`${name}: verdict.text has ${tw} words; keep it to 4 or fewer`);
          if (yw !== null && yw > 20) note(`${name}: verdict.why has ${yw} words; keep it to one sentence of 20 or fewer`);
        }
      }
      const hasSources = Array.isArray(w.sources) && w.sources.length > 0;
      if ((METRICS.length || picture.numbers()) && !hasSources && !(typeof w.note === 'string' && w.note.trim())) {
        note(`the walkthrough shows numbers (${METRICS.length ? 'metrics' : 'tags with numbers'}) but has neither "sources" nor "note"; say where the numbers come from`);
      }
      return { warnings, notes };
    }

    const checks = runChecks();

    // The title of scene k for the stage's text alternative and the sheet's stills, such as
    // "step 6: The lock clicks (Try it: 50 ms)".
    function titleOf(k, tryWord) {
      const m = META[k], opt = m.opt >= 0 ? tries[m.step].options[m.opt] : null;
      return `step ${m.step + 1}: ${SCENES[k].title || ''}${opt ? ` (${tryWord}: ${opt.label})` : ''}`;
    }

    return {
      STEPS, SCENES, META, METRICS, GOALS, LEGEND, tries, picture, checks, words, isList, titleOf,
      report() {
        const id = w.id || 'walkthrough';
        for (const m of checks.warnings) console.warn(`[diorama] ${id}: ${m}`);
        for (const m of checks.notes) console.info(`[diorama] note: ${id}: ${m}`);
      },
    };
  }

  // opts: { labels, start (0-based step), crumb, searchHint, docTitle, minutes, level,
  //         prev: { title, go } | null   where Back on the first step leads,
  //         end: { label, icon, go }      what the last step's primary button does,
  //         onMove(i) }                   called after every step change, and when go() stays put
  function mount(host, w, opts) {
    const M = modelOf(w);
    const { STEPS, SCENES, METRICS, GOALS, LEGEND, tries } = M;
    const LBL = opts.labels;
    // Where the explanation sits: the walkthrough's own "explain", else the collection's.
    const SIDE = (w.explain ?? opts.explain) === 'side';
    host.innerHTML = viewMarkup({ ...opts, side: SIDE });
    const R = {};
    for (const el of host.querySelectorAll('[data-ref]')) R[el.dataset.ref] = el;
    const $ = (name) => R[name];
    let reduce = motionQuery.matches;

    // Everything asynchronous goes through life, so destroy() can cancel all of it.
    let alive = true;
    const life = lifetime();
    const later = life.later, nextFrame = life.frame;
    // Animations of the page itself (the metric counters), run once a frame while there are any.
    const uiAnims = [];
    function uiAnim(fn) {
      uiAnims.push(fn);
      if (uiAnims.length === 1) nextFrame(runAnims);
    }
    function runAnims(now) {
      for (let k = 0; k < uiAnims.length; k++) if (uiAnims[k](now)) uiAnims.splice(k--, 1);
      if (uiAnims.length) nextFrame(runAnims);
    }

    let S = null;          // the stage view, mounted once the regions around it are in place
    let cur = -1;          // step shown in the explanation
    let choice = -1;       // the try option chosen on that step, or -1 for its base scene

    /* ================= Page regions ================= */

    const CHAPTER_TONE = { setup: 'gray', problem: 'red', technique: 'violet', solution: 'green', insight: 'amber', tradeoff: 'amber', recap: 'paper' };
    const CALLOUT = {
      insight: { label: 'Key idea', icon: 'bulb', tone: 'amber' },
      tip: { label: 'Good to know', icon: 'info', tone: 'green' },
      warn: { label: 'Watch out', icon: 'alert', tone: 'red' },
      next: { label: 'Next up', icon: 'arrow', tone: 'violet' },
    };

    function renderHeader() {
      document.title = opts.docTitle || w.title || 'Walkthrough';
      $('title').textContent = w.title || '';
      $('summary').textContent = w.summary || '';
      $('question').hidden = !w.question;
      $('question').textContent = w.question || '';
      if (w.note) { $('note').hidden = false; $('note').textContent = `# ${w.note}`; }
      const minutes = w.minutes ?? opts.minutes, level = w.level ?? opts.level;
      const pills = [];
      if (minutes) pills.push(['clock', `${minutes} min`, 'amber']);
      if (level) pills.push(['level', level, 'green']);
      pills.push(['layers', `${STEPS.length} steps`, 'violet']);
      $('pills').innerHTML = pills.map(([ic, t, tone]) => `<li class="pill tone-${tone}">${iconHtml(ic)}${esc(t)}</li>`).join('');
      $('stripHead').textContent = LBL.strip;
      $('goals').hidden = !GOALS.length;
      renderSources();
      if (SIDE) $('moreCard').hidden = $('goals').hidden && $('sources').hidden;
    }

    // The ledger under the goals: where each fact and number comes from, collapsed by default.
    function renderSources() {
      const list = Array.isArray(w.sources) ? w.sources.filter(isObject) : [];
      $('sources').hidden = !list.length;
      if (!list.length) return;
      const kindOf = (s) => (s.kind === 'data' ? ['green', LBL.sourced] : s.kind === 'assumption' ? ['amber', LBL.assumed] : ['gray', String(s.kind ?? '?')]);
      const counts = [['data', 'green', LBL.sourced], ['assumption', 'amber', LBL.assumed]]
        .map(([kind, tone, label]) => [list.filter((s) => s.kind === kind).length, tone, label])
        .filter(([n]) => n)
        .map(([n, tone, label]) => ` · ${tagHtml(`${label} ${n}`, tone)}`).join('');
      $('sourcesHead').innerHTML = `<span class="sources-h">${esc(LBL.sources)}</span>${counts}`;
      $('sourcesList').innerHTML = list.map((s) => {
        const [tone, tag] = kindOf(s);
        const text = String(s.source ?? '').trim(), url = String(s.url ?? '').trim();
        const from = /^https?:\/\//i.test(url) ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text || url)}</a>` : esc(text || url);
        return `<li>${tagHtml(tag, tone)}<div><p class="src-claim">${esc(s.claim ?? '')}</p>${from ? `<p class="src-from">${from}</p>` : ''}</div></li>`;
      }).join('');
    }

    function renderLegend() {
      $('legend').innerHTML = LEGEND.map((l) => {
        const kind = stage.flowKind(l.kind);
        return `<li>${stage.flowIcon(kind)}${esc(l.label || kind)}</li>`;
      }).join('');
    }

    /* ---------- Metric chips ---------- */

    const chips = [];

    function buildMetrics() {
      const box = $('metrics');
      box.hidden = !METRICS.length;
      if (SIDE) $('numbersCard').hidden = !METRICS.length;
      METRICS.forEach((m, k) => {
        const el = document.createElement('div');
        el.className = `chip${k === METRICS.length - 1 && METRICS.length > 1 ? ' total' : ''}`;
        el.setAttribute('role', 'listitem');
        el.innerHTML = `<span class="chip-l">${m.icon ? iconHtml(m.icon) : ''}${esc(m.label)}</span><span class="chip-v"><span class="chip-n">—</span><span class="chip-u"></span></span>`;
        box.appendChild(el);
        chips.push({ el, v: el.querySelector('.chip-v'), num: el.querySelector('.chip-n'), unit: el.querySelector('.chip-u'), m, value: null, token: 0 });
      });
    }

    function setChip(c, v) {
      c.num.textContent = v === null ? '—' : fmtNum(v);
      c.unit.textContent = v === null ? '' : (c.m.unit || '');
    }

    // A number this step (or the chosen option) changed stays tinted until the next step.
    function updateMetrics(i, animate) {
      const vals = SCENES[i].metrics || {};
      const before = i === cur ? (cur > 0 ? SCENES[cur - 1].metrics || {} : {}) : SCENES[cur].metrics || {};
      for (const c of chips) {
        const v = typeof vals[c.m.id] === 'number' ? vals[c.m.id] : null;
        const was = typeof before[c.m.id] === 'number' ? before[c.m.id] : null;
        c.el.classList.toggle('now', v !== null && v !== was);
        if (v === c.value) continue;
        const old = c.value;
        c.value = v;
        const token = ++c.token;
        if (!animate || reduce || v === null || old === null) {
          setChip(c, v);
          if (animate && !reduce) restartAnim(c.v, 'swap');
        } else {
          const t0 = performance.now(), dec = decimalsOf(v);
          c.unit.textContent = c.m.unit || '';
          uiAnim((now) => {
            if (token !== c.token) return true;
            const u = Math.min(1, (now - t0) / 900);
            c.num.textContent = u >= 1 ? fmtNum(v, dec) : fmtNum(Number(lerp(old, v, outCubic(u)).toFixed(dec)), dec);
            return u >= 1;
          });
        }
        if (animate && !reduce) restartAnim(c.el, 'flash');
      }
    }

    /* ---------- Explanation ---------- */

    function renderGuide(i, dir) {
      const guide = $('guide');
      if (dir && !reduce && guide.childElementCount) {
        const old = guide.cloneNode(true);
        old.removeAttribute('data-ref');
        old.removeAttribute('aria-live');
        old.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
        old.className = 'guide guide-old still';
        old.setAttribute('aria-hidden', 'true');
        old.inert = true;   // its buttons must not take focus while it fades out
        old.style.left = `${guide.offsetLeft}px`;
        old.style.top = `${guide.offsetTop}px`;
        old.style.width = `${guide.offsetWidth}px`;
        guide.parentNode.appendChild(old);
        later(() => old.remove(), 200);
      }
      guide.className = dir && !reduce ? 'guide' : 'guide still';
      guide.style.setProperty('--slide', `${dir > 0 ? 36 : -36}px`);
      guide.innerHTML = guideBlocks(i).map((b, k) => `<div class="blk" style="--i:${k}">${b}</div>`).join('');
    }

    // The blocks of one step's text: head, title, body, try, callout, what changed.
    function guideBlocks(i, sizing) {
      const s = STEPS[i], blocks = [];
      const chapter = s.chapter || 'setup';
      blocks.push(`<div class="guide-head"><span>${i + 1} / ${STEPS.length}</span><span class="badge tone-${CHAPTER_TONE[chapter] || 'gray'}">${esc(LBL.chapters[chapter] || chapter)}</span></div>`);
      blocks.push(`<h2>${esc(s.title || '')}</h2>`);
      for (const para of s.body || []) blocks.push(/^\s*<(ul|ol|p)\b/i.test(para) ? `<div class="body">${para}</div>` : `<div class="body"><p>${para}</p></div>`);
      if (tries[i] && !sizing) blocks.push(tryBlock(tries[i]));
      if (s.callout && s.callout.text) {
        const c = CALLOUT[s.callout.kind] || CALLOUT.insight;
        blocks.push(`<div class="callout tone-${c.tone}"><span class="callout-icon">${iconHtml(c.icon)}</span><div><strong>${c.label}</strong><p>${s.callout.text}</p></div></div>`);
      }
      if (s.changes && s.changes.length) {
        const items = s.changes.map((line) => {
          const str = String(line), ch = str.charAt(0);
          const kind = ch === '+' ? ['+', 'green', 'added'] : ch === '~' ? ['~', 'amber', 'changed'] : (ch === '−' || ch === '-') ? ['−', 'red', 'removed'] : null;
          const text = kind ? str.slice(1).trim() : str;
          return `<li>${kind ? `<span class="mark tone-${kind[1]}" aria-hidden="true">${kind[0]}</span><span class="sr-only">${kind[2]}: </span>` : ''}<span>${esc(text)}</span></li>`;
        }).join('');
        blocks.push(`<section class="changes"><h3 class="section-h">${esc(LBL.changes)}</h3><ul>${items}</ul></section>`);
      }
      return blocks;
    }

    // Every step's text, invisible, in the same place as the shown one: the slot is then as tall as
    // the longest step at any width, and Back and Next below it do not move from step to step.
    // A try's options and verdict are not in it: on a try step they may push the buttons down,
    // and where the pane scrolls they are brought into view (reveal).
    function buildSizers() {
      const box = $('sizers');
      box.innerHTML = STEPS.map((_, i) => `<div class="guide still">${guideBlocks(i, true).map((b) => `<div class="blk">${b}</div>`).join('')}</div>`).join('');
      box.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
      box.querySelectorAll('[aria-labelledby]').forEach((n) => n.removeAttribute('aria-labelledby'));
    }

    /* ---------- Try it ---------- */
    // A try step offers options; choosing one moves the stage to that option's scene without
    // sliding the text. Reset, or leaving the step, returns to the step's own (base) scene.

    const sceneNow = () => (choice >= 0 && tries[cur] ? tries[cur].options[choice].scene : cur);

    function tryBlock(t) {
      const buttons = t.options.map((o, k) => `<button type="button" class="btn try-opt" data-try="${k}" aria-pressed="false"><kbd aria-hidden="true">${k + 1}</kbd><span>${esc(o.label)}</span></button>`).join('');
      return `<section class="try" aria-labelledby="dio-try-head" aria-live="off"><h3 class="section-h" id="dio-try-head">${esc(LBL.try)}</h3>`
        + `${t.prompt ? `<p class="try-prompt">${esc(t.prompt)}</p>` : ''}`
        + `<div class="try-options" role="group" aria-label="${esc(t.prompt || LBL.try)}">${buttons}`
        + `<button type="button" class="btn small try-reset" data-try="reset" hidden>${iconHtml('replay')}<span>${esc(LBL.reset)}</span></button></div>`
        + '<div class="try-verdict" hidden></div></section>';
    }

    function syncTry() {
      const box = $('guide').querySelector('.try');
      if (!box) return;
      const o = choice >= 0 ? tries[cur].options[choice] : null;
      for (const b of box.querySelectorAll('.try-opt')) b.setAttribute('aria-pressed', String(Number(b.dataset.try) === choice));
      box.querySelector('.try-reset').hidden = !o;
      const v = box.querySelector('.try-verdict');
      v.hidden = !o;
      v.className = `try-verdict tone-${o ? o.verdict.tone : 'paper'}`;
      v.innerHTML = o ? `<p class="try-v-head"><span class="try-v-text">${esc(o.verdict.text)}</span><span class="try-v-opt">${esc(o.label)}</span></p>${o.verdict.why ? `<p class="try-v-why">${esc(o.verdict.why)}</p>` : ''}` : '';
    }

    function showChoice() {
      const k = sceneNow();
      S.pause(false);
      syncTry();
      updateMetrics(k, true);
      S.text(k);
      S.inline(k);
      S.show(k);
    }

    // In a pane that scrolls, a try step's options, and then the verdict of a choice, are brought
    // into view above Back and Next, moving the text no further than that takes.
    function reveal(sel) {
      const pane = $('pane'), els = [...$('guide').querySelectorAll(sel)].filter((el) => !el.hidden);
      if (!els.length || pane.scrollHeight <= pane.clientHeight + 1) return;
      const p = pane.getBoundingClientRect(), nav = pane.querySelector('.nav');
      const floor = p.bottom - (getComputedStyle(nav).position === 'sticky' ? nav.offsetHeight : 0) - 10;
      const top = Math.min(...els.map((el) => el.getBoundingClientRect().top)), bottom = Math.max(...els.map((el) => el.getBoundingClientRect().bottom));
      if (bottom > floor) pane.scrollTop += Math.min(bottom - floor, Math.max(0, top - p.top - 8));
      else if (top < p.top) pane.scrollTop -= p.top - top + 8;
    }

    function choose(k) {
      const t = tries[cur];
      if (!t || k < 0 || k >= t.options.length || k === choice) return;
      choice = k;
      showChoice();
      reveal('.try-verdict');
      const o = t.options[k];
      $('tryLive').textContent = `${o.label}: ${o.verdict.text.replace(/[.!?]$/, '')}.${o.verdict.why ? ` ${o.verdict.why}` : ''}`;
    }

    function resetTry() {
      if (!tries[cur] || choice < 0) return;
      choice = -1;
      showChoice();
      $('tryLive').textContent = LBL.reset;
    }

    // Keys on a try step: 1-5 choose, 0 resets. Returns false when the key means nothing here.
    function tryKey(n) {
      const t = tries[cur];
      if (!t || n > t.options.length) return false;
      if (n === 0) resetTry();
      else choose(n - 1);
      return true;
    }

    function renderTryHint(i) {
      const t = tries[i], hint = $('tryHint');
      hint.hidden = !t;
      hint.innerHTML = t ? `<kbd>1</kbd>${t.options.length > 1 ? `–<kbd>${t.options.length}</kbd>` : ''} ${esc(LBL.try.toLocaleLowerCase())} · <kbd>0</kbd> ${esc(LBL.reset.toLocaleLowerCase())} · ` : '';
    }

    function renderNav(i) {
      const back = $('backBtn'), next = $('nextBtn');
      const toPrev = i === 0 && opts.prev;
      back.innerHTML = `${iconHtml('back')}<span>${esc(LBL.back)}</span>`;
      back.disabled = i === 0 && !opts.prev;
      if (toPrev) back.setAttribute('aria-label', `${LBL.back}: ${opts.prev.title}`);
      else back.removeAttribute('aria-label');
      back.title = toPrev ? `${LBL.back}: ${opts.prev.title}` : '';
      if (i === STEPS.length - 1) {
        const end = opts.end || { label: LBL.restart, icon: 'replay' };
        next.innerHTML = `<span>${esc(end.label)}</span>${iconHtml(end.icon || 'arrow')}`;
      } else {
        next.innerHTML = `<span>${esc(LBL.next)}: ${esc(STEPS[i + 1].short || `step ${i + 2}`)}</span>${iconHtml('arrow')}`;
      }
    }

    // Collapsed by default, so the step's own text has the pane; the heading counts what is covered.
    function renderGoals(i) {
      $('goalsHead').innerHTML = `<span class="sources-h">${esc(LBL.goals)}</span> · ${GOALS.filter((g) => i >= g.step).length} / ${GOALS.length}`;
      $('goalsList').innerHTML = GOALS.map((g) => {
        const done = i >= g.step;
        return `<li class="${done ? 'done' : ''}"><span class="check" aria-hidden="true">${iconHtml('check')}</span><span>${esc(g.text)}<span class="sr-only">${done ? ' (covered)' : ''}</span></span></li>`;
      }).join('');
    }

    /* ---------- Step strip ---------- */

    const stripButtons = [];
    function buildStrip() {
      const ol = $('stepStrip');
      ol.style.setProperty('--n', STEPS.length);
      STEPS.forEach((s, k) => {
        const li = document.createElement('li');
        const t = tries[k];
        const b = document.createElement('button');
        b.type = 'button';
        b.className = t ? 'step-btn has-try' : 'step-btn';
        b.innerHTML = `<span class="dot-n" aria-hidden="true">${k + 1}</span>${t ? '<span class="try-mark" aria-hidden="true"></span>' : ''}<span class="step-short">${esc(s.short || `Step ${k + 1}`)}</span>`;
        b.setAttribute('aria-label', `Step ${k + 1}: ${s.short || s.title || ''}${t ? ` (${LBL.try})` : ''}`);
        if (t) b.title = LBL.try;
        b.addEventListener('click', () => go(k));
        li.appendChild(b);
        ol.appendChild(li);
        stripButtons.push(b);
      });
    }

    function renderStrip(i) {
      stripButtons.forEach((b, k) => {
        b.classList.toggle('past', k < i);
        b.classList.toggle('current', k === i);
        if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      $('stepStrip').style.setProperty('--p', STEPS.length > 1 ? i / (STEPS.length - 1) : 0);
      $('stripCount').textContent = `step ${i + 1} of ${STEPS.length}`;
      const sc = $('stripScroll'), b = stripButtons[i];
      if (sc.scrollWidth > sc.clientWidth) sc.scrollLeft = b.parentNode.offsetLeft - sc.clientWidth / 2 + b.offsetWidth / 2;
    }

    /* ---------- Replay ---------- */

    function replay() {
      if (cur < 0) return;
      const k = sceneNow();
      // Reduced motion shows the scene at once; otherwise the step plays again from the previous
      // one (step 1 has no previous scene, so it starts from an empty stage).
      if (reduce || k === cur) { S.replay(k, cur - 1); return; }
      // With an option chosen, replay the change from the step's base scene to that option: the
      // stage, the metrics counting from the base values, and an inline summary card.
      updateMetrics(cur, false);
      updateMetrics(k, true);
      S.inline(cur);
      const end = S.replay(k, cur);
      S.after(Math.max(0, end - 300), () => S.inline(k, true));
    }

    /* ================= Navigation ================= */

    function go(i, opt = {}) {
      if (!alive) return;
      i = clamp(i, 0, STEPS.length - 1);
      if (i !== cur || opt.force) {
        const dir = cur < 0 ? 0 : Math.sign(i - cur);
        cur = i;
        choice = -1;
        S.pause(false);
        renderGuide(i, opt.instant ? 0 : dir);
        $('pane').scrollTop = 0;
        reveal('.try-options');
        updateMetrics(i, !opt.instant);
        renderNav(i);
        renderGoals(i);
        renderStrip(i);
        renderTryHint(i);
        $('tryLive').textContent = '';
        S.text(i);
        S.inline(i);
        S.untrace();
        S.show(i, { instant: !!opt.instant, fit: true });
      }
      if (opts.onMove) opts.onMove(i);
    }

    // The primary buttons may leave the walkthrough (previous or next one, home); keys never do.
    function back() {
      if (cur === 0 && opts.prev) opts.prev.go();
      else go(cur - 1);
    }
    function forward() {
      if (cur < STEPS.length - 1) go(cur + 1);
      else if (opts.end) opts.end.go();
      else go(0);
    }

    // ←/→ step, R replay, Space pause, + and - zoom, F fit, and on a try step 1-5 choose, 0 reset.
    // The shell passes on only keys not typed into a field and not held with Alt, Ctrl or ⌘.
    // Returns true when the key was used.
    function key(e) {
      if (e.key === 'ArrowRight') go(cur + 1);
      else if (e.key === 'ArrowLeft') go(cur - 1);
      else if (e.key === 'r' || e.key === 'R') replay();
      // Space always means pause, even on a focused button (Enter still activates buttons).
      else if (e.key === ' ' || e.key === 'Spacebar') S.pause(!S.paused);
      else if (e.key === '+' || e.key === '=') S.zoom(1);
      else if (e.key === '-' || e.key === '_') S.zoom(-1);
      else if (e.key === 'f' || e.key === 'F') S.fit();
      else if (!/^[0-5]$/.test(e.key) || !tryKey(Number(e.key))) return false;
      return true;
    }

    $('backBtn').addEventListener('click', back);
    $('nextBtn').addEventListener('click', forward);
    $('guide').addEventListener('click', (e) => {
      const b = e.target.closest('[data-try]');
      if (!b) return;
      if (b.dataset.try !== 'reset') { choose(Number(b.dataset.try)); return; }
      resetTry();
      const first = $('guide').querySelector('.try-opt');
      if (first) first.focus({ preventScroll: true });
    });
    const onMotion = (e) => { reduce = e.matches; };
    motionQuery.addEventListener('change', onMotion);

    // Beside the stage, the goals card is given room for its closed size only: the step card's
    // height is worked out as if it were closed, so opening the goals or the sources never takes
    // room from the step; an open list scrolls inside the goals card instead. Its closed height,
    // which changes with the width, is measured whenever both lists are closed.
    let moreWatch = null;
    function watchMore() {
      const more = $('moreCard'), rail = more.parentNode;
      const fit = () => {
        if (more.hidden) rail.style.setProperty('--more', '0px');
        else if (!more.querySelector('details[open]')) rail.style.setProperty('--more', `${more.scrollHeight}px`);
      };
      // A frame later, so the size it sets is not measured again in the same frame.
      moreWatch = new ResizeObserver(() => nextFrame(fit));
      moreWatch.observe(more);
      more.addEventListener('toggle', fit, true);
    }

    function destroy() {
      if (!alive) return;
      alive = false;
      if (moreWatch) moreWatch.disconnect();
      S.destroy();
      life.end();
      uiAnims.length = 0;
      motionQuery.removeEventListener('change', onMotion);
      host.innerHTML = '';
    }

    /* ================= Start ================= */

    renderHeader();
    renderLegend();
    buildMetrics();
    buildSizers();
    buildStrip();
    if (SIDE) watchMore();
    // The stage measures the room it has, so it comes to life once the regions around it are in place.
    S = stage.mount(host, M.picture, { titleOf: (k) => M.titleOf(k, LBL.try), onReplay: replay });
    const start = clamp(Math.floor(Number(opts.start) || 0), 0, STEPS.length - 1);
    // Opening on the first step lets its objects drop in; deep links open settled.
    if (start === 0) go(0);
    else go(start, { instant: true });
    // The pane has its final size only once the page has been laid out.
    nextFrame(() => nextFrame(() => { $('stepStrip').classList.remove('still'); reveal('.try-options'); }));

    return {
      get position() { return cur; },
      go: (i) => go(i),
      key,
      focusTitle: () => $('title').focus({ preventScroll: true }),
      destroy,
    };
  }

  /* ================= Contact sheet ================= */
  // #/<id>/sheet, a review page that the reader's UI does not link to. Every step and every try
  // option as a still at the framing a reader gets on the reference stage, with the results of
  // the automatic checks, so a whole walkthrough can be reviewed from one or two screenshots.

  function mountSheet(host, w, opts) {
    const M = modelOf(w), LBL = opts.labels;
    const { STEPS, SCENES, META, METRICS, tries, picture, checks } = M;
    const CHAPTER_TONE = { setup: 'gray', problem: 'red', technique: 'violet', solution: 'green', insight: 'amber', tradeoff: 'amber', recap: 'paper' };
    const order = STEPS.flatMap((_, i) => [i, ...(tries[i] ? tries[i].options.map((o) => o.scene) : [])]);
    const sources = Array.isArray(w.sources) ? w.sources.filter(isObject) : [];
    const ofKind = (kind) => sources.filter((s) => s.kind === kind).length;
    const optionCount = tries.reduce((n, t) => n + (t ? t.options.length : 0), 0);
    const counts = [plural(STEPS.length, 'step'), plural(optionCount, 'try option'), `sources: ${ofKind('data')} data, ${ofKind('assumption')} assumption`];
    const uncovered = `Not checked automatically: whether the facts and the numbers in the text are right, whether each “${esc(LBL.changes)}” line matches the picture, and how the transitions look. Step through the walkthrough for those.`;

    // Word counts against their budget; a count over budget is flagged.
    const budget = (label, n, max) => (n === null ? `<span>${label} –</span>` : `<span${n > max ? ' class="over"' : ''}>${label} ${n}${n > max ? ` &gt; ${max}` : ''}</span>`);

    function tile(k) {
      const m = META[k], s = STEPS[m.step], t = tries[m.step], opt = m.opt >= 0 ? t.options[m.opt] : null;
      const chapter = s.chapter || 'setup';
      const still = picture.still(k), scene = { title: M.titleOf(k, LBL.try), items: picture.describe(k) };
      const vals = SCENES[k].metrics || {};
      const metrics = METRICS.map((mt) => {
        const v = vals[mt.id];
        return `<span class="tile-metric">${esc(mt.label)} <b>${typeof v === 'number' ? `${fmtNum(v)}${mt.unit ? ` ${esc(mt.unit)}` : ''}` : '—'}</b></span>`;
      }).join('');
      const words = opt
        ? [budget('verdict', M.words.text(opt.verdict.text), 4), budget('why', M.words.text(opt.verdict.why), 20)]
        : (Array.isArray(s.body) ? s.body : []).map((p, j) => (M.isList(p) ? `<span>¶${j + 1} list ${M.words.html(p) ?? '–'}</span>` : budget(`¶${j + 1}`, M.words.html(p), 40)));
      const bubble = picture.bubble(k);
      if (bubble) words.push(budget('bubble', M.words.text(bubble.text), BUBBLE_WORDS));
      let extra = '';
      if (opt) {
        extra = `<p class="tile-opt"><span>${esc(LBL.try)}: <b>${esc(opt.label)}</b></span><span class="badge tone-${opt.verdict.tone}">${esc(opt.verdict.text || '?')}</span></p>`
          + (opt.verdict.why ? `<p class="tile-why">${esc(opt.verdict.why)}</p>` : '');
      } else if (t) {
        extra = `<p class="tile-opt"><span>${esc(LBL.try)}: the base scene, before choosing (${plural(t.options.length, 'option')})</span></p>`;
      }
      return `<li class="tile card${opt ? ' tile-option' : ''}">
  <p class="tile-head"><span class="tile-id">${esc(m.id)}</span><span>·</span><span>${esc(s.short || '')}</span><span>·</span><span class="badge tone-${CHAPTER_TONE[chapter] || 'gray'}">${esc(LBL.chapters[chapter] || chapter)}</span></p>
  <h2 class="tile-title"><a href="#/${encodeURIComponent(w.id)}/${m.step + 1}">${esc(s.title || '')}</a></h2>
  ${extra}
  <svg class="tile-scene st" viewBox="${still.viewBox}" role="img" aria-label="Still of ${esc(scene.title)}" aria-describedby="dio-still-${esc(m.id)}">${still.svg}</svg>
  <div id="dio-still-${esc(m.id)}" class="sr-only"><ul>${scene.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
  ${METRICS.length ? `<p class="tile-metrics">${metrics}</p>` : ''}
  <p class="tile-words">words ${words.join(' ')}</p>
</li>`;
    }

    document.title = opts.docTitle || `${w.title || 'Walkthrough'} · contact sheet`;
    host.innerHTML = `<div class="sheet">
  <svg class="sheet-defs" aria-hidden="true" focusable="false"><defs>${stage.defs()}</defs></svg>
  <header class="wt-head sheet-head"><div>
    <p class="crumb">${opts.crumb ? `${esc(opts.crumb)} · ` : ''}Contact sheet</p>
    <h1 tabindex="-1">${esc(w.title || '')}</h1>
    ${w.question ? `<p class="question">${esc(w.question)}</p>` : ''}
    <p class="sheet-counts">${counts.map(esc).join(' · ')}</p>
  </div></header>
  ${sheetChecks(checks, uncovered)}
  <ol class="sheet-grid" aria-label="Every step and try option">${order.map(tile).join('')}</ol>
</div>`;
    return {
      focusTitle: () => host.querySelector('h1').focus({ preventScroll: true }),
      destroy: () => { host.innerHTML = ''; },
    };
  }

  /* ================= Positions and search ================= */

  // A step story's positions are its steps: 0-based indexes, written 1-based in the address.
  // With loose (a collection), a number past either end means the nearest step.
  function positions(w) {
    const n = w.steps.length;
    return {
      count: n,
      first: 0,
      last: n - 1,
      parse(seg, loose) {
        if (!/^\d+$/.test(seg)) return null;
        const i = Number(seg) - 1;
        if (loose) return clamp(i, 0, n - 1);
        return i >= 0 && i < n ? i : null;
      },
      format: (i) => String(Number(i) + 1),
      label: (i) => `step ${Number(i) + 1}`,
    };
  }

  // Step titles, short labels and marked terms, for the collection's search.
  function search(w) {
    return w.steps.map((s, i) => {
      const html = [].concat(s.body || [], s.callout && s.callout.text ? [s.callout.text] : []).join(' ');
      const terms = [...new Set([...html.matchAll(/<span\s+class=["']term["']\s*>([\s\S]*?)<\/span>/gi)].map((m) => plainText(m[1])))];
      const title = String(s.title || ''), short = String(s.short || '');
      const bubble = isObject(s.scene) && isObject(s.scene.bubble) && typeof s.scene.bubble.text === 'string' ? s.scene.bubble.text : '';
      return { at: i, title, sub: terms.join(' · '), text: `${title} ${short} ${terms.join(' ')} ${bubble}` };
    });
  }

  return {
    labels: LABELS,
    unusable,
    prepare: (w) => { modelOf(w); },
    checks: (w) => modelOf(w).checks,
    positions,
    mount,
    mountSheet,
    search,
  };
});
