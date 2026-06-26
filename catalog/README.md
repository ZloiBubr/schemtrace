# Component catalog — authoring guide

This folder is the **component library** for [schemtrace](../README.md). Every part
is one self-registering JavaScript file, organized in a `category/series/part.js`
tree. This guide explains how to add a new component and documents every
parameter of `SCH.define(...)`.

> Quick mental model: a component declares **where its pins are** (on a grid, in
> cell units) and **how to draw its symbol** (with a small Pen API). The engine
> handles sizing, lead stubs, pin numbers/names, rotation, labels, and wiring.

---

## 1. Folder layout

```
catalog/
  manifest.js                 ← lists every part file (load order)
  <category>/<series>/<part>.js
```

- **category** — top-level group: `passive`, `discrete`, `ic`, `power`,
  `connector`, `electromech`, `misc`.
- **series** — a sub-group within a category (`basic`, `transistors`, `timer`…).
- **part** — one component per file.

Each category folder has its own README describing what belongs there and the
parts it currently holds.

## 2. Add a component in three steps

**1) Create the file** `catalog/<category>/<series>/<type>.js`:

```js
// A 2-terminal fuse symbol.
SCH.define({
  type: 'fuse', aka: ['fs'],
  category: 'passive', series: 'basic', name: 'Fuse', ref: 'F',
  w: 8, h: 2,
  pins: { '1': { at: [0, 1], side: 'l' }, '2': { at: [8, 1], side: 'r' } },
  draw: function (p) {
    p.line(0, 1, 2, 1);
    p.rect(2, 0.4, 4, 1.2);
    p.line(2, 1, 6, 1);
    p.line(6, 1, 8, 1);
  }
});
```

**2) Register it** in [`manifest.js`](manifest.js):

```js
{ category: 'passive', series: 'basic', file: 'passive/basic/fuse.js' },
```

**3) Use it** in a script: `F1: fuse 1A @10,4`.

That's it — the part now appears in the editor's Catalog page and can be placed,
rotated, themed, and auto-wired like any built-in.

---

## 3. `SCH.define(spec)` — every parameter

### Identity & catalog placement

| Param | Type | Default | Meaning |
|-------|------|---------|---------|
| `type` | string | — (**required**) | id used in scripts (`fuse`) and as the catalog key |
| `aka` | string[] | `[]` | aliases that also resolve to this part (`['fs']`) |
| `name` | string | = `type` | display name (catalog card; shown inside IC bodies when `showName`) |
| `ref` | string | `'X'` | designator prefix for auto-generated IDs (`R`, `U`, `Q`, `D`…) |
| `category` | string | `'misc'` | catalog category (top folder) |
| `series` | string | `'generic'` | catalog series (sub folder) |

### Size

| Param | Type | Default | Meaning |
|-------|------|---------|---------|
| `w` | number | `4` | symbol box width in **grid cells** |
| `h` | number | `2` | symbol box height in **grid cells** |
| `flexW` | bool | `false` | let the script set **width** via the `*w,h` token (else `w` is fixed) |
| `flexH` | bool | `false` | let the script set **height** via the `*w,h` token (else `h` is fixed) |

> `*w,h` in a script is `width,height` in **grid cells**, applied only to the
> dimensions a part flexes. A flexible part can derive more from its size in
> `draw` — e.g. `header` is `flexH` and draws one pin per 2 cells of height
> (`header *1,8` → 4 pins), reading `p.size.h`.

If you provide `sides` (below), `w`/`h` are **auto-computed** from the pin counts
unless you set them explicitly.

### Pins

A pin is `{ at: [x, y], side, num, name }` where `at` is in **cell units relative
to the box top-left**, and `side` ∈ `'l' | 'r' | 't' | 'b'` is the edge the pin
faces (controls the lead-stub direction and the wire "escape" direction).

Two ways to declare pins:

**A. Explicit `pins` map** — key each pin by its number (preferred) or name:

```js
pins: {
  '1': { at: [0, 1], side: 'l' },     // left edge, vertically centered
  '2': { at: [8, 1], side: 'r' }
}
// array shorthand: pins: { a: [0,1], c: [6,1] }  → {at:[0,1]} etc.
```

**B. `sides` convenience** (best for ICs/modules) — list pins per edge as
`'<number>:<name>'`; the engine lays them out evenly and computes the box size:

```js
sides: {
  left:  ['1:GND', '2:TR', '3:Q', '4:R'],
  right: ['8:V+', '7:DIS', '6:THR', '5:CV']
}
```

| Param | Type | Default | Meaning |
|-------|------|---------|---------|
| `sides` | object | — | `{left,right,top,bottom: ['num:name', …]}` → auto pins + auto size |
| `pinSpace` | number | `2` | cells between adjacent pins on a side |
| `pinMargin` | number | `1` | cells from the corner to the first/last pin |
| `lead` | number | `0` | length of the drawn lead stub in cells (ICs/modules use `1`) |
| `hidePins` | bool | `false` | don't draw lead stubs, pin numbers, or names (for parts that draw their own leads, e.g. passives) |

> Pins are keyed by **number** when present, because pin *names* repeat on ICs
> (a dual op-amp has `OUT`/`-IN`/`+IN` on both halves). Reference such pins by
> number (`U1:8`) or — for unique names — by name (`U1:THR`).

### Labels (designator / value / name)

| Param | Type | Default | Meaning |
|-------|------|---------|---------|
| `value` | string | `''` | default value text under the part (overridden per-instance) |
| `showName` | bool | `false` | show the component `name` inside the body (IC style) |
| `hideValue` | bool | `false` | suppress the auto value text (when `draw` renders its own) |
| `labelInside` | bool | = `showName` | may the designator/name sit **inside** the body when sides are crowded? On for IC-style parts, off for discretes — set explicitly to override |
| `labelPos` | string | auto | placement hint: `'inside'`, `'right'`, `'left'`, `'above'`, `'below'` |

The label auto-placer avoids overlapping traces and pins; `labelPos` is a hint it
tries first.

### Drawing

| Param | Type | Meaning |
|-------|------|---------|
| `draw` | `function (p, inst, schematic)` | renders the symbol using the Pen `p` (see §4) |

---

## 4. The Pen drawing API

`draw(p)` receives a **Pen**. All coordinates are in **cell units relative to the
part box top-left** (so a `w:8` part spans `x = 0…8`). The Pen converts to pixels
and applies the part's color/theme automatically.

| Method | Draws |
|--------|-------|
| `p.line(x1, y1, x2, y2, attrs?)` | a straight segment |
| `p.rect(x, y, w, h, attrs?)` | a rectangle (`attrs.fill` for fill) |
| `p.circle(cx, cy, r, attrs?)` | a circle |
| `p.poly(pts, attrs?)` | an **open** polyline — `pts = [[x,y], …]` |
| `p.polygon(pts, attrs?)` | a **closed**, filled polygon (arrowheads, triangles) |
| `p.path(d, attrs?)` | a raw SVG path `d` string |
| `p.dot(cx, cy, r?)` | a small filled dot in the part color |
| `p.zig(x1, x2, y, peaks, amp)` | a zig-zag between `x1`→`x2` (resistor body) |
| `p.arc(x1, y1, x2, y2, r, sweep, attrs?)` | an arc from one point to another |

Useful Pen fields inside `draw`:

- `p.s` — cell size in px · `p.theme` — active theme tokens · `p.size` — `{w,h}` in cells (post-resize)
- `p.inst.color` — per-instance `#hex` override · `p.inst.bg` — per-instance `bg:#hex`
- For an IC-style filled body + pin-1 marker, call **`SCH.icBody(p)`** instead of drawing the box yourself.

`attrs` is an optional object: `{ fill, stroke, 'stroke-width', … }`. Omit it to
use the theme's part color and default stroke.

### Drawing notes

- Default stroke is the part color (`theme.part`, or the instance `#hex`); set
  `attrs.stroke` only to deviate.
- The engine draws lead stubs, pin numbers, and names for you (unless
  `hidePins`) — your `draw` only needs the **symbol body**, ending lines at the
  pin `at` points.
- Keep pins on **integer** cell coordinates so wires align to the grid.

---

## 5. Conventions & tips

- **One part per file**, named `<type>.js`; comment the top line with what it is.
- **Match existing style** — look at a sibling in the same series before adding.
- **Transistors / circular-envelope parts**: `w:4, h:6`, pins on integer cells,
  `labelPos:'right'` (top/bottom/left carry pins).
- **ICs / modules**: use `sides` + `SCH.icBody(p)`, set `showName:true, lead:1`.
- **Passives**: `hidePins:true` and draw your own leads to the pin points.
- **Power symbols** (`vcc`/`gnd`): often `hideValue:true` and draw their own text.
- Test by opening [`../index.html`](../index.html) → the part shows on the Catalog
  page and can be dropped into a script.

See the top-level [README](../README.md) for the script format and full API.
