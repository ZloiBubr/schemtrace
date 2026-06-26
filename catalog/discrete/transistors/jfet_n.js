// N-channel JFET — gate arrow points IN toward the channel. Circular envelope,
// same footprint as the BJTs (g left, d top, s bottom).
SCH.define({
  type: 'jfet_n', aka: ['jfet', 'njfet'],
  category: 'discrete', series: 'transistors', name: 'JFET-N', ref: 'Q',
  w: 4, h: 6, hidePins: true, labelPos: 'right',
  pins: { 'g': { at: [0, 3], side: 'l' }, 'd': { at: [3, 0], side: 't' }, 's': { at: [3, 6], side: 'b' } },
  draw: function (p) {
    var c = p.inst.color || p.theme.part;
    p.circle(2, 3, 1.8);
    p.line(3, 1.3, 3, 4.7);          // channel bar
    p.line(3, 0, 3, 1.3);            // drain
    p.line(3, 4.7, 3, 6);            // source
    p.line(0, 3, 3, 3);             // gate to channel
    p.polygon([[2.95, 3], [2.4, 2.73], [2.4, 3.27]], { fill: c }); // N: arrow points right (in)
  }
});
