// Potentiometer — resistor with a wiper (3rd terminal on top).
SCH.define({
  type: 'pot', aka: ['potentiometer', 'rv'],
  category: 'passive', series: 'basic', name: 'Pot', ref: 'R',
  w: 8, h: 3, hidePins: true,
  pins: { '1': { at: [0, 2], side: 'l' }, '2': { at: [8, 2], side: 'r' }, 'w': { at: [4, 0], side: 't' } },
  draw: function (p) {
    var c = p.inst.color || p.theme.part;
    p.line(0, 2, 2, 2);
    p.rect(2, 1.4, 4, 1.2, { fill: p.theme.body });
    p.line(6, 2, 8, 2);
    // wiper arrow onto the body
    p.line(4, 0, 4, 1.1);
    p.polygon([[3.6, 1.1], [4.4, 1.1], [4, 1.7]], { fill: c });
  }
});
