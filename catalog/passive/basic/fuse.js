// Fuse — IEC rectangle with a line straight through it. 2 pins.
SCH.define({
  type: 'fuse', aka: ['f'],
  category: 'passive', series: 'basic', name: 'Fuse', ref: 'F',
  w: 6, h: 2, hidePins: true,
  pins: { '1': { at: [0, 1], side: 'l' }, '2': { at: [6, 1], side: 'r' } },
  draw: function (p) {
    p.line(0, 1, 1.4, 1);           // left lead
    p.rect(1.4, 0.5, 3.2, 1);       // body
    p.line(1.4, 1, 4.6, 1);         // element through the body
    p.line(4.6, 1, 6, 1);           // right lead
  }
});
