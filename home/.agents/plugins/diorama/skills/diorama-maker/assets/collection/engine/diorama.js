/*
 * Diorama engine: draws a walkthrough on an illustrated isometric stage, and presents a
 * collection of walkthroughs behind one shell page.
 *
 * Public API (one global):
 *   Diorama.collection(obj)        collection.js registers the outline
 *   Diorama.walkthrough(obj)       walkthroughs/<id>.js registers one walkthrough
 *   Diorama.startCollection()      index.html starts the collection shell
 *   Diorama.startSingle(obj)       the single-file page starts one walkthrough
 *
 * No dependencies, no network, works from file://. The data formats are described in the
 * diorama-maker skill: references/walkthrough-schema.md and references/collection.md.
 */
(() => {
  'use strict';

  const VERSION = '0.1.0';
  const NS = 'http://www.w3.org/2000/svg';
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const phoneQuery = matchMedia('(max-width: 600px)');
  const warn = (m) => console.warn(`[diorama] ${m}`);
  const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const validated = new WeakSet();   // walkthrough objects already checked, so warnings print once

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
  const hash2 = (i, j) => { const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return s - Math.floor(s); };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  function svgEl(tag, attrs = {}, parent = null) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  // Text widths for layout come from a canvas using the same font stack as the SVG text.
  // The context is created on first use, after the stylesheet that defines --mono has loaded.
  let measureCtx = null, MONO = 'monospace';
  const widthCache = new Map();
  function textW(text, size, weight = 700) {
    const key = `${weight}|${size}|${text}`;
    let w = widthCache.get(key);
    if (w === undefined) {
      if (!measureCtx) {
        measureCtx = document.createElement('canvas').getContext('2d');
        MONO = getComputedStyle(document.documentElement).getPropertyValue('--mono').trim() || 'monospace';
      }
      measureCtx.font = `${weight} ${size}px ${MONO}`;
      w = measureCtx.measureText(String(text)).width;
      widthCache.set(key, w);
    }
    return w;
  }

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
  };
  const FALLBACK_GLYPH = '<circle cx="12" cy="12" r="2.8" class="gl-dot"/>';

  function glyph(name, cx, cy, size = 24, sw = 1.9) {
    const k = size / 24;
    return `<g class="gl" transform="translate(${n1(cx - 12 * k)} ${n1(cy - 12 * k)}) scale(${n2(k)})" stroke-width="${n2(sw)}">${GLYPH[name] || FALLBACK_GLYPH}</g>`;
  }
  function iconHtml(name) {
    return `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${GLYPH[name] || FALLBACK_GLYPH}</svg>`;
  }

  /* ================= Geometry ================= */

  // Isometric floor: one grid unit is 14 px across and 7 px down (a 2:1 tile); z is in px.
  const TILE = 14;
  const P = (x, y, z = 0) => [TILE * (x + y), TILE / 2 * (x - y) - z];
  const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const pt = (q) => `${n1(q[0])} ${n1(q[1])}`;

  function roundPoly(pts, radii) {
    const n = pts.length;
    let d = '';
    for (let i = 0; i < n; i++) {
      const p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
      const la = dist(p, a), lb = dist(p, b);
      const r = Math.min(Array.isArray(radii) ? radii[i] : radii, la / 2, lb / 2);
      const p1 = la ? [p[0] + (a[0] - p[0]) * r / la, p[1] + (a[1] - p[1]) * r / la] : p;
      const p2 = lb ? [p[0] + (b[0] - p[0]) * r / lb, p[1] + (b[1] - p[1]) * r / lb] : p;
      d += `${i ? 'L' : 'M'}${pt(p1)}Q${pt(p)} ${pt(p2)}`;
    }
    return d + 'Z';
  }

  function roundLine(pts, r) {
    let d = `M${pt(pts[0])}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i], a = pts[i - 1], b = pts[i + 1];
      const la = dist(p, a), lb = dist(p, b);
      if (la < .01 || lb < .01) continue;
      const rr = Math.min(r, la / 2, lb / 2);
      d += `L${pt([p[0] + (a[0] - p[0]) * rr / la, p[1] + (a[1] - p[1]) * rr / la])}Q${pt(p)} ${pt([p[0] + (b[0] - p[0]) * rr / lb, p[1] + (b[1] - p[1]) * rr / lb])}`;
    }
    return d + `L${pt(pts[pts.length - 1])}`;
  }

  function polyLen(pts) {
    let l = 0;
    for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i]);
    return l;
  }

  function pointAt(pts, s) {
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], l = dist(a, b);
      if (s <= l || i === pts.length - 1) {
        const t = l ? clamp(s / l, 0, 1) : 0;
        return { p: [lerp(a[0], b[0], t), lerp(a[1], b[1], t)], dir: l ? [(b[0] - a[0]) / l, (b[1] - a[1]) / l] : [1, 0] };
      }
      s -= l;
    }
    return { p: pts[0], dir: [1, 0] };
  }

  function trimPts(pts, s0, s1) {
    const out = [pointAt(pts, s0).p];
    let acc = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      acc += dist(pts[i - 1], pts[i]);
      if (acc > s0 && acc < s1) out.push(pts[i]);
    }
    out.push(pointAt(pts, s1).p);
    return out;
  }

  function convexHull(points) {
    const p = points.map((q) => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (p.length < 3) return p;
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower = [], upper = [];
    for (const q of p) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
    return lower.slice(0, -1).concat(upper.slice(0, -1));
  }

  function bboxOf(points) {
    const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    for (const q of points) { b.x0 = Math.min(b.x0, q[0]); b.y0 = Math.min(b.y0, q[1]); b.x1 = Math.max(b.x1, q[0]); b.y1 = Math.max(b.y1, q[1]); }
    return b;
  }
  const boxAt = (cx, cy, w, h) => ({ x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 + 2 });
  const inflate = (b, d) => ({ x0: b.x0 - d, y0: b.y0 - d, x1: b.x1 + d, y1: b.y1 + d });
  const boxCorners = (b) => [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]];
  const overlapArea = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  const inBox = (q, b) => q[0] > b.x0 && q[0] < b.x1 && q[1] > b.y0 && q[1] < b.y1;

  function pointInPoly(q, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < (b[0] - a[0]) * (q[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  }

  // Separating-axis test between a convex polygon and an axis-aligned box.
  function polyBoxOverlap(poly, b) {
    const rect = boxCorners(b);
    const axes = [[1, 0], [0, 1]];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], c = poly[(i + 1) % poly.length];
      axes.push([a[1] - c[1], c[0] - a[0]]);
    }
    for (const ax of axes) {
      let p0 = Infinity, p1 = -Infinity, r0 = Infinity, r1 = -Infinity;
      for (const q of poly) { const d = q[0] * ax[0] + q[1] * ax[1]; p0 = Math.min(p0, d); p1 = Math.max(p1, d); }
      for (const q of rect) { const d = q[0] * ax[0] + q[1] * ax[1]; r0 = Math.min(r0, d); r1 = Math.max(r1, d); }
      if (p1 <= r0 || r1 <= p0) return false;
    }
    return true;
  }

  /* ================= Palette and SVG defs ================= */

  const COLORS = ['blue', 'orange', 'yellow', 'green', 'violet', 'gray'];
  const TONES = ['paper', 'green', 'amber', 'red', 'violet', 'gray'];
  const KINDS = ['request', 'response', 'heavy', 'signal', 'write', 'message'];
  const STYLES = ['solid', 'dashed', 'off', 'cut', 'beat'];
  const colorOf = (c) => (COLORS.includes(c) ? c : 'gray');
  const toneOf = (t) => (TONES.includes(t) ? t : 'paper');

  // Gradients, blurs and the floor grid. Ids are global, which is safe because only one
  // stage exists at a time.
  function defsMarkup() {
    let s = '';
    for (const c of COLORS) {
      s += `<linearGradient id="g-${c}-top" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" style="stop-color:var(--${c}-t1)"/><stop offset="1" style="stop-color:var(--${c}-t2)"/></linearGradient>`;
      s += `<linearGradient id="g-${c}-side" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--${c}-s1)"/><stop offset="1" style="stop-color:var(--${c}-s2)"/></linearGradient>`;
    }
    s += '<linearGradient id="g-lid-side" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--lid-3)"/><stop offset="1" style="stop-color:var(--lid-2)"/></linearGradient>';
    s += '<linearGradient id="g-lid-top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--lid-1)"/><stop offset="1" style="stop-color:var(--lid-3)"/></linearGradient>';
    s += '<linearGradient id="g-hero" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--hero-1)"/><stop offset="1" style="stop-color:var(--hero-2)"/></linearGradient>';
    s += '<linearGradient id="g-cyl-sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".3" stop-color="#fff" stop-opacity=".38"/><stop offset=".62" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".07"/></linearGradient>';
    s += '<linearGradient id="g-glare" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>';
    const blur = (id, sd) => `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
    s += blur('blur-sm', 2.2) + blur('blur-md', 4) + blur('blur-lg', 6.5) + blur('blur-glow', 9);
    s += '<pattern id="iso-grid" width="28" height="14" y="-7" patternUnits="userSpaceOnUse"><path class="grid-lines" d="M0 7L14 0L28 7L14 14Z"/></pattern>';
    s += '<radialGradient id="grid-fade" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="400" gradientTransform="scale(1 .6)"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".42" stop-color="#fff" stop-opacity=".92"/><stop offset=".78" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>';
    s += '<mask id="grid-mask" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000"><rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#grid-fade)"/></mask>';
    return s;
  }

  /* ================= Pills ================= */

  const PILL_H = 21;
  const STACK_GAP = 26;

  function pillSize(spec) {
    let w = 0;
    for (const l of spec.lines) w = Math.max(w, textW(l.t, l.size, l.w));
    let h = PILL_H;
    for (let i = 1; i < spec.lines.length; i++) h += Math.round(1.3 * spec.lines[i].size);
    return [Math.ceil(w + 18 + (spec.icon ? 15 : 0)), h];
  }

  function pillSvg(cx, cy, spec, alpha = 1) {
    if (alpha <= .01) return '';
    const [w, h] = pillSize(spec);
    const x = cx - w / 2, y = cy - h / 2;
    const tx = cx + (spec.icon ? 7.5 : 0);
    let s = `<g class="pill tone-${toneOf(spec.tone)}"${alpha < .99 ? ` opacity="${n2(alpha)}"` : ''}>`;
    s += `<rect class="pill-drop" x="${n1(x)}" y="${n1(y + 2)}" width="${w}" height="${h}" rx="10.5"/>`;
    s += `<rect class="pill-bg" x="${n1(x)}" y="${n1(y)}" width="${w}" height="${h}" rx="10.5"/>`;
    if (spec.icon) s += glyph(spec.icon, x + 15, cy, 12, 2.2);
    let by = y + 10.5 + spec.lines[0].size * .36;
    spec.lines.forEach((l, i) => {
      if (i) by += Math.round(1.3 * l.size);
      s += `<text class="${l.cls || 'pill-t'}" x="${n1(tx)}" y="${n1(by)}" style="font-size:${l.size}px;font-weight:${l.w}">${esc(l.t)}</text>`;
    });
    return s + '</g>';
  }

  const GAUGE_W = 86;
  const loadTone = (v) => (v < .6 ? 'green' : v < .85 ? 'amber' : 'red');

  function gaugeSvg(cx, cy, v, alpha = 1) {
    if (alpha <= .01) return '';
    v = clamp(v, 0, 1);
    const w = GAUGE_W, h = PILL_H, x = cx - w / 2, y = cy - h / 2;
    let s = `<g class="pill tone-paper"${alpha < .99 ? ` opacity="${n2(alpha)}"` : ''}>`;
    s += `<rect class="pill-drop" x="${n1(x)}" y="${n1(y + 2)}" width="${w}" height="${h}" rx="10.5"/>`;
    s += `<rect class="pill-bg" x="${n1(x)}" y="${n1(y)}" width="${w}" height="${h}" rx="10.5"/>`;
    s += glyph('gauge', x + 14, cy, 12, 2.2);
    s += `<rect class="g-track" x="${n1(x + 24)}" y="${n1(cy - 3.5)}" width="28" height="7" rx="3.5"/>`;
    if (v > .005) s += `<rect class="g-${loadTone(v)}" x="${n1(x + 24)}" y="${n1(cy - 3.5)}" width="${n1(Math.max(7, 28 * v))}" height="7" rx="3.5"/>`;
    s += `<text class="pill-n" x="${n1(x + w - 9)}" y="${n1(cy + 3.8)}">${Math.round(v * 100)}%</text>`;
    return s + '</g>';
  }

  const tagSpec = (t) => ({ lines: [{ t: String(t.text ?? ''), size: 10.5, w: 700 }], tone: t.tone, icon: t.icon });

  function labelSpec(n, t) {
    if (!t.label && !t.sub) return null;
    const lines = [];
    if (t.label) lines.push({ t: t.label, size: 10.5, w: 700 });
    if (t.sub) lines.push({ t: t.sub, size: 9, w: 600, cls: lines.length ? 'pill-s' : 'pill-t' });
    const icon = n.glyph || { actor: 'user', crowd: 'users', queue: 'queue', db: 'database' }[n.type]
      || (n.type === 'device' ? { reader: 'card', phone: 'phone' }[n.form] || 'laptop' : null);
    return { lines, tone: 'paper', icon };
  }

  /* ================= Entity drawing ================= */
  // Each draw function returns parts at the entity's current lift:
  // { shadow, body, outline, deco, wash (path d), hull (convex polygon), anchor (first pill centre),
  //   crossAt, floor (zones only) }.

  function prism(o) {
    const lift = o.lift || 0, zb = (o.z0 || 0) + lift, zt = zb + o.h;
    const { x0, x1, y0, y1 } = o;
    const T = P(x0, y1, zt), R = P(x1, y1, zt), B = P(x1, y0, zt), L = P(x0, y0, zt);
    const Rd = P(x1, y1, zb), Bd = P(x1, y0, zb), Ld = P(x0, y0, zb);
    const p = Math.max(0, Math.min(o.r ?? 9, o.h / 2 - .5));
    const rc = o.rc ?? 10;
    const silPts = [T, R, Rd, Bd, Ld, L];
    const silR = [rc, p, p, rc + 2, p, p];
    const sil = roundPoly(silPts, silR);
    const topPts = [T, R, B, L];
    const sideFill = o.side || `url(#g-${o.c}-side)`, topFill = o.top || `url(#g-${o.c}-top)`;
    let shadow = '';
    if (o.shadow !== false) {
      // The contact shadow stays on the floor; while the body is lifted it spreads and fades.
      const off = Math.min(9, 3 + .15 * o.h), up = Math.max(0, lift), k = 1 + up / 300;
      const cx = (L[0] + R[0]) / 2, cy = (T[1] + Bd[1]) / 2 + lift + off;
      const sp = silPts.map((q) => [cx + (q[0] - cx) * k, cy + (q[1] + lift + off - cy) * k]);
      shadow = `<path class="sh" filter="url(#blur-lg)" opacity="${n2(.26 * (1 - Math.min(1, up / 140) * .85))}" d="${roundPoly(sp, silR)}"/>`;
    }
    let body = `<path d="${sil}" style="fill:${sideFill}"/>`;
    body += `<path class="rf" d="${roundPoly([B, R, Rd, Bd], [Math.min(6, p), p, p, rc + 2])}"/>`;
    body += `<path d="${roundPoly(topPts, [rc, p, Math.min(6, p), p])}" style="fill:${topFill}"/>`;
    if (o.sheen !== false) {
      const c = [(T[0] + B[0]) / 2, (T[1] + B[1]) / 2 - 3];
      const sp = topPts.map((q) => [q[0] + (c[0] - q[0]) * .25, q[1] - 3 + (c[1] - q[1] + 3) * .25]);
      body += `<path class="sheen" filter="url(#blur-sm)" d="${roundPoly(sp, 8)}"/>`;
    }
    if (o.bevel !== false) {
      const along = (a, b, d) => { const l = dist(a, b) || 1; return [a[0] + (b[0] - a[0]) * d / l, a[1] + (b[1] - a[1]) * d / l]; };
      const edge = [along(L, B, p), B, along(R, B, p)];
      const down = (dy) => edge.map((q) => [q[0], q[1] + dy]);
      body += `<path class="bev dk" d="${roundLine(down(3.4), 6)}"/><path class="bev lt" d="${roundLine(down(1.4), 6)}"/>`;
    }
    const outline = `<path class="ol" d="${sil}"${o.sw ? ` style="stroke-width:${o.sw}"` : ''}/>`;
    return { shadow, body, outline, sil, T, R, B, L, Rd, Bd, Ld, hull: silPts, topC: P((x0 + x1) / 2, (y0 + y1) / 2, zt) };
  }

  function faceLabel(cx, cy, t, maxW) {
    if (t.a <= .01 || (!t.label && !t.sub)) return '';
    let size = 13.5;
    while (size > 11.5 && textW(t.label, size, 800) > maxW) size -= .5;
    let lines = [t.label];
    if (textW(t.label, size, 800) > maxW && t.label.includes(' ')) {
      const words = t.label.split(' ');
      let best = null;
      for (let i = 1; i < words.length; i++) {
        const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
        const w = Math.max(textW(a, size, 800), textW(b, size, 800));
        if (!best || w < best.w) best = { w, lines: [a, b] };
      }
      lines = best.lines;
    }
    const rows = lines.filter(Boolean).map((l) => ({ t: l, size, cls: 'face-t', w: 800 }));
    if (t.sub) rows.push({ t: t.sub, size: rows.length ? 10 : 12, cls: 'face-s', w: 600 });
    const lh = (r) => r.size * 1.2;
    let y = cy - rows.reduce((a, r) => a + lh(r), 0) / 2;
    let s = `<g class="deco"${t.a < .99 ? ` opacity="${n2(t.a)}"` : ''}>`;
    for (const r of rows) {
      s += `<text class="${r.cls}" x="${n1(cx)}" y="${n1(y + r.size * .92)}" style="font-size:${r.size}px">${esc(r.t)}</text>`;
      y += lh(r);
    }
    return s + '</g>';
  }

  function crossMark(c, a = 1) {
    const d = `M${n1(c[0] - 8)} ${n1(c[1] - 8)}L${n1(c[0] + 8)} ${n1(c[1] + 8)}M${n1(c[0] + 8)} ${n1(c[1] - 8)}L${n1(c[0] - 8)} ${n1(c[1] + 8)}`;
    return `<g class="deco" opacity="${n2(a)}"><path class="xhalo" d="${d}"/><path class="xmark" d="${d}"/></g>`;
  }

  function drawBlock(e, n, p) {
    const s = n.size || 4, h = n.height || 46;
    const pr = prism({ x0: n.x - s / 2, x1: n.x + s / 2, y0: n.y - s / 2, y1: n.y + s / 2, h, c: colorOf(n.color), lift: p.lift });
    const k = s >= 6 ? 1.15 : s < 3.5 ? .8 : 1;
    let deco = '';
    if (p.dead < .99) deco += `<g class="deco"${p.dead > .01 ? ` opacity="${n2(1 - p.dead)}"` : ''}>${glyph(n.glyph || 'server', pr.topC[0], pr.topC[1], 24 * k)}</g>`;
    const ly = pr.topC[1] + (7 * s + h) * .4;
    for (const t of p.texts) deco += faceLabel(pr.topC[0], ly, t, 28 * s * .86);
    return { shadow: pr.shadow, body: pr.body, outline: pr.outline, deco, wash: pr.sil, hull: pr.hull, crossAt: pr.topC };
  }

  function cylinderPath(cx, ty, by, rx, ry) {
    return `M${n1(cx - rx)} ${n1(ty)}L${n1(cx - rx)} ${n1(by)}A${n1(rx)} ${n1(ry)} 0 0 0 ${n1(cx + rx)} ${n1(by)}L${n1(cx + rx)} ${n1(ty)}A${n1(rx)} ${n1(ry)} 0 0 0 ${n1(cx - rx)} ${n1(ty)}Z`;
  }
  function ellipsePts(cx, cy, rx, ry, k = 12) {
    const out = [];
    for (let i = 0; i < k; i++) { const a = i / k * Math.PI * 2; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
    return out;
  }

  function drawDb(e, n, p) {
    const rx = Math.SQRT2 * TILE * 1.7, ry = rx / 2, h = n.height || 38;
    const [cx, cy] = P(n.x, n.y);
    const by = cy - p.lift, ty = by - h, up = Math.max(0, p.lift), c = colorOf(n.color);
    const shadow = `<ellipse class="sh" filter="url(#blur-md)" cx="${n1(cx + 4)}" cy="${n1(cy + 5)}" rx="${n1(rx * 1.05 * (1 + up / 300))}" ry="${n1(ry * 1.05 * (1 + up / 300))}" opacity="${n2(.3 * (1 - Math.min(1, up / 140) * .85))}"/>`;
    const sil = cylinderPath(cx, ty, by, rx, ry);
    let body = `<path d="${sil}" style="fill:url(#g-${c}-side)"/>`;
    const load = clamp(p.load || 0, 0, 1);
    if (load > .005) {
      const lv = by - h * load, tone = loadTone(load);
      body += `<path class="liq-${tone}" d="M${n1(cx - rx)} ${n1(lv)}L${n1(cx - rx)} ${n1(by)}A${n1(rx)} ${n1(ry)} 0 0 0 ${n1(cx + rx)} ${n1(by)}L${n1(cx + rx)} ${n1(lv)}A${n1(rx)} ${n1(ry)} 0 0 1 ${n1(cx - rx)} ${n1(lv)}Z"/>`;
      body += `<path class="men-${tone}" d="M${n1(cx + rx - 1)} ${n1(lv)}A${n1(rx - 1)} ${n1(ry - .5)} 0 0 1 ${n1(cx - rx + 1)} ${n1(lv)}"/>`;
    }
    body += `<path d="${sil}" fill="url(#g-cyl-sheen)"/>`;
    body += `<ellipse cx="${n1(cx)}" cy="${n1(ty)}" rx="${n1(rx)}" ry="${n1(ry)}" style="fill:url(#g-${c}-top)"/>`;
    body += `<path class="rim" d="M${n1(cx - rx + 5)} ${n1(ty)}A${n1(rx - 5)} ${n1(ry - 2.5)} 0 0 0 ${n1(cx + rx - 5)} ${n1(ty)}"/>`;
    const outline = `<path class="ol" d="${sil}"/><ellipse class="ol-thin" cx="${n1(cx)}" cy="${n1(ty)}" rx="${n1(rx)}" ry="${n1(ry)}"/>`;
    let deco = '';
    if (p.dead < .99) deco += `<g class="deco"${p.dead > .01 ? ` opacity="${n2(1 - p.dead)}"` : ''}>${glyph(n.glyph || 'database', cx, by - h / 2 + ry * .55, 19)}</g>`;
    const hull = convexHull(ellipsePts(cx, ty, rx, ry).concat(ellipsePts(cx, by, rx, ry)));
    return { shadow, body, outline, deco, wash: sil + `M${n1(cx - rx)} ${n1(ty)}A${n1(rx)} ${n1(ry)} 0 0 0 ${n1(cx + rx)} ${n1(ty)}A${n1(rx)} ${n1(ry)} 0 0 0 ${n1(cx - rx)} ${n1(ty)}Z`, hull, crossAt: [cx, by - h / 2 + ry * .5] };
  }

  function disc(cx, cy, rx, ry, t, lift, c) {
    const by = cy - lift, ty = by - t, up = Math.max(0, lift);
    const sil = cylinderPath(cx, ty, by, rx, ry);
    return {
      shadow: `<ellipse class="sh" filter="url(#blur-md)" cx="${n1(cx + 3)}" cy="${n1(cy + 4)}" rx="${n1(rx * (1 + up / 300))}" ry="${n1(ry * (1 + up / 300))}" opacity="${n2(.28 * (1 - Math.min(1, up / 140) * .85))}"/>`,
      body: `<path d="${sil}" style="fill:url(#g-${c}-side)"/><ellipse cx="${n1(cx)}" cy="${n1(ty)}" rx="${n1(rx)}" ry="${n1(ry)}" style="fill:url(#g-${c}-top)"/>`
        + `<path class="rim" d="M${n1(cx - rx + 4)} ${n1(ty)}A${n1(rx - 4)} ${n1(ry - 2)} 0 0 0 ${n1(cx + rx - 4)} ${n1(ty)}"/>`,
      outline: `<path class="ol" d="${sil}"/><ellipse class="ol-thin" cx="${n1(cx)}" cy="${n1(ty)}" rx="${n1(rx)}" ry="${n1(ry)}"/>`,
      sil, top: [cx, ty], hull: ellipsePts(cx, ty, rx, ry).concat(ellipsePts(cx, by, rx, ry)),
    };
  }

  // A pawn stands with its feet at (x, y); k scales it; strokes stay ~1.6 px on screen.
  function pawn(x, y, k, fill, alpha = 1) {
    if (alpha <= .01) return '';
    const sw = n2(1.6 / k);
    return `<g transform="translate(${n1(x)} ${n1(y)}) scale(${n2(k)})"${alpha < .99 ? ` opacity="${n2(alpha)}"` : ''}>`
      + '<ellipse class="pawn-sh" cx="1.4" cy=".8" rx="5.6" ry="2.4"/>'
      + `<path class="pawn-b" style="fill:${fill};stroke-width:${sw}" d="M-4.4 0V-7.6a4.4 4.4 0 0 1 8.8 0V0a1.4 1.4 0 0 1-1.4 1.4h-6A1.4 1.4 0 0 1-4.4 0z"/>`
      + `<circle class="pawn-h" cy="-16.4" r="4.3" style="stroke-width:${sw}"/></g>`;
  }
  const pawnFill = (c) => `var(--pawn-${colorOf(c)})`;

  function drawActor(e, n, p) {
    const [cx, cy] = P(n.x, n.y);
    const rx = Math.SQRT2 * TILE * 1.45, ry = rx / 2;
    const d = disc(cx, cy, rx, ry, 7, p.lift, 'gray');
    const k = 2.1, feet = d.top;
    const body = d.body + d.outline + pawn(feet[0], feet[1] + 2, k, pawnFill(n.color));
    const headTop = feet[1] + 2 - (16.4 + 4.3) * k;
    const hull = convexHull(d.hull.concat([[cx - 10.5, headTop + 4], [cx + 10.5, headTop + 4], [cx, headTop]]));
    return { shadow: d.shadow, body, outline: '', deco: '', wash: d.sil + `M${n1(cx - 9.2)} ${n1(feet[1])}V${n1(headTop + 10)}A9.2 9.2 0 0 1 ${n1(cx + 9.2)} ${n1(headTop + 10)}V${n1(feet[1])}Z`, hull, crossAt: [cx, headTop + 16] };
  }

  const CROWD = { rows: 4, cols: 6, sp: 1.75 };
  const PAWN_ORDER = ['blue', 'orange', 'green', 'violet', 'yellow'];
  function crowdSlots(n) {
    const slots = [];
    for (let i = 0; i < CROWD.rows; i++) {
      for (let j = 0; j < CROWD.cols; j++) {
        const di = i - (CROWD.rows - 1) / 2, dj = j - (CROWD.cols - 1) / 2;
        slots.push({ x: n.x + di * CROWD.sp, y: n.y + dj * CROWD.sp, key: Math.hypot(di, dj * .8) + hash2(i, j) * .9, color: PAWN_ORDER[Math.floor(hash2(j + 3, i + 7) * 5)] });
      }
    }
    return slots.sort((a, b) => a.key - b.key);
  }

  function drawCrowd(e, n, p) {
    const hx = CROWD.rows * CROWD.sp / 2 + .7, hy = CROWD.cols * CROWD.sp / 2 + .7, h = 10;
    const pr = prism({ x0: n.x - hx, x1: n.x + hx, y0: n.y - hy, y1: n.y + hy, h, c: 'gray', lift: p.lift, rc: 12, r: 4 });
    const slots = e.slots || (e.slots = crowdSlots(n));
    const shown = clamp(p.count || 0, 0, slots.length), full = Math.floor(shown), frac = shown - full;
    const drawn = [];
    for (let i = 0; i < Math.ceil(shown); i++) drawn.push({ ...slots[i], a: i < full ? 1 : frac });
    drawn.sort((a, b) => (a.x - a.y) - (b.x - b.y));
    let people = '';
    for (const s of drawn) {
      const q = P(s.x, s.y, h + p.lift);
      people += pawn(q[0], q[1] + 1 + (1 - s.a) * 6, 1.3 * (.6 + .4 * s.a), pawnFill(s.color), s.a);
    }
    const hull = convexHull(pr.hull.concat(pr.hull.map((q) => [q[0], q[1] - 28])));
    return { shadow: pr.shadow, body: pr.body, outline: pr.outline, deco: people, wash: pr.sil, hull, crossAt: pr.topC };
  }

  function drawQueue(e, n, p) {
    const sp = 1.3, cap = e.cap || 4, len = cap * sp + 1;
    const pr = prism({ x0: n.x - len / 2, x1: n.x + len / 2, y0: n.y - .9, y1: n.y + .9, h: 5, c: 'gray', lift: p.lift, rc: 6, r: 2, sheen: false });
    const count = clamp(p.count || 0, 0, cap), full = Math.floor(count), frac = count - full;
    let deco = '';
    for (let k = 0; k < Math.ceil(count); k++) {
      const a = k < full ? 1 : frac, sc = .5 + .5 * a;
      const q = P(n.x - len / 2 + .5 + sp * (k + .5), n.y, 5 + p.lift);
      const rx = 7 * sc, ry = 3.5 * sc, hh = 5 * sc, by = q[1] + (1 - a) * 8;
      deco += `<g opacity="${n2(a)}"><path class="puck" d="${cylinderPath(q[0], by - hh, by, rx, ry)}"/><ellipse class="puck" cx="${n1(q[0])}" cy="${n1(by - hh)}" rx="${n1(rx)}" ry="${n1(ry)}"/><ellipse class="puck-top" cx="${n1(q[0] - 1)}" cy="${n1(by - hh - .6)}" rx="${n1(rx * .5)}" ry="${n1(ry * .4)}"/></g>`;
    }
    const hull = convexHull(pr.hull.concat(pr.hull.map((q) => [q[0], q[1] - 12])));
    return { shadow: pr.shadow, body: pr.body, outline: pr.outline, deco, wash: pr.sil, hull, crossAt: pr.topC };
  }

  function drawZone(e, n, p) {
    const w = n.w || 8, h = n.h || 6;
    const x0 = n.x - w / 2, x1 = n.x + w / 2, y0 = n.y - h / 2, y1 = n.y + h / 2;
    const corners = [P(x0, y1), P(x1, y1), P(x1, y0), P(x0, y0)];
    let s = `<path class="zone" d="${roundPoly(corners, 8)}"/>`;
    for (const t of p.texts) {
      if (!t.label || t.a <= .01) continue;
      const o = P(x0 + 1.2, y1 - .5);
      // The floor matrix lays text flat on the grid, reading along +x.
      s += `<text class="zone-t" transform="matrix(1 .5 -1 .5 ${n1(o[0])} ${n1(o[1])})"${t.a < .99 ? ` opacity="${n2(t.a)}"` : ''}>${esc(String(t.label).toUpperCase())}</text>`;
    }
    return { floor: s, extent: corners, hull: null };
  }

  function drawLaptop(e, n, p) {
    const base = prism({ x0: n.x - 1.9, x1: n.x + 1.9, y0: n.y - 1.9, y1: n.y + 1.9, h: 8, c: 'gray', lift: p.lift, rc: 8, r: 3 });
    const deck = prism({ x0: n.x - 1.05, x1: n.x + 1.35, y0: n.y - 1.3, y1: n.y + 1.3, z0: 8, h: 3, c: 'gray', lift: p.lift, rc: 3, r: 1, shadow: false, sheen: false, bevel: false, sw: 1.3 });
    const lid = prism({ x0: n.x - 1.32, x1: n.x - 1.08, y0: n.y - 1.3, y1: n.y + 1.3, z0: 9, h: 40, side: 'url(#g-lid-side)', top: 'url(#g-lid-top)', lift: p.lift, rc: 2, r: 2, shadow: false, sheen: false, bevel: false, sw: 1.5 });
    let keys = '';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        const gx = n.x - .82 + r * .32, gy = n.y - .9 + c * .4;
        keys += `<path class="key" d="M${pt(P(gx, gy + .14, 11 + p.lift))}L${pt(P(gx + .22, gy + .14, 11 + p.lift))}L${pt(P(gx + .22, gy - .14, 11 + p.lift))}L${pt(P(gx, gy - .14, 11 + p.lift))}Z"/>`;
      }
    }
    keys += `<path class="key" d="M${pt(P(n.x + .55, n.y + .45, 11 + p.lift))}L${pt(P(n.x + 1.15, n.y + .45, 11 + p.lift))}L${pt(P(n.x + 1.15, n.y - .45, 11 + p.lift))}L${pt(P(n.x + .55, n.y - .45, 11 + p.lift))}Z"/>`;
    // Screen on the lid face that looks toward +x; matrix(1 -.5 0 1) maps a flat page onto it.
    const o = P(n.x - 1.08, n.y - 1.3, 49 + p.lift), fw = 2.6 * TILE;
    const scr = `<g class="deco" transform="matrix(1 -.5 0 1 ${n1(o[0])} ${n1(o[1])})">`
      + `<rect class="scr" x="2.5" y="2.5" width="${n1(fw - 5)}" height="33" rx="2"/>`
      + '<circle cx="6" cy="6.2" r="1.1" fill="#e5675c"/><circle cx="9.4" cy="6.2" r="1.1" fill="#efb246"/><circle cx="12.8" cy="6.2" r="1.1" fill="#6dbb63"/>'
      + `<rect class="scr-line" x="16" y="5" width="${n1(fw - 21)}" height="2.6" rx="1.3"/>`
      + `<rect x="5" y="10" width="${n1(fw - 10)}" height="12" rx="1.6" fill="url(#g-hero)"/>`
      + `<rect class="scr-line" x="5" y="25" width="${n1(fw * .55)}" height="2.2" rx="1.1"/><rect class="scr-line" x="5" y="29.5" width="${n1(fw * .35)}" height="2.2" rx="1.1"/>`
      + `<path d="M2.5 2.5h${n1(fw * .5)}L2.5 26z" fill="url(#g-glare)"/></g>`;
    const body = base.body + base.outline + deck.body + deck.outline + keys + lid.body + scr + lid.outline;
    return { shadow: base.shadow, body, outline: '', deco: '', wash: base.sil + lid.sil, hull: convexHull(base.hull.concat(lid.hull)), crossAt: P(n.x - 1.1, n.y, 30 + p.lift) };
  }

  function drawPhone(e, n, p) {
    const base = prism({ x0: n.x - 1.3, x1: n.x + 1.3, y0: n.y - 1.3, y1: n.y + 1.3, h: 6, c: 'gray', lift: p.lift, rc: 8, r: 2.5 });
    const set = prism({ x0: n.x - .3, x1: n.x + .05, y0: n.y - .8, y1: n.y + .8, z0: 6, h: 44, side: 'url(#g-lid-side)', top: 'url(#g-lid-top)', lift: p.lift, rc: 3, r: 3, shadow: false, sheen: false, bevel: false, sw: 1.5 });
    const o = P(n.x + .05, n.y - .8, 50 + p.lift), fw = 1.6 * TILE;
    const scr = `<g class="deco" transform="matrix(1 -.5 0 1 ${n1(o[0])} ${n1(o[1])})">`
      + `<rect class="scr" x="2" y="3" width="${n1(fw - 4)}" height="37" rx="2.5"/>`
      + '<rect x="4" y="8" width="11" height="6" rx="2.5" fill="url(#g-hero)"/>'
      + `<rect class="scr-line" x="${n1(fw - 15)}" y="17" width="11" height="6" rx="2.5"/>`
      + '<rect x="4" y="26" width="13" height="6" rx="2.5" fill="url(#g-hero)"/></g>';
    const body = base.body + base.outline + set.body + scr + set.outline;
    return { shadow: base.shadow, body, outline: '', deco: '', wash: base.sil + set.sil, hull: convexHull(base.hull.concat(set.hull)), crossAt: P(n.x, n.y, 28 + p.lift) };
  }

  function drawReader(e, n, p) {
    const wall = prism({ x0: n.x - 1.6, x1: n.x + 1.6, y0: n.y + .15, y1: n.y + .65, h: 74, c: 'gray', lift: p.lift, rc: 6, r: 4 });
    const unit = prism({ x0: n.x - .9, x1: n.x + .9, y0: n.y - .3, y1: n.y + .15, z0: 18, h: 40, c: colorOf(n.color), lift: p.lift, rc: 5, r: 4, shadow: false, sheen: false });
    // Reader face toward -y (down-left on screen); matrix(1 .5 0 1) maps a flat page onto it.
    const o = unit.L;
    const face = `<g class="deco" transform="matrix(1 .5 0 1 ${n1(o[0])} ${n1(o[1])})">`
      + '<rect class="scr-glass" x="4" y="5" width="17.2" height="9" rx="2"/><rect class="led" x="6.5" y="8.2" width="6" height="2.6" rx="1.3"/>'
      + '<path class="gl" stroke-width="1.4" d="M9.5 22.5a4 4 0 0 1 0 6M12.5 20a7.5 7.5 0 0 1 0 11M15.5 17.5a11 11 0 0 1 0 16"/>'
      + '<circle class="gl-dot" cx="7" cy="25.5" r="1.3"/></g>';
    const body = wall.body + wall.outline + unit.body + unit.outline + face;
    return { shadow: wall.shadow, body, outline: '', deco: '', wash: wall.sil + unit.sil, hull: convexHull(wall.hull.concat(unit.hull)), crossAt: P(n.x, n.y - .3, 38 + p.lift) };
  }

  function drawDevice(e, n, p) {
    if (n.form === 'reader') return drawReader(e, n, p);
    if (n.form === 'phone') return drawPhone(e, n, p);
    return drawLaptop(e, n, p);
  }

  const DRAW = { block: drawBlock, db: drawDb, device: drawDevice, actor: drawActor, crowd: drawCrowd, queue: drawQueue, zone: drawZone };
  const LABEL_ON_FACE = new Set(['block', 'zone']);

  function drawEntity(e, n, p) {
    const d = (DRAW[n.type] || drawBlock)(e, n, p);
    if (d.hull) {
      const top = Math.min(...d.hull.map((q) => q[1]));
      d.anchor = [P(n.x, n.y)[0], top - 17];
    }
    return d;
  }

  // Layers one entity's parts with its state washes: glow behind, tints on the body, marks on top.
  function composeEntity(d, p) {
    let s = d.shadow || '';
    if (p.heat > .01) s += `<g opacity="${n2(p.heat)}"><path class="glow pulse" filter="url(#blur-glow)" d="${d.wash}"/></g>`;
    s += d.body;
    if (p.heat > .01) s += `<path class="wash tint" opacity="${n2(.3 * p.heat)}" d="${d.wash}"/>`;
    if (p.dead > .01) s += `<path class="wash dead" opacity="${n2(.62 * p.dead)}" d="${d.wash}"/>`;
    s += d.outline + d.deco;
    if (p.dim > .01) s += `<path class="wash dim" opacity="${n2(.45 * p.dim)}" d="${d.wash}"/>`;
    if (p.dead > .01) s += crossMark(d.crossAt, p.dead);
    return s;
  }

  /* ================= Walkthrough view ================= */
  // One walkthrough in four regions: header, stage, explanation and step strip. A view owns its
  // DOM, frame loop, timers and observers; destroy() releases all of them, so views can be
  // created and thrown away as often as the reader switches walkthroughs.

  const DEFAULT_LABELS = {
    goals: "What you'll learn", strip: 'In this walkthrough', changes: 'What changed', next: 'Next', back: 'Back', restart: 'Start again', chapters: {},
    sections: 'Sections', home: 'Overview', continue: 'Continue', planned: 'planned', draft: 'draft',
  };

  // Later layers win: defaults, then the collection's labels, then the walkthrough's own.
  function mergeLabels(...layers) {
    const out = { ...DEFAULT_LABELS, chapters: {} };
    for (const l of layers) {
      if (!l || typeof l !== 'object') continue;
      for (const k in l) {
        if (k === 'chapters') { if (l.chapters && typeof l.chapters === 'object') Object.assign(out.chapters, l.chapters); }
        else if (typeof l[k] === 'string') out[k] = l[k];
      }
    }
    return out;
  }

  // Returns a reason when the data cannot be drawn at all; smaller mistakes are only warned about.
  function unusable(w) {
    if (!w || typeof w !== 'object' || Array.isArray(w)) return 'it is missing or is not a JSON object';
    if (!Array.isArray(w.steps) || !w.steps.length) return 'it has no steps';
    if (w.nodes !== undefined && (typeof w.nodes !== 'object' || Array.isArray(w.nodes))) return '"nodes" is not an object';
    return null;
  }

  function viewMarkup(opts) {
    return `<div class="page">
  <header class="wt-head">
    <div>
      ${opts.crumb ? `<p class="crumb">${esc(opts.crumb)}</p>` : ''}
      <h1 data-ref="title" tabindex="-1"></h1>
      <p data-ref="summary" class="summary"></p>
      <p data-ref="note" class="note" hidden></p>
    </div>
    <ul data-ref="pills" class="pills" aria-label="About this walkthrough"></ul>
  </header>
  <div class="layout">
    <section class="stage card" aria-label="Stage">
      <div class="stage-top">
        <div data-ref="metrics" class="metrics" role="list" aria-label="Running numbers"></div>
        <div class="stage-controls">
          <button data-ref="replayBtn" class="btn small" type="button" title="Replay this step (R)"></button>
          <button data-ref="pauseBtn" class="btn small" type="button" aria-pressed="false" title="Pause or resume (Space)"></button>
        </div>
      </div>
      <div data-ref="sceneWrap" class="scene-wrap">
        <svg data-ref="scene" class="scene st" role="img" aria-labelledby="dio-scene-title" aria-describedby="dio-scene-text">
          <title id="dio-scene-title" data-ref="sceneTitle">Stage</title>
          <defs data-ref="sceneDefs"></defs>
          <rect class="deco" x="-5000" y="-5000" width="10000" height="10000" fill="url(#iso-grid)" mask="url(#grid-mask)"/>
          <g data-ref="layerGeo" opacity="0" aria-hidden="true"></g>
          <g data-ref="layerFloor"></g>
          <g data-ref="layerLinks"></g>
          <g data-ref="layerPackets"></g>
          <g data-ref="layerEnts"></g>
          <g data-ref="layerFx"></g>
          <g data-ref="layerOver"></g>
          <g data-ref="layerHud"></g>
        </svg>
      </div>
      <p data-ref="scrollHint" class="scroll-hint" hidden>Swipe sideways to see the whole stage.</p>
      <div data-ref="panelInline" class="panel-inline" hidden></div>
      <ul data-ref="legend" class="legend" aria-label="Legend"></ul>
      <div id="dio-scene-text" data-ref="sceneText" class="sr-only"></div>
    </section>

    <aside class="explain card" aria-label="Explanation">
      <div data-ref="guide" class="guide still" aria-live="polite"></div>
      <div class="nav">
        <button data-ref="backBtn" class="btn" type="button"></button>
        <button data-ref="nextBtn" class="btn primary" type="button"></button>
      </div>
      <p class="kbd-hint"><span><kbd>←</kbd> <kbd>→</kbd> step</span> · <span><kbd>R</kbd> replay</span> · <span><kbd>Space</kbd> pause</span>${opts.searchHint ? ' · <span><kbd>/</kbd> search</span>' : ''}</p>
      <section data-ref="goals" class="goals" aria-labelledby="dio-goals-head" hidden>
        <h3 id="dio-goals-head" data-ref="goalsHead" class="section-h"></h3>
        <ul data-ref="goalsList"></ul>
      </section>
    </aside>

    <nav class="strip card" aria-label="Steps">
      <div class="strip-head"><span data-ref="stripHead"></span><span data-ref="stripCount"></span></div>
      <div data-ref="stripScroll" class="strip-scroll">
        <ol data-ref="stepStrip" class="still"></ol>
      </div>
    </nav>
  </div>
</div>`;
  }

  // opts: { labels, start (0-based step), crumb, searchHint, docTitle,
  //         prev: { title, go } | null   where Back on the first step leads,
  //         end: { label, icon, go }      what the last step's primary button does,
  //         onStep(i) }                   called after every step change
  function mountWalkthrough(host, w, opts) {
    const NODES = w.nodes || {};
    const LINKS = w.links || {};
    const STEPS = w.steps;
    const METRICS = Array.isArray(w.metrics) ? w.metrics : [];
    const LBL = opts.labels;
    host.innerHTML = viewMarkup(opts);
    const R = {};
    for (const el of host.querySelectorAll('[data-ref]')) R[el.dataset.ref] = el;
    const $ = (name) => R[name];
    $('sceneDefs').innerHTML = defsMarkup();
    let reduce = motionQuery.matches;

    // Everything asynchronous goes through these two, so destroy() can cancel all of it.
    let alive = true;
    const timeouts = new Set(), frames = new Set();
    function later(fn, ms) {
      const t = setTimeout(() => { timeouts.delete(t); fn(); }, ms);
      timeouts.add(t);
    }
    function nextFrame(fn) {
      const f = requestAnimationFrame((now) => { frames.delete(f); fn(now); });
      frames.add(f);
    }

    /* ================= Per-step node state ================= */

    function propsFor(id, i) {
      const n = NODES[id], st = ((STEPS[i] && STEPS[i].scene && STEPS[i].scene.state) || {})[id] || {};
      const dflt = n.type === 'crowd' ? 12 : n.type === 'queue' ? 3 : 0;
      return {
        load: typeof st.load === 'number' ? clamp(st.load, 0, 1) : null,
        heat: clamp(Number(st.heat) || 0, 0, 1),
        dead: st.dead ? 1 : 0,
        dim: st.dim ? 1 : 0,
        count: typeof st.count === 'number' ? st.count : (typeof n.count === 'number' ? n.count : dflt),
        label: String(st.label ?? n.label ?? ''),
        sub: String(st.sub ?? n.sub ?? ''),
        tags: Array.isArray(st.tags) ? st.tags : [],
      };
    }

    const restParams = (pr) => ({ lift: 0, load: pr.load ?? 0, heat: pr.heat, dead: pr.dead, dim: pr.dim, count: pr.count, texts: [{ label: pr.label, sub: pr.sub, a: 1 }] });

    function stackOf(n, pr) {
      const out = [];
      if (pr.load !== null && n.type !== 'db') out.push({ key: '§load', gauge: true });
      for (const t of pr.tags) out.push({ key: `${t.text}|${t.tone}|${t.icon || ''}`, tag: t });
      return out;
    }

    const queueCaps = {};
    for (const id in NODES) {
      if (NODES[id].type !== 'queue') continue;
      let m = 4;
      STEPS.forEach((s, i) => { if ((s.scene && s.scene.show || []).includes(id)) m = Math.max(m, Math.ceil(propsFor(id, i).count)); });
      queueCaps[id] = Math.min(16, m);
    }
    const shell = (id) => ({ id, cap: queueCaps[id] });

    /* ================= Links: geometry ================= */

    const geomCache = new Map();
    const restHullCache = new Map();
    function restHull(id) {
      if (!restHullCache.has(id)) {
        const n = NODES[id];
        restHullCache.set(id, drawEntity(shell(id), n, restParams({ load: null, heat: 0, dead: 0, dim: 0, count: n.type === 'crowd' ? 24 : 4, label: '', sub: '' })).hull);
      }
      return restHullCache.get(id);
    }

    // Distance along the polyline at which it leaves the polygon (0 if it starts outside).
    function exitDist(pts, hull) {
      if (!hull || !pointInPoly(pts[0], hull)) return 0;
      const L = polyLen(pts);
      let hi = null;
      for (let s = 2; s <= L; s += 2) if (!pointInPoly(pointAt(pts, s).p, hull)) { hi = s; break; }
      if (hi === null) return L / 2;
      let lo = hi - 2;
      for (let k = 0; k < 20; k++) { const m = (lo + hi) / 2; if (pointInPoly(pointAt(pts, m).p, hull)) lo = m; else hi = m; }
      return hi;
    }

    function linkGeom(id) {
      if (geomCache.has(id)) return geomCache.get(id);
      const L = LINKS[id], a = NODES[L.from], b = NODES[L.to];
      const grid = [[a.x, a.y]];
      if (a.x !== b.x && a.y !== b.y) {
        if (L.route === 'x-first') grid.push([b.x, a.y]);
        else if (L.route === 'y-first') grid.push([a.x, b.y]);
      }
      grid.push([b.x, b.y]);
      let pts = grid.map(([x, y]) => P(x, y));
      const total = polyLen(pts);
      const s0 = exitDist(pts, restHull(L.from)) + 3;
      const s1 = total - exitDist(pts.slice().reverse(), restHull(L.to)) - 4;
      pts = trimPts(pts, s0, Math.max(s0 + 2, s1));
      const len = polyLen(pts);
      const g = { pts, len, d: roundLine(pts, 9), tip: pts[pts.length - 1], dir: pointAt(pts, len).dir, mid: pointAt(pts, len / 2) };
      geomCache.set(id, g);
      return g;
    }

    const hasHead = (style) => style !== 'cut' && style !== 'beat';
    const stepLinks = (i) => (i >= 0 && STEPS[i].scene && STEPS[i].scene.links) || {};
    function linkStyle(i, id) { const s = (stepLinks(i)[id] || {}).style; return STYLES.includes(s) ? s : 'solid'; }
    function linkText(i, id) { const v = stepLinks(i)[id] || {}; return String('label' in v ? (v.label ?? '') : (LINKS[id].label ?? '')); }
    const linkLabelSpec = (text, style) => ({ lines: [{ t: text, size: 9.5, w: 700 }], tone: style === 'cut' ? 'red' : style === 'off' ? 'gray' : 'paper' });

    /* ================= Step plans: layout at rest ================= */

    function placementCost(box, ctx, own) {
      let cost = 0;
      const padded = inflate(box, 3);
      for (const h of ctx.hulls) if (polyBoxOverlap(h, padded)) cost += 170;
      for (const b of ctx.pills) { const a = overlapArea(box, inflate(b, 2)); if (a > 0) cost += 90 + a / 6; }
      for (const b of ctx.labels) { const a = overlapArea(box, inflate(b, 3)); if (a > 0) cost += 90 + a / 3; }
      const sb = inflate(box, 2);
      for (const s of ctx.samples) if (inBox(s.p, sb)) cost += s.id === own ? 18 : 12;
      return cost;
    }

    function placeEntityLabel(n, hull, spec, ctx) {
      const [w, h] = pillSize(spec), b = bboxOf(hull), cx = P(n.x, n.y)[0];
      const below = b.y1 + h / 2 + 8, side = b.y1 - h / 2 - 4;
      const cands = [
        [cx, below, 0], [cx + w * .4, below - 2, 6], [cx - w * .4, below - 2, 6],
        [b.x1 + w / 2 + 8, side, 10], [b.x0 - w / 2 - 8, side, 10],
        [cx, below + 16, 16], [b.x1 + w / 2 + 8, b.y0 + (b.y1 - b.y0) / 2, 14], [b.x0 - w / 2 - 8, b.y0 + (b.y1 - b.y0) / 2, 14],
        [cx, b.y0 - h / 2 - 8, 20], [b.x1 + w / 2 + 4, b.y1 + h / 2 + 2, 18], [b.x0 - w / 2 - 4, b.y1 + h / 2 + 2, 18],
      ];
      let best = null;
      for (const [x, y, extra] of cands) {
        const cost = placementCost(boxAt(x, y, w, h), ctx, null) + extra;
        if (!best || cost < best.cost) best = { x, y, cost };
      }
      return best;
    }

    function placeLinkLabel(id, spec, ctx) {
      const g = linkGeom(id), [w, h] = pillSize(spec);
      let best = null;
      for (const dt of [0, .1, -.1, .2, -.2, .3, -.3, .4, -.4]) {
        const t = .5 + dt;
        if (t < .12 || t > .88) continue;
        const { p, dir } = pointAt(g.pts, t * g.len);
        const nrm = [-dir[1], dir[0]];
        const sup = Math.abs(nrm[0]) * w / 2 + Math.abs(nrm[1]) * (h + 2) / 2;
        const variants = [[sup + 5, 0], [-(sup + 5), 2], [sup + 16, 22], [-(sup + 16), 24], [sup + 32, 46], [-(sup + 32), 48], [0, 70]];
        for (const [off, extra] of variants) {
          const x = p[0] + nrm[0] * off, y = p[1] + nrm[1] * off;
          const cost = placementCost(boxAt(x, y, w, h), ctx, id) + Math.abs(dt) * 90 + extra;
          if (!best || cost < best.cost) best = { x, y, cost };
        }
      }
      return best;
    }

    // Where a node's pill stack sits: above by default, or below/beside it when that frees space.
    const STACK_SIDES = { above: 0, below: 30, right: 40, left: 40 };
    function stackPos(d, side, idx, w) {
      const b = bboxOf(d.hull);
      if (side === 'below') return [d.anchor[0], b.y1 + 17 + STACK_GAP * idx];
      if (side === 'right') return [b.x1 + 8 + w / 2, b.y0 + 12 - STACK_GAP * idx];
      if (side === 'left') return [b.x0 - 8 - w / 2, b.y0 + 12 - STACK_GAP * idx];
      return [d.anchor[0], d.anchor[1] - STACK_GAP * idx];
    }
    const stackItemSize = (it) => (it.gauge ? [GAUGE_W, PILL_H] : pillSize(tagSpec(it.tag)));

    function layoutOverlays(i, plan, base, sides) {
      const ctx = { hulls: base.hulls, samples: base.samples, pills: [], labels: [] };
      const out = { cost: 0, entLabels: {}, linkLabels: {} };
      for (const id of plan.show) {
        const info = plan.ents[id];
        if (!info.d.hull) continue;
        const side = sides[id] || 'above';
        stackOf(NODES[id], plan.props[id]).forEach((it, k) => {
          const [w, h] = stackItemSize(it), [x, y] = stackPos(info.d, side, k, w);
          const box = boxAt(x, y, w, h);
          out.cost += placementCost(box, ctx, null) + STACK_SIDES[side];
          ctx.pills.push(box);
        });
      }
      for (const id of plan.show) {
        const n = NODES[id], info = plan.ents[id];
        if (LABEL_ON_FACE.has(n.type) || !info.d.hull) continue;
        const spec = labelSpec(n, plan.props[id]);
        if (!spec) continue;
        const best = placeEntityLabel(n, info.d.hull, spec, ctx);
        out.entLabels[id] = [best.x, best.y];
        out.cost += best.cost;
        const [w, h] = pillSize(spec);
        ctx.pills.push(boxAt(best.x, best.y, w, h));
      }
      for (const id of plan.linkIds) {
        const text = linkText(i, id);
        if (!text) continue;
        const spec = linkLabelSpec(text, linkStyle(i, id));
        const best = placeLinkLabel(id, spec, ctx);
        out.linkLabels[id] = [best.x, best.y];
        out.cost += best.cost;
        const [w, h] = pillSize(spec);
        ctx.labels.push(boxAt(best.x, best.y, w, h));
      }
      out.ctx = ctx;
      return out;
    }

    function buildPlan(i) {
      const sc = STEPS[i].scene || {};
      const show = (sc.show || []).filter((id) => NODES[id]);
      const plan = { i, show, props: {}, ents: {}, labels: {}, linkIds: [], panel: sc.panel && sc.panel.lines ? sc.panel : null };
      const base = { hulls: [], samples: [] };
      const pts = [];
      for (const id of show) {
        const n = NODES[id], pr = propsFor(id, i);
        plan.props[id] = pr;
        const d = drawEntity(shell(id), n, restParams(pr));
        plan.ents[id] = { d, labelAt: null, side: 'above' };
        if (d.extent) pts.push(...d.extent);
        if (d.hull) { base.hulls.push(d.hull); pts.push(...d.hull); }
      }
      plan.linkIds = Object.keys(sc.links || {}).filter((id) => LINKS[id] && show.includes(LINKS[id].from) && show.includes(LINKS[id].to));
      for (const id of plan.linkIds) {
        const g = linkGeom(id);
        for (let s = 0; s <= g.len; s += 12) base.samples.push({ id, p: pointAt(g.pts, s).p });
        pts.push(g.pts[0], g.tip);
      }
      // Greedy pass: move a stack off its default side only when the whole layout gets cheaper.
      const sides = {};
      let best = layoutOverlays(i, plan, base, sides);
      for (const id of show) {
        if (!plan.ents[id].d.hull || !stackOf(NODES[id], plan.props[id]).length) continue;
        for (const side of ['below', 'right', 'left']) {
          const trial = layoutOverlays(i, plan, base, { ...sides, [id]: side });
          if (trial.cost < best.cost - 1) { best = trial; sides[id] = side; }
        }
      }
      for (const id of show) {
        plan.ents[id].side = sides[id] || 'above';
        plan.ents[id].labelAt = best.entLabels[id] || null;
      }
      plan.labels = best.linkLabels;
      for (const b of best.ctx.pills.concat(best.ctx.labels)) pts.push(...boxCorners(b));
      plan.bounds = pts.length ? bboxOf(pts) : { x0: -100, y0: -60, x1: 100, y1: 60 };
      plan.ctx = best.ctx;
      return plan;
    }

    /* ================= Camera ================= */

    const VIEW = { W: 900, H: 520, margin: 26, zMax: 1.45, zMin: .3, phoneZ: .85, hud: 1 };

    const viewRect = (c) => ({ x: c.cx - VIEW.W / 2 / c.z, y: c.cy - VIEW.H / 2 / c.z, w: VIEW.W / c.z, h: VIEW.H / c.z });

    function fitCamera(b) {
      const bw = Math.max(40, b.x1 - b.x0), bh = Math.max(40, b.y1 - b.y0);
      const z = clamp(Math.min(VIEW.zMax, (VIEW.W - 2 * VIEW.margin) / bw, (VIEW.H - 2 * VIEW.margin) / bh), VIEW.zMin, VIEW.zMax);
      return { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, z };
    }

    // Keeps the previous framing when the new content still fits with room to spare.
    function keepsPrevious(prev, next, b) {
      if (!prev) return false;
      if (!(prev.z <= next.z + 1e-6 && prev.z >= next.z * .9)) return false;
      const v = viewRect(prev), m = 12 / prev.z;
      if (b.x0 < v.x + m || b.y0 < v.y + m || b.x1 > v.x + v.w - m || b.y1 > v.y + v.h - m) return false;
      return Math.abs(next.cx - prev.cx) < .15 * v.w && Math.abs(next.cy - prev.cy) < .18 * v.h;
    }

    function cardWorldRect(c, corner, cw, ch) {
      const v = viewRect(c), m = 12;
      const sx = corner[1] === 'r' ? VIEW.W - m - cw : m;
      const sy = corner[0] === 'b' ? VIEW.H - m - ch - 3 : m;
      return { x0: v.x + sx / c.z, y0: v.y + sy / c.z, x1: v.x + (sx + cw) / c.z, y1: v.y + (sy + ch + 3) / c.z };
    }

    function cardHits(r, ctx) {
      const pr = inflate(r, 4);
      return ctx.hulls.some((h) => polyBoxOverlap(h, pr)) || ctx.pills.concat(ctx.labels).some((b) => overlapArea(pr, b) > 0);
    }

    // Finds the largest zoom at which the card fits in a corner, sliding the content away from
    // that corner within the free margin before zooming out further.
    function dockPanel(plan, cam, prevCorner) {
      const L = panelLayout(plan.panel);
      const cw = L.w * VIEW.hud, ch = L.h * VIEW.hud, b = plan.bounds;
      const order = [prevCorner, 'tr', 'br', 'tl', 'bl'].filter((c, k, a) => c && a.indexOf(c) === k);
      const shifts = [[0, 0], [.5, 0], [0, .5], [.5, .5], [1, 0], [0, 1], [1, .5], [.5, 1], [1, 1]];
      for (let z = cam.z; z >= VIEW.zMin - 1e-6; z -= .025) {
        const sx = Math.max(0, VIEW.W - 2 * VIEW.margin - (b.x1 - b.x0) * z) / 2 / z;
        const sy = Math.max(0, VIEW.H - 2 * VIEW.margin - (b.y1 - b.y0) * z) / 2 / z;
        for (const [fx, fy] of shifts) {
          for (const corner of order) {
            const c = { cx: (b.x0 + b.x1) / 2 + (corner[1] === 'r' ? 1 : -1) * fx * sx, cy: (b.y0 + b.y1) / 2 + (corner[0] === 'b' ? 1 : -1) * fy * sy, z };
            if (!cardHits(cardWorldRect(c, corner, cw, ch), plan.ctx)) return { ...c, corner };
          }
        }
      }
      return { ...cam, corner: 'tr' };
    }

    function planCameras() {
      let prev = null;
      for (const plan of plans) {
        let cam = fitCamera(plan.bounds);
        if (keepsPrevious(prev, cam, plan.bounds)) cam = { cx: prev.cx, cy: prev.cy, z: prev.z };
        if (plan.panel && !VIEW.inlinePanel) cam = dockPanel(plan, cam, prev && prev.corner);
        plan.cam = cam;
        prev = cam;
      }
    }

    /* ================= Recap panel (HUD card in screen pixels) ================= */

    function panelRows(panel) {
      return (panel.lines || []).map((raw) => {
        const s = String(raw);
        // Prefixes are replaced by spaces so column alignment written into the data survives.
        if (s.startsWith('= ')) return { t: '  ' + s.slice(2), kind: 'sum' };
        if (s.startsWith('! ')) return { t: '  ' + s.slice(2), kind: 'bad' };
        if (s.startsWith('# ')) return { t: s.slice(2), kind: 'note' };
        return { t: s, kind: 'row' };
      });
    }

    function panelLayout(panel) {
      const PAD = 14, LH = 19;
      const title = String(panel.title || '').toUpperCase();
      const rows = panelRows(panel);
      let w = textW(title, 10.5, 800) + title.length * 1.2;
      for (const r of rows) w = Math.max(w, textW(r.t, r.kind === 'note' ? 11 : 12, r.kind === 'sum' ? 800 : 600));
      w = Math.ceil(w + PAD * 2);
      let h = 34;
      for (const r of rows) h += LH + (r.kind === 'sum' ? 6 : 0);
      return { title, rows, w, h: h + 8, PAD, LH };
    }

    function panelSvg(L) {
      let s = `<rect class="hud-drop" x="0" y="2.5" width="${L.w}" height="${L.h}" rx="10"/><rect class="hud-bg" width="${L.w}" height="${L.h}" rx="10"/>`;
      s += `<text class="hud-title" x="${L.PAD}" y="21">${esc(L.title)}</text><path class="hud-rule" d="M${L.PAD} 29.5H${L.w - L.PAD}"/>`;
      let y = 34;
      for (const r of L.rows) {
        if (r.kind === 'sum') { s += `<path class="hud-rule sum" d="M${L.PAD} ${y + 3}H${L.w - L.PAD}"/>`; y += 6; }
        if (r.kind === 'sum' || r.kind === 'bad') s += `<rect class="hud-band ${r.kind}" x="${L.PAD - 6}" y="${y + 1}" width="${L.w - 2 * L.PAD + 12}" height="${L.LH}" rx="5"/>`;
        if (r.kind === 'bad') s += `<g class="pill tone-red">${glyph('alert', L.PAD + 5, y + 10.5, 11, 2.4)}</g>`;
        s += `<text class="hud-line ${r.kind}" x="${L.PAD}" y="${y + 14.5}" xml:space="preserve">${esc(r.t)}</text>`;
        y += L.LH;
      }
      return s;
    }

    /* ================= Runtime state ================= */

    const svg = $('scene'), wrap = $('sceneWrap');
    const layer = { geo: $('layerGeo'), floor: $('layerFloor'), links: $('layerLinks'), packets: $('layerPackets'), ents: $('layerEnts'), fx: $('layerFx'), over: $('layerOver'), hud: $('layerHud') };
    const gridFadeEl = $('sceneDefs').querySelector('#grid-fade');
    const gridFade = () => gridFadeEl;

    let plans = [];
    let cur = -1;          // step shown in the explanation
    let stageIdx = -1;     // step whose scene the stage is heading to
    let stageToken = 0;
    let paused = false;
    let clock = 0;         // animation time in ms; stands still while paused

    const ents = new Map();
    const lks = new Map();
    const cam = { x: -400, y: -250, w: 800, h: 500, dirty: true };
    const hud = { g: null, key: '', op: 0, corner: 'tr', layout: null, old: [], dirty: true };
    let flows = [];
    let packets = [];

    /* ---------- Tweens and timers (one clock, one loop) ---------- */

    const tweens = [];
    const timers = [];

    function tween(target, key, to, dur, opt = {}) {
      for (let k = tweens.length - 1; k >= 0; k--) if (tweens[k].target === target && tweens[k].key === key) tweens.splice(k, 1);
      if (reduce || dur <= 0) {
        target[key] = to;
        if (opt.owner) opt.owner.dirty = true;
        if (opt.done) opt.done();
        return;
      }
      tweens.push({ target, key, to, dur, from: null, t0: clock + (opt.delay || 0), ease: opt.ease || inOut, owner: opt.owner, done: opt.done });
    }

    function runTweens() {
      for (let k = 0; k < tweens.length; k++) {
        const t = tweens[k];
        if (clock < t.t0) continue;
        if (t.from === null) t.from = t.target[t.key];
        const u = Math.min(1, (clock - t.t0) / t.dur);
        t.target[t.key] = lerp(t.from, t.to, t.ease(u));
        if (t.owner) t.owner.dirty = true;
        if (u >= 1) { tweens.splice(k--, 1); if (t.done) t.done(); }
      }
    }

    function after(ms, fn) { timers.push({ at: clock + ms, fn }); }
    function runTimers() {
      for (let k = 0; k < timers.length; k++) if (clock >= timers[k].at) { const t = timers.splice(k--, 1)[0]; t.fn(); }
    }

    /* ---------- Entities ---------- */

    const depthOf = (n) => (n.type === 'zone' ? -1e4 : n.type === 'queue' ? -1e3 + n.x - n.y : n.x - n.y);

    function insertByDepth(parent, node, depth) {
      node.dataset.depth = depth;
      const next = [...parent.children].find((c) => Number(c.dataset.depth) > depth);
      parent.insertBefore(node, next || null);
    }

    function makeEnt(id) {
      const n = NODES[id];
      const e = { id, n, cap: queueCaps[id], g: svgEl('g', { class: 'ent', 'data-id': id }), og: svgEl('g', { class: 'ent-over' }), c: null, from: null, to: null, labelPos: null, labelTarget: null, dirty: true, leaving: false, landAt: 0 };
      insertByDepth(n.type === 'zone' ? layer.floor : layer.ents, e.g, depthOf(n));
      insertByDepth(layer.over, e.og, depthOf(n));
      ents.set(id, e);
      return e;
    }

    function removeEnt(e) {
      e.g.remove();
      e.og.remove();
      ents.delete(e.id);
    }

    const fadeOutOf = (k) => 1 - clamp(k / .42, 0, 1);
    const fadeInOf = (k) => clamp((k - .55) / .4, 0, 1);

    function liveParams(e) {
      const c = e.c, k = c.swap;
      const texts = [];
      if (e.from && k < 1 && (e.from.label !== e.to.label || e.from.sub !== e.to.sub)) {
        texts.push({ label: e.from.label, sub: e.from.sub, a: fadeOutOf(k) }, { label: e.to.label, sub: e.to.sub, a: fadeInOf(k) });
      } else {
        texts.push({ label: e.to.label, sub: e.to.sub, a: 1 });
      }
      return { lift: c.lift, load: c.load, heat: c.heat, dead: c.dead, dim: c.dim, count: c.count, texts };
    }

    function renderEnt(e) {
      e.dirty = false;
      const p = liveParams(e);
      const d = drawEntity(e, e.n, p);
      e.g.innerHTML = d.floor || composeEntity(d, p);
      e.g.setAttribute('opacity', n2(e.c.op));
      e.og.setAttribute('opacity', n2(e.c.op));
      e.og.innerHTML = d.hull ? overlayFor(e, d, p) : '';
    }

    function overlayFor(e, d, p) {
      const n = e.n, k = e.c.swap;
      const swapping = e.from && k < 1;
      const item = (it, idx, a) => {
        const [w] = stackItemSize(it), [x, y] = stackPos(d, e.side || 'above', idx, w);
        return it.gauge ? gaugeSvg(x, y, e.c.load ?? 0, a) : pillSvg(x, y, tagSpec(it.tag), a);
      };
      const now = stackOf(n, e.to), before = swapping ? stackOf(n, e.from) : null;
      const mv = inOut(clamp(k, 0, 1));
      let s = '';
      if (before) {
        before.forEach((it, j) => { if (!now.some((o) => o.key === it.key)) s += item(it, j, fadeOutOf(k)); });
      }
      now.forEach((it, i) => {
        const j = before ? before.findIndex((o) => o.key === it.key) : -1;
        s += item(it, before && j >= 0 ? lerp(j, i, mv) : i, !before || j >= 0 ? 1 : fadeInOf(k));
      });
      if (!LABEL_ON_FACE.has(n.type) && e.labelPos) {
        const [lx, ly] = [e.labelPos[0], e.labelPos[1] - p.lift];
        for (const t of p.texts) {
          const spec = labelSpec(n, t);
          if (spec) s += pillSvg(lx, ly, spec, t.a);
        }
      }
      return s;
    }

    /* ---------- Links ---------- */

    function makeLink(id) {
      const geom = linkGeom(id);
      const g = svgEl('g', { class: 'link', 'data-id': id }, layer.links);
      const line = svgEl('path', { class: 'lk' }, g);
      const head = svgEl('path', { class: 'ah' }, g);
      const mark = svgEl('g', { class: 'deco' }, g);
      const lg = svgEl('g', { class: 'link-label' }, layer.over);
      const geo = svgEl('path', { d: geom.d, fill: 'none' }, layer.geo);
      const lk = { id, geom, g, line, head, mark, lg, geo, glen: geo.getTotalLength() || geom.len, draw: 0, op: 1, style: 'solid', text: '', textFrom: null, posFrom: null, lswap: 1, pos: null, target: null, dirty: true, leaving: false };
      lks.set(id, lk);
      return lk;
    }

    function removeLink(lk) {
      lk.g.remove();
      lk.lg.remove();
      lk.geo.remove();
      lks.delete(lk.id);
    }

    function arrowPath(tip, dir) {
      const nx = -dir[1], ny = dir[0];
      const bx = tip[0] - dir[0] * 9, by = tip[1] - dir[1] * 9;
      return `M${pt(tip)}L${pt([bx + nx * 4.2, by + ny * 4.2])}L${pt([bx - nx * 4.2, by - ny * 4.2])}Z`;
    }

    function renderLink(lk) {
      lk.dirty = false;
      const g = lk.geom, head = hasHead(lk.style);
      lk.g.setAttribute('opacity', n2(lk.op));
      lk.line.setAttribute('class', `lk ${lk.style}`);
      if (lk.draw <= .001) {
        lk.line.setAttribute('d', '');
      } else {
        const end = lk.draw * (g.len - (head ? 7 : 0));
        lk.line.setAttribute('d', roundLine(trimPts(g.pts, 0, Math.max(.5, end)), 9));
      }
      const headA = head ? clamp((lk.draw - .97) / .03, 0, 1) : 0;
      lk.head.setAttribute('class', `ah${lk.style === 'off' ? ' off' : ''}`);
      lk.head.setAttribute('d', headA > 0 ? arrowPath(g.tip, g.dir) : '');
      lk.head.setAttribute('opacity', n2(headA));
      lk.mark.innerHTML = lk.style === 'cut' && lk.draw > .5 ? crossMark(g.mid.p, clamp((lk.draw - .5) * 4, 0, 1)) : '';
      const a = lk.op * clamp((lk.draw - .6) / .4, 0, 1);
      let s = '';
      if (lk.textFrom && lk.lswap < 1 && lk.posFrom) s += pillSvg(lk.posFrom[0], lk.posFrom[1], linkLabelSpec(lk.textFrom, lk.style), a * fadeOutOf(lk.lswap));
      if (lk.text && lk.pos) s += pillSvg(lk.pos[0], lk.pos[1], linkLabelSpec(lk.text, lk.style), a * (lk.textFrom && lk.lswap < 1 ? fadeInOf(lk.lswap) : 1));
      lk.lg.innerHTML = s;
    }

    /* ---------- Camera and HUD ---------- */

    function camTargetOf(c) { const v = viewRect(c); return { x: v.x, y: v.y, w: v.w, h: v.h }; }

    function applyCamera() {
      cam.dirty = false;
      svg.setAttribute('viewBox', `${n2(cam.x)} ${n2(cam.y)} ${n2(cam.w)} ${n2(cam.h)}`);
      const gf = gridFade();
      if (gf) {
        gf.setAttribute('cx', n1(cam.x + cam.w / 2));
        gf.setAttribute('cy', n1((cam.y + cam.h / 2) / .6));
        gf.setAttribute('r', n1(cam.w * .56));
      }
      layer.hud.setAttribute('transform', `translate(${n2(cam.x)} ${n2(cam.y)}) scale(${(cam.w / VIEW.W).toFixed(4)})`);
    }

    function renderHud() {
      hud.dirty = false;
      if (!hud.g) return;
      const L = hud.layout, cw = L.w * VIEW.hud, ch = L.h * VIEW.hud, m = 12;
      const sx = hud.corner[1] === 'r' ? VIEW.W - m - cw : m;
      const sy = hud.corner[0] === 'b' ? VIEW.H - m - ch - 3 : m;
      hud.g.setAttribute('transform', `translate(${n1(sx)} ${n1(sy)}) scale(${n2(VIEW.hud)})`);
      hud.g.setAttribute('opacity', n2(hud.op));
    }

    function setPanel(plan, instant, delay) {
      const panel = plan && plan.panel && !VIEW.inlinePanel ? plan.panel : null;
      const key = panel ? JSON.stringify(panel) : '';
      if (plan && plan.cam && plan.cam.corner) hud.corner = plan.cam.corner;
      hud.dirty = true;
      if (key === hud.key) return;
      if (hud.g) {
        const old = hud.g;
        hud.g = null;
        if (instant || reduce) old.remove();
        else { const o = { op: hud.op }; tween(o, 'op', 0, 260, { done: () => old.remove() }); hud.old.push({ g: old, o }); }
      }
      hud.key = key;
      if (!panel) return;
      hud.layout = panelLayout(panel);
      hud.g = svgEl('g', { class: 'hud-card' }, layer.hud);
      hud.g.innerHTML = panelSvg(hud.layout);
      hud.op = 0;
      tween(hud, 'op', 1, instant ? 0 : 420, { delay, owner: hud, ease: outCubic });
    }

    function renderPanelInline(i) {
      const box = $('panelInline');
      const panel = VIEW.inlinePanel && i >= 0 ? (STEPS[i].scene || {}).panel : null;
      if (!panel || !panel.lines) { box.hidden = true; box.innerHTML = ''; return; }
      box.hidden = false;
      box.innerHTML = `<div class="pi-title">${esc(String(panel.title || '').toUpperCase())}</div>` + panelRows(panel).map((r) => `<div class="pi-row ${r.kind}">${esc(r.t)}</div>`).join('');
    }

    /* ---------- Floor effects ---------- */

    function spotlight(id) {
      const n = NODES[id];
      const r = n.type === 'block' ? (n.size || 4) / 2 + 1.2 : n.type === 'crowd' ? 6.5 : n.type === 'zone' ? Math.max(n.w || 8, n.h || 6) / 2 : 2.6;
      const d = roundPoly([P(n.x - r, n.y + r), P(n.x + r, n.y + r), P(n.x + r, n.y - r), P(n.x - r, n.y - r)], 12);
      const el = svgEl('path', { class: 'spot', d }, layer.floor);
      after(1600, () => el.remove());
    }

    /* ---------- Scene transitions ---------- */

    const EXIT = 420, MOVE = 820, ENTER = 680, STAGGER = 130, LINK_DRAW = 560, LINK_OUT = 300, CAM = 820;
    const ENTER_LIFT = { device: 40, crowd: 26, queue: 26, actor: 60, zone: 0 };

    function freshState(pr, extra) {
      return { op: 1, lift: 0, load: pr.load ?? 0, heat: pr.heat, dead: pr.dead, dim: pr.dim, count: pr.count, swap: 1, ...extra };
    }

    function stageTo(i, instant) {
      const token = ++stageToken;
      timers.length = 0;
      stopFlows();
      const plan = i >= 0 ? plans[i] : null;
      const show = new Set(plan ? plan.show : []);
      stageIdx = i;
      instant = instant || reduce;

      if (instant) {
        tweens.length = 0;
        for (const e of [...ents.values()]) if (!show.has(e.id)) removeEnt(e);
        for (const id of show) {
          const e = ents.get(id) || makeEnt(id), pr = plan.props[id];
          e.leaving = false; e.from = null; e.to = pr; e.c = freshState(pr);
          e.labelTarget = plan.ents[id].labelAt; e.labelPos = e.labelTarget; e.side = plan.ents[id].side; e.dirty = true;
        }
        const vis = new Set(plan ? plan.linkIds : []);
        for (const lk of [...lks.values()]) if (!vis.has(lk.id)) removeLink(lk);
        for (const id of vis) {
          const lk = lks.get(id) || makeLink(id);
          Object.assign(lk, { leaving: false, draw: 1, op: 1, style: linkStyle(i, id), text: linkText(i, id), textFrom: null, lswap: 1, dirty: true });
          lk.target = plan.labels[id] || null; lk.pos = lk.target;
        }
        for (const h of hud.old) h.g.remove();
        hud.old = [];
        if (plan) Object.assign(cam, camTargetOf(plan.cam), { dirty: true });
        setPanel(plan, true, 0);
        if (plan) startFlows(i);
        return;
      }

      const exits = [], moves = [], enters = [];
      for (const e of ents.values()) if (!show.has(e.id) && !e.leaving) exits.push(e);
      for (const id of plan ? plan.show : []) {
        const e = ents.get(id), pr = plan.props[id];
        if (!e) enters.push({ id, pr });
        else if (e.leaving || !same(pr, e.to)) moves.push({ e, pr });
      }
      const tMove = exits.length ? EXIT * .55 : 0;
      const tEnter = moves.length ? tMove + MOVE * .75 : exits.length ? EXIT * .7 : 0;
      const tCam = exits.length ? 168 : 0;
      let end = 0;

      for (const e of exits) {
        e.leaving = true;
        tween(e.c, 'op', 0, EXIT, { owner: e });
        tween(e.c, 'lift', -22, EXIT, { owner: e, done: () => { if (e.leaving) removeEnt(e); } });
        end = Math.max(end, EXIT);
      }

      const changed = [];
      for (const { e, pr } of moves) {
        const o = { owner: e, delay: tMove };
        e.from = e.to; e.to = pr;
        if (e.from.load === null && pr.load !== null) e.c.load = 0;
        if (pr.load !== null) tween(e.c, 'load', pr.load, MOVE, o);
        tween(e.c, 'heat', pr.heat, MOVE, o);
        tween(e.c, 'dead', pr.dead, MOVE, o);
        tween(e.c, 'dim', pr.dim, MOVE, o);
        tween(e.c, 'count', pr.count, MOVE, o);
        e.c.swap = 0;
        tween(e.c, 'swap', 1, MOVE, { ...o, ease: linear });
        if (e.leaving) {
          e.leaving = false;
          tween(e.c, 'op', 1, MOVE, o);
          tween(e.c, 'lift', 0, MOVE, o);
        }
        e.labelTarget = plan.ents[e.id].labelAt; e.side = plan.ents[e.id].side;
        e.landAt = tMove;
        changed.push(e.id);
        end = Math.max(end, tMove + MOVE);
      }
      for (const e of ents.values()) if (show.has(e.id) && !moves.some((m) => m.e === e)) { e.landAt = 0; e.labelTarget = plan.ents[e.id].labelAt; e.side = plan.ents[e.id].side; e.dirty = true; }

      enters.sort((a, b) => depthOf(NODES[a.id]) - depthOf(NODES[b.id]));
      enters.forEach(({ id, pr }, k) => {
        const e = makeEnt(id), n = NODES[id];
        e.to = pr; e.from = null;
        e.c = freshState(pr, { op: 0, lift: ENTER_LIFT[n.type] ?? 120, count: n.type === 'crowd' ? 0 : pr.count });
        e.labelTarget = plan.ents[id].labelAt; e.labelPos = e.labelTarget; e.side = plan.ents[id].side;
        const delay = tEnter + k * STAGGER;
        tween(e.c, 'op', 1, ENTER, { owner: e, delay, ease: outCubic });
        tween(e.c, 'lift', 0, ENTER, { owner: e, delay, ease: outBack });
        if (n.type === 'crowd') tween(e.c, 'count', pr.count, ENTER + 300, { owner: e, delay });
        e.landAt = delay + ENTER;
        changed.push(id);
        end = Math.max(end, e.landAt);
      });

      const vis = new Set(plan ? plan.linkIds : []);
      for (const lk of lks.values()) {
        if (vis.has(lk.id) || lk.leaving) continue;
        lk.leaving = true;
        tween(lk, 'op', 0, LINK_OUT, { owner: lk, done: () => { if (lk.leaving) removeLink(lk); } });
      }
      let j = 0;
      for (const id of plan ? plan.linkIds : []) {
        const style = linkStyle(i, id), text = linkText(i, id), target = plan.labels[id] || null;
        let lk = lks.get(id);
        if (lk) {
          if (lk.leaving) { lk.leaving = false; tween(lk, 'op', 1, LINK_OUT, { owner: lk, delay: tMove }); }
          if (lk.draw < 1) tween(lk, 'draw', 1, LINK_DRAW, { owner: lk, delay: tMove });
          if (lk.style !== style) { lk.style = style; lk.dirty = true; }
          if (lk.text !== text) {
            lk.textFrom = lk.text; lk.posFrom = lk.pos; lk.text = text; lk.pos = target; lk.lswap = 0;
            tween(lk, 'lswap', 1, MOVE, { owner: lk, delay: tMove, ease: linear });
          }
          lk.target = target;
          if (!lk.pos) lk.pos = target;
          continue;
        }
        lk = makeLink(id);
        Object.assign(lk, { style, text, target, pos: target, draw: 0, op: 1 });
        const L = LINKS[id];
        const land = Math.max(ents.get(L.from) ? ents.get(L.from).landAt : 0, ents.get(L.to) ? ents.get(L.to).landAt : 0);
        const delay = land + 60 + 90 * j++;
        tween(lk, 'draw', 1, LINK_DRAW, { owner: lk, delay });
        end = Math.max(end, delay + LINK_DRAW);
      }

      if (plan) {
        const t = camTargetOf(plan.cam);
        for (const k of ['x', 'y', 'w', 'h']) tween(cam, k, t[k], CAM, { owner: cam, delay: tCam });
        end = Math.max(end, tCam + CAM);
      }
      setPanel(plan, false, Math.max(0, end - 300));

      after(end + 40, () => {
        if (token !== stageToken || !plan) return;
        startFlows(i);
        changed.forEach(spotlight);
      });
    }

    /* ---------- Flows ---------- */

    const SPEED = 155;
    const KIND_SPEED = { heavy: .7, signal: .85 };

    function packetShape(kind) {
      switch (kind) {
        case 'heavy': return '<rect class="pkb pk-heavy" x="-6" y="-6" width="12" height="12" rx="3"/>';
        case 'write': return '<rect class="pkb pk-write" x="-4.2" y="-4.2" width="8.4" height="8.4" rx="1.8"/>';
        case 'message': return '<rect class="pkb pk-message" x="-4.8" y="-4.8" width="9.6" height="9.6" rx="2.2"/>';
        case 'signal': return '<circle class="pk-ring" r="5.8"/><circle class="pkb pk-signal" r="2.9"/>';
        case 'response': return '<circle class="pkb pk-response" r="4.3"/>';
        default: return '<circle class="pkb pk-request" r="4.3"/>';
      }
    }

    const legRange = (lk) => [2, Math.max(4, lk.glen - (hasHead(lk.style) ? 10 : 2))];

    function legPoint(lk, leg, s) {
      const [lo, hi] = legRange(lk);
      const q = lk.geo.getPointAtLength(leg.rev ? hi - s : lo + s);
      return [q.x, q.y];
    }

    function startFlows(i) {
      stopFlows();
      flows = ((STEPS[i].scene || {}).flows || []).map((f) => ({
        f,
        kind: KINDS.includes(f.kind) ? f.kind : 'request',
        legs: (f.route || []).map((r) => ({ id: String(r).replace(/^~/, ''), rev: String(r).startsWith('~') })).filter((l) => lks.has(l.id)),
        acc: .6,
      })).filter((fl) => fl.legs.length);
      if (reduce) drawChevrons();
    }

    function stopFlows() {
      flows = [];
      for (const p of packets) { const g = p.g; g.classList.add('leave'); later(() => g.remove(), 280); }
      packets = [];
      for (const c of [...layer.packets.querySelectorAll('.chev')]) c.remove();
      layer.fx.innerHTML = '';
    }

    function setPacketKind(p, kind) {
      if (p.kind === kind) return;
      p.kind = kind;
      p.shape.innerHTML = packetShape(kind);
    }

    function spawn(fl) {
      const legs = fl.legs.map((l) => ({ ...l, kind: fl.kind }));
      const turn = legs.length - 1;
      if (fl.f.bounce) for (let k = fl.legs.length - 1; k >= 0; k--) legs.push({ id: fl.legs[k].id, rev: !fl.legs[k].rev, kind: 'response' });
      const g = svgEl('g', { class: 'pk', style: 'opacity:0' }, layer.packets);
      const shape = svgEl('g', {}, g);
      const p = { fl, legs, turn, k: 0, s: 0, wait: 0, g, shape, kind: null };
      setPacketKind(p, legs[0].kind);
      placePacket(p, legPoint(lks.get(legs[0].id), legs[0], 0));
      nextFrame(() => { if (!p.dead && p.wait <= 0) g.style.opacity = 1; });
      packets.push(p);
    }

    const placePacket = (p, q) => p.g.setAttribute('transform', `translate(${n1(q[0])} ${n1(q[1])})`);

    function killPacket(p) {
      p.dead = true;
      p.g.remove();
    }

    function fxRing(q) {
      const c = svgEl('circle', { class: 'fx fx-ring', cx: n1(q[0]), cy: n1(q[1]), r: 6 }, layer.fx);
      later(() => c.remove(), 700);
    }

    function fxBurst(q) {
      const g = svgEl('g', { class: 'fx', transform: `translate(${n1(q[0])} ${n1(q[1])})` }, layer.fx);
      g.innerHTML = '<g class="fx-burst"><circle r="6.5"/><path d="M-2.8-2.8l5.6 5.6M2.8-2.8l-5.6 5.6"/></g>';
      later(() => g.remove(), 900);
    }

    function stepPackets(dt) {
      for (const fl of flows) {
        fl.acc += dt * (typeof fl.f.rate === 'number' ? fl.f.rate : .8);
        while (fl.acc >= 1) { fl.acc -= 1; spawn(fl); }
      }
      for (let q = packets.length - 1; q >= 0; q--) {
        const p = packets[q];
        if (p.wait > 0) {
          p.wait -= dt;
          if (p.wait > 0) continue;
          p.g.classList.remove('held');
          p.k += 1; p.s = 0;
          setPacketKind(p, p.legs[p.k].kind);
          p.g.style.opacity = 1;
        }
        const leg = p.legs[p.k], lk = lks.get(leg.id);
        if (!lk) { killPacket(p); packets.splice(q, 1); continue; }
        const [lo, hi] = legRange(lk), L = hi - lo;
        p.s += dt * SPEED * (typeof p.fl.f.speed === 'number' ? p.fl.f.speed : 1) * (KIND_SPEED[p.kind] || 1);
        if (lk.style === 'cut' && p.s >= L / 2) {
          // A broken link cannot deliver: the dot dies at the break.
          fxBurst(legPoint(lk, leg, L / 2)); killPacket(p); packets.splice(q, 1); continue;
        }
        if (p.s < L) { placePacket(p, legPoint(lk, leg, p.s)); continue; }
        const endPt = legPoint(lk, leg, L);
        placePacket(p, endPt);
        if (p.k === p.turn && Math.random() < (Number(p.fl.f.fail) || 0)) { fxBurst(endPt); killPacket(p); packets.splice(q, 1); continue; }
        if (p.k === p.legs.length - 1) { fxRing(endPt); killPacket(p); packets.splice(q, 1); continue; }
        const hold = p.k === p.turn ? Number(p.fl.f.hold) || 0 : 0;
        if (hold > 0) { p.wait = hold; p.g.classList.add('held'); }
        else { p.wait = .16; p.g.style.opacity = 0; }
      }
    }

    // Reduced motion: each flow becomes still chevrons along its links.
    function drawChevrons() {
      let s = '';
      const chev = (lk, leg, t, kind, side) => {
        const [lo, hi] = legRange(lk), L = hi - lo;
        const a = legPoint(lk, leg, L * t), b = legPoint(lk, leg, Math.min(L, L * t + 2));
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        const ox = -Math.sin(ang) * side, oy = Math.cos(ang) * side;
        return `<path class="chev chev-${kind}" transform="translate(${n1(a[0] + ox)} ${n1(a[1] + oy)}) rotate(${n1(ang * 180 / Math.PI)})" d="M-3-4.5 2 0-3 4.5"/>`;
      };
      for (const fl of flows) {
        const side = fl.f.bounce ? -5 : 0;
        for (const leg of fl.legs) {
          const lk = lks.get(leg.id), [lo, hi] = legRange(lk);
          const count = clamp(Math.floor((hi - lo) / 30), 1, 5);
          for (let k = 0; k < count; k++) {
            const t = .12 + .76 * (k + .5) / count;
            s += chev(lk, leg, t, fl.kind, side);
            if (fl.f.bounce) s += chev(lk, { ...leg, rev: !leg.rev }, 1 - t, 'response', side);
          }
        }
      }
      const g = svgEl('g', { class: 'chev' }, layer.packets);
      g.innerHTML = s;
    }

    /* ---------- Frame loop ---------- */

    let lastT = performance.now();
    const uiAnims = [];

    function frame(now) {
      if (!alive) return;
      const dt = Math.min(50, now - lastT);
      lastT = now;
      for (let k = 0; k < uiAnims.length; k++) if (uiAnims[k](now)) uiAnims.splice(k--, 1);
      if (!paused) {
        clock += dt;
        runTimers();
        runTweens();
        for (const e of ents.values()) {
          if (e.labelTarget && e.labelPos && (e.labelPos[0] !== e.labelTarget[0] || e.labelPos[1] !== e.labelTarget[1])) {
            const nx = lerp(e.labelPos[0], e.labelTarget[0], .16), ny = lerp(e.labelPos[1], e.labelTarget[1], .16);
            e.labelPos = Math.abs(nx - e.labelTarget[0]) + Math.abs(ny - e.labelTarget[1]) < .3 ? e.labelTarget : [nx, ny];
            e.dirty = true;
          } else if (e.labelTarget && !e.labelPos) { e.labelPos = e.labelTarget; e.dirty = true; }
        }
        for (const lk of lks.values()) {
          if (lk.target && lk.pos && (lk.pos[0] !== lk.target[0] || lk.pos[1] !== lk.target[1])) {
            const nx = lerp(lk.pos[0], lk.target[0], .16), ny = lerp(lk.pos[1], lk.target[1], .16);
            lk.pos = Math.abs(nx - lk.target[0]) + Math.abs(ny - lk.target[1]) < .3 ? lk.target : [nx, ny];
            lk.dirty = true;
          }
        }
        for (const h of hud.old) h.g.setAttribute('opacity', n2(h.o.op));
        hud.old = hud.old.filter((h) => h.g.isConnected);
      }
      for (const e of ents.values()) if (e.dirty) renderEnt(e);
      for (const lk of lks.values()) if (lk.dirty) renderLink(lk);
      if (cam.dirty) { applyCamera(); hud.dirty = true; }
      if (hud.dirty) renderHud();
      if (!paused && !reduce) stepPackets(dt / 1000);
      nextFrame(frame);
    }

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
      if (w.note) { $('note').hidden = false; $('note').textContent = `# ${w.note}`; }
      const minutes = w.minutes ?? opts.minutes, level = w.level ?? opts.level;
      const pills = [];
      if (minutes) pills.push(['clock', `${minutes} min`, 'amber']);
      if (level) pills.push(['level', level, 'green']);
      pills.push(['layers', `${STEPS.length} steps`, 'violet']);
      $('pills').innerHTML = pills.map(([ic, t, tone]) => `<li class="pill tone-${tone}">${iconHtml(ic)}${esc(t)}</li>`).join('');
      $('stripHead').textContent = LBL.strip;
      $('goalsHead').textContent = LBL.goals;
      $('goals').hidden = !(Array.isArray(w.goals) && w.goals.length);
    }

    function renderLegend() {
      $('legend').innerHTML = (w.legend || []).map((l) => {
        const kind = KINDS.includes(l.kind) ? l.kind : 'request';
        return `<li><svg viewBox="-8 -8 16 16" aria-hidden="true">${packetShape(kind)}</svg>${esc(l.label || kind)}</li>`;
      }).join('');
    }

    /* ---------- Metric chips ---------- */

    const chips = [];
    const decimalsOf = (v) => Math.min(2, (String(v).split('.')[1] || '').length);
    const fmt = (v, dec) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

    function buildMetrics() {
      const box = $('metrics');
      box.hidden = !METRICS.length;
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
      c.num.textContent = v === null ? '—' : fmt(v, decimalsOf(v));
      c.unit.textContent = v === null ? '' : (c.m.unit || '');
    }

    function restartAnim(el, cls) {
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
    }

    function updateMetrics(i, animate) {
      const vals = STEPS[i].metrics || {};
      for (const c of chips) {
        const v = typeof vals[c.m.id] === 'number' ? vals[c.m.id] : null;
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
          uiAnims.push((now) => {
            if (token !== c.token) return true;
            const u = Math.min(1, (now - t0) / 900);
            c.num.textContent = u >= 1 ? fmt(v, dec) : fmt(Number(lerp(old, v, outCubic(u)).toFixed(dec)), dec);
            return u >= 1;
          });
        }
        if (animate && !reduce) restartAnim(c.el, 'flash');
      }
    }

    /* ---------- Explanation ---------- */

    function renderGuide(i, dir) {
      const s = STEPS[i], guide = $('guide');
      if (dir && !reduce && guide.childElementCount) {
        const old = guide.cloneNode(true);
        old.removeAttribute('data-ref');
        old.removeAttribute('aria-live');
        old.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
        old.className = 'guide guide-old still';
        old.setAttribute('aria-hidden', 'true');
        old.style.left = `${guide.offsetLeft}px`;
        old.style.top = `${guide.offsetTop}px`;
        old.style.width = `${guide.offsetWidth}px`;
        guide.parentNode.appendChild(old);
        later(() => old.remove(), 200);
      }
      const blocks = [];
      const chapter = s.chapter || 'setup';
      blocks.push(`<div class="guide-head"><span>${i + 1} / ${STEPS.length}</span><span class="badge tone-${CHAPTER_TONE[chapter] || 'gray'}">${esc(LBL.chapters[chapter] || chapter)}</span></div>`);
      blocks.push(`<h2>${esc(s.title || '')}</h2>`);
      for (const para of s.body || []) blocks.push(/^\s*<(ul|ol|p)\b/i.test(para) ? `<div class="body">${para}</div>` : `<div class="body"><p>${para}</p></div>`);
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
      guide.className = dir && !reduce ? 'guide' : 'guide still';
      guide.style.setProperty('--slide', `${dir > 0 ? 36 : -36}px`);
      guide.innerHTML = blocks.map((b, k) => `<div class="blk" style="--i:${k}">${b}</div>`).join('');
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

    function renderGoals(i) {
      $('goalsList').innerHTML = (Array.isArray(w.goals) ? w.goals : []).map((g) => {
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
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'step-btn';
        b.innerHTML = `<span class="dot-n" aria-hidden="true">${k + 1}</span><span class="step-short">${esc(s.short || `Step ${k + 1}`)}</span>`;
        b.setAttribute('aria-label', `Step ${k + 1}: ${s.short || s.title || ''}`);
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

    /* ---------- Text alternative for the stage ---------- */

    function describeScene(i) {
      const sc = STEPS[i].scene || {};
      const name = (id) => (NODES[id] ? propsFor(id, i).label || id : id);
      const items = [];
      for (const id of sc.show || []) {
        const n = NODES[id];
        if (!n) continue;
        const pr = propsFor(id, i), bits = [];
        if (pr.load !== null) bits.push(n.type === 'db' ? `${Math.round(pr.load * 100)}% full` : `${Math.round(pr.load * 100)}% busy`);
        if (pr.heat > 0) bits.push('under strain');
        if (pr.dead) bits.push('failed');
        if (pr.dim) bits.push('not involved in this step');
        if (n.type === 'crowd') bits.push(`${pr.count} people`);
        if (n.type === 'queue') bits.push(`${pr.count} waiting`);
        for (const t of pr.tags) bits.push(`“${t.text}”`);
        items.push(`${pr.label || id}${pr.sub ? ` (${pr.sub})` : ''}${bits.length ? `: ${bits.join(', ')}` : ''}`);
      }
      const styleWord = { dashed: 'occasional', off: 'unused', cut: 'broken', beat: 'health check' };
      for (const id of Object.keys(sc.links || {})) {
        const L = LINKS[id];
        if (!L) continue;
        const st = linkStyle(i, id), text = linkText(i, id);
        items.push(`Link ${name(L.from)} → ${name(L.to)}${text ? ` “${text}”` : ''}${styleWord[st] ? ` (${styleWord[st]})` : ''}`);
      }
      for (const f of sc.flows || []) {
        const legs = (f.route || []).map((r) => ({ id: String(r).replace(/^~/, ''), rev: String(r).startsWith('~') })).filter((l) => LINKS[l.id]);
        if (!legs.length) continue;
        const stops = [legs[0].rev ? LINKS[legs[0].id].to : LINKS[legs[0].id].from, ...legs.map((l) => (l.rev ? LINKS[l.id].from : LINKS[l.id].to))].map(name);
        items.push(`Moving: ${f.kind || 'request'} dots ${stops.join(' → ')}${f.bounce ? ' and back' : ''}${f.fail ? (f.fail >= 1 ? ', every one fails' : ', some fail') : ''}`);
      }
      if (sc.panel && sc.panel.lines) items.push(`${sc.panel.title || 'Summary'}: ${sc.panel.lines.map((l) => String(l).replace(/^[=!#] /, '').replace(/\s+/g, ' ')).join('; ')}`);
      $('sceneTitle').textContent = `Stage, step ${i + 1}: ${STEPS[i].title || ''}`;
      $('sceneText').innerHTML = `<ul>${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
    }

    /* ---------- Controls ---------- */

    function setPaused(v) {
      paused = v;
      svg.classList.toggle('paused', v);
      const b = $('pauseBtn');
      b.setAttribute('aria-pressed', String(v));
      b.innerHTML = v ? `${iconHtml('play')}<span>Resume</span>` : `${iconHtml('pause')}<span>Pause</span>`;
    }

    function replay() {
      if (cur < 0) return;
      setPaused(false);
      if (reduce) { stageTo(cur, true); return; }
      stageTo(cur - 1, true);   // step 1 has no previous scene, so this empties the stage
      stageTo(cur, false);
    }

    /* ================= Layout of the stage ================= */

    function layoutStage() {
      const wrapW = wrap.clientWidth;
      let W = wrapW;
      const H = svg.clientHeight || 400;
      VIEW.inlinePanel = wrapW < 520;
      if (phoneQuery.matches && plans.length) {
        // On a phone the stage keeps a readable minimum scale and pans sideways instead.
        const need = Math.max(...plans.map((pl) => (pl.bounds.x1 - pl.bounds.x0) * VIEW.phoneZ + 2 * VIEW.margin));
        const hNeed = Math.max(...plans.map((pl) => (pl.bounds.y1 - pl.bounds.y0) * VIEW.phoneZ + 2 * VIEW.margin));
        if (need > wrapW && hNeed <= H) W = Math.ceil(Math.min(need, wrapW * 2.6));
        else if (need > wrapW) W = Math.ceil(Math.min(need * H / hNeed, wrapW * 2.6));
      }
      svg.style.width = W > wrapW ? `${W}px` : '';
      VIEW.W = W;
      VIEW.H = H;
      VIEW.hud = clamp(W / 780, .86, 1.16);
      // A bigger stage may zoom further in, so the scene grows with the window instead of floating in empty space.
      VIEW.zMax = phoneQuery.matches ? 1.45 : clamp(Math.min(W / 700, H / 400), 1.45, 2.6);
      $('scrollHint').hidden = W <= wrapW + 1;
      planCameras();
    }

    function relayout() {
      const prevW = VIEW.W, prevH = VIEW.H;
      layoutStage();
      if (prevW === VIEW.W && prevH === VIEW.H) return;
      if (stageIdx >= 0) {
        for (const k of ['x', 'y', 'w', 'h']) for (let t = tweens.length - 1; t >= 0; t--) if (tweens[t].target === cam && tweens[t].key === k) tweens.splice(t, 1);
        Object.assign(cam, camTargetOf(plans[stageIdx].cam), { dirty: true });
        hud.key = '__relayout';
        setPanel(plans[stageIdx], true, 0);
      }
      renderPanelInline(cur);
      centreScroll();
    }

    function centreScroll() {
      if (wrap.scrollWidth > wrap.clientWidth) wrap.scrollLeft = (wrap.scrollWidth - wrap.clientWidth) / 2;
    }

    /* ================= Validation (schema rules 1, 2, 3, 7) ================= */

    function validate() {
      const warn = (m) => console.warn(`[diorama] ${w.id || 'walkthrough'}: ${m}`);
      if (typeof w.id !== 'string' || !KEBAB.test(w.id)) warn(`id ${JSON.stringify(w.id)} should be a kebab-case string`);
      for (const [id, L] of Object.entries(LINKS)) {
        if (!NODES[L.from] || !NODES[L.to]) warn(`link "${id}" joins a node that does not exist (rule 1)`);
      }
      STEPS.forEach((s, i) => {
        const n = i + 1, sc = s.scene || {}, show = sc.show || [], links = sc.links || {};
        for (const id of show) if (!NODES[id]) warn(`step ${n}: scene.show names unknown node "${id}" (rule 1)`);
        for (const id of Object.keys(sc.state || {})) if (!NODES[id]) warn(`step ${n}: scene.state names unknown node "${id}" (rule 1)`);
        for (const id of Object.keys(links)) {
          const L = LINKS[id];
          if (!L) warn(`step ${n}: scene.links names unknown link "${id}" (rule 1)`);
          else if (!show.includes(L.from) || !show.includes(L.to)) warn(`step ${n}: link "${id}" is shown but "${show.includes(L.from) ? L.to : L.from}" is not (rule 2)`);
        }
        (sc.flows || []).forEach((f, k) => {
          const legs = (f.route || []).map((r) => ({ id: String(r).replace(/^~/, ''), rev: String(r).startsWith('~') }));
          if (!legs.length) warn(`step ${n}: flow ${k + 1} has an empty route`);
          for (const l of legs) {
            if (!LINKS[l.id]) warn(`step ${n}: flow ${k + 1} uses unknown link "${l.id}" (rule 1)`);
            else if (!(l.id in links)) warn(`step ${n}: flow ${k + 1} uses link "${l.id}", which is not shown in this step (rule 2)`);
          }
          for (let q = 1; q < legs.length; q++) {
            const a = LINKS[legs[q - 1].id], b = LINKS[legs[q].id];
            if (!a || !b) continue;
            const shared = [a.from, a.to].some((x) => x === b.from || x === b.to);
            const end = legs[q - 1].rev ? a.from : a.to, start = legs[q].rev ? b.to : b.from;
            if (!shared) warn(`step ${n}: flow ${k + 1} links "${legs[q - 1].id}" and "${legs[q].id}" share no endpoint (rule 7)`);
            else if (end !== start) warn(`step ${n}: flow ${k + 1} arrives at "${end}" but leaves from "${start}"; prefix a link with ~ to travel it backwards (rule 7)`);
          }
        });
        if (METRICS.length > 1 && s.metrics) {
          const total = METRICS[METRICS.length - 1].id, tv = s.metrics[total];
          const parts = METRICS.slice(0, -1).map((m) => s.metrics[m.id]).filter((v) => typeof v === 'number');
          const sum = parts.reduce((a, b) => a + b, 0);
          if (typeof tv === 'number' ? Math.abs(tv - sum) > 1e-9 : parts.length > 0) warn(`step ${n}: metrics.${total} is ${tv} but the other metrics add up to ${sum} (rule 3)`);
        }
      });
      (Array.isArray(w.goals) ? w.goals : []).forEach((g, k) => {
        if (!Number.isInteger(g.step) || g.step < 0 || g.step >= STEPS.length) warn(`goal ${k + 1} points at step index ${g.step}, which does not exist (rule 1)`);
      });
      const ids = Object.keys(NODES).filter((id) => NODES[id].type !== 'zone');
      for (let a = 0; a < ids.length; a++) {
        for (let b = a + 1; b < ids.length; b++) {
          const A = NODES[ids[a]], B = NODES[ids[b]], d = Math.hypot(A.x - B.x, A.y - B.y);
          if (d < 6) warn(`nodes "${ids[a]}" and "${ids[b]}" are ${n1(d)} grid units apart; keep at least 6 (rule 7)`);
        }
      }
    }

    /* ================= Navigation ================= */

    function go(i, opt = {}) {
      if (!alive) return;
      i = clamp(i, 0, STEPS.length - 1);
      if (i !== cur || opt.force) {
        const dir = cur < 0 ? 0 : Math.sign(i - cur);
        cur = i;
        setPaused(false);
        renderGuide(i, opt.instant ? 0 : dir);
        updateMetrics(i, !opt.instant);
        renderNav(i);
        renderGoals(i);
        renderStrip(i);
        describeScene(i);
        renderPanelInline(i);
        stageTo(i, !!opt.instant);
      }
      if (opts.onStep) opts.onStep(i);
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

    $('backBtn').addEventListener('click', back);
    $('nextBtn').addEventListener('click', forward);
    $('replayBtn').addEventListener('click', replay);
    $('pauseBtn').addEventListener('click', () => setPaused(!paused));
    $('replayBtn').innerHTML = `${iconHtml('replay')}<span>Replay</span>`;
    const onMotion = (e) => {
      reduce = e.matches;
      stageTo(cur, true);
    };
    motionQuery.addEventListener('change', onMotion);
    let resizeQueued = false;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeQueued) return;
      resizeQueued = true;
      nextFrame(() => { resizeQueued = false; relayout(); });
    });
    resizeObserver.observe(wrap);

    function destroy() {
      if (!alive) return;
      alive = false;
      for (const t of timeouts) clearTimeout(t);
      for (const f of frames) cancelAnimationFrame(f);
      timeouts.clear();
      frames.clear();
      tweens.length = 0;
      timers.length = 0;
      uiAnims.length = 0;
      flows = [];
      packets = [];
      resizeObserver.disconnect();
      motionQuery.removeEventListener('change', onMotion);
      host.innerHTML = '';
    }

    /* ================= Start ================= */

    if (!validated.has(w)) { validated.add(w); validate(); }
    renderHeader();
    renderLegend();
    buildMetrics();
    buildStrip();
    plans = STEPS.map((_, i) => buildPlan(i));
    layoutStage();
    const start = clamp(Math.floor(Number(opts.start) || 0), 0, STEPS.length - 1);
    setPaused(false);
    if (start === 0) {
      // Opening on the first step lets its objects drop in; deep links open settled.
      Object.assign(cam, camTargetOf(plans[0].cam), { dirty: true });
      go(0);
    } else {
      go(start, { instant: true });
    }
    centreScroll();
    nextFrame(frame);
    nextFrame(() => nextFrame(() => $('stepStrip').classList.remove('still')));

    return {
      id: w.id,
      get step() { return cur; },
      get stepCount() { return STEPS.length; },
      go: (i) => go(i),
      next: () => go(cur + 1),
      prev: () => go(cur - 1),
      replay,
      togglePause: () => setPaused(!paused),
      focusTitle: () => $('title').focus({ preventScroll: true }),
      destroy,
    };
  }

  /* ================= Shared page pieces ================= */

  const typingIn = (t) => !!(t && (t.isContentEditable || (t.closest && t.closest('input, textarea, select'))));
  const pillHtml = (icon, text, tone) => `<span class="pill tone-${tone}">${icon ? iconHtml(icon) : ''}${esc(text)}</span>`;
  const tagHtml = (text, tone) => `<span class="tag tone-${tone}">${esc(text)}</span>`;

  // ←/→ step, R replay, Space pause. Returns true when the key was used.
  function stepKey(e, view) {
    if (!view || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || typingIn(e.target)) return false;
    if (e.key === 'ArrowRight') view.next();
    else if (e.key === 'ArrowLeft') view.prev();
    else if (e.key === 'r' || e.key === 'R') view.replay();
    // Space always means pause, even on a focused button (Enter still activates buttons).
    else if (e.key === ' ' || e.key === 'Spacebar') view.togglePause();
    else return false;
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

  /* ================= Single-file page ================= */

  function startSingle(w) {
    if (!claimStart('startSingle')) return;
    const app = appRoot('dio-single');
    app.innerHTML = '<main class="dio-main"></main>';
    const main = app.firstChild;
    const bad = unusable(w);
    if (bad) {
      warn(`the walkthrough cannot be shown: ${bad}`);
      main.innerHTML = statusMarkup({
        title: 'Walkthrough', heading: 'This walkthrough cannot be shown', tone: 'red', icon: 'alert', alert: true,
        body: `<p>The <code>&lt;script type="application/json" id="walkthrough"&gt;</code> block in this file cannot be used: ${esc(bad)}. The browser console has details.</p>`,
      });
      return;
    }
    const hashOf = (i) => `#/${encodeURIComponent(w.id)}/${i + 1}`;
    const parseHash = () => {
      const m = /^#\/([^/]+)\/(\d+)$/.exec(location.hash);
      if (!m || decodeURIComponent(m[1]) !== w.id) return null;
      const n = Number(m[2]);
      return n >= 1 && n <= w.steps.length ? n - 1 : null;
    };
    const view = mountWalkthrough(main, w, {
      labels: mergeLabels(w.labels),
      start: parseHash() ?? 0,
      onStep: (i) => { if (location.hash !== hashOf(i)) location.replace(hashOf(i)); },
    });
    window.addEventListener('hashchange', () => { const i = parseHash(); if (i !== null) view.go(i); });
    document.addEventListener('keydown', (e) => stepKey(e, view));
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
    const data = { read: {}, last: {}, recent: null };
    if (enabled) {
      try {
        const v = JSON.parse(localStorage.getItem(key) || 'null');
        if (isObject(v)) {
          if (isObject(v.read)) Object.assign(data.read, v.read);
          if (isObject(v.last)) Object.assign(data.last, v.last);
          if (typeof v.recent === 'string') data.recent = v.recent;
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

  // Step titles, short labels and marked terms of one walkthrough, for search.
  const stepIndexCache = new WeakMap();
  function stepIndex(w) {
    let list = stepIndexCache.get(w);
    if (!list) {
      list = w.steps.map((s, i) => {
        const html = [].concat(s.body || [], s.callout && s.callout.text ? [s.callout.text] : []).join(' ');
        const terms = [...html.matchAll(/<span\s+class=["']term["']\s*>([\s\S]*?)<\/span>/gi)].map((m) => plainText(m[1]));
        return { i, title: String(s.title || ''), short: String(s.short || ''), terms: [...new Set(terms)] };
      });
      stepIndexCache.set(w, list);
    }
    return list;
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
    const L = mergeLabels(c.labels);
    const outline = buildOutline(c);
    const opt = outline.opt;
    const progress = progressStore(cid, opt.progress);
    const P = progress.data;
    const isRead = (e) => opt.progress && !!P.read[e.id];
    const mapKey = `diorama:${cid}:map`;
    const drawerQuery = matchMedia('(max-width: 899px)');
    const list = opt.ordered ? 'ol' : 'ul';
    const checked = new Set();   // ids whose title and summary were compared with collection.js

    let view = null;             // the mounted walkthrough view, if any
    let currentId = null;        // the item shown in the main area (loading, open or failed)
    let navToken = 0;            // invalidates loads that finish after the reader moved on
    let pendingStep = null;      // { id, step: 'last' } for Back into the previous walkthrough
    let firstRoute = true, wantFocus = false, gAt = 0, drawerOpen = false;
    let collapsed = false;
    try { collapsed = localStorage.getItem(mapKey) === 'collapsed'; } catch (err) { /* storage blocked */ }

    app.innerHTML = `<header class="app-bar">
  <button class="icon-btn" type="button" data-ref="drawerBtn" aria-controls="dio-map" aria-expanded="false">${iconHtml('menu')}<span class="sr-only">Contents</span></button>
  <a class="app-bar-title" href="#/">${esc(c.title || '')}</a>
  <button class="icon-btn" type="button" data-ref="barSearch" aria-haspopup="dialog">${iconHtml('search')}<span class="sr-only">Search</span></button>
</header>
<div class="app-scrim" data-ref="scrim" hidden></div>
<nav class="map card" id="dio-map" data-ref="map" aria-label="Contents">
  <div class="map-top">
    <a class="map-title" href="#/"><span class="map-kicker">${esc(L.home)}</span><span class="map-name">${esc(c.title || '')}</span></a>
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
      if (view) { view.destroy(); view = null; }
    }

    function resetScroll() {
      $('main').scrollTop = 0;
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
    }

    function focusMain() {
      const h = $('main').querySelector('h1');
      if (h) h.focus({ preventScroll: true });
    }

    // Where Continue leads: the walkthrough last visited if unfinished, else the next unread one.
    function continueTarget() {
      const open = outline.open;
      const recent = open.find((e) => e.id === P.recent);
      if (recent && !P.read[recent.id]) return { e: recent, step: P.last[recent.id] || 0 };
      const from = recent ? open.indexOf(recent) + 1 : 0;
      const e = open.slice(from).concat(open.slice(0, from)).find((x) => !P.read[x.id]);
      return e ? { e, step: P.last[e.id] || 0 } : null;
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
        if (t) s += `<a class="btn primary" href="#/${t.e.id}/${t.step + 1}"><span>${esc(L.continue)}: ${esc(t.e.title)}${t.step ? ` · step ${t.step + 1}` : ''}</span>${iconHtml('arrow')}</a>`;
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

    function showLoadError(e, reason, focus) {
      const file = fileOf(e.id);
      warn(`could not open ${file}: ${reason}`);
      $('main').innerHTML = statusMarkup({
        crumb: crumbOf(e), title: e.title, summary: e.summary, heading: 'This walkthrough could not be opened', tone: 'red', icon: 'alert', alert: true,
        body: `<p>File <code>${esc(file)}</code>: ${esc(reason)}</p><p class="muted">The rest of the collection still works. Fix the file, then try again.</p>`,
        actions: `<button class="btn primary" type="button" data-act="retry">${iconHtml('replay')}<span>Try again</span></button><a class="btn" href="#/">${iconHtml('home')}<span>${esc(L.home)}</span></a>`,
      });
      $('main').querySelector('[data-act="retry"]').addEventListener('click', () => { currentId = null; openItem(e.id, null, true, true); });
      if (focus) focusMain();
    }

    function stepped(e, i, last) {
      const h = `#/${e.id}/${i + 1}`;
      if (location.hash !== h) location.replace(h);
      if (!opt.progress) return;
      P.last[e.id] = i;
      P.recent = e.id;
      if (i === last && !P.read[e.id]) { P.read[e.id] = true; renderMap(); }
      progress.save();
    }

    // step: a 0-based index, 'last', or null for "where the reader left off".
    async function openItem(id, step, focusNew, focusSame) {
      const e = outline.byId.get(id);
      if (!e || !e.openable) { showUnavailable(id, e); if (focusNew) focusMain(); return; }
      if (view && view.id === id && currentId === id) {
        // A bare #/<id> for the open walkthrough keeps the current step (and restores the step in the URL).
        view.go(step === null ? view.step : step === 'last' ? view.stepCount - 1 : step);
        if (focusSame) view.focusTitle();
        return;
      }
      teardown();
      currentId = id;
      renderMap();
      const token = ++navToken;
      const file = fileOf(id);
      document.title = `${e.title} · ${c.title || ''}`;
      if (!walkthroughs.has(id)) {
        $('main').innerHTML = statusMarkup({ crumb: crumbOf(e), title: e.title, summary: e.summary, heading: 'Loading…', body: `<p>Reading <code>${esc(file)}</code>.</p>`, icon: 'clock', busy: true });
      }
      let w;
      try {
        w = await loadWalkthrough(id);
      } catch (err) {
        if (token === navToken) showLoadError(e, err && err.reason ? err.reason : String(err), focusNew);
        return;
      }
      if (token !== navToken) return;
      const bad = unusable(w);
      if (bad) { showLoadError(e, `the walkthrough cannot be drawn: ${bad}.`, focusNew); return; }
      if (!checked.has(id)) {
        checked.add(id);
        if (w.title !== e.title) warn(`collection.js calls "${id}" ${JSON.stringify(e.title)} but ${file} says ${JSON.stringify(w.title)}; keep the titles identical`);
        if (w.summary !== e.summary) warn(`collection.js and ${file} give different summaries for "${id}"; keep them identical`);
      }
      const last = w.steps.length - 1;
      let start = step === 'last' ? last : step;
      if (start === null) start = opt.progress && Number.isInteger(P.last[id]) ? P.last[id] : 0;
      const labels = mergeLabels(c.labels, w.labels);
      const k = outline.open.indexOf(e);
      const prevE = opt.ordered && k > 0 ? outline.open[k - 1] : null;
      const nextE = opt.ordered && k < outline.open.length - 1 ? outline.open[k + 1] : null;
      resetScroll();
      view = mountWalkthrough($('main'), w, {
        labels, start: clamp(start, 0, last), crumb: crumbOf(e), searchHint: true,
        docTitle: `${w.title || e.title} · ${c.title || ''}`, minutes: e.minutes, level: e.level,
        prev: prevE ? { title: prevE.title, go: () => navigate(prevE.id, 'last') } : null,
        end: nextE
          ? { label: `${labels.next}: ${nextE.title}`, icon: 'arrow', go: () => navigate(nextE.id, 0) }
          : { label: L.home, icon: 'home', go: navigateHome },
        onStep: (i) => stepped(e, i, last),
      });
      if (focusNew) view.focusTitle();
    }

    /* ---------- Routing: #/ home, #/<id> where the reader left off, #/<id>/<step> ---------- */

    function parseRoute() {
      const m = /^#\/([^/]+)(?:\/(\d+))?\/?$/.exec(location.hash);
      if (!m) return { home: true };
      return { id: decodeURIComponent(m[1]), step: m[2] ? Math.max(0, Number(m[2]) - 1) : null };
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
      let step = r.step;
      if (step === null && pendingStep && pendingStep.id === r.id) step = pendingStep.step;
      pendingStep = null;
      openItem(r.id, step, focusNew, focusSame);
    }

    function navigate(id, step) {
      wantFocus = true;
      let h = `#/${id}/${step + 1}`;
      if (step === 'last') { pendingStep = { id, step }; h = `#/${id}`; }
      if (location.hash === h) route(); else location.hash = h;
    }

    function navigateHome() {
      wantFocus = true;
      if (location.hash === '#/') route(); else location.hash = '#/';
    }

    /* ---------- Search ---------- */

    const search = { open: false, opener: null, primed: false, pending: 0, failed: 0 };

    // The first search reads every listed walkthrough, so steps and terms of unopened ones are found too.
    function primeSearch() {
      search.primed = true;
      for (const e of outline.open) {
        if (walkthroughs.has(e.id)) continue;
        search.pending++;
        loadWalkthrough(e.id)
          .catch((err) => { search.failed++; warn(`search could not read ${fileOf(e.id)}: ${err && err.reason ? err.reason : err}`); })
          .finally(() => { search.pending--; if (search.open) renderResults(); });
      }
    }

    function findHits(q) {
      const tokens = q.split(/\s+/).filter(Boolean);
      const has = (text) => { const low = text.toLowerCase(); return tokens.every((t) => low.includes(t)); };
      const hits = [];
      for (const e of outline.open) {
        if (has(`${e.title} ${e.summary}`)) hits.push({ e, step: null, title: e.title, sub: e.summary, href: `#/${e.id}`, rank: e.title.toLowerCase().includes(q) ? 0 : 1 });
        const w = walkthroughs.get(e.id);
        if (!w || unusable(w)) continue;
        for (const st of stepIndex(w)) {
          if (!has(`${st.title} ${st.short} ${st.terms.join(' ')}`)) continue;
          hits.push({ e, step: st.i, title: st.title, sub: st.terms.join(' · '), href: `#/${e.id}/${st.i + 1}`, rank: st.title.toLowerCase().includes(q) ? 2 : 3 });
        }
      }
      return { tokens, hits: hits.sort((a, b) => a.rank - b.rank).slice(0, 40) };
    }

    function renderResults() {
      const q = $('searchInput').value.trim().toLowerCase();
      const { tokens, hits } = q ? findHits(q) : { tokens: [], hits: outline.open.map((e) => ({ e, step: null, title: e.title, sub: e.summary, href: `#/${e.id}` })) };
      $('searchResults').innerHTML = hits.map((h) => {
        const where = h.step === null ? `${h.e.num ? `${h.e.num} · ` : ''}walkthrough` : `${h.e.title} · step ${h.step + 1}`;
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
      stepKey(ev, view);
    });

    /* ---------- Start ---------- */

    applyMap();
    window.addEventListener('hashchange', route);
    route();
  }

  window.Diorama = Object.freeze({
    version: VERSION,
    collection: registerCollection,
    walkthrough: registerWalkthrough,
    startCollection,
    startSingle,
  });
})();
