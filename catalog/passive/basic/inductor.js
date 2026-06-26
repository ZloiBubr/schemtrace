// Inductor — four bumps. Horizontal, 2 pins.
SCH.define({
  type: 'inductor', aka: ['ind', 'l'],
  category: 'passive', series: 'basic', name: 'Inductor', ref: 'L',
  w: 8, h: 2, hidePins: true,
  pins: { '1': { at: [0, 1], side: 'l' }, '2': { at: [8, 1], side: 'r' } },
  draw: function (p) {
    p.line(0, 1, 2, 1);
    for (var i = 0; i < 4; i++) p.arc(2 + i, 1, 3 + i, 1, 0.5, 1);
    p.line(6, 1, 8, 1);
  }
});
