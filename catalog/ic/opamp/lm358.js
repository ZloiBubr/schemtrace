// LM358 — dual op-amp, 8-pin DIP. Drawn as a labelled IC body with pin
// numbers on lead stubs (outside) and pin names inside.
SCH.define({
  type: 'lm358',
  category: 'ic', series: 'opamp', name: 'LM358', ref: 'U',
  showName: true, lead: 1,
  sides: {
    left:  ['1:OUT', '2:-IN', '3:+IN', '4:V-'],
    right: ['8:V+', '7:OUT', '6:-IN', '5:+IN']
  },
  draw: function (p) { SCH.icBody(p); }
});
