# Passive components

Resistors, capacitors, inductors and other two-terminal passives. These draw their own leads (`hidePins:true`) to the pin points.

Part of the [schemtrace component catalog](../README.md). To add a part here,
drop a `<series>/<type>.js` file in this folder and register it in
[`../manifest.js`](../manifest.js). See the
[**authoring guide**](../README.md) for every `SCH.define(...)` parameter and
the Pen drawing API.

## Parts in this category

| series | type | name |
|--------|------|------|
| basic | `resistor` | Resistor |
| basic | `capacitor` | Capacitor (non-polar) |
| basic | `cap_np` | Capacitor, explicitly non-polar (NP) |
| basic | `electrolytic` | Polarized / electrolytic capacitor |
| basic | `inductor` | Inductor |
| basic | `pot` | Potentiometer |

> Reference a part in a script by its `type` (or any alias). Pin conventions and
> usage are documented in the [top-level README](../../README.md).
