// PNP bipolar transistor. Same layout as the NPN but the emitter arrow points
// INWARD (toward the base). Includes part BC557 via aka.
SCH.define({
  type: 'pnp', aka: ['bc557'],
  category: 'discrete', series: 'transistors', name: 'PNP', ref: 'Q',
  w: 4, h: 6, hidePins: true, labelPos: 'right',
  pins: {
    'b': { at: [0, 3], side: 'l' },
    'c': { at: [3, 0], side: 't' },
    'e': { at: [3, 6], side: 'b' }
  },
  draw: function (p) {
    var c = p.inst.color || p.theme.part;
    p.circle(2, 3, 1.8);            // envelope
    p.line(0, 3, 1.2, 3);           // base lead
    p.line(1.2, 1.5, 1.2, 4.5);     // base bar
    p.line(1.2, 2.4, 3, 1.2);       // collector
    p.line(3, 1.2, 3, 0);
    p.line(1.2, 3.6, 3, 4.8);       // emitter
    p.line(3, 4.8, 3, 6);
    // PNP: emitter arrow points IN (toward the base), aligned to the emitter line
    p.polygon([[1.74, 3.96], [2.05, 4.49], [2.35, 4.04]], { fill: c });
  }
});
