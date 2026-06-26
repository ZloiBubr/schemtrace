// P-channel enhancement MOSFET — like the N-MOSFET but the substrate arrow
// points OUT (away from the gate, toward source/body).
SCH.define({
  type: 'pmos', aka: ['mosfet_p'],
  category: 'discrete', series: 'transistors', name: 'P-MOSFET', ref: 'Q',
  w: 4, h: 6, hidePins: true, labelPos: 'right',
  pins: { 'g': { at: [0, 3], side: 'l' }, 'd': { at: [3, 0], side: 't' }, 's': { at: [3, 6], side: 'b' } },
  draw: function (p) {
    var c = p.inst.color || p.theme.part;
    p.circle(2, 3, 1.8);
    p.line(0, 3, 1.4, 3);            // gate lead
    p.line(1.4, 1.8, 1.4, 4.2);      // gate plate
    p.line(2.0, 1.8, 2.0, 2.4);
    p.line(2.0, 2.7, 2.0, 3.3);
    p.line(2.0, 3.6, 2.0, 4.2);
    p.line(2.0, 2.1, 3, 2.1); p.line(3, 0, 3, 2.1);   // drain
    p.line(2.0, 3.9, 3, 3.9); p.line(3, 3.9, 3, 6);   // source
    p.line(2.0, 3, 2.45, 3); p.line(3, 3, 3, 3.9);    // body tie to source
    p.polygon([[3, 3], [2.45, 2.78], [2.45, 3.22]], { fill: c }); // P: arrow points out (right)
  }
});
