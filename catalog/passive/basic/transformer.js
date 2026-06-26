// Transformer — two coupled coils around a laminated core. 4 pins:
// 1/2 primary (left), 3/4 secondary (right).
SCH.define({
  type: 'transformer', aka: ['xfmr', 'trafo'],
  category: 'passive', series: 'basic', name: 'Transformer', ref: 'T',
  w: 8, h: 8,
  pins: {
    '1': { at: [0, 1], side: 'l' }, '2': { at: [0, 7], side: 'l' },
    '3': { at: [8, 1], side: 'r' }, '4': { at: [8, 7], side: 'r' }
  },
  draw: function (p) {
    var i;
    // primary coil (left), bumps facing out to the left
    p.line(0, 1, 3, 1); p.line(3, 1, 3, 2);
    for (i = 0; i < 4; i++) p.arc(3, 2 + i, 3, 3 + i, 0.5, 0);
    p.line(3, 6, 3, 7); p.line(0, 7, 3, 7);
    // secondary coil (right), bumps facing out to the right
    p.line(8, 1, 5, 1); p.line(5, 1, 5, 2);
    for (i = 0; i < 4; i++) p.arc(5, 2 + i, 5, 3 + i, 0.5, 1);
    p.line(5, 6, 5, 7); p.line(8, 7, 5, 7);
    // laminated core (two bars between the coils)
    p.line(3.9, 1.5, 3.9, 6.5);
    p.line(4.1, 1.5, 4.1, 6.5);
  }
});
