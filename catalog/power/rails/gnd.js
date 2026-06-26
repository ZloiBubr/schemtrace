// Ground symbol. Single pin at the top.
SCH.define({
  type: 'gnd', aka: ['ground', 'vss'],
  category: 'power', series: 'rails', name: 'GND', ref: false,
  w: 4, h: 3, hidePins: true, showName: false,
  pins: { 'g': { at: [2, 0], side: 't' } },
  draw: function (p) {
    p.line(2, 0, 2, 1.3);
    p.line(0.6, 1.3, 3.4, 1.3);
    p.line(1.1, 1.9, 2.9, 1.9);
    p.line(1.6, 2.5, 2.4, 2.5);
  }
});
