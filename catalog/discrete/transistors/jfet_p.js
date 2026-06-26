// P-channel JFET — gate arrow points OUT (away from the channel).
SCH.define({
  type: 'jfet_p', aka: ['pjfet'],
  category: 'discrete', series: 'transistors', name: 'JFET-P', ref: 'Q',
  w: 4, h: 6, hidePins: true, labelPos: 'right',
  pins: { 'g': { at: [0, 3], side: 'l' }, 'd': { at: [3, 0], side: 't' }, 's': { at: [3, 6], side: 'b' } },
  draw: function (p) {
    var c = p.inst.color || p.theme.part;
    p.circle(2, 3, 1.8);
    p.line(3, 1.3, 3, 4.7);          // channel bar
    p.line(3, 0, 3, 1.3);            // drain
    p.line(3, 4.7, 3, 6);            // source
    p.line(0, 3, 3, 3);             // gate to channel
    p.polygon([[2.4, 3], [2.95, 2.73], [2.95, 3.27]], { fill: c }); // P: arrow points left (out)
  }
});
