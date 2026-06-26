// Catalog manifest — the component tree, organized by category/series.
// Add a new component by dropping a file in the right folder and listing it
// here (file paths are relative to this manifest's folder).
SCH.manifest = [
  { category: 'passive',   series: 'basic',       file: 'passive/basic/resistor.js' },
  { category: 'passive',   series: 'basic',       file: 'passive/basic/capacitor.js' },
  { category: 'passive',   series: 'basic',       file: 'passive/basic/inductor.js' },
  { category: 'passive',   series: 'basic',       file: 'passive/basic/pot.js' },
  { category: 'passive',   series: 'basic',       file: 'passive/basic/electrolytic.js' },
  { category: 'passive',   series: 'basic',       file: 'passive/basic/cap_np.js' },
  { category: 'passive',   series: 'basic',       file: 'passive/basic/crystal.js' },
  { category: 'passive',   series: 'basic',       file: 'passive/basic/fuse.js' },
  { category: 'passive',   series: 'basic',       file: 'passive/basic/transformer.js' },

  { category: 'discrete',  series: 'diodes',      file: 'discrete/diodes/diode.js' },
  { category: 'discrete',  series: 'diodes',      file: 'discrete/diodes/led.js' },
  { category: 'discrete',  series: 'diodes',      file: 'discrete/diodes/schottky.js' },
  { category: 'discrete',  series: 'transistors', file: 'discrete/transistors/npn.js' },
  { category: 'discrete',  series: 'transistors', file: 'discrete/transistors/pnp.js' },
  { category: 'discrete',  series: 'transistors', file: 'discrete/transistors/jfet_n.js' },
  { category: 'discrete',  series: 'transistors', file: 'discrete/transistors/jfet_p.js' },
  { category: 'discrete',  series: 'transistors', file: 'discrete/transistors/nmos.js' },
  { category: 'discrete',  series: 'transistors', file: 'discrete/transistors/pmos.js' },
  { category: 'discrete',  series: 'transistors', file: 'discrete/transistors/phototransistor.js' },

  { category: 'ic',        series: 'timer',       file: 'ic/timer/ne555.js' },
  { category: 'ic',        series: 'opamp',       file: 'ic/opamp/lm358.js' },
  { category: 'ic',        series: 'opamp',       file: 'ic/opamp/opamp.js' },
  { category: 'ic',        series: 'mcu',         file: 'ic/mcu/arduino.js' },
  { category: 'ic',        series: 'logic',       file: 'ic/logic/gates.js' },

  { category: 'electromech', series: 'switches',  file: 'electromech/switches/pushbutton.js' },
  { category: 'electromech', series: 'relays',    file: 'electromech/relays/relay.js' },

  { category: 'power',     series: 'rails',       file: 'power/rails/vcc.js' },
  { category: 'power',     series: 'rails',       file: 'power/rails/gnd.js' },

  { category: 'connector', series: 'headers',     file: 'connector/headers/header.js' },
  { category: 'connector', series: 'modules',     file: 'connector/modules/module.js' },
  { category: 'connector', series: 'modules',     file: 'connector/modules/sensor.js' },
  { category: 'connector', series: 'modules',     file: 'connector/modules/lcd.js' },

  { category: 'misc',      series: 'audio',       file: 'misc/audio/buzzer.js' },
  { category: 'misc',      series: 'labels',      file: 'misc/labels/port.js' }
];
