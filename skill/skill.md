---
name: schematics
description: >-
  Draw electronic/electrical circuit schematics as clean SVG using the bundled
  schemtrace engine instead of hand-coding SVG paths or ASCII art. Use this skill
  whenever the user wants to visualize, draw, sketch, diagram, or generate a circuit
  — e.g. "draw a 555 blinker", "show me how to wire an LED to an Arduino", "schematic
  for a voltage divider", "diagram this op-amp filter", "wire up a transistor switch",
  or any mention of resistors, capacitors, transistors, diodes/LEDs, op-amps, NE555,
  MOSFETs, GND/VCC rails, breadboard wiring, or pin connections. Trigger even when the
  user doesn't say the word "schematic" but clearly describes a circuit to be drawn.
  Do NOT use for PCB layout/Gerber files, mechanical drawings, flowcharts, or software
  architecture diagrams.
---

# Schematics (schemtrace)

Render circuit schematics from a compact text DSL to clean, auto-routed SVG. You
describe parts on a grid and the nets between their pins; the engine routes the
wires (A*), drops junction dots, and places labels. You never compute wire paths.

## Workflow

1. Write the circuit as a `.sch` text file using the DSL below.
2. Render it:
   ```bash
   cd <skill-dir> && npm i jsdom sharp >/dev/null 2>&1   # first run only
   node scripts/render.js circuit.sch out.png --theme blueprint
   ```
   `.png` output also writes `out.svg`. Use `.svg` as the target if you only want vector.
3. Read/preview the PNG to sanity-check routing and labels, then present the
   SVG (vector, themeable) and/or PNG to the user.

Render errors for unknown parts or bad pins are printed but the rest still draws —
read them, fix the offending line, re-render.

## DSL

One statement per line. `#`, `//`, `%%` start comments. Optional leading `schematic`.

```
Theme: blueprint                 # light | dark | blueprint | mono
Title: "My circuit"

# Component: <ID>: <type> <value> [@x,y] [rot:N] [flip] [flipv] [*w,h] [#hex] [bg:#hex]
PWR: vcc +5V      @8,0           # @x,y = top-left grid cell (pins at fixed offsets)
R1:  resistor 330 @10,4          # rot:N = 0|90|180|270 ; flip/flipv = mirror
D1:  led          @20,3          # #hex recolors symbol; bg:#rrggbbaa = tint
G1:  gnd          @24,8

# Nets / wires:
net: VCC PWR:+ R1:1              # named node joining 2+ pins; #hex anywhere colors net
net: SIG R1:2 D1:a              # pins as ID:pin or ID.pin
wire: D1:c G1:g                # single unnamed connection
label: @40,2 "OUT"             # free-floating label at a grid cell
```

Junction dots appear automatically where 3+ segments of the SAME net meet; crossing
nets that aren't connected get no dot. Quote values containing spaces: `"dual amp"`.

### Layout tips
- Place parts a few cells apart so the router has room; signal flows left→right reads best.
- `@x,y` is the part's top-left cell. Bump coordinates and re-render if wires look cramped.
- `*w,h` only affects flexible parts: `header *1,8` = 4-pin (1 pin / 2 cells), `module *12,8` = 12×8 box.

## Catalog (type → pins)

- passive: `resistor` `capacitor` `cap_np` `electrolytic` `inductor` `pot` — pins `1`/`2`
- discrete: `diode` `led` (pins `a`/`c`); `npn` `pnp` `jfet_n` `jfet_p` `nmos` `pmos` `phototransistor` (pins `b`/`c`/`e` or `g`/`d`/`s`)
- ic: `ne555` `lm358` `opamp` `arduino` — pins by printed name (`U1:THR`, `U1:8`); opamp adds `+` `-` `out` `V+` `V-`
- power: `vcc` `gnd`
- connector/module: `header` (flex height) `module` (flex box) `sensor` `lcd1602`
- electromech: `pushbutton`; misc: `buzzer` `port`

If unsure of a part's exact pin names, read its source under `vendor/catalog/<category>/.../<part>.js`
(the `sides`/pin list is at the top of each file).

## Theming

Presets via `Theme:` or `--theme`: light, dark, blueprint, mono. Per-element color with
`#hex` on a component, `bg:#rrggbbaa` for a tint, and `#hex` on a `net:` line to color a
whole net (traces + dots) — handy for power/ground/signal highlighting.

## Example (555 astable)

```
schematic
Theme: blueprint
U1: ne555 @28,14
R1: resistor 10k @16,8
C1: capacitor 2n2 @28,28
G1: gnd @30,40
net: VDD #d23 U1:8 U1:4 R1:1
net: GND U1:1 C1:2 G1:g
```