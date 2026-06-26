# Discrete semiconductors

Diodes, LEDs and transistors. Transistors use a circular envelope (`w:4, h:6`, pins on integer cells, `labelPos:'right'`).

Part of the [schemtrace component catalog](../README.md). To add a part here,
drop a `<series>/<type>.js` file in this folder and register it in
[`../manifest.js`](../manifest.js). See the
[**authoring guide**](../README.md) for every `SCH.define(...)` parameter and
the Pen drawing API.

## Parts in this category

| series | type | name |
|--------|------|------|
| diodes | `diode` | Diode |
| diodes | `led` | LED |
| transistors | `npn` | NPN bipolar |
| transistors | `pnp` | PNP bipolar |
| transistors | `jfet_n` | N-channel JFET |
| transistors | `jfet_p` | P-channel JFET |
| transistors | `nmos` | N-channel MOSFET |
| transistors | `pmos` | P-channel MOSFET |
| transistors | `phototransistor` | Phototransistor |

> Reference a part in a script by its `type` (or any alias). Pin conventions and
> usage are documented in the [top-level README](../../README.md).
