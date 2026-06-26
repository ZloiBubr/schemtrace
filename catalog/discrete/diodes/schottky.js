// Schottky diode — triangle + cathode bar with S-shaped (bracketed) ends.
// Pins a (anode) / c (cathode).
SCH.define({
  type: 'schottky', aka: ['sd', 'schottky_diode'],
  category: 'discrete', series: 'diodes', name: 'Schottky', ref: 'D',
  w: 6, h: 2, hidePins: true,
  pins: { 'a': { at: [0, 1], side: 'l' }, 'c': { at: [6, 1], side: 'r' } },
  draw: function (p) {
    var c = p.inst.color || p.theme.part;
    p.line(0, 1, 2, 1);
    p.polygon([[2, 0.3], [2, 1.7], [3.6, 1]], { fill: c });
    p.line(3.6, 0.3, 3.6, 1.7);     // cathode bar
    // Schottky bracket ends
    p.line(3.2, 0.3, 3.6, 0.3); p.line(3.2, 0.3, 3.2, 0.6);
    p.line(3.6, 1.7, 4.0, 1.7); p.line(4.0, 1.7, 4.0, 1.4);
    p.line(3.6, 1, 6, 1);
  }
});
