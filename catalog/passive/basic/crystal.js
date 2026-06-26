// Crystal / quartz resonator — two plates hugging a rectangular body. 2 pins.
SCH.define({
  type: 'crystal', aka: ['xtal', 'quartz'],
  category: 'passive', series: 'basic', name: 'Crystal', ref: 'Y',
  w: 6, h: 2, hidePins: true,
  pins: { '1': { at: [0, 1], side: 'l' }, '2': { at: [6, 1], side: 'r' } },
  draw: function (p) {
    p.line(0, 1, 1.4, 1);            // left lead
    p.line(1.4, 0.4, 1.4, 1.6);     // left plate
    p.rect(2, 0.55, 2, 0.9);        // quartz body
    p.line(4.6, 0.4, 4.6, 1.6);     // right plate
    p.line(4.6, 1, 6, 1);           // right lead
  }
});
