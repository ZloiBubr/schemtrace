// NPN bipolar transistor. Pins b (base, left), c (collector, top), e (emitter, bottom).
// Includes named part BC547 via aka.
SCH.define({
  type: 'npn', aka: ['bc547', 'transistor'],
  category: 'discrete', series: 'transistors', name: 'NPN', ref: 'Q',
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
    // NPN: emitter arrow points OUT (away from base), aligned to the emitter line
    p.polygon([[2.50, 4.46], [1.89, 4.38], [2.19, 3.93]], { fill: c });
  }
});
