/*!
 * schemtrace.js — grid-based SVG electronic-schematic drawer
 * Places pinned components on a cell grid and wires their pins together with
 * orthogonal nets, junction dots, power/ground symbols, designators & values.
 *
 * Components live in a separate, extensible catalog (see /catalog). The core
 * knows nothing about specific parts — it only knows how to place a part, find
 * its pins, route nets, and render.
 *
 *   const s = new SCH.Schematic('#app', { cols: 60, rows: 36, cell: 16 });
 *   s.add('resistor', { id:'R1', at:[10,4], value:'10k' });
 *   s.add('lm358',    { id:'U1', at:[24,3] });
 *   s.net('SIG', ['R1.2', 'U1.3']);
 *   s.add('gnd', { id:'G1', at:[24,16] });
 *   s.render();
 *
 * Or from text (see SCH.parse / SCH.draw).
 */
(function (global) {
  'use strict';
  var SVGNS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
    if (attrs) for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function text(parent, attrs, str) { var t = el('text', attrs, parent); t.textContent = str; return t; }
  function assign(a, b) { for (var k in b) if (b[k] != null) a[k] = b[k]; return a; }

  // ========================================================================
  // Part registry (the catalog registers into this).
  // ========================================================================
  var parts = {};

  // Normalize a side-list entry: "13:OUT" -> {num:'13', name:'OUT'}; "GND" -> {name:'GND'}
  function pinEntry(s) {
    s = String(s).trim();
    var i = s.indexOf(':');
    if (i >= 0) return { num: s.slice(0, i).trim(), name: s.slice(i + 1).trim() };
    return { name: s };
  }

  // Build a pin map from {left:[],right:[],top:[],bottom:[]} side lists, spacing
  // pins evenly and sizing the body to fit. Mutates spec (sets pins,w,h).
  function sidesToPins(spec) {
    var sp = spec.pinSpace || 2, m = spec.pinMargin != null ? spec.pinMargin : 1;
    var S = spec.sides, pins = {};
    var L = (S.left || []).length, R = (S.right || []).length;
    var T = (S.top || []).length, B = (S.bottom || []).length;
    var h = Math.max(L, R) ? (Math.max(L, R) - 1) * sp + 2 * m : (spec.h || 4);
    var w = Math.max(T, B) ? (Math.max(T, B) - 1) * sp + 2 * m : (spec.w || 6);
    spec.w = spec.w || w; spec.h = spec.h || h;
    function lay(list, side) {
      var n = list.length; if (!n) return;
      var along = (side === 'left' || side === 'right') ? spec.h : spec.w;
      var start = (along - (n - 1) * sp) / 2;
      list.forEach(function (raw, i) {
        var e = pinEntry(raw);
        var off = start + i * sp;
        if (side === 'left')  e.at = [0, off],        e.side = 'l';
        if (side === 'right') e.at = [spec.w, off],   e.side = 'r';
        if (side === 'top')   e.at = [off, 0],        e.side = 't';
        if (side === 'bottom')e.at = [off, spec.h],   e.side = 'b';
        // key by pin NUMBER when present — pin names repeat on ICs (OUT/-IN/+IN
        // on both halves of a dual op-amp) and would otherwise overwrite.
        pins[(e.num != null && e.num !== '') ? e.num : e.name] = e;
      });
    }
    lay(S.left || [], 'left'); lay(S.right || [], 'right');
    lay(S.top || [], 'top'); lay(S.bottom || [], 'bottom');
    spec.pins = pins;
  }

  function define(spec) {
    spec.category = spec.category || 'misc';
    spec.series = spec.series || 'generic';
    spec.name = spec.name || spec.type;
    if (spec.sides && !spec.pins) sidesToPins(spec);
    // normalize array pins -> {at:[..]}
    var pins = spec.pins || {};
    for (var k in pins) if (Array.isArray(pins[k])) pins[k] = { at: pins[k] };
    spec.pins = pins;
    spec.w = spec.w || 4; spec.h = spec.h || 2;
    spec.lead = spec.lead || 0;   // pin lead-stub length (cells); ICs/modules use 1
    // labelInside: may the designator/name sit INSIDE the body? Construction
    // option the placer reads. Defaults on for IC-style parts (showName), off
    // for discrete parts; set explicitly to override (true/false).
    spec.labelInside = spec.labelInside != null ? spec.labelInside : !!spec.showName;
    parts[spec.type] = spec;
    (spec.aka || []).forEach(function (a) { parts[a] = spec; });
    return spec;
  }

  // Shared IC / module body: a rectangle inset by the lead length on whichever
  // sides carry pins, plus a pin-1 marker. Pin stubs/numbers/names are added by
  // the core (see _pinLabels). Call from a part's draw():  SCH.icBody(p)
  function icBody(p) {
    var lead = p.inst.def.lead || 0, w = p.size.w, h = p.size.h, pins = p.inst.def.pins;
    var hasL = 0, hasR = 0, hasT = 0, hasB = 0;
    for (var k in pins) { var s = pins[k].side; if (s === 'l') hasL = 1; else if (s === 'r') hasR = 1; else if (s === 't') hasT = 1; else if (s === 'b') hasB = 1; }
    var x0 = hasL ? lead : 0, x1 = w - (hasR ? lead : 0);
    var y0 = hasT ? lead : 0, y1 = h - (hasB ? lead : 0);
    p.rect(x0, y0, x1 - x0, y1 - y0, { fill: p.inst.bg || p.theme.body });
    p.inst._hasBody = true;   // tells render() not to add a separate background card
    // pin-1 marker (small notch) near the top-left inside corner
    p.circle(x0 + 0.55, y0 + 0.55, 0.2, { fill: p.inst.color || p.theme.part, stroke: 'none' });
  }

  // ========================================================================
  // Pen — drawing helper passed to a part's draw(). Coordinates are in CELL
  // units relative to the part's bounding-box top-left; converted to px here.
  // ========================================================================
  function Pen(g, cell, theme, inst) {
    this.g = g; this.s = cell; this.theme = theme; this.inst = inst;
  }
  Pen.prototype._s = function (a) {
    a = a || {}; a.fill = a.fill || 'none';
    a.stroke = a.stroke || this.inst.color || this.theme.part;
    a['stroke-width'] = a['stroke-width'] || this.theme.lw;
    a['stroke-linecap'] = a['stroke-linecap'] || 'round';
    a['stroke-linejoin'] = a['stroke-linejoin'] || 'round';
    return a;
  };
  Pen.prototype.line = function (x1, y1, x2, y2, a) {
    var s = this.s; return el('line', this._s(assign({ x1: x1 * s, y1: y1 * s, x2: x2 * s, y2: y2 * s }, a || {})), this.g);
  };
  Pen.prototype.rect = function (x, y, w, h, a) {
    var s = this.s; return el('rect', this._s(assign({ x: x * s, y: y * s, width: w * s, height: h * s }, a || {})), this.g);
  };
  Pen.prototype.circle = function (cx, cy, r, a) {
    var s = this.s; return el('circle', this._s(assign({ cx: cx * s, cy: cy * s, r: r * s }, a || {})), this.g);
  };
  Pen.prototype.poly = function (pts, a) {
    var s = this.s, str = pts.map(function (p) { return (p[0] * s) + ',' + (p[1] * s); }).join(' ');
    return el('polyline', this._s(assign({ points: str }, a || {})), this.g);
  };
  Pen.prototype.polygon = function (pts, a) {
    var s = this.s, str = pts.map(function (p) { return (p[0] * s) + ',' + (p[1] * s); }).join(' ');
    return el('polygon', this._s(assign({ points: str }, a || {})), this.g);
  };
  Pen.prototype.path = function (d, a) { return el('path', this._s(assign({ d: d }, a || {})), this.g); };
  Pen.prototype.dot = function (cx, cy, r) {
    return this.circle(cx, cy, r || 0.16, { fill: this.inst.color || this.theme.part, stroke: 'none' });
  };
  // zig-zag resistor body between (x1,y)-(x2,y)
  Pen.prototype.zig = function (x1, x2, y, peaks, amp) {
    peaks = peaks || 6; amp = amp || 0.5;
    var pts = [[x1, y]], n = peaks, step = (x2 - x1) / n;
    for (var i = 0; i < n; i++) {
      var dir = (i % 2 === 0) ? -1 : 1;
      pts.push([x1 + step * (i + 0.5), y + dir * amp]);
    }
    pts.push([x2, y]);
    return this.poly(pts);
  };
  // arc helper (cell units)
  Pen.prototype.arc = function (x1, y1, x2, y2, r, sweep, a) {
    var s = this.s;
    var d = ['M', x1 * s, y1 * s, 'A', r * s, r * s, 0, 0, sweep == null ? 1 : sweep, x2 * s, y2 * s].join(' ');
    return el('path', this._s(assign({ d: d }, a || {})), this.g);
  };

  // ========================================================================
  // Themes
  // ========================================================================
  var THEME_LIGHT = {
    bg: '#ffffff', grid: '#eef3f6', gridMajor: '#e0e8ee',
    part: '#7a1f1f', body: '#ffffff',
    wire: '#177a17', junction: '#177a17',
    pin: '#1f3a7a', ref: '#7a1f1f', value: '#444', name: '#222',
    lw: 1.6, font: 'ui-sans-serif, system-ui, Segoe UI, Roboto, sans-serif',
    fontSize: 11, pinSize: 9
  };
  var THEME_DARK = {
    bg: '#0f141a', grid: '#1b232c', gridMajor: '#27323d',
    part: '#e0a458', body: '#0f141a',
    wire: '#4cc38a', junction: '#4cc38a',
    pin: '#5aa9e6', ref: '#e0a458', value: '#aeb9c4', name: '#e6edf3',
    lw: 1.7, font: 'ui-sans-serif, system-ui, Segoe UI, Roboto, sans-serif',
    fontSize: 11, pinSize: 9
  };
  // Blueprint — classic white-on-blue drafting look.
  var THEME_BLUEPRINT = {
    bg: '#12365e', grid: '#1c4b7d', gridMajor: '#235c97',
    part: '#dfeaf6', body: '#12365e',
    wire: '#ffffff', junction: '#ffffff',
    pin: '#bfe0ff', ref: '#ffd479', value: '#bcd3ea', name: '#ffffff',
    lw: 1.6, font: 'ui-sans-serif, system-ui, Segoe UI, Roboto, sans-serif',
    fontSize: 11, pinSize: 9
  };
  // Mono — black on white for printing.
  var THEME_MONO = {
    bg: '#ffffff', grid: '#f0f0f0', gridMajor: '#e2e2e2',
    part: '#111111', body: '#ffffff',
    wire: '#111111', junction: '#111111',
    pin: '#333333', ref: '#000000', value: '#555555', name: '#000000',
    lw: 1.5, font: 'ui-sans-serif, system-ui, Segoe UI, Roboto, sans-serif',
    fontSize: 11, pinSize: 9
  };
  var THEMES = { light: THEME_LIGHT, dark: THEME_DARK, blueprint: THEME_BLUEPRINT, mono: THEME_MONO };

  // ========================================================================
  // Schematic
  // ========================================================================
  function Schematic(target, opts) {
    opts = opts || {};
    this.host = typeof target === 'string' ? document.querySelector(target) : target;
    if (!this.host) throw new Error('SCH: target not found');
    this.cell = opts.cell || 16;
    this.cols = opts.cols || 60;
    this.rows = opts.rows || 36;
    // theme: a preset name ('light'|'dark'|'blueprint'|'mono'), or an object of
    // overrides (merged onto `light`), or {base:'dark', ...overrides}.
    var theme = THEME_LIGHT, ov = {};
    if (typeof opts.theme === 'string') theme = THEMES[opts.theme] || THEME_LIGHT;
    else if (opts.theme && typeof opts.theme === 'object') {
      theme = THEMES[opts.theme.base] || THEME_LIGHT; ov = opts.theme;
    }
    this.theme = assign(assign({}, theme), ov);
    this.showGrid = opts.grid !== false;
    this.showPins = opts.pinLabels !== false;
    this.insts = [];
    this.byId = {};
    this.nets = [];    // logical connections {name, refs, opts} — routed at render
    this.wires = [];   // computed routed polylines {pts, color}
    this.labels = [];  // free-floating net labels {at, text}
    this._dirty = true;
    this._n = 0;
  }

  // --- placement -----------------------------------------------------------
  Schematic.prototype.add = function (type, opts) {
    var def = parts[type];
    if (!def) throw new Error('SCH: unknown component "' + type + '"');
    opts = opts || {};
    var at = opts.at || [0, 0];
    var inst = {
      type: type, def: def, id: opts.id || (def.ref || 'X') + (++this._n),
      col: at[0], row: at[1],
      rotate: ((opts.rotate || opts.rot || 0) % 360 + 360) % 360,
      mirror: !!(opts.mirror || opts.flip),
      mirrorV: !!(opts.mirrorV || opts.flipv),
      value: opts.value != null ? opts.value : (def.value || ''),
      label: opts.label, color: opts.color, bg: opts.bg, opts: opts
    };
    this.insts.push(inst); this.byId[inst.id] = inst;
    this._dirty = true;
    return inst;
  };

  Schematic.prototype._size = function (inst) {
    var def = inst.def, w = def.w, h = def.h, o = inst.opts;
    if (def.flexW && o.w) w = o.w;
    if (def.flexH && o.h) h = o.h;
    return { w: w, h: h };
  };

  // absolute pixel position of a local cell-coordinate within an instance,
  // honoring mirror + 90° rotation (matches the SVG group transform exactly).
  Schematic.prototype._abs = function (inst, lc, lr) {
    var s = this.cell, sz = this._size(inst);
    var x = lc * s, y = lr * s;
    if (inst.mirror) x = sz.w * s - x;
    if (inst.mirrorV) y = sz.h * s - y;
    var cx = sz.w * s / 2, cy = sz.h * s / 2;
    var rad = inst.rotate * Math.PI / 180, dx = x - cx, dy = y - cy;
    var rx = cx + dx * Math.cos(rad) - dy * Math.sin(rad);
    var ry = cy + dx * Math.sin(rad) + dy * Math.cos(rad);
    var sn = this._snap(inst);
    return { x: inst.col * s + rx + sn, y: inst.row * s + ry + sn };
  };

  // Half-cell snap: a 90/270 rotation pivots about the box centre (w/2, h/2). When
  // w and h have different parity that centre is on a half cell, so every pin lands
  // off-grid — shifting the part by half a cell puts the pins back on the grid.
  Schematic.prototype._snap = function (inst) {
    var sz = this._size(inst);
    return ((inst.rotate === 90 || inst.rotate === 270) && ((sz.w + sz.h) & 1)) ? this.cell / 2 : 0;
  };

  // resolve "U1.3" (or "U1" single-pin) to absolute px; or [col,row] -> px
  Schematic.prototype.pin = function (ref) {
    if (Array.isArray(ref)) return { x: ref[0] * this.cell, y: ref[1] * this.cell };
    var dot = ref.lastIndexOf('.');
    var id = dot < 0 ? ref : ref.slice(0, dot);
    var pn = dot < 0 ? null : ref.slice(dot + 1);
    var inst = this.byId[id];
    if (!inst) throw new Error('SCH: no component "' + id + '"');
    var pins = inst.def.pins, p;
    if (pn == null) { for (var k in pins) { p = pins[k]; break; } }   // first pin
    else p = pins[pn] || findPinByNum(pins, pn) || findPinByName(pins, pn);
    if (!p) throw new Error('SCH: no pin "' + pn + '" on ' + id);
    return this._abs(inst, p.at[0], p.at[1]);
  };
  function findPinByNum(pins, num) {
    for (var k in pins) if (pins[k].num === num) return pins[k];
    return null;
  }
  function findPinByName(pins, name) {
    for (var k in pins) if (pins[k].name === name) return pins[k];
    return null;
  }

  // --- nets / wires --------------------------------------------------------
  // Logical connection of a list of pin refs. Actual geometry is computed by the
  // auto-router at render time (so it can see every part as an obstacle).
  Schematic.prototype.net = function (name, refs, opts) {
    opts = opts || {};
    if (typeof name !== 'string') { opts = refs || {}; refs = name; name = ''; }
    this.nets.push({ name: name, refs: refs, opts: opts });
    this._dirty = true;
    return this;
  };
  Schematic.prototype.wire = function (a, b, opts) {
    opts = opts || {};
    this.nets.push({ name: opts.net || '', refs: [a, b], opts: opts });
    this._dirty = true;
    return this;
  };
  Schematic.prototype.label = function (at, str, opts) {
    this.labels.push({ at: at, text: str, opts: opts || {} });
    return this;
  };

  // L-shaped manhattan route between two px points (router fallback)
  Schematic.prototype._route = function (a, b, mode) {
    if (Math.abs(a.x - b.x) < 0.5 || Math.abs(a.y - b.y) < 0.5) return [a, b];
    if (mode === 'v') return [a, { x: a.x, y: b.y }, b];
    return [a, { x: b.x, y: a.y }, b];   // horizontal-first default
  };

  // Rich pin resolution: returns the pin's connection point plus a one-cell
  // "escape" point stepped outward along the pin's facing side, so wires leave
  // the pin cleanly before routing (and never run across the body / other pins).
  var OUT = { l: [-1, 0], r: [1, 0], t: [0, -1], b: [0, 1] };
  Schematic.prototype._pinInfo = function (ref) {
    if (Array.isArray(ref)) {
      var pp = { x: ref[0] * this.cell, y: ref[1] * this.cell };
      return { px: pp, escapePx: pp };
    }
    var dot = ref.lastIndexOf('.');
    var id = dot < 0 ? ref : ref.slice(0, dot);
    var pn = dot < 0 ? null : ref.slice(dot + 1);
    var inst = this.byId[id];
    if (!inst) throw new Error('SCH: no component "' + id + '"');
    var pins = inst.def.pins, p;
    if (pn == null) { for (var k in pins) { p = pins[k]; break; } }
    else p = pins[pn] || findPinByNum(pins, pn) || findPinByName(pins, pn);
    if (!p) throw new Error('SCH: no pin "' + pn + '" on ' + id);
    var d = OUT[p.side] || [0, 0];
    return {
      px: this._abs(inst, p.at[0], p.at[1]),
      escapePx: this._abs(inst, p.at[0] + d[0], p.at[1] + d[1])
    };
  };

  // ---- A* grid auto-router ------------------------------------------------
  // Routes every net on a half-cell grid, treating part bounding boxes as
  // obstacles and penalizing turns and crossings so nets fan out instead of
  // overlapping. Results cached until parts/nets change.
  function MinHeap() { this.a = []; }
  MinHeap.prototype.push = function (node, pri) {
    var a = this.a; a.push({ n: node, p: pri }); var i = a.length - 1;
    while (i > 0) { var par = (i - 1) >> 1; if (a[par].p <= a[i].p) break; var t = a[par]; a[par] = a[i]; a[i] = t; i = par; }
  };
  MinHeap.prototype.pop = function () {
    var a = this.a, top = a[0], last = a.pop();
    if (a.length) { a[0] = last; var i = 0, n = a.length; for (;;) { var l = 2 * i + 1, r = l + 1, s = i; if (l < n && a[l].p < a[s].p) s = l; if (r < n && a[r].p < a[s].p) s = r; if (s === i) break; var t = a[s]; a[s] = a[i]; a[i] = t; i = s; } }
    return top.n;
  };
  MinHeap.prototype.size = function () { return this.a.length; };

  Schematic.prototype._routeAll = function () {
    var self = this, cell = this.cell, G = 2;   // 2 nodes per cell (half-grid)
    // grid bounds from content extent (independent of viewport cols/rows)
    var maxC = 8, maxR = 8;
    this.insts.forEach(function (inst) {
      var sz = self._size(inst);
      [[0, 0], [sz.w, 0], [0, sz.h], [sz.w, sz.h]].forEach(function (c) {
        var a = self._abs(inst, c[0], c[1]);
        maxC = Math.max(maxC, a.x / cell); maxR = Math.max(maxR, a.y / cell);
      });
    });
    var W = Math.ceil(maxC + 4) * G, H = Math.ceil(maxR + 4) * G, Wn = W + 1;
    var blocked = new Uint8Array(Wn * (H + 1));
    function bidx(c, r) { return r * Wn + c; }
    function inb(c, r) { return c >= 0 && c <= W && r >= 0 && r <= H; }
    // block part bodies (axis-aligned bbox over rotated corners)
    this.insts.forEach(function (inst) {
      var sz = self._size(inst), xs = [], ys = [];
      [[0, 0], [sz.w, 0], [0, sz.h], [sz.w, sz.h]].forEach(function (c) {
        var a = self._abs(inst, c[0], c[1]); xs.push(a.x / cell); ys.push(a.y / cell);
      });
      var c0 = Math.round(Math.min.apply(0, xs) * G), c1 = Math.round(Math.max.apply(0, xs) * G);
      var r0 = Math.round(Math.min.apply(0, ys) * G), r1 = Math.round(Math.max.apply(0, ys) * G);
      for (var c = c0; c <= c1; c++) for (var r = r0; r <= r1; r++) if (inb(c, r)) blocked[bidx(c, r)] = 1;
    });
    // clearance halo: cells touching a body cost extra, so wires keep a gap
    // from parts/pins instead of grazing them
    var near = new Float32Array(Wn * (H + 1));
    for (var rr = 0; rr <= H; rr++) for (var cc2 = 0; cc2 <= W; cc2++) {
      var ii = bidx(cc2, rr); if (blocked[ii]) continue;
      var adj = false;
      for (var dc = -1; dc <= 1 && !adj; dc++) for (var dr = -1; dr <= 1 && !adj; dr++) {
        if (!dc && !dr) continue; var ac = cc2 + dc, ar = rr + dr;
        if (inb(ac, ar) && blocked[bidx(ac, ar)]) adj = true;
      }
      if (adj) near[ii] = 3;
    }

    function outDir(info) {
      var dx = info.escapePx.x - info.px.x, dy = info.escapePx.y - info.px.y;
      if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 0 : 1;
      if (Math.abs(dy) > 0.1) return dy > 0 ? 2 : 3;
      return -1;
    }

    var used = {}, wires = [];
    // Coalesce nets that share a pin: a pin referenced by two net statements is
    // one electrical node, so route it as ONE net (no duplicate stubs/overlap,
    // and a proper junction where the groups meet).
    var mergedNets = coalesceNets(this.nets);
    // Resolve each net's pins to grid nodes, then route SHORTEST nets first: short
    // local nets claim their lanes before long nets, which then route around them —
    // fewer forced detours and crossings overall.
    var prepared = mergedNets.map(function (net) {
      var infos;
      try { infos = net.refs.map(function (r) { return self._pinInfo(r); }); } catch (e) { return null; }
      if (infos.length < 2) return null;
      var nodes = infos.map(function (info) {
        return { c: Math.round(info.escapePx.x / cell * G), r: Math.round(info.escapePx.y / cell * G), info: info };
      });
      var minC = Infinity, maxC = -Infinity, minR = Infinity, maxR = -Infinity;
      nodes.forEach(function (n) { if (n.c < minC) minC = n.c; if (n.c > maxC) maxC = n.c; if (n.r < minR) minR = n.r; if (n.r > maxR) maxR = n.r; });
      return { net: net, nodes: nodes, span: (maxC - minC) + (maxR - minR) };
    }).filter(Boolean);
    prepared.sort(function (a, b) { return a.span - b.span; });

    // crossings (cells shared with an already-routed net) and a route score used to
    // compare a forward route against its reverse
    function pathCrossings(p) { var n = 0; for (var i = 1; i < p.length; i++) if (used[bidx(p[i].c, p[i].r)]) n++; return n; }
    function routeScore(p) {
      var turns = 0;
      for (var i = 1; i < p.length - 1; i++) { var a = p[i - 1], b = p[i], c = p[i + 1]; if (!((a.c === b.c && b.c === c.c) || (a.r === b.r && b.r === c.r))) turns++; }
      return pathCrossings(p) * 6 + turns * 4 + p.length;
    }

    prepared.forEach(function (item, nid) {
      var net = item.net, nodes = item.nodes;
      nodes.forEach(function (n) { if (inb(n.c, n.r)) blocked[bidx(n.c, n.r)] = 0; });
      // pin-escape nodes: the only places a half-cell line may land (straight stub
      // into a half-cell pin). Trunk tees must connect on full cells.
      var pinNode = {}; nodes.forEach(function (n) { pinNode[bidx(n.c, n.r)] = 1; });

      var netCells = {};          // cells belonging to this net (branch targets)
      var netAdded = [];          // cells to fold into global `used` after the net
      function px(p) { return { x: p.c / G * cell, y: p.r / G * cell }; }
      function absorb(path) { path.forEach(function (p) { var k = bidx(p.c, p.r); if (!netCells[k]) { netCells[k] = 1; netAdded.push(k); } }); }

      // Grow the net as a tree, nearest-first (Prim): attach whichever remaining
      // pin is closest to the net so far, and route it to the NEAREST cell
      // already on the net — so a new pin always branches off the closest line
      // of the same net instead of running a parallel trace back to a pin.
      var wStart = wires.length;  // wires of this net — folded into `used` (with axis) at the end
      var seed = nodes[0];
      netCells[bidx(seed.c, seed.r)] = 1; netAdded.push(bidx(seed.c, seed.r));
      wires.push({ pts: dedupe([seed.info.px, px(seed)]), color: net.opts.color, nid: nid }); // seed pin stub
      var inNet = [seed], rem = nodes.slice(1);

      while (rem.length) {
        var bi = 0, bd = Infinity;
        for (var ri = 0; ri < rem.length; ri++) for (var ni = 0; ni < inNet.length; ni++) {
          var dd = Math.abs(rem[ri].c - inNet[ni].c) + Math.abs(rem[ri].r - inNet[ni].r);
          if (dd < bd) { bd = dd; bi = ri; }
        }
        var A = rem.splice(bi, 1)[0];
        var startN = bidx(A.c, A.r);
        var goalSet = netCells;
        var isGoal = function (n) { return !!goalSet[n]; };
        var z0 = function () { return 0; };
        var path = self._astar(startN, isGoal, z0, blocked, near, bidx, W, H, Wn, used, inb, outDir(A.info), pinNode);
        // if the forward trace crosses other nets, try the reverse direction (from
        // the join point back to the pin) — often a shorter, less-crossing route
        if (path && pathCrossings(path) > 0) {
          var endN = bidx(path[path.length - 1].c, path[path.length - 1].r);
          var rev = self._astar(endN, function (n) { return n === startN; }, z0, blocked, near, bidx, W, H, Wn, used, inb, -1, pinNode);
          if (rev) { rev.reverse(); if (routeScore(rev) < routeScore(path)) path = rev; }
        }
        // full-cell routing couldn't reach the net — fall back to half-cell lanes so
        // the branch still connects (last resort, only when no grid route exists)
        if (!path) path = self._astar(startN, isGoal, z0, blocked, near, bidx, W, H, Wn, used, inb, outDir(A.info), pinNode, true);
        var pts;
        if (path) {
          // pull the route taut: replace staircases/jogs with the longest
          // collision-free 1-bend run, so nets don't make unnecessary turns and
          // branch attachments line up (no twin junction dots a cell apart)
          var origin = {}; path.forEach(function (p) { origin[bidx(p.c, p.r)] = 1; });
          var free = function (c, r) {
            if (!inb(c, r)) return false;
            var b = bidx(c, r);
            if (origin[b]) return true;                 // the A* path is always allowed
            if (blocked[b]) return false;               // never cut through a part
            if (used[b] && !netCells[b]) return false;  // nor through another net
            // keep a lane clear of other nets so straightening preserves spacing
            if ((inb(c + 1, r) && used[bidx(c + 1, r)] && !netCells[bidx(c + 1, r)]) ||
                (inb(c - 1, r) && used[bidx(c - 1, r)] && !netCells[bidx(c - 1, r)]) ||
                (inb(c, r + 1) && used[bidx(c, r + 1)] && !netCells[bidx(c, r + 1)]) ||
                (inb(c, r - 1) && used[bidx(c, r - 1)] && !netCells[bidx(c, r - 1)])) return false;
            return true;
          };
          path = straighten(path, free);
          absorb(path); pts = simplify(path.map(px));
        }
        else { pts = [px(A)]; }
        wires.push({ pts: dedupe([A.info.px].concat(pts)), color: net.opts.color, nid: nid });
        inNet.push(A);
      }
      // Fold this net's wires into `used` as an AXIS bitmask (1 = horizontal,
      // 2 = vertical) on every cell they pass through. Other nets may then cross
      // perpendicular but never run along the same lane (overlap).
      var q = cell / G;
      for (var wi = wStart; wi < wires.length; wi++) {
        var P = wires[wi].pts;
        for (var pi = 1; pi < P.length; pi++) {
          var ac = Math.round(P[pi - 1].x / q), ar = Math.round(P[pi - 1].y / q);
          var bc = Math.round(P[pi].x / q), br = Math.round(P[pi].y / q);
          var ax = (ar === br) ? 1 : 2;
          var sdc = bc > ac ? 1 : bc < ac ? -1 : 0, sdr = br > ar ? 1 : br < ar ? -1 : 0;
          var cc = ac, rr = ar;
          for (;;) { if (inb(cc, rr)) used[bidx(cc, rr)] = (used[bidx(cc, rr)] || 0) | ax; if (cc === bc && rr === br) break; cc += sdc; rr += sdr; }
        }
      }
    });
    return wires;
  };

  // A* on the half-cell grid. `isGoal(nodeIndex)` allows multi-target search
  // (route to the nearest cell already on the net); `near` is the clearance map.
  Schematic.prototype._astar = function (start, isGoal, hfn, blocked, near, bidx, W, H, Wn, used, inb, startDir, pinNode, noParity) {
    pinNode = pinNode || {};
    var sc = start % Wn, sr = Math.floor(start / Wn);
    if (!inb(sc, sr)) return null;
    var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    var g = {}, came = {}, dir = {}, closed = {};
    var open = new MinHeap();
    g[start] = 0; dir[start] = startDir == null ? -1 : startDir; open.push(start, hfn(sc, sr));
    while (open.size()) {
      var cur = open.pop();
      if (isGoal(cur)) {
        var path = [], n = cur;
        while (n != null) { path.push({ c: n % Wn, r: Math.floor(n / Wn) }); n = came[n]; }
        return path.reverse();
      }
      if (closed[cur]) continue; closed[cur] = 1;
      var cx = cur % Wn, cy = Math.floor(cur / Wn);
      for (var k = 0; k < 4; k++) {
        var nc = cx + DIRS[k][0], nr = cy + DIRS[k][1];
        if (!inb(nc, nr)) continue;
        var ni = bidx(nc, nr);
        var goal = isGoal(ni);
        if (blocked[ni] && !goal) continue;
        var axis = (k < 2) ? 1 : 2;                          // 1 = moving horizontally, 2 = vertically
        // Keep trunks on FULL cells: a horizontal run must lie on a full-cell row,
        // a vertical run on a full-cell column. Half-cell lines are allowed only at
        // a pin escape — the straight stub into a half-cell pin. The fallback pass
        // (noParity) lifts this when a full-cell route can't be found.
        if (!noParity && (axis === 1 ? (nr & 1) : (nc & 1)) && !pinNode[ni]) continue;
        var u = used[ni] || 0;
        if (u & axis) continue;                              // HARD: never run along another net's lane (overlap)
        var step = 1;
        if (dir[cur] >= 0 && dir[cur] !== k) step += 4;      // strongly prefer straight runs (fewer turns)
        if (u) step += 5;                                    // perpendicular crossing — allowed but discouraged
        else {                                               // graduated repulsion → parallel nets spread evenly
          if ((inb(nc + 1, nr) && used[bidx(nc + 1, nr)]) || (inb(nc - 1, nr) && used[bidx(nc - 1, nr)]) ||
              (inb(nc, nr + 1) && used[bidx(nc, nr + 1)]) || (inb(nc, nr - 1) && used[bidx(nc, nr - 1)])) step += 3;
          else if ((inb(nc + 2, nr) && used[bidx(nc + 2, nr)]) || (inb(nc - 2, nr) && used[bidx(nc - 2, nr)]) ||
              (inb(nc, nr + 2) && used[bidx(nc, nr + 2)]) || (inb(nc, nr - 2) && used[bidx(nc, nr - 2)])) step += 1;
        }
        step += near[ni] || 0;                               // keep clear of bodies
        var ng = g[cur] + step;
        if (g[ni] === undefined || ng < g[ni]) { g[ni] = ng; came[ni] = cur; dir[ni] = k; open.push(ni, ng + hfn(nc, nr)); }
      }
    }
    return null;
  };

  // Union nets that share any pin into single electrical nodes (union-find over
  // pin refs). Returns merged nets {name, refs, opts}; color is taken from the
  // first member that sets one.
  function coalesceNets(nets) {
    var parent = nets.map(function (_, i) { return i; });
    function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
    var byPin = {};
    nets.forEach(function (net, i) {
      (net.refs || []).forEach(function (r) {
        var k = normRef(r);
        if (byPin[k] != null) parent[find(byPin[k])] = find(i); else byPin[k] = i;
      });
    });
    var groups = {}, order = [];
    nets.forEach(function (net, i) {
      var g = find(i);
      var grp = groups[g];
      if (!grp) { grp = groups[g] = { name: net.name, refs: [], seen: {}, opts: {} }; order.push(g); }
      if (net.opts) for (var ok in net.opts) if (grp.opts[ok] == null && net.opts[ok] != null) grp.opts[ok] = net.opts[ok];
      if (!grp.name && net.name) grp.name = net.name;
      (net.refs || []).forEach(function (r) { var k = normRef(r); if (!grp.seen[k]) { grp.seen[k] = 1; grp.refs.push(r); } });
    });
    return order.map(function (g) { return groups[g]; });
  }

  // orthogonal path "pull-taut": greedily replace the longest sub-path with a
  // straight or single-bend connector that stays collision-free (per `free`),
  // collapsing staircases and twin branch-junctions into clean L-shapes.
  function lineFree(c0, r0, c1, r1, free) {
    if (c0 === c1) { var sr = r1 > r0 ? 1 : -1; for (var r = r0; r !== r1 + sr; r += sr) if (!free(c0, r)) return false; return true; }
    if (r0 === r1) { var sc = c1 > c0 ? 1 : -1; for (var c = c0; c !== c1 + sc; c += sc) if (!free(c, r0)) return false; return true; }
    return false;
  }
  function connFree(a, b, free) {
    if (a.c === b.c || a.r === b.r) { return lineFree(a.c, a.r, b.c, b.r, free) ? [a, b] : null; }
    var k1 = { c: b.c, r: a.r }, k2 = { c: a.c, r: b.r };
    // keep the introduced bend lines on FULL cells (horizontal on an even row,
    // vertical on an even column) so straightening never cuts a half-cell corner
    if (!((a.r & 1) || (b.c & 1)) && lineFree(a.c, a.r, k1.c, k1.r, free) && lineFree(k1.c, k1.r, b.c, b.r, free)) return [a, k1, b];
    if (!((b.r & 1) || (a.c & 1)) && lineFree(a.c, a.r, k2.c, k2.r, free) && lineFree(k2.c, k2.r, b.c, b.r, free)) return [a, k2, b];
    return null;
  }
  function straighten(path, free) {
    if (path.length < 3) return path;
    var out = [path[0]], i = 0;
    while (i < path.length - 1) {
      var a = path[i], conn = null, j = path.length - 1;
      for (; j > i + 1; j--) { conn = connFree(a, path[j], free); if (conn) break; }
      if (conn) { for (var k = 1; k < conn.length; k++) out.push(conn[k]); i = j; }
      else { out.push(path[i + 1]); i++; }
    }
    return out;
  }

  function simplify(pts) {
    if (pts.length < 3) return pts;
    var out = [pts[0]];
    for (var i = 1; i < pts.length - 1; i++) {
      var a = out[out.length - 1], b = pts[i], c = pts[i + 1];
      var col = (a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y);
      if (!col) out.push(b);
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  function dedupe(pts) {
    var out = [];
    pts.forEach(function (p) { var l = out[out.length - 1]; if (!l || Math.abs(l.x - p.x) > 0.1 || Math.abs(l.y - p.y) > 0.1) out.push(p); });
    return out;
  }

  // --- rendering -----------------------------------------------------------
  Schematic.prototype._build = function () {
    var s = this.cell, w = this.cols * s, h = this.rows * s;
    var svg = el('svg', { xmlns: SVGNS, width: w, height: h, viewBox: '0 0 ' + w + ' ' + h, class: 'schematic' });
    svg.style.background = this.theme.bg; svg.style.display = 'block';
    this.svg = svg;
    this.gGrid = el('g', { class: 'grid' }, svg);
    this.gWires = el('g', { class: 'wires' }, svg);
    this.gJunc = el('g', { class: 'junctions' }, svg);
    this.gComp = el('g', { class: 'parts' }, svg);
    this.gAnno = el('g', { class: 'annot' }, svg);
    this.host.innerHTML = ''; this.host.appendChild(svg);
  };

  Schematic.prototype._grid = function () {
    var t = this.theme, s = this.cell, g = this.gGrid; g.innerHTML = '';
    if (!this.showGrid) return;
    for (var c = 0; c <= this.cols; c++)
      el('line', { x1: c * s, y1: 0, x2: c * s, y2: this.rows * s, stroke: c % 5 ? t.grid : t.gridMajor, 'stroke-width': 1 }, g);
    for (var r = 0; r <= this.rows; r++)
      el('line', { x1: 0, y1: r * s, x2: this.cols * s, y2: r * s, stroke: r % 5 ? t.grid : t.gridMajor, 'stroke-width': 1 }, g);
  };

  Schematic.prototype.render = function () {
    if (!this.svg) this._build();
    var self = this, s = this.cell, t = this.theme;
    // keep the SVG sized to the current cols/rows (they may have changed since
    // the last render, e.g. to fill a viewport)
    var W = this.cols * s, H = this.rows * s;
    this.svg.setAttribute('width', W);
    this.svg.setAttribute('height', H);
    this.svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    // grid fills the whole canvas; content groups are shifted by (offX,offY) so a
    // viewer can park the drawing in the middle of a viewport-sized-or-larger grid
    var tr = 'translate(' + (this.offX || 0) + ',' + (this.offY || 0) + ')';
    this.gWires.setAttribute('transform', tr);
    this.gJunc.setAttribute('transform', tr);
    this.gComp.setAttribute('transform', tr);
    this.gAnno.setAttribute('transform', tr);
    this._grid();
    this.gWires.innerHTML = ''; this.gJunc.innerHTML = '';
    this.gComp.innerHTML = ''; this.gAnno.innerHTML = '';

    // (re)route nets only when parts/nets changed — cheap on zoom/re-render
    if (this._dirty || !this.wires) { this.wires = this._routeAll(); this._dirty = false; }

    // wires
    this.wires.forEach(function (w) {
      var d = w.pts.map(function (p, i) { return (i ? 'L' : 'M') + Math.round(p.x) + ',' + Math.round(p.y); }).join(' ');
      var nid = (w.nid == null ? '' : w.nid);
      // fat invisible hit path so a net is easy to click/select; the visible wire
      // above it is thin but also clickable (so selection works on the line itself)
      el('path', { d: d, fill: 'none', stroke: 'transparent', 'stroke-width': self.cell * 0.6,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'wirehit',
        'data-nid': nid, 'pointer-events': 'stroke' }, self.gWires);
      el('path', { d: d, fill: 'none', stroke: w.color || t.wire, 'stroke-width': t.lw + 0.3,
        'stroke-linejoin': 'round', 'stroke-linecap': 'round', class: 'wire',
        'data-nid': nid, 'pointer-events': 'stroke' }, self.gWires);
    });
    this._junctions();

    // components (pin leads/numbers collect into _pinObst so the label pass,
    // which runs last, can avoid them too)
    this._pinObst = [];
    this.insts.forEach(function (inst) {
      var sz = self._size(inst);
      var g = el('g', { class: 'part part-' + inst.type, 'data-id': inst.id }, self.gComp);
      // transparent full-bbox hit area so the whole component is clickable/draggable,
      // not just its thin outline strokes
      el('rect', { x: 0, y: 0, width: sz.w * s, height: sz.h * s, fill: 'transparent', 'pointer-events': 'all', class: 'parthit' }, g);
      var sn = self._snap(inst);
      var ox = inst.col * s + sn, oy = inst.row * s + sn, cx = sz.w * s / 2, cy = sz.h * s / 2;
      var tf = 'translate(' + ox + ',' + oy + ')';
      if (inst.rotate) tf += ' rotate(' + inst.rotate + ',' + cx + ',' + cy + ')';
      if (inst.mirror) tf += ' translate(' + (sz.w * s) + ',0) scale(-1,1)';
      if (inst.mirrorV) tf += ' translate(0,' + (sz.h * s) + ') scale(1,-1)';
      g.setAttribute('transform', tf);
      var pen = new Pen(g, s, t, inst); pen.size = sz;
      inst._hasBody = false;
      inst.def.draw(pen, inst, self);
      // background card for symbols that don't fill their own body (e.g. discrete
      // parts) — inserted behind the drawn symbol; 8-digit bg gives transparency
      if (inst.bg && !inst._hasBody) {
        var bgr = el('rect', { x: 0, y: 0, width: sz.w * s, height: sz.h * s, rx: 3,
          fill: inst.bg, stroke: 'none' });
        g.insertBefore(bgr, g.firstChild);
      }
      self._pinLabels(inst, sz);
    });

    // labels are placed after symbols + wires are known, so the placer can
    // avoid overlapping traces/parts
    this._placeLabels();

    // free net labels
    this.labels.forEach(function (l) {
      var p = Array.isArray(l.at) ? { x: l.at[0] * s, y: l.at[1] * s } : self.pin(l.at);
      self._netLabel(p, l.text, l.opts);
    });
    return this;
  };

  // junction dots: where >=3 wire-segment ends meet, or a vertex sits on
  // another segment's interior (a T).
  Schematic.prototype._junctions = function () {
    var t = this.theme, self = this;
    function key(p) { return Math.round(p.x) + ',' + Math.round(p.y); }
    // Only wires of the SAME net may form a junction — where two independent
    // nets merely cross or touch, there is NO electrical connection and no dot.
    // Tally vertices and collect segments per net id.
    var verts = {}, segs = [], ncolor = {};  // verts[nid][key]=segment-ends ; segs={nid,a,b}
    this.wires.forEach(function (w) {
      var nid = w.nid == null ? '_' : w.nid;
      if (w.color) ncolor[nid] = w.color;    // a junction dot takes its net's colour
      // count SEGMENT ENDPOINTS at each point (a corner = 2, a free end = 1), so a
      // dot needs 3+ segment-ends — a tap where the trunk bends + a branch ends.
      for (var i = 1; i < w.pts.length; i++) {
        var A = w.pts[i - 1], B = w.pts[i];
        var v = verts[nid] || (verts[nid] = {});
        v[key(A)] = (v[key(A)] || 0) + 1;
        v[key(B)] = (v[key(B)] || 0) + 1;
        segs.push({ nid: nid, a: A, b: B });
      }
    });
    var drawn = {};
    function place(x, y, nid) {
      // dedupe only the exact same point — never suppress a nearby junction, or a
      // genuine connection looks disconnected (missing dot)
      var k = Math.round(x) + ',' + Math.round(y);
      if (drawn[k]) return; drawn[k] = 1;
      el('circle', { cx: x, cy: y, r: t.lw + 1.6, fill: ncolor[nid] || t.junction, stroke: 'none',
        class: 'junction', 'data-nid': (nid == null ? '' : nid) }, self.gJunc);
    }
    // degree >= 3 endpoints within a single net (3+ wire segments meeting at a point)
    for (var nid in verts) {
      var vv = verts[nid];
      for (var k in vv) if (vv[k] >= 3) { var a = k.split(','); place(+a[0], +a[1], nid); }
    }
    // T-junctions: a wire ENDPOINT landing on the interior of one of its net's
    // segments (a real branch tap). Mid-wire corners are NOT junctions, so a plain
    // 90° bend never gets a dot.
    this.wires.forEach(function (w) {
      if (w.pts.length < 2) return;
      var wn = w.nid == null ? '_' : w.nid;
      [w.pts[0], w.pts[w.pts.length - 1]].forEach(function (vtx) {
        segs.forEach(function (sg) {
          if (sg.nid === wn && onSegmentInterior(vtx, sg.a, sg.b)) place(Math.round(vtx.x), Math.round(vtx.y), wn);
        });
      });
    });
  };
  function onSegmentInterior(p, a, b) {
    var eps = 0.6;
    if (Math.abs(a.x - b.x) < eps) { // vertical
      if (Math.abs(p.x - a.x) > eps) return false;
      var lo = Math.min(a.y, b.y), hi = Math.max(a.y, b.y);
      return p.y > lo + eps && p.y < hi - eps;
    }
    if (Math.abs(a.y - b.y) < eps) { // horizontal
      if (Math.abs(p.y - a.y) > eps) return false;
      var lo2 = Math.min(a.x, b.x), hi2 = Math.max(a.x, b.x);
      return p.x > lo2 + eps && p.x < hi2 - eps;
    }
    return false;
  }

  // pin nubs, lead stubs, pin numbers (outside) and names (inside) — all drawn
  // upright regardless of part rotation. Offsets are computed in LOCAL cell
  // coordinates and projected through _abs() so rotation/mirror stay correct.
  Schematic.prototype._pinLabels = function (inst, sz) {
    if (!this.showPins) return;
    var t = this.theme, def = inst.def, lead = def.lead || 0;
    if (def.hidePins) return;
    for (var key in def.pins) {
      var p = def.pins[key];
      if (p.name == null && p.num == null) continue;
      if (p.at[0] > sz.w + 0.01 || p.at[1] > sz.h + 0.01) continue;  // outside sized body
      var lc = p.at[0], lr = p.at[1], side = p.side;
      var outer = this._abs(inst, lc, lr);
      // inward unit step (local) for this side
      var ix = side === 'l' ? 1 : side === 'r' ? -1 : 0;
      var iy = side === 't' ? 1 : side === 'b' ? -1 : 0;

      // lead stub from body edge out to the connection point
      if (lead > 0 && side) {
        var inner = this._abs(inst, lc + ix * lead, lr + iy * lead);
        el('line', { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y,
          stroke: inst.color || t.part, 'stroke-width': t.lw, 'stroke-linecap': 'round' }, this.gComp);
        if (this._pinObst) this._pinObst.push({ x: Math.min(inner.x, outer.x) - 2, y: Math.min(inner.y, outer.y) - 2,
          w: Math.abs(inner.x - outer.x) + 4, h: Math.abs(inner.y - outer.y) + 4 });
      }
      // connection nub at the outer point
      el('circle', { cx: outer.x, cy: outer.y, r: 1.3, fill: t.pin, stroke: 'none' }, this.gComp);

      var esideAnchor = effectiveSide(side, inst);
      // pin number — sits just outside the body, above/beside the lead
      if (p.num != null && p.num !== '') {
        var nMid = lead > 0 ? lead * 0.5 : 0.35;       // along the lead
        var npos = this._abs(inst, lc + ix * nMid - (iy ? 0.5 : 0), lr + iy * nMid - (ix ? 0.6 : 0));
        text(this.gComp, { x: npos.x, y: npos.y, fill: t.value,
          'font-size': t.pinSize - 1, 'font-family': t.font, 'text-anchor': 'middle',
          'dominant-baseline': 'middle' }, p.num);
        if (this._pinObst) { var nw = String(p.num).length * (t.pinSize - 1) * 0.6, nh = t.pinSize;
          this._pinObst.push({ x: npos.x - nw / 2 - 1, y: npos.y - nh / 2 - 1, w: nw + 2, h: nh + 2 }); }
      }
      // pin name — inside the body, hugging the edge
      if (p.name != null && !def.hideNames) {
        var pad = lead > 0 ? 0.35 : 0.22;
        var mpos = this._abs(inst, lc + ix * (lead + pad), lr + iy * (lead + pad));
        var anchor = esideAnchor === 'l' ? 'start' : esideAnchor === 'r' ? 'end' : 'middle';
        text(this.gComp, { x: mpos.x, y: mpos.y, fill: t.pin,
          'font-size': t.pinSize, 'font-family': t.font, 'text-anchor': anchor,
          'dominant-baseline': 'middle' }, p.name);
      }
    }
  };
  // a part rotated 90/180/270 moves which physical side a pin faces
  function effectiveSide(side, inst) {
    if (!side) return side;
    var order = ['t', 'r', 'b', 'l'];
    var i = order.indexOf(side); if (i < 0) return side;
    var steps = Math.round(inst.rotate / 90) % 4;
    var s2 = order[(i + steps) % 4];
    if (inst.mirror && (s2 === 'l' || s2 === 'r')) s2 = (s2 === 'l') ? 'r' : 'l';
    return s2;
  }

  // Collision-aware label placement. For each part the engine tries positions
  // around the body — preferring sides with no pins — and picks the first whose
  // text block doesn't overlap a wire, another part, or an already-placed label.
  // Large bodies (ICs) also offer an 'inside' slot. Distance is bounded: every
  // candidate hugs the body (pad ≈ 6px), so labels never drift far away.
  function rectsOverlap(a, b, m) {
    m = m || 0;
    return a.x < b.x + b.w + m && a.x + a.w + m > b.x && a.y < b.y + b.h + m && a.y + a.h + m > b.y;
  }
  function overlapArea(a, b) {
    var ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
    var oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    return ox * oy;
  }
  Schematic.prototype._bbox = function (inst) {
    var self = this, sz = this._size(inst);
    var xs = [], ys = [];
    [[0, 0], [sz.w, 0], [0, sz.h], [sz.w, sz.h]].forEach(function (q) {
      var a = self._abs(inst, q[0], q[1]); xs.push(a.x); ys.push(a.y);
    });
    var x0 = Math.min.apply(0, xs), y0 = Math.min.apply(0, ys);
    return { x: x0, y: y0, w: Math.max.apply(0, xs) - x0, h: Math.max.apply(0, ys) - y0 };
  };

  Schematic.prototype._placeLabels = function () {
    var self = this, t = this.theme, fs = t.fontSize, lh = fs * 1.2, pad = 6;

    // static obstacles: part bodies + pin leads/numbers + wire segments — the whole
    // finished diagram, so labels are moved into clear space after traces are set
    var bodies = this.insts.map(function (i) { return self._bbox(i); });
    var obstacles = bodies.concat(this._pinObst || []);
    this.wires.forEach(function (w) {
      for (var i = 1; i < w.pts.length; i++) {
        var a = w.pts[i - 1], b = w.pts[i];
        obstacles.push({ x: Math.min(a.x, b.x) - 1, y: Math.min(a.y, b.y) - 1,
          w: Math.abs(a.x - b.x) + 2, h: Math.abs(a.y - b.y) + 2 });
      }
    });
    var placed = [];

    this.insts.forEach(function (inst, idx) {
      var def = inst.def;
      var rows = [];
      if (inst.id && def.ref !== false) rows.push([inst.id, t.ref, true]);
      if (def.showName) rows.push([inst.label || def.name, t.name, true]);
      if (inst.value && !def.hideValue) rows.push([inst.value, t.value, false]);
      if (!rows.length) return;

      var tw = 0;
      rows.forEach(function (r) { tw = Math.max(tw, r[0].length * fs * 0.6); });
      var th = rows.length * lh;
      var bb = bodies[idx];
      var cx = bb.x + bb.w / 2, cy = bb.y + bb.h / 2;

      // which physical sides carry pins → avoid placing the label there
      var occ = {};
      for (var k in def.pins) { var es = effectiveSide(def.pins[k].side, inst); if (es) occ[es] = 1; }

      // Generate many candidate boxes per side — several distances out from the
      // body and a few slides along the side — so a label can step past a trace
      // instead of settling on top of it.
      function rct(x, y, anchor, ax, inside) { return { x: x, y: y, w: tw, h: th, anchor: anchor, ax: ax, inside: !!inside }; }
      function genSide(sd) {
        var out = [], di, slides;
        for (di = 0; di < 3; di++) {
          var dist = pad + di * (lh + 3);
          if (sd === 'below' || sd === 'above') {
            var yy = sd === 'below' ? bb.y + bb.h + dist : bb.y - dist - th;
            slides = [0, tw * 0.55, -tw * 0.55];
            slides.forEach(function (dx) { out.push(rct(cx - tw / 2 + dx, yy, 'middle', cx + dx)); });
          } else {
            slides = [0, th * 0.7, -th * 0.7];
            if (sd === 'right') { var xr = bb.x + bb.w + dist; slides.forEach(function (dy) { out.push(rct(xr, cy - th / 2 + dy, 'start', xr)); }); }
            else { var xl = bb.x - dist; slides.forEach(function (dy) { out.push(rct(xl - tw, cy - th / 2 + dy, 'end', xl)); }); }
          }
        }
        return out;
      }
      // side preference: explicit hint, then pin-free sides, then the rest
      var sides = [], pushSide = function (sd) { if (sd && sd !== 'inside' && sides.indexOf(sd) < 0) sides.push(sd); };
      pushSide(def.labelPos);
      ['below', 'right', 'above', 'left'].forEach(function (sd) {
        var sk = sd === 'below' ? 'b' : sd === 'above' ? 't' : sd === 'right' ? 'r' : 'l';
        if (!occ[sk]) pushSide(sd);
      });
      ['below', 'right', 'above', 'left'].forEach(pushSide);
      var cands = [];
      sides.forEach(function (sd) { genSide(sd).forEach(function (c) { cands.push(c); }); });
      // inside: forced by labelPos:'inside', else only if the part opted in and fits
      var insideOK = def.labelPos === 'inside' || (def.labelInside && bb.w > th + 8 && bb.h > th + 4 && tw < bb.w - 10);
      if (insideOK) { var ins = rct(cx - tw / 2, cy - th / 2, 'middle', cx, true); if (def.labelPos === 'inside') cands.unshift(ins); else cands.push(ins); }

      // first candidate with zero overlap against parts/traces/other labels wins;
      // otherwise the least-overlapping (never a blind fallback)
      var chosen = null, bestScore = Infinity;
      for (var oi = 0; oi < cands.length; oi++) {
        var c = cands[oi];
        var obs = c.inside ? obstacles.filter(function (o) { return o !== bb; }) : obstacles;
        var score = 0, jj;
        for (jj = 0; jj < obs.length; jj++) score += overlapArea(c, obs[jj]);
        for (jj = 0; jj < placed.length; jj++) score += overlapArea(c, placed[jj]);
        if (score === 0) { chosen = c; break; }
        if (score < bestScore) { bestScore = score; chosen = c; }
      }
      if (!chosen) chosen = cands[0];

      var y0 = chosen.y + lh * 0.8;
      rows.forEach(function (r, i) {
        text(self.gAnno, { x: chosen.ax, y: y0 + i * lh, fill: r[1], 'font-weight': r[2] ? 700 : 400,
          'font-size': fs, 'font-family': t.font, 'text-anchor': chosen.anchor, 'dominant-baseline': 'middle' }, r[0]);
      });
      placed.push(chosen);
      obstacles.push(chosen);
    });
  };

  Schematic.prototype._netLabel = function (p, str, opts) {
    var t = this.theme;
    var tw = String(str).length * (t.fontSize * 0.62) + 8;
    var g = el('g', null, this.gAnno);
    el('rect', { x: p.x - tw / 2, y: p.y - t.fontSize, width: tw, height: t.fontSize * 1.7,
      rx: 3, fill: opts.fill || t.bg, stroke: opts.color || t.wire, 'stroke-width': 1 }, g);
    text(g, { x: p.x, y: p.y - t.fontSize * 0.1, fill: opts.color || t.pin, 'font-weight': 600,
      'font-size': t.fontSize, 'font-family': t.font, 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, str);
  };

  Schematic.prototype.fit = function (margin) {
    margin = margin == null ? 3 : margin;
    var maxC = 0, maxR = 0, self = this;
    this.insts.forEach(function (inst) {
      var sz = self._size(inst);
      [[0, 0], [sz.w, 0], [0, sz.h], [sz.w, sz.h]].forEach(function (corner) {
        var a = self._abs(inst, corner[0], corner[1]);
        maxC = Math.max(maxC, a.x / self.cell); maxR = Math.max(maxR, a.y / self.cell);
      });
    });
    this.wires.forEach(function (w) { w.pts.forEach(function (p) {
      maxC = Math.max(maxC, p.x / self.cell); maxR = Math.max(maxR, p.y / self.cell); }); });
    this.cols = Math.ceil(maxC) + margin; this.rows = Math.ceil(maxR) + margin;
    return this;
  };

  // pixel bounding box of all drawn content (parts + routed wires), with a
  // one-cell margin for labels. Used by viewers to center the diagram.
  Schematic.prototype.bounds = function () {
    var self = this, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    function ext(x, y) { if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y; }
    if (this._dirty) { this.wires = this._routeAll(); this._dirty = false; }
    this.insts.forEach(function (inst) { var b = self._bbox(inst); ext(b.x, b.y); ext(b.x + b.w, b.y + b.h); });
    this.wires.forEach(function (w) { w.pts.forEach(function (p) { ext(p.x, p.y); }); });
    if (minX === Infinity) return { x: 0, y: 0, w: this.cols * this.cell, h: this.rows * this.cell };
    var m = this.cell;
    return { x: minX - m, y: minY - m, w: (maxX - minX) + 2 * m, h: (maxY - minY) + 2 * m };
  };

  // shift all drawn content by (x,y) px without re-routing — cheap, used by
  // viewers to center the diagram within a grid that fills the viewport.
  Schematic.prototype.setOffset = function (x, y) {
    this.offX = x; this.offY = y;
    if (this.svg) {
      var tr = 'translate(' + x + ',' + y + ')';
      this.gWires.setAttribute('transform', tr);
      this.gJunc.setAttribute('transform', tr);
      this.gComp.setAttribute('transform', tr);
      this.gAnno.setAttribute('transform', tr);
    }
    return this;
  };

  Schematic.prototype.toSVG = function () {
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(this.svg);
  };

  // ========================================================================
  // Catalog browsing helpers
  // ========================================================================
  function tree() {
    var t = {}, seen = {};
    for (var k in parts) {
      var s = parts[k];
      if (seen[s.type]) continue; seen[s.type] = 1;
      (t[s.category] = t[s.category] || {});
      (t[s.category][s.series] = t[s.category][s.series] || []).push(s);
    }
    return t;
  }
  // dynamically load catalog modules listed in a manifest array
  function load(base, manifest, cb) {
    base = base || '';
    var list = manifest || SCH.manifest || [];
    var left = list.length, errs = [];
    if (!left) { cb && cb(errs); return; }
    list.forEach(function (entry) {
      var src = base + (entry.file || entry);
      var sc = document.createElement('script');
      sc.src = src;
      sc.onload = function () { if (--left === 0) cb && cb(errs); };
      sc.onerror = function () { errs.push(src); if (--left === 0) cb && cb(errs); };
      document.head.appendChild(sc);
    });
  }

  // ========================================================================
  // Text DSL
  // ========================================================================
  // Lines (first token is the component designator / a keyword):
  //   Theme: <name>                                  set the canvas theme
  //   Title: "<text>"                                (metadata)
  //   <ID>: "<type>" "<value>" [@x,y] [rot N] [flip] [*w,h] [#hex]
  //   net: <name> <ID:pin> <ID:pin> ...
  //   wire: <ID:pin> <ID:pin>
  //   label: @x,y "<text>"
  //   # / // / %%  → comment ;  schematic / sch  → ignored marker
  // Pin refs accept either ':' or '.'  (U1:3  ==  U1.3)
  function parse(text) {
    var lines = String(text).replace(/\r/g, '').split('\n');
    var comps = [], nets = [], labels = [], theme = null, title = null;
    lines.forEach(function (raw) {
      var line = raw.trim();
      if (!line || line[0] === '#' || line.indexOf('//') === 0 || line.indexOf('%%') === 0) return;
      if (/^(schematic|sch)\s*$/i.test(line)) return;

      var th = line.match(/^theme\s*:?\s*([A-Za-z][\w]*)/i); if (th) { theme = th[1].toLowerCase(); return; }
      var ti = line.match(/^title\s*:?\s*"?([^"]*)"?/i); if (ti) { title = ti[1].trim(); return; }

      if (/^net\b/i.test(line) || /^wire\b/i.test(line)) { nets.push(parseNet(line)); return; }
      if (/^label\b/i.test(line)) {
        var lm = line.match(/^label\s*:?\s*@?(\d+),(\d+)\s+"?([^"]*)"?/i);
        if (lm) labels.push({ at: [+lm[1], +lm[2]], text: lm[3].trim() });
        return;
      }
      var c = parseComp(line);
      if (c) comps.push(c);
    });
    return { comps: comps, nets: nets, labels: labels, theme: theme, title: title };
  }

  // normalize a pin ref: accept "ID:pin" or "ID.pin" → internal "ID.pin"
  function normRef(t) { return t.indexOf(':') >= 0 ? t.replace(':', '.') : t; }

  function parseNet(line) {
    var body = line.replace(/^(net|wire)\s*:?\s*/i, '');
    var opts = {};
    // optional wire colour: a #hex token anywhere on the line
    var col = body.match(/#([0-9a-fA-F]{3,8})\b/);
    if (col) { opts.color = '#' + col[1]; body = body.replace(col[0], ' '); }
    var toks = body.split(/\s+/).filter(Boolean);
    var name = '';
    // leading token with no pin separator is the (optional) net name
    if (toks.length && toks[0].indexOf(':') < 0 && toks[0].indexOf('.') < 0) name = toks.shift();
    return { name: name, refs: toks.map(normRef), opts: opts };
  }

  function parseComp(line) {
    // ID, then optional ':' , then the rest (type/value/directives, any order)
    var m = line.match(/^([A-Za-z_][\w]*)\s*:?\s*(.*)$/);
    if (!m) return null;
    var c = { id: m[1], type: '', value: '', opts: {} };
    var rest = m[2] || '';
    // @x,y  with optional orientation  @x,y,deg  (0|90|180|270)
    var at = rest.match(/@(-?\d+),(-?\d+)(?:,(\d+))?/);
    if (at) { c.at = [+at[1], +at[2]]; if (at[3] != null) c.opts.rot = +at[3]; rest = rest.replace(at[0], ' '); }
    var sz = rest.match(/\*(\d+),(\d+)/); if (sz) { c.opts.w = +sz[1]; c.opts.h = +sz[2]; rest = rest.replace(sz[0], ' '); }
    var ro = rest.match(/\brot\s*:?\s*(\d+)/i); if (ro) { c.opts.rot = +ro[1]; rest = rest.replace(ro[0], ' '); }
    if (/\b(flipv|mirrorv|vflip)\b/i.test(rest)) { c.opts.flipv = true; rest = rest.replace(/\b(flipv|mirrorv|vflip)\b/i, ' '); }
    if (/\b(flip|mirror)\b/i.test(rest)) { c.opts.flip = true; rest = rest.replace(/\b(flip|mirror)\b/i, ' '); }
    // bg:#hex  — component background fill; 8 digits give RGBA transparency (#rrggbbaa)
    var bg = rest.match(/\bbg\s*:?\s*#([0-9a-fA-F]{3,8})\b/i); if (bg) { c.opts.bg = '#' + bg[1]; rest = rest.replace(bg[0], ' '); }
    var col = rest.match(/#([0-9a-fA-F]{3,8})\b/); if (col) { c.opts.color = '#' + col[1]; rest = rest.replace(col[0], ' '); }
    // remaining ordered tokens (quoted or bare): [type, value]
    var toks = [], re = /"([^"]*)"|(\S+)/g, mm;
    while ((mm = re.exec(rest))) toks.push(mm[1] != null ? mm[1] : mm[2]);
    c.type = toks[0]; c.value = toks[1] != null ? toks[1] : '';
    return c.type ? c : null;
  }

  // build a Schematic from text. Problems are collected on s.errors (with line
  // context) rather than aborting the whole drawing, so a single bad net or
  // typo doesn't blank the canvas — the rest still renders and the caller can
  // surface what went wrong.
  function draw(target, txt, opts) {
    opts = opts || {};
    var model = parse(txt);
    // a `Theme:` directive in the script wins over the caller's theme option
    var themeName = model.theme || opts.theme;
    if (model.theme && !THEMES[model.theme]) themeName = opts.theme;   // unknown name → ignore
    var s = new Schematic(target, assign({}, opts, { cols: opts.cols || 8, rows: opts.rows || 6, theme: themeName }));
    s.usedTheme = (typeof themeName === 'string' && THEMES[themeName]) ? themeName : (typeof opts.theme === 'string' ? opts.theme : 'light');
    s.errors = [];
    if (model.theme && !THEMES[model.theme]) s.errors.push('Unknown theme "' + model.theme + '" — using ' + s.usedTheme);
    var known = {};
    model.comps.forEach(function (c) {
      if (!parts[c.type]) { s.errors.push('Unknown component type "' + c.type + '" (' + c.id + ')'); return; }
      try { s.add(c.type, assign({ id: c.id, at: c.at || [0, 0], value: c.value }, c.opts)); known[c.id] = 1; }
      catch (e) { s.errors.push(c.id + ': ' + e.message); }
    });
    model.nets.forEach(function (n) {
      // validate every ref first so a bad pin reports clearly and the net is
      // skipped wholesale (no half-drawn wire)
      var bad = null;
      n.refs.forEach(function (r) { if (bad) return; try { s.pin(r); } catch (e) { bad = e.message; } });
      if (bad) { s.errors.push((n.name ? 'net ' + n.name : 'wire') + ': ' + bad); return; }
      try { s.net(n.name, n.refs, n.opts || {}); } catch (e) { s.errors.push((n.name ? 'net ' + n.name : 'wire') + ': ' + e.message); }
    });
    model.labels.forEach(function (l) { try { s.label(l.at, l.text); } catch (e) { s.errors.push(e.message); } });
    if (opts.fit !== false) s.fit(opts.margin != null ? opts.margin : 3);
    if (opts.cols) s.cols = opts.cols; if (opts.rows) s.rows = opts.rows;
    s.render();
    return s;
  }

  // ---- export -------------------------------------------------------------
  // Library name: Schemtrace. `SCH` is a short alias used by catalog modules.
  var Schemtrace = {
    name: 'schemtrace',
    Schematic: Schematic, define: define, parts: parts, Pen: Pen, icBody: icBody,
    parse: parse, draw: draw, tree: tree, load: load, manifest: [],
    themes: THEMES,
    version: '1.0.0'
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Schemtrace;
  else { global.Schemtrace = Schemtrace; global.SCH = Schemtrace; }
})(typeof window !== 'undefined' ? window : this);
