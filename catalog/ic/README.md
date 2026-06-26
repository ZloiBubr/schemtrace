# Integrated circuits

Multi-pin chips and modules drawn with a rectangular body. Use the `sides` convenience plus `SCH.icBody(p)`, and set `showName:true, lead:1`.

Part of the [schemtrace component catalog](../README.md). To add a part here,
drop a `<series>/<type>.js` file in this folder and register it in
[`../manifest.js`](../manifest.js). See the
[**authoring guide**](../README.md) for every `SCH.define(...)` parameter and
the Pen drawing API.

## Parts in this category

| series | type | name |
|--------|------|------|
| timer | `ne555` | NE555 timer (standard DIP-8 pinout) |
| opamp | `lm358` | LM358 dual op-amp |
| opamp | `opamp` | Generic op-amp triangle |
| mcu | `arduino` | Arduino R3 |

> Reference a part in a script by its `type` (or any alias). Pin conventions and
> usage are documented in the [top-level README](../../README.md).
