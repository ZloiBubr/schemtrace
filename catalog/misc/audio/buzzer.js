// Buzzer / piezo sounder — dome with two leads.
SCH.define({
  type: 'buzzer', aka: ['piezo'],
  category: 'misc', series: 'audio', name: 'Buzzer', ref: 'SG',
  w: 4, h: 4, hidePins: true,
  pins: { '1': { at: [1, 4], side: 'b' }, '2': { at: [3, 4], side: 'b' } },
  draw: function (p) {
    // half-circle dome on a baseline
    p.path(['M', 0.4 * p.s, 2.4 * p.s, 'A', 1.6 * p.s, 1.6 * p.s, 0, 0, 1, 3.6 * p.s, 2.4 * p.s].join(' '),
      { fill: p.theme.body });
    p.line(0.4, 2.4, 3.6, 2.4);
    p.line(1, 2.4, 1, 4);
    p.line(3, 2.4, 3, 4);
  }
});
