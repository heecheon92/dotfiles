/*
 * Diorama isometric stage ("iso"): draws scenes of nodes, links and moving dots on an
 * illustrated isometric floor, with the reader's zoom, pan and tracing.
 *
 * A template uses it in two halves. model(data) reads nodes, links and a list of scenes once,
 * reports shape problems and offers checks, stills and text descriptions. parts() gives the
 * stage's markup to place in the template's page, and mount() brings it to life there.
 * The contract is described in the diorama-maker skill: references/templates.md.
 *
 * The shell (engine/diorama.js) loads this file on demand. It defines the stage and nothing else.
 */
Diorama.defineStage('iso', (kit) => {
  'use strict';

  const { esc, clamp, lerp, n1, n2, linear, inOut, outCubic, outBack, isObject, GLYPH, FALLBACK_GLYPH, iconHtml, toneOf, restartAnim, lifetime } = kit;
  const motionQuery = kit.motion;
  const NS = 'http://www.w3.org/2000/svg';
  const phoneQuery = matchMedia('(max-width: 600px)');

  /* ================= Small helpers ================= */

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

  /* ================= Icons on the stage (the glyphs themselves come from the shell) ================= */

  // Icons for the page's own controls; kept apart so walkthrough data cannot name them.
  const UI_GLYPH = {
    'zoom-in': '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.4 15.4 5 5M7.7 10.5h5.6M10.5 7.7v5.6"/>',
    'zoom-out': '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.4 15.4 5 5M7.7 10.5h5.6"/>',
    fit: '<path d="M4 9V5.5C4 4.7 4.7 4 5.5 4H9M15 4h3.5c.8 0 1.5.7 1.5 1.5V9M20 15v3.5c0 .8-.7 1.5-1.5 1.5H15M9 20H5.5C4.7 20 4 19.3 4 18.5V15"/>',
  };

  function glyph(name, cx, cy, size = 24, sw = 1.9) {
    const k = size / 24;
    return `<g class="gl" transform="translate(${n1(cx - 12 * k)} ${n1(cy - 12 * k)}) scale(${n2(k)})" stroke-width="${n2(sw)}">${GLYPH[name] || FALLBACK_GLYPH}</g>`;
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

  // Separating-axis test between two convex polygons; polyBoxOverlap takes an axis-aligned box as the second.
  function convexOverlap(pa, pb) {
    for (const poly of [pa, pb]) {
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], c = poly[(i + 1) % poly.length], ax = [a[1] - c[1], c[0] - a[0]];
        if (!ax[0] && !ax[1]) continue;
        let p0 = Infinity, p1 = -Infinity, r0 = Infinity, r1 = -Infinity;
        for (const q of pa) { const d = q[0] * ax[0] + q[1] * ax[1]; p0 = Math.min(p0, d); p1 = Math.max(p1, d); }
        for (const q of pb) { const d = q[0] * ax[0] + q[1] * ax[1]; r0 = Math.min(r0, d); r1 = Math.max(r1, d); }
        if (p1 <= r0 || r1 <= p0) return false;
      }
    }
    return true;
  }
  const polyBoxOverlap = (poly, b) => convexOverlap(poly, boxCorners(b));

  /* ================= Palette and SVG defs ================= */

  const COLORS = ['blue', 'orange', 'yellow', 'green', 'violet', 'gray'];
  const KINDS = ['request', 'response', 'heavy', 'signal', 'write', 'message'];
  const STYLES = ['solid', 'dashed', 'off', 'cut', 'beat'];
  const colorOf = (c) => (COLORS.includes(c) ? c : 'gray');

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

  // The name on a block's front face: the size chosen to fit, the rows, and the box they cover.
  function faceRows(cx, cy, t, maxW) {
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
    const box = { x0: Infinity, y0: y, x1: -Infinity, y1: y };
    for (const r of rows) {
      const hw = textW(r.t, r.size, r.w) / 2;
      box.x0 = Math.min(box.x0, cx - hw); box.x1 = Math.max(box.x1, cx + hw);
      r.y = y + r.size * .92;
      y += lh(r);
    }
    box.y1 = y;
    return { rows, box, size: Math.min(...rows.map((r) => r.size)) };
  }

  function faceLabel(cx, t, L) {
    if (t.a <= .01 || !L.rows.length) return '';
    let s = `<g class="deco"${t.a < .99 ? ` opacity="${n2(t.a)}"` : ''}>`;
    for (const r of L.rows) s += `<text class="${r.cls}" x="${n1(cx)}" y="${n1(r.y)}" style="font-size:${r.size}px">${esc(r.t)}</text>`;
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
    const ly = pr.topC[1] + (7 * s + h) * .4, texts = [];
    for (const t of p.texts) {
      if (t.a <= .01 || (!t.label && !t.sub)) continue;
      const L = faceRows(pr.topC[0], ly, t, 28 * s * .86);
      if (!L.rows.length) continue;
      deco += faceLabel(pr.topC[0], t, L);
      texts.push({ box: L.box, size: L.size });
    }
    return { shadow: pr.shadow, body: pr.body, outline: pr.outline, deco, wash: pr.sil, hull: pr.hull, crossAt: pr.topC, texts };
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
    const texts = [];
    for (const t of p.texts) {
      if (!t.label || t.a <= .01) continue;
      const o = P(x0 + 1.2, y1 - .5), text = String(t.label).toUpperCase();
      // The floor matrix lays text flat on the grid, reading along +x.
      s += `<text class="zone-t" transform="matrix(1 .5 -1 .5 ${n1(o[0])} ${n1(o[1])})"${t.a < .99 ? ` opacity="${n2(t.a)}"` : ''}>${esc(text)}</text>`;
      // Its outline on screen (10.5 px, 1.6 px letter spacing as in the stylesheet), for the overlap check.
      const len = textW(text, 10.5, 800) + 1.6 * text.length, flat = (u, v) => [o[0] + u - v, o[1] + .5 * u + .5 * v];
      texts.push({ poly: [flat(0, -8.5), flat(len, -8.5), flat(len, 2.5), flat(0, 2.5)], size: 10.5 });
    }
    return { floor: s, extent: corners, hull: null, texts };
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

  /* ================= Contract: data check and page parts ================= */

  // Why the data cannot be drawn at all, or null; smaller mistakes are reported by model().
  function unusable(data) {
    if (data.nodes !== undefined && (typeof data.nodes !== 'object' || Array.isArray(data.nodes))) return '"nodes" is not an object';
    return null;
  }

  // The stage's markup in three pieces that a template places in its page: the camera, replay and
  // pause buttons; the scene with its scroll hint and inline summary card; the scene's text
  // alternative. mount() finds them again by their data-ref attributes. The indentation suits
  // the step story's page; it has no effect on how the page looks or behaves.
  function parts(opts = {}) {
    return {
      controls: `<div class="cam-controls" role="group" aria-label="Camera">
            <button data-ref="zoomOutBtn" class="btn small icon" type="button" aria-label="Zoom out" aria-keyshortcuts="-" title="Zoom out (-)">${iconHtml('zoom-out', UI_GLYPH)}</button>
            <button data-ref="zoomInBtn" class="btn small icon" type="button" aria-label="Zoom in" aria-keyshortcuts="+" title="Zoom in (+)">${iconHtml('zoom-in', UI_GLYPH)}</button>
            <button data-ref="fitBtn" class="btn small icon" type="button" aria-label="Fit the scene" aria-keyshortcuts="F" title="Fit the scene (F)">${iconHtml('fit', UI_GLYPH)}</button>
          </div>
          <button data-ref="replayBtn" class="btn small" type="button" title="${esc(opts.replayTitle || 'Replay (R)')}"></button>
          <button data-ref="pauseBtn" class="btn small" type="button" aria-pressed="false" title="Pause or resume (Space)"></button>`,
      scene: `<div data-ref="sceneWrap" class="scene-wrap">
        <svg data-ref="scene" class="scene st" role="group" aria-labelledby="dio-scene-title" aria-describedby="dio-scene-text">
          <title id="dio-scene-title" data-ref="sceneTitle">Stage</title>
          <defs data-ref="sceneDefs"></defs>
          <rect class="deco" x="-5000" y="-5000" width="10000" height="10000" fill="url(#iso-grid)" mask="url(#grid-mask)" aria-hidden="true"/>
          <g data-ref="layerGeo" opacity="0" aria-hidden="true"></g>
          <g data-ref="layerFloor" aria-hidden="true"></g>
          <g data-ref="layerLinks" aria-hidden="true"></g>
          <g data-ref="layerPackets" aria-hidden="true"></g>
          <g data-ref="layerEnts" aria-hidden="true"></g>
          <g data-ref="layerFx" aria-hidden="true"></g>
          <g data-ref="layerOver" aria-hidden="true"></g>
          <g data-ref="layerFocus"></g>
          <g data-ref="layerHud" aria-hidden="true"></g>
        </svg>
      </div>
      <p data-ref="scrollHint" class="scroll-hint" hidden>Swipe sideways to see the whole stage.</p>
      <div data-ref="panelInline" class="panel-inline" hidden></div>`,
      text: '<div id="dio-scene-text" data-ref="sceneText" class="sr-only"></div>',
    };
  }

  // A moving dot of each kind, drawn around (0, 0): on the stage and in a template's legend.
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

  // The legend's picture of a kind of moving dot, and the kind an unknown one falls back to.
  const flowKind = (kind) => (KINDS.includes(kind) ? kind : 'request');
  const flowIcon = (kind) => `<svg viewBox="-8 -8 16 16" aria-hidden="true">${packetShape(flowKind(kind))}</svg>`;

  /* ================= Model ================= */
  // What follows from the data alone: the layout of every scene at rest, camera planning for a
  // given stage size, still pictures, text descriptions and the checks a stage can make. mount()
  // and the template's contact sheet both draw from it.

  const internals = new WeakMap();   // model → what mount() needs
  const SCENE_KEYS = ['show', 'state', 'links', 'flows', 'panel'];
  // The stage size the checks and the stills assume: about what a 1440 × 900 window leaves for the stage.
  const REF = { W: 960, H: 540 };

  // Camera limits for a stage of W × H px. A bigger stage may zoom further in, so the scene grows
  // with the window instead of floating in empty space.
  function viewFor(W, H, o = {}) {
    return { W, H, margin: 26, zMin: .3, zMax: o.phone ? 1.45 : clamp(Math.min(W / 700, H / 400), 1.45, 2.6), hud: clamp(W / 780, .86, 1.16), inlinePanel: !!o.inline };
  }
  const viewRect = (c, V) => ({ x: c.cx - V.W / 2 / c.z, y: c.cy - V.H / 2 / c.z, w: V.W / c.z, h: V.H / c.z });

  // data: { nodes, links, scenes: [{ scene, name, base }], groups: [[k, ...], ...] }.
  function buildModel(data) {
    /* ================= Shapes ================= */
    // Everything below reads cleaned copies of the data. A field of the wrong type is reported here,
    // naming the scene and the field, and is then treated as absent, so one malformed field never
    // stops a scene from drawing. Problems of the nodes and links go to shapes, those of scene k
    // to sceneShapes[k].

    const shapes = [], sceneShapes = [];
    let into = shapes;
    const bad = (where, field, what, end = 'so it is ignored') => into.push(`${where}: ${field} ${what}, ${end}`);
    const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

    const NODES = {};
    for (const [id, n] of Object.entries(isObject(data.nodes) ? data.nodes : {})) {
      if (!isObject(n)) bad(`node "${id}"`, 'the entry', 'is not an object', 'so the node is left out');
      else if (!isNum(n.x) || !isNum(n.y)) bad(`node "${id}"`, '"x" or "y"', 'is not a number', 'so the node is left out');
      else NODES[id] = n;
    }
    const LINKS = {};
    if (data.links != null && !isObject(data.links)) bad('the walkthrough', '"links"', 'is not an object', 'so no links are drawn');
    for (const [id, L] of Object.entries(isObject(data.links) ? data.links : {})) {
      if (isObject(L) && typeof L.from === 'string' && typeof L.to === 'string') LINKS[id] = L;
      else bad(`link "${id}"`, 'the entry', 'is not an object with a "from" and a "to"', 'so the link is left out');
    }

    // A scene's keys; for an option (inherit), a key that is malformed falls back to the step's value.
    function cleanScene(raw, where, inherit) {
      const out = {};
      if (raw == null) return out;
      const end = inherit ? "so it is ignored and the step's value is used" : 'so it is ignored';
      if (!isObject(raw)) { bad(where, 'scene', 'is not an object', end); return out; }
      if ('show' in raw) {
        const v = raw.show ?? [];
        if (!Array.isArray(v)) bad(where, 'scene.show', 'is not a list of node ids', end);
        else {
          out.show = v.filter((id) => typeof id === 'string');
          if (out.show.length < v.length) bad(where, 'scene.show', 'has an entry that is not a node id', 'so that entry is ignored');
        }
      }
      if ('state' in raw) {
        const v = raw.state ?? {};
        if (!isObject(v)) bad(where, 'scene.state', 'is not an object', end);
        else {
          out.state = {};
          for (const [id, st] of Object.entries(v)) {
            if (!isObject(st)) { bad(where, `scene.state.${id}`, 'is not an object'); continue; }
            const s = { ...st };
            if (st.tags != null && !Array.isArray(st.tags)) { bad(where, `scene.state.${id}.tags`, 'is not a list'); delete s.tags; }
            else if (st.tags) {
              s.tags = st.tags.filter(isObject);
              if (s.tags.length < st.tags.length) bad(where, `scene.state.${id}.tags`, 'has an entry that is not an object', 'so that entry is ignored');
            }
            out.state[id] = s;
          }
        }
      }
      if ('links' in raw) {
        const v = raw.links ?? {};
        if (!isObject(v)) bad(where, 'scene.links', 'is not an object', end);
        else {
          out.links = {};
          for (const [id, l] of Object.entries(v)) {
            if (l != null && !isObject(l)) bad(where, `scene.links.${id}`, 'is not an object', 'so the link is drawn without its label or style');
            out.links[id] = isObject(l) ? l : {};
          }
        }
      }
      if ('flows' in raw) {
        const v = raw.flows ?? [];
        if (!Array.isArray(v)) bad(where, 'scene.flows', 'is not a list', end);
        else out.flows = v.filter((f, j) => (isObject(f) && Array.isArray(f.route)) || (bad(where, `flow ${j + 1}`, 'is not an object with a "route" list'), false));
      }
      if ('panel' in raw) {
        const v = raw.panel;
        if (v == null) out.panel = null;
        else if (!isObject(v) || !Array.isArray(v.lines)) bad(where, 'scene.panel', 'is not an object with a "lines" list', end);
        else out.panel = v;
      }
      return out;
    }

    /* ================= Scenes ================= */
    // SCENES[k] is { scene } for scene k of the data. A scene with a base (an earlier scene) is a
    // variant of it: its own scene keys in place of the base's, everything else inherited.

    const SCENES = [], META = [];
    (Array.isArray(data.scenes) ? data.scenes : []).forEach((s, k) => {
      const name = String(s.name ?? `scene ${k + 1}`);
      const base = Number.isInteger(s.base) && s.base >= 0 && s.base < k ? SCENES[s.base].scene : null;
      into = sceneShapes[k] = [];
      const own = cleanScene(s.scene, name, !!base);
      let scene = own;
      if (base) {
        scene = { ...base };
        for (const key of SCENE_KEYS) if (key in own) scene[key] = own[key];
      }
      SCENES.push({ scene });
      META.push({ name });
    });
    into = shapes;

    // Scenes framed together: one camera holds every scene of a group (a try step's base and its
    // options), so moving between them never moves the camera. A scene in no group frames alone.
    const GROUPS = [], groupIndex = [];
    for (const g of Array.isArray(data.groups) ? data.groups : []) {
      const ks = [...new Set(Array.isArray(g) ? g : [])].filter((k) => Number.isInteger(k) && k >= 0 && k < SCENES.length && groupIndex[k] === undefined);
      if (!ks.length) continue;
      for (const k of ks) groupIndex[k] = GROUPS.length;
      GROUPS.push(ks);
    }
    SCENES.forEach((_, k) => { if (groupIndex[k] === undefined) { groupIndex[k] = GROUPS.length; GROUPS.push([k]); } });

    /* ================= Per-scene node state ================= */

    function propsFor(id, i) {
      const n = NODES[id], st = ((SCENES[i] && SCENES[i].scene && SCENES[i].scene.state) || {})[id] || {};
      const dflt = n.type === 'crowd' ? 12 : n.type === 'queue' ? 3 : 0;
      return {
        load: typeof st.load === 'number' ? clamp(st.load, 0, 1) : null,
        heat: clamp(Number(st.heat) || 0, 0, 1),
        dead: st.dead ? 1 : 0,
        dim: st.dim ? 1 : 0,
        count: typeof st.count === 'number' ? st.count : (typeof n.count === 'number' ? n.count : dflt),
        label: String(st.label ?? n.label ?? ''),
        sub: String(st.sub ?? n.sub ?? ''),
        tags: (st.tags || []).map((t) => ({ text: String(t.text ?? ''), tone: toneOf(t.tone), icon: typeof t.icon === 'string' ? t.icon : '' })),
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
      SCENES.forEach((s, i) => { if ((s.scene && s.scene.show || []).includes(id)) m = Math.max(m, Math.ceil(propsFor(id, i).count)); });
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
    const stepLinks = (i) => (i >= 0 && SCENES[i].scene && SCENES[i].scene.links) || {};
    function linkStyle(i, id) { const s = (stepLinks(i)[id] || {}).style; return STYLES.includes(s) ? s : 'solid'; }
    function linkText(i, id) { const v = stepLinks(i)[id] || {}; return String('label' in v ? (v.label ?? '') : (LINKS[id].label ?? '')); }
    const linkLabelSpec = (text, style) => ({ lines: [{ t: text, size: 9.5, w: 700 }], tone: style === 'cut' ? 'red' : style === 'off' ? 'gray' : 'paper' });

    /* ================= Scene plans: layout at rest ================= */

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

    // Places every pill of scene i. `items` names each placed box, for the overlap check (rule 8).
    function layoutOverlays(i, plan, base, sides) {
      const ctx = { hulls: base.hulls, samples: base.samples, pills: [], labels: [] };
      const out = { cost: 0, entLabels: {}, linkLabels: {}, items: [] };
      const nameOf = (id) => JSON.stringify(plan.props[id].label || id);
      for (const id of plan.show) {
        const info = plan.ents[id];
        if (!info.d.hull) continue;
        const side = sides[id] || 'above';
        stackOf(NODES[id], plan.props[id]).forEach((it, k) => {
          const [w, h] = stackItemSize(it), [x, y] = stackPos(info.d, side, k, w);
          const box = boxAt(x, y, w, h);
          out.cost += placementCost(box, ctx, null) + STACK_SIDES[side];
          ctx.pills.push(box);
          out.items.push({ box, what: it.gauge ? `the gauge on ${nameOf(id)}` : `tag ${JSON.stringify(String(it.tag.text ?? ''))} on ${nameOf(id)}` });
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
        out.items.push({ box: boxAt(best.x, best.y, w, h), what: `the label ${nameOf(id)}` });
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
        out.items.push({ box: boxAt(best.x, best.y, w, h), what: `link label ${JSON.stringify(text)}` });
      }
      out.ctx = ctx;
      return out;
    }

    function buildPlan(i) {
      const sc = SCENES[i].scene || {};
      const show = (sc.show || []).filter((id) => NODES[id]);
      const plan = { i, show, props: {}, ents: {}, labels: {}, linkIds: [], hullIds: [], panel: sc.panel && sc.panel.lines ? sc.panel : null };
      const base = { hulls: [], samples: [] };
      const pts = [];
      for (const id of show) {
        const n = NODES[id], pr = propsFor(id, i);
        plan.props[id] = pr;
        const d = drawEntity(shell(id), n, restParams(pr));
        plan.ents[id] = { d, labelAt: null, side: 'above' };
        if (d.extent) pts.push(...d.extent);
        if (d.hull) { base.hulls.push(d.hull); plan.hullIds.push(id); pts.push(...d.hull); }
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
      // Text drawn on an object (a block's name on its face, a zone's name on the floor) is checked
      // for overlaps as well, against everything except its own object.
      const texts = [];
      for (const id of show) {
        for (const t of plan.ents[id].d.texts || []) {
          const what = `the ${NODES[id].type === 'zone' ? 'zone name' : 'name'} ${JSON.stringify(plan.props[id].label || id)}`;
          texts.push(t.box ? { box: t.box, what, own: id, size: t.size } : { poly: t.poly, what, own: id, size: t.size });
          pts.push(...(t.box ? boxCorners(t.box) : t.poly));
        }
      }
      for (const b of best.ctx.pills.concat(best.ctx.labels)) pts.push(...boxCorners(b));
      plan.bounds = pts.length ? bboxOf(pts) : { x0: -100, y0: -60, x1: 100, y1: 60 };
      plan.ctx = best.ctx;
      plan.items = best.items.concat(texts);
      plan.texts = texts;
      return plan;
    }

    /* ================= Camera ================= */
    // V is a stage size from viewFor(). Plans do not depend on the stage size; cameras do.

    function fitCamera(b, V) {
      const bw = Math.max(40, b.x1 - b.x0), bh = Math.max(40, b.y1 - b.y0);
      const z = clamp(Math.min(V.zMax, (V.W - 2 * V.margin) / bw, (V.H - 2 * V.margin) / bh), V.zMin, V.zMax);
      return { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, z };
    }

    // Keeps the previous framing when the new content still fits with room to spare.
    function keepsPrevious(prev, next, b, V) {
      if (!prev) return false;
      if (!(prev.z <= next.z + 1e-6 && prev.z >= next.z * .9)) return false;
      const v = viewRect(prev, V), m = 12 / prev.z;
      if (b.x0 < v.x + m || b.y0 < v.y + m || b.x1 > v.x + v.w - m || b.y1 > v.y + v.h - m) return false;
      return Math.abs(next.cx - prev.cx) < .15 * v.w && Math.abs(next.cy - prev.cy) < .18 * v.h;
    }

    function cardWorldRect(c, corner, cw, ch, V) {
      const v = viewRect(c, V), m = 12;
      const sx = corner[1] === 'r' ? V.W - m - cw : m;
      const sy = corner[0] === 'b' ? V.H - m - ch - 3 : m;
      return { x0: v.x + sx / c.z, y0: v.y + sy / c.z, x1: v.x + (sx + cw) / c.z, y1: v.y + (sy + ch + 3) / c.z };
    }

    function cardHits(r, ctx) {
      const pr = inflate(r, 4);
      return ctx.hulls.some((h) => polyBoxOverlap(h, pr)) || ctx.pills.concat(ctx.labels).some((b) => overlapArea(pr, b) > 0)
        || (ctx.texts || []).some((t) => (t.box ? overlapArea(pr, t.box) > 0 : polyBoxOverlap(t.poly, pr)));
    }

    // Docks the summary card in a corner: the largest zoom at which, in one corner, every card of the
    // step (a try step's base and each option show their own) clears its own scene. The content slides
    // away from the corner within the free margin before the zoom drops. `cards` is [{ L, ctx }].
    function dockPanel(cards, b, cam, prevCorner, V) {
      const order = [prevCorner, 'tr', 'br', 'tl', 'bl'].filter((c, k, a) => c && a.indexOf(c) === k);
      const shifts = [[0, 0], [.5, 0], [0, .5], [.5, .5], [1, 0], [0, 1], [1, .5], [.5, 1], [1, 1]];
      for (let z = cam.z; z >= V.zMin - 1e-6; z -= .025) {
        const sx = Math.max(0, V.W - 2 * V.margin - (b.x1 - b.x0) * z) / 2 / z;
        const sy = Math.max(0, V.H - 2 * V.margin - (b.y1 - b.y0) * z) / 2 / z;
        for (const [fx, fy] of shifts) {
          for (const corner of order) {
            const c = { cx: (b.x0 + b.x1) / 2 + (corner[1] === 'r' ? 1 : -1) * fx * sx, cy: (b.y0 + b.y1) / 2 + (corner[0] === 'b' ? 1 : -1) * fy * sy, z };
            if (cards.every((d) => !cardHits(cardWorldRect(c, corner, d.L.w * V.hud, d.L.h * V.hud, V), d.ctx))) return { ...c, corner };
          }
        }
      }
      return { ...cam, corner: 'tr' };
    }

    // One framing per group. A try step is framed to hold its base and every option, so choosing
    // an option never moves the camera. Returns one camera per scene.
    function planCameras(V) {
      const cams = [];
      let prev = null;
      GROUPS.forEach((_, g) => {
        const group = groupOf(g), bounds = groupBounds[g];
        let cam = fitCamera(bounds, V);
        if (keepsPrevious(prev, cam, bounds, V)) cam = { cx: prev.cx, cy: prev.cy, z: prev.z };
        const cards = V.inlinePanel ? [] : group.filter((p) => p.panel).map((p) => ({ L: panelLayout(p.panel), ctx: { ...p.ctx, texts: p.texts } }));
        if (cards.length) cam = dockPanel(cards, bounds, cam, prev && prev.corner, V);
        for (const p of group) cams[p.i] = cam;
        prev = cam;
      });
      return cams;
    }

    const plans = SCENES.map((_, k) => buildPlan(k));
    // The plans a group's framing must hold, and their bounds.
    const groupOf = (g) => GROUPS[g].map((k) => plans[k]);
    const groupBounds = GROUPS.map((_, g) => bboxOf(groupOf(g).flatMap((p) => boxCorners(p.bounds))));

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

    /* ================= Pills, links and flows shared by the stage and the stills ================= */

    const depthOf = (n) => (n.type === 'zone' ? -1e4 : n.type === 'queue' ? -1e3 + n.x - n.y : n.x - n.y);
    const fadeOutOf = (k) => 1 - clamp(k / .42, 0, 1);
    const fadeInOf = (k) => clamp((k - .55) / .4, 0, 1);

    // A node's pills: its stack (gauge, tags) and its name label. While a step changes them, old
    // and new cross-fade, and pills that stay slide to their new place in the stack.
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

    function arrowPath(tip, dir) {
      const nx = -dir[1], ny = dir[0];
      const bx = tip[0] - dir[0] * 9, by = tip[1] - dir[1] * 9;
      return `M${pt(tip)}L${pt([bx + nx * 4.2, by + ny * 4.2])}L${pt([bx - nx * 4.2, by - ny * 4.2])}Z`;
    }

    // The flows of scene k, keeping only the legs on links for which has(id) is true.
    function flowList(k, has) {
      return ((SCENES[k].scene || {}).flows || []).map((f) => ({
        f,
        kind: KINDS.includes(f.kind) ? f.kind : 'request',
        legs: (f.route || []).map((r) => ({ id: String(r).replace(/^~/, ''), rev: String(r).startsWith('~') })).filter((l) => has(l.id)),
        acc: .6,
      })).filter((fl) => fl.legs.length);
    }

    // How far a moving dot really gets, as the stage animates it: along the route up to the first
    // broken (cut) link, where it dies halfway; back again only when the flow bounces, no link on
    // the way is broken and not every dot fails on arrival (fail: 1).
    function reachOf(fl, isCut) {
      const legs = [];
      for (const leg of fl.legs) {
        if (isCut(leg.id)) return { legs: legs.concat({ ...leg, upTo: .5 }), back: [], broken: leg };
        legs.push({ ...leg, upTo: 1 });
      }
      const back = fl.f.bounce && (Number(fl.f.fail) || 0) < 1 ? fl.legs.slice().reverse().map((l) => ({ id: l.id, rev: !l.rev, upTo: 1 })) : [];
      return { legs, back, broken: null };
    }

    // Reduced motion and the stills: each flow becomes still chevrons along the part of its route
    // that a dot reaches. legOf(leg) gives the length a dot travels on that leg and the point at a
    // distance along it; isCut(id) says whether that link is broken.
    function chevronsSvg(list, legOf, isCut) {
      let s = '';
      const chev = (leg, t, kind, side) => {
        const { L, at } = legOf(leg);
        const a = at(L * t), b = at(Math.min(L, L * t + 2));
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        const ox = -Math.sin(ang) * side, oy = Math.cos(ang) * side;
        return `<path class="chev chev-${kind}" data-link="${esc(leg.id)}" transform="translate(${n1(a[0] + ox)} ${n1(a[1] + oy)}) rotate(${n1(ang * 180 / Math.PI)})" d="M-3-4.5 2 0-3 4.5"/>`;
      };
      const run = (leg, kind, side) => {
        const count = clamp(Math.floor(legOf(leg).L * leg.upTo / 30), 1, 5), hi = leg.upTo < 1 ? leg.upTo - .08 : .88;
        for (let k = 0; k < count; k++) s += chev(leg, .12 + (hi - .12) * (k + .5) / count, kind, side);
      };
      for (const fl of list) {
        const r = reachOf(fl, isCut), side = r.back.length ? -5 : 0;
        for (const leg of r.legs) run(leg, fl.kind, side);
        for (const leg of r.back) run(leg, 'response', side);
      }
      return s;
    }

    // Scene k settled, as one picture framed by `cam` on a stage of size V: what the stage shows
    // once a step has finished arriving, with flows as still chevrons and the summary card docked.
    function stillSvg(k, cam, V) {
      const plan = plans[k], v = viewRect(cam, V);
      let floor = '', links = '', body = '', over = '', hudCard = '';
      for (const id of plan.show.slice().sort((a, b) => depthOf(NODES[a]) - depthOf(NODES[b]))) {
        const n = NODES[id], pr = plan.props[id], info = plan.ents[id], p = restParams(pr), d = info.d;
        if (d.floor) { floor += d.floor; continue; }
        body += composeEntity(d, p);
        over += overlayFor({ n, c: { swap: 1, load: pr.load ?? 0 }, from: null, to: pr, side: info.side, labelPos: info.labelAt }, d, p);
      }
      for (const id of plan.linkIds) {
        const g = linkGeom(id), style = linkStyle(k, id), head = hasHead(style), text = linkText(k, id), at = plan.labels[id];
        links += `<path class="lk ${style}" d="${roundLine(trimPts(g.pts, 0, Math.max(.5, g.len - (head ? 7 : 0))), 9)}"/>`;
        if (head) links += `<path class="ah${style === 'off' ? ' off' : ''}" d="${arrowPath(g.tip, g.dir)}"/>`;
        if (style === 'cut') links += crossMark(g.mid.p);
        if (text && at) over += pillSvg(at[0], at[1], linkLabelSpec(text, style));
      }
      const chevrons = chevronsSvg(flowList(k, (id) => plan.linkIds.includes(id)), (leg) => {
        const g = linkGeom(leg.id), hi = Math.max(4, g.len - (hasHead(linkStyle(k, leg.id)) ? 10 : 2));
        return { L: hi - 2, at: (s) => pointAt(g.pts, leg.rev ? hi - s : 2 + s).p };
      }, (id) => linkStyle(k, id) === 'cut');
      if (plan.panel && !V.inlinePanel && cam.corner) {
        const L = panelLayout(plan.panel), m = 12;
        const sx = cam.corner[1] === 'r' ? V.W - m - L.w * V.hud : m;
        const sy = cam.corner[0] === 'b' ? V.H - m - L.h * V.hud - 3 : m;
        hudCard = `<g transform="translate(${n2(v.x)} ${n2(v.y)}) scale(${(v.w / V.W).toFixed(4)})"><g class="hud-card" transform="translate(${n1(sx)} ${n1(sy)}) scale(${n2(V.hud)})">${panelSvg(L)}</g></g>`;
      }
      const grid = `<rect class="deco" x="${n1(v.x)}" y="${n1(v.y)}" width="${n1(v.w)}" height="${n1(v.h)}" fill="url(#iso-grid)" opacity=".7"/>`;
      return {
        viewBox: `${n2(v.x)} ${n2(v.y)} ${n2(v.w)} ${n2(v.h)}`,
        svg: `${grid}<g>${floor}</g><g>${links}</g><g class="chev">${chevrons}</g><g>${body}</g><g>${over}</g>${hudCard}`,
      };
    }

    // Scene k in words, for the stage's text alternative and the sheet's stills: one line per
    // object, link, flow and summary card.
    function describe(k) {
      const plan = plans[k], sc = SCENES[k].scene || {};
      const name = (id) => (NODES[id] ? propsFor(id, k).label || id : id);
      const items = [];
      for (const id of plan.show) {
        const n = NODES[id], pr = plan.props[id], bits = [];
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
      for (const id of plan.linkIds) {
        const L = LINKS[id], st = linkStyle(k, id), text = linkText(k, id);
        items.push(`Link ${name(L.from)} → ${name(L.to)}${text ? ` “${text}”` : ''}${styleWord[st] ? ` (${styleWord[st]})` : ''}`);
      }
      for (const f of sc.flows || []) {
        const legs = f.route.map((r) => ({ id: String(r).replace(/^~/, ''), rev: String(r).startsWith('~') })).filter((l) => LINKS[l.id]);
        if (!legs.length) continue;
        const from = (l) => (l.rev ? LINKS[l.id].to : LINKS[l.id].from), to = (l) => (l.rev ? LINKS[l.id].from : LINKS[l.id].to);
        const r = reachOf({ f, legs }, (id) => linkStyle(k, id) === 'cut'), fail = Number(f.fail) || 0;
        const stops = [from(legs[0]), ...(r.broken ? r.legs.slice(0, -1) : r.legs).map(to)].map(name);
        const end = r.broken ? `, dying at the broken link to ${name(to(r.broken))}` : `${r.back.length ? ' and back' : ''}${fail ? (fail >= 1 ? ', every one fails' : ', some fail') : ''}`;
        items.push(`Moving: ${f.kind || 'request'} dots ${stops.join(' → ')}${end}`);
      }
      if (plan.panel) items.push(`${plan.panel.title || 'Summary'}: ${plan.panel.lines.map((l) => String(l).replace(/^[=!#] /, '').replace(/\s+/g, ' ')).join('; ')}`);
      return items;
    }

    /* ================= Checks ================= */
    // What a stage can say about the data; the template decides which to run and how to report them.

    // Rules 1, 2 and 7 for scene k: what it names exists, a link is shown with both its ends, and a
    // flow's route is connected.
    function rules(k) {
      const out = [], warn = (m) => out.push(m);
      const n = META[k].name, sc = SCENES[k].scene || {}, show = sc.show || [], links = sc.links || {};
      for (const id of show) if (!NODES[id]) warn(`${n}: scene.show names unknown node "${id}" (rule 1)`);
      for (const id of Object.keys(sc.state || {})) if (!NODES[id]) warn(`${n}: scene.state names unknown node "${id}" (rule 1)`);
      for (const id of Object.keys(links)) {
        const L = LINKS[id];
        if (!L) warn(`${n}: scene.links names unknown link "${id}" (rule 1)`);
        else if (!show.includes(L.from) || !show.includes(L.to)) warn(`${n}: link "${id}" is shown but "${show.includes(L.from) ? L.to : L.from}" is not (rule 2)`);
      }
      (sc.flows || []).forEach((f, j) => {
        const legs = (f.route || []).map((r) => ({ id: String(r).replace(/^~/, ''), rev: String(r).startsWith('~') }));
        if (!legs.length) warn(`${n}: flow ${j + 1} has an empty route`);
        for (const l of legs) {
          if (!LINKS[l.id]) warn(`${n}: flow ${j + 1} uses unknown link "${l.id}" (rule 1)`);
          else if (!(l.id in links)) warn(`${n}: flow ${j + 1} uses link "${l.id}", which is not shown in this step (rule 2)`);
        }
        for (let r = 1; r < legs.length; r++) {
          const a = LINKS[legs[r - 1].id], b = LINKS[legs[r].id];
          if (!a || !b) continue;
          const shared = [a.from, a.to].some((x) => x === b.from || x === b.to);
          const end = legs[r - 1].rev ? a.from : a.to, start = legs[r].rev ? b.to : b.from;
          if (!shared) warn(`${n}: flow ${j + 1} links "${legs[r - 1].id}" and "${legs[r].id}" share no endpoint (rule 7)`);
          else if (end !== start) warn(`${n}: flow ${j + 1} arrives at "${end}" but leaves from "${start}"; prefix a link with ~ to travel it backwards (rule 7)`);
        }
      });
      return out;
    }

    // Rule 8 for one scene: pills, labels, text drawn on objects and the summary card that cover an
    // object or each other. Text drawn on an object is not tested against that object.
    function overlapsIn(k, cam, V) {
      const plan = plans[k], items = plan.items.slice(), out = [];
      if (plan.panel && !V.inlinePanel && cam.corner) {
        const L = panelLayout(plan.panel);
        items.push({ box: cardWorldRect(cam, cam.corner, L.w * V.hud, L.h * V.hud, V), what: 'the summary card' });
      }
      const shape = (a, d) => (a.box ? boxCorners(inflate(a.box, d)) : a.poly);
      items.forEach((a, x) => {
        const inner = shape(a, -1.5);
        plan.hullIds.forEach((id, h) => {
          if (id !== a.own && convexOverlap(plan.ctx.hulls[h], inner)) out.push(`${a.what} overlaps the ${q(plan.props[id].label || id)} object`);
        });
        for (let y = x + 1; y < items.length; y++) {
          const b = items[y];
          if (a.box && b.box ? overlapArea(a.box, b.box) > 4 : convexOverlap(shape(a, -1), shape(b, -1))) out.push(`${a.what} overlaps ${b.what}`);
        }
      });
      return out;
    }

    // The smallest text size (in stage units) that scene k draws, for the label-size note. Text on
    // objects is measured at the size the drawing chose for it.
    function smallestText(k) {
      const plan = plans[k];
      let min = Infinity;
      for (const t of plan.texts) min = Math.min(min, t.size);
      for (const id of plan.show) {
        const n = NODES[id], pr = plan.props[id];
        if (n.type === 'zone') continue;
        if (!LABEL_ON_FACE.has(n.type)) {
          if (pr.sub) min = Math.min(min, 9);
          else if (pr.label) min = Math.min(min, 10.5);
        }
        if (stackOf(n, pr).length) min = Math.min(min, 10.5);
      }
      if (Object.keys(plan.labels).length) min = Math.min(min, 9.5);
      return min;
    }

    // What scene k puts on the stage, in a fixed form for rule 9: the same picture gives the same
    // string whatever the key order of the data and whether a default value is written out.
    function signature(k) {
      const plan = plans[k], num = (v, d) => (typeof v === 'number' ? v : d);
      const props = plan.show.slice().sort().map((id) => {
        const n = NODES[id], pr = plan.props[id];
        return [id, { ...pr, load: n.type === 'db' ? pr.load ?? 0 : pr.load, count: n.type === 'crowd' || n.type === 'queue' ? pr.count : null }];
      });
      const links = plan.linkIds.slice().sort().map((id) => [id, linkStyle(k, id), linkText(k, id)]);
      const flows = flowList(k, (id) => plan.linkIds.includes(id)).map((fl) => JSON.stringify([fl.kind, fl.legs.map((l) => (l.rev ? '~' : '') + l.id),
        !!fl.f.bounce, num(fl.f.rate, .8), num(fl.f.speed, 1), clamp(Number(fl.f.fail) || 0, 0, 1), Number(fl.f.hold) || 0])).sort();
      const panel = plan.panel ? [String(plan.panel.title || ''), plan.panel.lines.map(String)] : null;
      return JSON.stringify({ props, links, flows, panel });
    }

    // Links that join a node that does not exist (rule 1).
    function wiring() {
      const out = [];
      for (const [id, L] of Object.entries(LINKS)) {
        if (!NODES[L.from] || !NODES[L.to]) out.push(`link "${id}" joins a node that does not exist (rule 1)`);
      }
      return out;
    }

    // Objects placed too close together (rule 7).
    function spacing() {
      const out = [];
      const ids = Object.keys(NODES).filter((id) => NODES[id].type !== 'zone');
      for (let a = 0; a < ids.length; a++) {
        for (let b = a + 1; b < ids.length; b++) {
          const A = NODES[ids[a]], B = NODES[ids[b]], d = Math.hypot(A.x - B.x, A.y - B.y);
          if (d < 6) out.push(`nodes "${ids[a]}" and "${ids[b]}" are ${n1(d)} grid units apart; keep at least 6 (rule 7)`);
        }
      }
      return out;
    }

    const refView = viewFor(REF.W, REF.H);
    const refCams = planCameras(refView);

    // Scene k at the reference stage size: what overlaps (rule 8), the smallest text it draws and
    // the zoom of its camera.
    const layouts = [];
    function layout(k) {
      if (!layouts[k]) layouts[k] = { overlaps: overlapsIn(k, refCams[k], refView), smallest: smallestText(k), zoom: refCams[k].z };
      return layouts[k];
    }

    // The objects scene k shows (zones are floor, not objects), and whether any scene puts a
    // number on the picture (a tag with a digit in it).
    const objects = (k) => ((SCENES[k].scene || {}).show || []).filter((id) => NODES[id] && NODES[id].type !== 'zone');
    const numbers = () => SCENES.some((s) => Object.values((s.scene || {}).state || {}).some((st) => isObject(st) && Array.isArray(st.tags) && st.tags.some((t) => /\d/.test(String(t && t.text)))));

    // Scene k settled, at the reference stage size or another { W, H }.
    const sized = new Map();
    function still(k, size) {
      if (!size) return stillSvg(k, refCams[k], refView);
      const key = `${size.W}x${size.H}`;
      if (!sized.has(key)) { const V = viewFor(size.W, size.H); sized.set(key, { V, cams: planCameras(V) }); }
      const s = sized.get(key);
      return stillSvg(k, s.cams[k], s.V);
    }

    const model = { shapes, sceneShapes, reference: { W: REF.W, H: REF.H }, wiring, rules, spacing, layout, signature, objects, numbers, describe, still };
    internals.set(model, {
      NODES, LINKS, SCENES, plans, groupBounds, groupIndex, queueCaps, linkGeom, hasHead, linkStyle, linkText, linkLabelSpec, depthOf, fadeOutOf, fadeInOf,
      overlayFor, arrowPath, panelRows, panelLayout, panelSvg, flowList, chevronsSvg, planCameras, describe,
    });
    return model;
  }

  /* ================= The stage on a page ================= */
  // mount() brings the stage to life inside host, which already holds the markup from parts().
  // opts: { titleOf(k) → the title of scene k for its text alternative, onReplay() → what the
  // Replay button does }. The view it returns moves between scenes only when asked to. It owns its
  // frame loop, timers, listeners and observers; destroy() releases all of them.
  function mount(host, model, opts = {}) {
    const M = internals.get(model);
    const { NODES, LINKS, SCENES, plans } = M;
    const { queueCaps, linkGeom, hasHead, linkStyle, linkText, linkLabelSpec, depthOf, fadeOutOf, fadeInOf, overlayFor, arrowPath, panelRows, panelLayout, panelSvg, flowList, chevronsSvg } = M;
    const R = {};
    for (const el of host.querySelectorAll('[data-ref]')) R[el.dataset.ref] = el;
    const $ = (name) => R[name];
    $('sceneDefs').innerHTML = defsMarkup();
    let reduce = motionQuery.matches;

    // Everything asynchronous and every listener goes through life, so destroy() can cancel all of it.
    let alive = true;
    const life = lifetime();
    const later = life.later, nextFrame = life.frame, listen = life.listen;

    /* ================= Runtime state ================= */

    const svg = $('scene'), wrap = $('sceneWrap');
    const layer = { geo: $('layerGeo'), floor: $('layerFloor'), links: $('layerLinks'), packets: $('layerPackets'), ents: $('layerEnts'), fx: $('layerFx'), over: $('layerOver'), focus: $('layerFocus'), hud: $('layerHud') };
    const gridFadeEl = $('sceneDefs').querySelector('#grid-fade');
    const gridFade = () => gridFadeEl;

    const VIEW = viewFor(900, 520);
    let cams = [];         // one camera per scene for the current stage size
    let stageIdx = -1;     // scene the stage is heading to
    let stageToken = 0;
    let paused = false;
    let clock = 0;         // animation time in ms; stands still while paused

    const ents = new Map();
    const lks = new Map();
    const cam = { x: -400, y: -250, w: 800, h: 500, dirty: true };   // the author's framing, eased between steps
    // The reader's view on top of it: a zoom factor (1 = the author's framing) and a pan of the
    // view's centre in scene units. It never changes the planned cameras.
    const uv = { z: 1, px: 0, py: 0 };
    const ZOOM_MAX = 4;
    // What the reader is tracing: { node } or { link }, with src 'hover', 'focus' or 'tap'; keepN
    // and keepL hold the ids that stay at full strength, or are null when nothing is traced.
    let trace = null, keepN = null, keepL = null;
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

    function insertByDepth(parent, node, depth) {
      node.dataset.depth = depth;
      const next = [...parent.children].find((c) => Number(c.dataset.depth) > depth);
      parent.insertBefore(node, next || null);
    }

    // An entity is two groups: e.g on the floor or object layer, e.og (pills and name) above. Each
    // carries the tracing class on its outer group and the animated opacity on an inner one, so a
    // trace never touches what the transitions animate.
    function makeEnt(id) {
      const n = NODES[id];
      const g = svgEl('g', { class: 'ent', 'data-id': id }), og = svgEl('g', { class: 'ent-over', 'data-id': id });
      const e = { id, n, cap: queueCaps[id], g, og, b: svgEl('g', {}, g), ob: svgEl('g', {}, og), c: null, from: null, to: null, labelPos: null, labelTarget: null, dirty: true, leaving: false, landAt: 0 };
      insertByDepth(n.type === 'zone' ? layer.floor : layer.ents, e.g, depthOf(n));
      insertByDepth(layer.over, e.og, depthOf(n));
      ents.set(id, e);
      markEnt(e);
      return e;
    }

    function removeEnt(e) {
      e.g.remove();
      e.og.remove();
      ents.delete(e.id);
    }

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
      e.b.innerHTML = d.floor || composeEntity(d, p);
      e.b.setAttribute('opacity', n2(e.c.op));
      e.ob.setAttribute('opacity', n2(e.c.op));
      e.ob.innerHTML = d.hull ? overlayFor(e, d, p) : '';
    }

    /* ---------- Links ---------- */

    function makeLink(id) {
      const geom = linkGeom(id);
      const g = svgEl('g', { class: 'link', 'data-id': id }, layer.links);
      const ig = svgEl('g', {}, g);
      // A wide invisible stroke under the line, so a thin link is easy to point at.
      const hit = svgEl('path', { class: 'lk-hit' }, ig);
      const line = svgEl('path', { class: 'lk' }, ig);
      const head = svgEl('path', { class: 'ah' }, ig);
      const mark = svgEl('g', { class: 'deco' }, ig);
      const lg = svgEl('g', { class: 'link-label', 'data-id': id }, layer.over);
      const geo = svgEl('path', { d: geom.d, fill: 'none' }, layer.geo);
      const lk = { id, geom, g, ig, hit, line, head, mark, lg, geo, glen: geo.getTotalLength() || geom.len, draw: 0, op: 1, style: 'solid', text: '', textFrom: null, posFrom: null, lswap: 1, pos: null, target: null, dirty: true, leaving: false };
      lks.set(id, lk);
      markLink(lk);
      return lk;
    }

    function removeLink(lk) {
      lk.g.remove();
      lk.lg.remove();
      lk.geo.remove();
      lks.delete(lk.id);
    }

    function renderLink(lk) {
      lk.dirty = false;
      const g = lk.geom, head = hasHead(lk.style);
      lk.ig.setAttribute('opacity', n2(lk.op));
      lk.line.setAttribute('class', `lk ${lk.style}`);
      if (lk.draw <= .001) {
        lk.line.setAttribute('d', '');
      } else {
        const end = lk.draw * (g.len - (head ? 7 : 0));
        lk.line.setAttribute('d', roundLine(trimPts(g.pts, 0, Math.max(.5, end)), 9));
      }
      lk.hit.setAttribute('d', lk.line.getAttribute('d'));
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

    function camTargetOf(c) { const v = viewRect(c, VIEW); return { x: v.x, y: v.y, w: v.w, h: v.h }; }

    // The view the stage shows: the author's framing (cam) with the reader's zoom and pan (u) on top.
    function effView(u = uv) {
      const w = cam.w / u.z, h = cam.h / u.z;
      return { x: cam.x + cam.w / 2 + u.px - w / 2, y: cam.y + cam.h / 2 + u.py - h / 2, w, h };
    }

    function applyCamera() {
      cam.dirty = false;
      const v = effView();
      svg.setAttribute('viewBox', `${n2(v.x)} ${n2(v.y)} ${n2(v.w)} ${n2(v.h)}`);
      const gf = gridFade();
      if (gf) {
        gf.setAttribute('cx', n1(v.x + v.w / 2));
        gf.setAttribute('cy', n1((v.y + v.h / 2) / .6));
        gf.setAttribute('r', n1(v.w * .56));
      }
      // The summary card stays in screen pixels whatever the reader's zoom.
      layer.hud.setAttribute('transform', `translate(${n2(v.x)} ${n2(v.y)}) scale(${(v.w / VIEW.W).toFixed(4)})`);
      syncCamControls();
    }

    let camControls = '';
    function syncCamControls() {
      const zoomed = uv.z > 1.001, top = uv.z >= ZOOM_MAX - .001, fitted = !zoomed && Math.abs(uv.px) < .5 && Math.abs(uv.py) < .5;
      const key = `${zoomed}${top}${fitted}`;
      if (key === camControls) return;
      camControls = key;
      // While zoomed in, one finger pans the scene instead of scrolling the page (touch-action in the CSS).
      svg.classList.toggle('zoomed', zoomed);
      $('zoomOutBtn').setAttribute('aria-disabled', String(!zoomed));
      $('zoomInBtn').setAttribute('aria-disabled', String(top));
      $('fitBtn').setAttribute('aria-disabled', String(fitted));
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

    function setPanel(k, instant, delay) {
      const plan = k >= 0 ? plans[k] : null;
      const panel = plan && plan.panel && !VIEW.inlinePanel ? plan.panel : null;
      const key = panel ? JSON.stringify(panel) : '';
      if (plan && cams[k].corner) hud.corner = cams[k].corner;
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

    // The summary card under a narrow stage. `animate` marks a change, as when a replay reaches the option.
    let inlineHtml = '';
    function renderPanelInline(i, animate) {
      const box = $('panelInline');
      const panel = VIEW.inlinePanel && i >= 0 ? (SCENES[i].scene || {}).panel : null;
      const html = panel && panel.lines ? `<div class="pi-title">${esc(String(panel.title || '').toUpperCase())}</div>` + panelRows(panel).map((r) => `<div class="pi-row ${r.kind}">${esc(r.t)}</div>`).join('') : '';
      box.hidden = !html;
      if (html === inlineHtml) return;
      box.innerHTML = inlineHtml = html;
      if (animate && html && !reduce) restartAnim(box, 'swap');
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

    // Moves the stage to scene i; returns when (ms on the animation clock) the move ends. With
    // `fit`, the reader's zoom and pan return to the author's framing as part of the same move.
    function stageTo(i, instant, fit) {
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
        if (plan) Object.assign(cam, camTargetOf(cams[i]), { dirty: true });
        if (fit) animateView(FIT, 0);
        setPanel(i, true, 0);
        if (plan) startFlows(i);
        staged(i);
        return 0;
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
        // A db shows its load as its fill, so a load that goes away drains it; a gauge fades out instead.
        if (pr.load !== null || e.n.type === 'db') tween(e.c, 'load', pr.load ?? 0, MOVE, o);
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
        const t = camTargetOf(cams[i]);
        for (const k of ['x', 'y', 'w', 'h']) tween(cam, k, t[k], CAM, { owner: cam, delay: tCam });
        if (fit) animateView(FIT, CAM, tCam);
        end = Math.max(end, tCam + CAM);
      }
      setPanel(i, false, Math.max(0, end - 300));
      staged(i);

      after(end + 40, () => {
        if (token !== stageToken || !plan) return;
        startFlows(i);
        changed.forEach(spotlight);
      });
      return end;
    }

    /* ---------- Flows ---------- */

    const SPEED = 155;
    const KIND_SPEED = { heavy: .7, signal: .85 };

    const legRange = (lk) => [2, Math.max(4, lk.glen - (hasHead(lk.style) ? 10 : 2))];

    function legPoint(lk, leg, s) {
      const [lo, hi] = legRange(lk);
      const q = lk.geo.getPointAtLength(leg.rev ? hi - s : lo + s);
      return [q.x, q.y];
    }

    function startFlows(i) {
      stopFlows();
      flows = flowList(i, (id) => lks.has(id));
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
      markPacket(p);
      placePacket(p, legPoint(lks.get(legs[0].id), legs[0], 0));
      nextFrame(() => { if (!p.dead && p.wait <= 0) g.style.opacity = 1; });
      packets.push(p);
    }

    const placePacket = (p, q) => p.g.setAttribute('transform', `translate(${n1(q[0])} ${n1(q[1])})`);

    function killPacket(p) {
      p.dead = true;
      p.g.remove();
    }

    // Arrival and failure marks belong to the link the dot was on, for tracing.
    function fxRing(q, id) {
      const g = svgEl('g', { class: 'fx' }, layer.fx);
      svgEl('circle', { class: 'fx-ring', cx: n1(q[0]), cy: n1(q[1]), r: 6 }, g);
      markFx(g, id);
      later(() => g.remove(), 700);
    }

    function fxBurst(q, id) {
      const g = svgEl('g', { class: 'fx', transform: `translate(${n1(q[0])} ${n1(q[1])})` }, layer.fx);
      g.innerHTML = '<g class="fx-burst"><circle r="6.5"/><path d="M-2.8-2.8l5.6 5.6M2.8-2.8l-5.6 5.6"/></g>';
      markFx(g, id);
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
          markPacket(p);
          p.g.style.opacity = 1;
        }
        const leg = p.legs[p.k], lk = lks.get(leg.id);
        if (!lk) { killPacket(p); packets.splice(q, 1); continue; }
        const [lo, hi] = legRange(lk), L = hi - lo;
        p.s += dt * SPEED * (typeof p.fl.f.speed === 'number' ? p.fl.f.speed : 1) * (KIND_SPEED[p.kind] || 1);
        if (lk.style === 'cut' && p.s >= L / 2) {
          // A broken link cannot deliver: the dot dies at the break.
          fxBurst(legPoint(lk, leg, L / 2), leg.id); killPacket(p); packets.splice(q, 1); continue;
        }
        if (p.s < L) { placePacket(p, legPoint(lk, leg, p.s)); continue; }
        const endPt = legPoint(lk, leg, L);
        placePacket(p, endPt);
        if (p.k === p.turn && Math.random() < (Number(p.fl.f.fail) || 0)) { fxBurst(endPt, leg.id); killPacket(p); packets.splice(q, 1); continue; }
        if (p.k === p.legs.length - 1) { fxRing(endPt, leg.id); killPacket(p); packets.splice(q, 1); continue; }
        const hold = p.k === p.turn ? Number(p.fl.f.hold) || 0 : 0;
        if (hold > 0) { p.wait = hold; p.g.classList.add('held'); }
        else { p.wait = .16; p.g.style.opacity = 0; }
      }
    }

    // Reduced motion: each flow becomes still chevrons along its links.
    function drawChevrons() {
      const g = svgEl('g', { class: 'chev' }, layer.packets);
      g.innerHTML = chevronsSvg(flows, (leg) => {
        const lk = lks.get(leg.id), [lo, hi] = legRange(lk);
        return { L: hi - lo, at: (s) => legPoint(lk, leg, s) };
      }, (id) => lks.get(id).style === 'cut');
      for (const c of g.querySelectorAll('[data-link]')) markFx(c, c.dataset.link);
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

    /* ================= The reader's camera: zoom and pan ================= */
    // A temporary view on top of the author's framing (uv). It returns to that framing when the
    // step changes, on Replay and when the layout changes; choosing a try option keeps it.

    const FIT = { z: 1, px: 0, py: 0 };
    const ZOOM_STEP = 1.5, ZOOM_EASE = 220, FOCUS_EASE = 360;
    let viewAnim = null, viewGoal = null;
    let appShell = false, layoutMode = '';   // set by layoutStage()

    function stopViewAnim() {
      if (!viewAnim) return;
      const k = uiAnims.indexOf(viewAnim);
      if (k >= 0) uiAnims.splice(k, 1);
      viewAnim = viewGoal = null;
    }

    // Eases the reader's view to `to` over dur ms after delay ms, on the page clock, so it also
    // works while the stage is paused. Reduced motion: at once.
    function animateView(to, dur, delay = 0) {
      stopViewAnim();
      if (reduce || dur <= 0) { Object.assign(uv, to); cam.dirty = true; return; }
      // Timed from the first frame that runs it: frame timestamps need not match performance.now().
      const from = { ...uv };
      let t0 = null;
      viewGoal = { ...to };
      viewAnim = (now) => {
        if (t0 === null) t0 = now + delay;
        if (now < t0) return false;
        const u = Math.min(1, (now - t0) / dur), k = inOut(u);
        uv.z = lerp(from.z, to.z, k);
        uv.px = lerp(from.px, to.px, k);
        uv.py = lerp(from.py, to.py, k);
        cam.dirty = true;
        if (u < 1) return false;
        viewAnim = viewGoal = null;
        return true;
      };
      uiAnims.push(viewAnim);
    }

    // Direct input (wheel, drag, pinch) applies at once, so the next event measures the view as drawn.
    function setView(to) {
      stopViewAnim();
      Object.assign(uv, to);
      applyCamera();
    }

    // Keeps the centre of the view over the step's scene (its bounds, and the author's own centre),
    // so the picture can never be dragged out of sight.
    function clampView(v) {
      const z = clamp(v.z, 1, ZOOM_MAX);
      if (stageIdx < 0) return { z, px: 0, py: 0 };
      const b = M.groupBounds[M.groupIndex[stageIdx]], c = cams[stageIdx];
      const cx = cam.x + cam.w / 2, cy = cam.y + cam.h / 2;
      return {
        z,
        px: clamp(cx + v.px, Math.min(b.x0, c.cx), Math.max(b.x1, c.cx)) - cx,
        py: clamp(cy + v.py, Math.min(b.y0, c.cy), Math.max(b.y1, c.cy)) - cy,
      };
    }

    // The scene point under client position (x, y) and its place in the view (0-1), from the
    // view as drawn.
    function stagePoint(x, y) {
      const m = svg.getScreenCTM(), vb = svg.viewBox.baseVal;
      if (!m || !vb || !vb.width) return null;
      const q = new DOMPoint(x, y).matrixTransform(m.inverse());
      return { wx: q.x, wy: q.y, fx: (q.x - vb.x) / vb.width, fy: (q.y - vb.y) / vb.height };
    }

    // The view at zoom z that shows scene point (wx, wy) at place (fx, fy) of the stage.
    function viewKeeping(z, wx, wy, fx, fy) {
      z = clamp(z, 1, ZOOM_MAX);
      const w = cam.w / z, h = cam.h / z;
      return clampView({ z, px: wx - (fx - .5) * w - (cam.x + cam.w / 2), py: wy - (fy - .5) * h - (cam.y + cam.h / 2) });
    }

    const sameView = (a, b) => Math.abs(a.z - b.z) < 1e-4 && Math.abs(a.px - b.px) < .01 && Math.abs(a.py - b.py) < .01;

    // Zooms by `factor` keeping the scene point under client (x, y) where it is. Returns whether the view changed.
    function zoomAt(factor, x, y) {
      const s = stagePoint(x, y);
      if (!s || stageIdx < 0) return false;
      const to = viewKeeping(uv.z * factor, s.wx, s.wy, s.fx, s.fy);
      if (sameView(to, uv)) return false;
      setView(to);
      return true;
    }

    // The part of the stage the reader can see, as places (0-1) across the view: all of it, except
    // on a phone, where the stage is wider than its box and scrolls sideways.
    function visibleSpan() {
      const s = svg.getBoundingClientRect(), w = wrap.getBoundingClientRect();
      if (!s.width) return { f0: 0, f1: 1, mid: .5 };
      const f0 = clamp((w.left - s.left) / s.width, 0, 1), f1 = clamp((w.right - s.left) / s.width, f0, 1);
      return { f0, f1, mid: (f0 + f1) / 2 };
    }

    // Buttons and keys: one step in or out around the middle of what the reader sees.
    function zoomStep(dir) {
      if (stageIdx < 0) return;
      const base = viewGoal || uv, v = effView(base), { mid } = visibleSpan();
      animateView(viewKeeping(base.z * (dir > 0 ? ZOOM_STEP : 1 / ZOOM_STEP), v.x + mid * v.w, v.y + v.h / 2, mid, .5), ZOOM_EASE);
    }

    function fitView() { animateView(FIT, FOCUS_EASE); }

    // Centres a scene point in what the reader sees, at 2× or more (double-click on an object).
    function focusOn(wx, wy, z = Math.max(2, (viewGoal || uv).z)) {
      if (stageIdx < 0) return;
      animateView(viewKeeping(z, wx, wy, visibleSpan().mid, .5), FOCUS_EASE);
    }

    // The middle of an object as the step draws it at rest.
    function objCentre(id) {
      const info = stageIdx >= 0 ? plans[stageIdx].ents[id] : null;
      if (!info || !info.d.hull) return null;
      const b = bboxOf(info.d.hull);
      return [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];
    }

    // While zoomed in, keyboard focus on an object outside what the reader sees brings it into view.
    function reveal(id) {
      const c = objCentre(id);
      if (!c || uv.z <= 1.001) return;
      const v = effView(), { f0, f1 } = visibleSpan(), x0 = v.x + f0 * v.w, x1 = v.x + f1 * v.w, mx = (x1 - x0) * .1, my = v.h * .1;
      if (c[0] > x0 + mx && c[0] < x1 - mx && c[1] > v.y + my && c[1] < v.y + v.h - my) return;
      focusOn(c[0], c[1], uv.z);
    }

    /* ================= Tracing: what an object or a link is connected to ================= */
    // Classes only: the outer groups get .on, the stage gets .tracing, and the CSS dims the rest.
    // Nothing here touches tween state, so a trace cannot disturb a transition.

    // The object or link an element belongs to, or null for the floor, a zone or something leaving.
    function hitOf(el) {
      const g = el && el.closest ? el.closest('[data-id]') : null;
      if (!g || !svg.contains(g) || g.classList.contains('fp')) return null;
      const id = g.dataset.id;
      if (g.classList.contains('link') || g.classList.contains('link-label')) {
        const lk = lks.get(id);
        return lk && !lk.leaving ? { link: id } : null;
      }
      const e = ents.get(id);
      return e && !e.leaving && e.n.type !== 'zone' ? { node: id } : null;
    }
    const sameHit = (a, b) => !!a && !!b && a.node === b.node && a.link === b.link;

    // The ids that stay at full strength: the object, every link of the current scene that
    // touches it and the objects at their other ends; or the link and its two ends.
    function traceSets() {
      keepN = keepL = null;
      if (!trace) return;
      keepN = new Set();
      keepL = new Set();
      const add = (id) => { keepL.add(id); keepN.add(LINKS[id].from); keepN.add(LINKS[id].to); };
      if (trace.link) add(trace.link);
      else {
        keepN.add(trace.node);
        for (const id of plans[stageIdx].linkIds) if (LINKS[id].from === trace.node || LINKS[id].to === trace.node) add(id);
      }
    }

    function markEnt(e) {
      const on = !!keepN && keepN.has(e.id);
      e.g.classList.toggle('on', on);
      e.og.classList.toggle('on', on);
    }
    function markLink(lk) {
      const on = !!keepL && keepL.has(lk.id);
      lk.g.classList.toggle('on', on);
      lk.lg.classList.toggle('on', on);
    }
    function markPacket(p) { p.g.classList.toggle('on', !!keepL && keepL.has(p.legs[p.k].id)); }
    function markFx(el, id) {
      el.dataset.link = id;
      el.classList.toggle('on', !!keepL && keepL.has(id));
    }

    function paintTrace() {
      svg.classList.toggle('tracing', !!trace);
      for (const e of ents.values()) markEnt(e);
      for (const lk of lks.values()) markLink(lk);
      for (const p of packets) markPacket(p);
      for (const el of svg.querySelectorAll('.fx[data-link], .chev [data-link]')) markFx(el, el.dataset.link);
    }

    function setTrace(t) {
      if (t && stageIdx < 0) t = null;
      trace = t;
      traceSets();
      paintTrace();
    }

    // After the stage heads to scene i: keyboard targets follow the scene, and a trace whose
    // object or link is no longer shown ends (choosing a try option keeps the rest).
    function staged(i) {
      syncFocusTargets(i);
      const plan = i >= 0 ? plans[i] : null;
      if (trace && (!plan || (trace.node ? !plan.show.includes(trace.node) : !plan.linkIds.includes(trace.link)))) trace = null;
      setTrace(trace);
    }

    /* ---------- Keyboard: one focus target per object ---------- */
    // Invisible outlines on a layer of their own, in the order the step lists its objects. Focus
    // draws the outline as a ring and traces the object; Escape clears the trace and leaves.

    const focusTargets = new Map();

    function ringPath(hull) {
      const cx = hull.reduce((s, q) => s + q[0], 0) / hull.length, cy = hull.reduce((s, q) => s + q[1], 0) / hull.length;
      return roundPoly(hull.map(([x, y]) => { const d = Math.hypot(x - cx, y - cy) || 1; return [x + (x - cx) / d * 7, y + (y - cy) / d * 7]; }), 8);
    }

    function syncFocusTargets(k) {
      const plan = k >= 0 ? plans[k] : null;
      const ids = plan ? plan.show.filter((id) => NODES[id].type !== 'zone' && plan.ents[id].d.hull) : [];
      const items = plan ? M.describe(k) : [];
      for (const [id, el] of focusTargets) if (!ids.includes(id)) { el.remove(); focusTargets.delete(id); }
      let at = layer.focus.firstChild;
      for (const id of ids) {
        let el = focusTargets.get(id);
        if (!el) {
          el = svgEl('path', { class: 'fp', tabindex: '0', role: 'img', 'data-id': id });
          focusTargets.set(id, el);
        }
        // The accessible name is the object's line in the stage's text description.
        el.setAttribute('aria-label', items[plan.show.indexOf(id)] || id);
        el.setAttribute('d', ringPath(plan.ents[id].d.hull));
        if (el === at) at = el.nextSibling;
        else layer.focus.insertBefore(el, at);
      }
    }

    // Listened for on the HTML wrapper: Chrome makes an SVG group with focus listeners a tab stop itself.
    const focusTarget = (e) => (e.target.classList && e.target.classList.contains('fp') ? e.target : null);
    listen(wrap, 'focusin', (e) => {
      const el = focusTarget(e), id = el && el.dataset.id;
      if (!id || !ents.has(id)) return;
      setTrace({ node: id, src: 'focus' });
      reveal(id);
    });
    listen(wrap, 'focusout', (e) => { if (focusTarget(e) && trace && trace.src === 'focus') setTrace(null); });
    listen(wrap, 'keydown', (e) => {
      const el = focusTarget(e);
      if (!el || e.key !== 'Escape') return;
      e.preventDefault();
      setTrace(null);
      el.blur();
    });

    /* ---------- Pointer: hover, drag, pinch, tap and double-click ---------- */

    const ptrs = new Map();   // pointers down on the stage: id → { x, y }
    let gest = null;          // { kind: 'press' | 'pan' | 'pinch', ... } while pointers are down
    let lastType = 'mouse', lastTap = null, dragEnd = -1e9;
    // Where the mouse rests on the stage, and, after a step change or Replay, the place it must
    // leave before hovering traces again: the browser re-sends hover events to a resting pointer
    // as the new scene is drawn under it, and the cleared trace would come straight back.
    let mouseAt = null, hoverHold = null;
    const holdHover = () => { hoverHold = mouseAt; };

    function onPointerDown(e) {
      lastType = e.pointerType;
      if (e.pointerType !== 'touch' && e.button !== 0) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) {
        gest = { kind: 'press', id: e.pointerId, touch: e.pointerType === 'touch', x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: e.timeStamp, hit: hitOf(e.target) };
      } else if (ptrs.size === 2 && e.pointerType === 'touch') {
        // Two fingers: pinch to zoom around the point between them, and move them to pan.
        const [a, b] = [...ptrs.values()];
        const s = stagePoint((a.x + b.x) / 2, (a.y + b.y) / 2);
        if (!s) return;
        stopViewAnim();
        svg.classList.remove('grabbing');
        gest = { kind: 'pinch', d0: Math.max(12, Math.hypot(a.x - b.x, a.y - b.y)), z0: uv.z, wx: s.wx, wy: s.wy };
        for (const id of ptrs.keys()) { try { svg.setPointerCapture(id); } catch { /* already released */ } }
      }
    }

    function onPointerMove(e) {
      if (e.pointerType !== 'touch') { if (hoverHold) hover(e); else mouseAt = [e.clientX, e.clientY]; }
      const p = ptrs.get(e.pointerId);
      if (!p) return;
      p.x = e.clientX;
      p.y = e.clientY;
      if (!gest) return;
      if (gest.kind === 'press') {
        if (e.pointerId !== gest.id || Math.hypot(p.x - gest.x0, p.y - gest.y0) < (gest.touch ? 8 : 4)) return;
        // At 1× one finger scrolls the page or the sideways stage; the browser has it already.
        if (gest.touch && uv.z <= 1.001) { gest = null; return; }
        gest.kind = 'pan';
        try { svg.setPointerCapture(e.pointerId); } catch { /* already released */ }
        stopViewAnim();
        svg.classList.add('grabbing');
      }
      if (gest.kind === 'pan') {
        const m = svg.getScreenCTM();
        if (!m || !m.a) return;
        setView(clampView({ z: uv.z, px: uv.px - (p.x - gest.x) / m.a, py: uv.py - (p.y - gest.y) / m.a }));
        gest.x = p.x;
        gest.y = p.y;
      } else if (gest.kind === 'pinch' && ptrs.size >= 2) {
        const [a, b] = [...ptrs.values()];
        const s = stagePoint((a.x + b.x) / 2, (a.y + b.y) / 2);
        if (s) setView(viewKeeping(gest.z0 * Math.hypot(a.x - b.x, a.y - b.y) / gest.d0, gest.wx, gest.wy, s.fx, s.fy));
      }
    }

    function onPointerUp(e) {
      if (!ptrs.delete(e.pointerId)) return;
      const g = gest;
      if (g && g.kind === 'press' && g.id === e.pointerId) {
        gest = null;
        if (g.touch && e.type === 'pointerup') tap(g, e.timeStamp);
        return;
      }
      if (g && (g.kind === 'pan' || g.kind === 'pinch')) {
        // After a pinch the remaining finger does nothing until it lifts.
        gest = null;
        dragEnd = e.timeStamp;
        lastTap = null;
        svg.classList.remove('grabbing');
        if (g.kind === 'pan' && e.pointerType !== 'touch' && trace && trace.src === 'hover') {
          const under = document.elementFromPoint(e.clientX, e.clientY);
          if (!svg.contains(under)) setTrace(null);
        }
      }
    }

    // A single tap traces what it lands on, or clears the trace on the floor. A second tap close
    // by is a double-tap: it moves the camera and leaves nothing traced.
    function tap(g, t) {
      if (t - g.t0 > 500) return;
      if (lastTap && t - lastTap.t < 320 && Math.hypot(g.x0 - lastTap.x, g.y0 - lastTap.y) < 30) {
        lastTap = null;
        if (trace && trace.src === 'tap') setTrace(null);
        doubleAt(g.hit);
        return;
      }
      lastTap = { t, x: g.x0, y: g.y0 };
      setTrace(g.hit ? { ...g.hit, src: 'tap' } : null);
    }

    // Double-click or double-tap: an object or a link is centred at 2× or more; the floor fits the scene.
    function doubleAt(hit) {
      const lk = hit && hit.link ? lks.get(hit.link) : null;
      const c = hit && hit.node ? objCentre(hit.node) : lk ? lk.geom.mid.p : null;
      if (c) focusOn(c[0], c[1]);
      else fitView();
    }

    listen(svg, 'pointerdown', onPointerDown);
    listen(svg, 'pointermove', onPointerMove);
    listen(svg, 'pointerup', onPointerUp);
    listen(svg, 'pointercancel', onPointerUp);
    listen(svg, 'dblclick', (e) => {
      // Touch has its own double-tap above; a double-click right after a drag is not one.
      if (lastType === 'touch' || e.timeStamp - dragEnd < 300) return;
      e.preventDefault();
      doubleAt(hitOf(e.target));
    });
    // Hover (mouse and pen): the object or link under the pointer is traced until it leaves.
    function hover(e) {
      if (e.pointerType === 'touch' || (gest && gest.kind !== 'press')) return;
      mouseAt = [e.clientX, e.clientY];
      if (hoverHold) {
        if (Math.hypot(e.clientX - hoverHold[0], e.clientY - hoverHold[1]) < 3) return;
        hoverHold = null;
      }
      const h = hitOf(e.target);
      if (h) { if (!sameHit(h, trace)) setTrace({ ...h, src: 'hover' }); }
      else if (trace && trace.src === 'hover') setTrace(null);
    }
    listen(svg, 'pointerover', hover);
    listen(svg, 'pointerleave', (e) => {
      if (e.pointerType === 'touch') return;
      mouseAt = hoverHold = null;
      if (!gest && trace && trace.src === 'hover') setTrace(null);
    });
    // The wheel zooms where the page itself does not scroll (the desktop app shell); elsewhere it
    // scrolls the page, and only ctrl/⌘ + wheel or a trackpad pinch (a wheel with ctrlKey) zooms.
    listen(svg, 'wheel', (e) => {
      const asked = e.ctrlKey || e.metaKey;
      if (!asked && (!appShell || Math.abs(e.deltaX) > Math.abs(e.deltaY))) return;
      const dy = clamp(e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1), -50, 50);
      const changed = zoomAt(Math.exp(-dy * (e.ctrlKey ? .01 : .004)), e.clientX, e.clientY);
      // A modified wheel over the stage means the stage, never the browser's page zoom.
      if (changed || asked) e.preventDefault();
    }, { passive: false });
    // Two fingers on the stage are a pinch: keep the browser from scrolling or zooming the page.
    const twoFingers = (e) => { if (e.touches.length > 1) e.preventDefault(); };
    listen(svg, 'touchstart', twoFingers, { passive: false });
    listen(svg, 'touchmove', twoFingers, { passive: false });

    const camButton = (name, fn) => listen($(name), 'click', () => { if ($(name).getAttribute('aria-disabled') !== 'true') fn(); });
    camButton('zoomInBtn', () => zoomStep(1));
    camButton('zoomOutBtn', () => zoomStep(-1));
    camButton('fitBtn', fitView);

    /* ---------- Text alternative for the stage ---------- */

    function describeScene(i) {
      $('sceneTitle').textContent = `Stage, ${opts.titleOf ? opts.titleOf(i) : `scene ${i + 1}`}`;
      $('sceneText').innerHTML = `<ul>${M.describe(i).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
    }

    /* ---------- Controls ---------- */

    function setPaused(v) {
      paused = v;
      svg.classList.toggle('paused', v);
      const b = $('pauseBtn');
      b.setAttribute('aria-pressed', String(v));
      b.innerHTML = v ? `${iconHtml('play')}<span>Resume</span>` : `${iconHtml('pause')}<span>Pause</span>`;
    }

    // Plays the arrival at scene k again, from scene `from` shown at once (-1: an empty stage).
    // Returns when the move ends, as show() does.
    function replay(k, from) {
      setPaused(false);
      setTrace(null);
      holdHover();
      if (reduce) { stageTo(k, true, true); return 0; }
      stageTo(from, true, true);
      return stageTo(k, false);
    }

    /* ================= Layout of the stage ================= */

    function layoutStage() {
      const wrapW = wrap.clientWidth;
      let W = wrapW;
      const H = svg.clientHeight || 400;
      if (phoneQuery.matches) {
        // On a phone the stage keeps a readable minimum scale (0.85) and pans sideways instead. A
        // group of scenes needs room for all of them, as its camera frames them all at once.
        const need = Math.max(...M.groupBounds.map((b) => (b.x1 - b.x0) * .85 + 2 * VIEW.margin));
        const hNeed = Math.max(...M.groupBounds.map((b) => (b.y1 - b.y0) * .85 + 2 * VIEW.margin));
        if (need > wrapW && hNeed <= H) W = Math.ceil(Math.min(need, wrapW * 2.6));
        else if (need > wrapW) W = Math.ceil(Math.min(need * H / hNeed, wrapW * 2.6));
      }
      svg.style.width = W > wrapW ? `${W}px` : '';
      Object.assign(VIEW, viewFor(W, H, { inline: wrapW < 520, phone: phoneQuery.matches }));
      $('scrollHint').hidden = W <= wrapW + 1;
      cams = M.planCameras(VIEW);
      // The desktop app shell, where the page itself does not scroll, pins the stage absolutely.
      appShell = getComputedStyle(svg).position === 'absolute';
      layoutMode = `${appShell}|${phoneQuery.matches}|${VIEW.inlinePanel}`;
    }

    function relayout() {
      const prevW = VIEW.W, prevH = VIEW.H, prevMode = layoutMode;
      layoutStage();
      // A new layout mode returns the reader's view to the author's framing; a resize keeps it.
      if (layoutMode !== prevMode) setView(FIT);
      if (prevW === VIEW.W && prevH === VIEW.H) return;
      if (stageIdx >= 0) {
        for (const k of ['x', 'y', 'w', 'h']) for (let t = tweens.length - 1; t >= 0; t--) if (tweens[t].target === cam && tweens[t].key === k) tweens.splice(t, 1);
        Object.assign(cam, camTargetOf(cams[stageIdx]), { dirty: true });
        setView(clampView(viewGoal || uv));
        hud.key = '__relayout';
        setPanel(stageIdx, true, 0);
      }
      renderPanelInline(stageIdx);
      centreScroll();
    }

    function centreScroll() {
      if (wrap.scrollWidth > wrap.clientWidth) wrap.scrollLeft = (wrap.scrollWidth - wrap.clientWidth) / 2;
    }

    listen($('replayBtn'), 'click', () => { if (opts.onReplay) opts.onReplay(); });
    listen($('pauseBtn'), 'click', () => setPaused(!paused));
    $('replayBtn').innerHTML = `${iconHtml('replay')}<span>Replay</span>`;
    const onMotion = (e) => {
      reduce = e.matches;
      stageTo(stageIdx, true);
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
      life.end();
      tweens.length = 0;
      timers.length = 0;
      uiAnims.length = 0;
      viewAnim = viewGoal = null;
      flows = [];
      packets = [];
      ptrs.clear();
      resizeObserver.disconnect();
      motionQuery.removeEventListener('change', onMotion);
    }

    /* ================= Start ================= */

    layoutStage();
    setPaused(false);
    centreScroll();
    nextFrame(frame);

    let shown = false;
    return {
      // Moves the stage to scene k (-1: empty). instant: no animation; fit: the reader's zoom and
      // pan return to the author's framing. Returns when the move ends, in ms on the stage clock.
      // The first scene shown opens already framed, so its objects drop into place.
      show(k, o = {}) {
        if (!shown && k >= 0) Object.assign(cam, camTargetOf(cams[k]), { dirty: true });
        shown = true;
        return stageTo(k, !!o.instant, !!o.fit);
      },
      replay,
      text: describeScene,
      inline: renderPanelInline,
      untrace() { setTrace(null); holdHover(); },
      pause: setPaused,
      get paused() { return paused; },
      after,
      zoom: zoomStep,
      fit: fitView,
      destroy,
    };
  }

  return { unusable, model: buildModel, parts, mount, defs: defsMarkup, flowKind, flowIcon };
});
