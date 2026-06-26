# Connectors & modules

Pin headers and self-contained modules (sensors, displays). Many are flexibly sized via `flexH`/`flexW` and the `*w,h` script token.

Part of the [schemtrace component catalog](../README.md). To add a part here,
drop a `<series>/<type>.js` file in this folder and register it in
[`../manifest.js`](../manifest.js). See the
[**authoring guide**](../README.md) for every `SCH.define(...)` parameter and
the Pen drawing API.

## Parts in this category

| series | type | name |
|--------|------|------|
| headers | `header` | Pin header — `*_,h` sets height; 1 pin per 2 cells (`*1,8` → 4 pins) |
| modules | `module` | Generic labeled module/breakout (`flexW`+`flexH`) |
| modules | `sensor` | Sensor module |
| modules | `lcd1602` | 16x2 character LCD |

> Reference a part in a script by its `type` (or any alias). Pin conventions and
> usage are documented in the [top-level README](../../README.md).
