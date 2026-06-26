# Power & rails

Power and ground symbols. These usually set `hideValue:true` and draw their own rail text.

Part of the [schemtrace component catalog](../README.md). To add a part here,
drop a `<series>/<type>.js` file in this folder and register it in
[`../manifest.js`](../manifest.js). See the
[**authoring guide**](../README.md) for every `SCH.define(...)` parameter and
the Pen drawing API.

## Parts in this category

| series | type | name |
|--------|------|------|
| rails | `vcc` | Supply rail (VCC / +5V / VDD) |
| rails | `gnd` | Ground (GND / VSS) |

> Reference a part in a script by its `type` (or any alias). Pin conventions and
> usage are documented in the [top-level README](../../README.md).
