// Polarized (electrolytic) capacitor — two straight parallel plates with a '+'
// hugging the positive plate (pin 1 = +).
SCH.define({
  type: 'electrolytic', aka: ['cap_pol', 'ecap'],
  category: 'passive', series: 'basic', name: 'Cap+', ref: 'C',
  w: 4, h: 2, hidePins: true,
  pins: { '1': { at: [0, 1], side: 'l' }, '2': { at: [4, 1], side: 'r' } },
  draw: function (p) {
    p.line(0, 1, 1.6, 1);
    p.line(1.6, 0.3, 1.6, 1.7);     // + plate
    p.line(2.4, 0.3, 2.4, 1.7);     // − plate (parallel, straight)
    p.line(2.4, 1, 4, 1);
    // '+' right next to the positive plate
    p.line(1.15, 0.35, 1.15, 0.75);
    p.line(0.95, 0.55, 1.35, 0.55);
  }
});
