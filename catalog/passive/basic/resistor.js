// Resistor — IEC rectangular (box) body. Horizontal, 2 pins.
SCH.define({
  type: 'resistor', aka: ['res', 'r'],
  category: 'passive', series: 'basic', name: 'Resistor', ref: 'R',
  w: 6, h: 2, hidePins: true,
  pins: { '1': { at: [0, 1], side: 'l' }, '2': { at: [6, 1], side: 'r' } },
  draw: function (p) {
    p.line(0, 1, 1, 1);                          // short lead
    p.rect(1, 0.4, 4, 1.2, { fill: p.theme.body });
    p.line(5, 1, 6, 1);                          // short lead
  }
});
