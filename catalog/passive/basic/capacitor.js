// Capacitor — two parallel plates. Horizontal, 2 pins.
SCH.define({
  type: 'capacitor', aka: ['cap', 'c'],
  category: 'passive', series: 'basic', name: 'Capacitor', ref: 'C',
  w: 4, h: 2, hidePins: true,
  pins: { '1': { at: [0, 1], side: 'l' }, '2': { at: [4, 1], side: 'r' } },
  draw: function (p) {
    p.line(0, 1, 1.6, 1);                        // short lead
    p.line(1.6, 0.3, 1.6, 1.7);
    p.line(2.4, 0.3, 2.4, 1.7);
    p.line(2.4, 1, 4, 1);                        // short lead
  }
});
