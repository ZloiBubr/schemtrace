// Diode — triangle + cathode bar. Pins a (anode) / c (cathode).
SCH.define({
  type: 'diode', aka: ['d'],
  category: 'discrete', series: 'diodes', name: 'Diode', ref: 'D',
  w: 6, h: 2, hidePins: true,
  pins: { 'a': { at: [0, 1], side: 'l' }, 'c': { at: [6, 1], side: 'r' } },
  draw: function (p) {
    p.line(0, 1, 2, 1);
    p.polygon([[2, 0.3], [2, 1.7], [3.6, 1]], { fill: p.inst.color || p.theme.part });
    p.line(3.6, 0.3, 3.6, 1.7);
    p.line(3.6, 1, 6, 1);
  }
});
