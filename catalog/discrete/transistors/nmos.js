// N-channel enhancement MOSFET — separated gate plate, broken (enhancement)
// channel, substrate arrow pointing IN (toward the gate). g left, d top, s bottom.
SCH.define({
  type: 'nmos', aka: ['mosfet_n', 'mosfet'],
  category: 'discrete', series: 'transistors', name: 'N-MOSFET', ref: 'Q',
  w: 4, h: 6, hidePins: true, labelPos: 'right',
  pins: { 'g': { at: [0, 3], side: 'l' }, 'd': { at: [3, 0], side: 't' }, 's': { at: [3, 6], side: 'b' } },
  draw: function (p) {
    var c = p.inst.color || p.theme.part;
    p.circle(2, 3, 1.8);
    p.line(0, 3, 1.4, 3);            // gate lead
    p.line(1.4, 1.8, 1.4, 4.2);      // gate plate
    // broken channel (enhancement) at x = 2.0
    p.line(2.0, 1.8, 2.0, 2.4);
    p.line(2.0, 2.7, 2.0, 3.3);
    p.line(2.0, 3.6, 2.0, 4.2);
    p.line(2.0, 2.1, 3, 2.1); p.line(3, 0, 3, 2.1);   // drain
    p.line(2.0, 3.9, 3, 3.9); p.line(3, 3.9, 3, 6);   // source
    p.line(2.55, 3, 3, 3); p.line(3, 3, 3, 3.9);      // body tie to source
    p.polygon([[2.0, 3], [2.55, 2.78], [2.55, 3.22]], { fill: c }); // N: arrow points in (left)
  }
});
