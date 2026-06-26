// Logic gates — IEEE/ANSI distinctive shapes. Two-input gates use pins a/b
// (left) and y (right); not/buffer use a (in) and y (out). All ref U.
(function () {
  var W = 8, H = 6;

  // shared geometry helpers (cell units) -----------------------------------
  function inputs2(p) { p.line(0, 2, 2, 2); p.line(0, 4, 2, 4); }
  function andBody(p) {                  // flat back + right semicircle (apex x6)
    p.line(2, 1, 2, 5); p.line(2, 1, 4, 1); p.line(2, 5, 4, 5);
    p.arc(4, 1, 4, 5, 2, 1);
  }
  function orBack(p, dx) { p.arc(2 - dx, 1, 2 - dx, 5, 3, 0); }   // concave input edge
  function orBody(p) {                   // curved back + pointed front (tip x6.4)
    orBack(p, 0);
    p.arc(2, 1, 6.4, 3, 6, 1);
    p.arc(2, 5, 6.4, 3, 6, 0);
  }
  function bubble(p, cx) { p.circle(cx, 3, 0.42, { fill: p.theme.body }); }

  function gate(type, aka, name, draw) {
    SCH.define({
      type: type, aka: aka, category: 'ic', series: 'logic',
      name: name, ref: 'U', w: W, h: H, hidePins: true,
      pins: { 'a': { at: [0, 2], side: 'l' }, 'b': { at: [0, 4], side: 'l' },
              'y': { at: [8, 3], side: 'r' } },
      draw: draw
    });
  }
  function gate1(type, aka, name, draw) {  // single-input (not / buffer)
    SCH.define({
      type: type, aka: aka, category: 'ic', series: 'logic',
      name: name, ref: 'U', w: W, h: H, hidePins: true,
      pins: { 'a': { at: [0, 3], side: 'l' }, 'y': { at: [8, 3], side: 'r' } },
      draw: draw
    });
  }

  gate('and', ['and_gate'], 'AND', function (p) {
    inputs2(p); andBody(p); p.line(6, 3, 8, 3);
  });
  gate('nand', ['nand_gate'], 'NAND', function (p) {
    inputs2(p); andBody(p); bubble(p, 6.4); p.line(6.82, 3, 8, 3);
  });
  gate('or', ['or_gate'], 'OR', function (p) {
    inputs2(p); orBody(p); p.line(6.4, 3, 8, 3);
  });
  gate('nor', ['nor_gate'], 'NOR', function (p) {
    inputs2(p); orBody(p); bubble(p, 6.8); p.line(7.22, 3, 8, 3);
  });
  gate('xor', ['xor_gate'], 'XOR', function (p) {
    inputs2(p); orBack(p, 0.6); orBody(p); p.line(6.4, 3, 8, 3);
  });
  gate('xnor', ['xnor_gate'], 'XNOR', function (p) {
    inputs2(p); orBack(p, 0.6); orBody(p); bubble(p, 6.8); p.line(7.22, 3, 8, 3);
  });

  gate1('not', ['inverter', 'inv'], 'NOT', function (p) {
    p.line(0, 3, 2, 3);
    p.polygon([[2, 1], [2, 5], [5.5, 3]], { fill: p.theme.body });
    bubble(p, 5.9); p.line(6.32, 3, 8, 3);
  });
  gate1('buffer', ['buf'], 'Buffer', function (p) {
    p.line(0, 3, 2, 3);
    p.polygon([[2, 1], [2, 5], [6, 3]], { fill: p.theme.body });
    p.line(6, 3, 8, 3);
  });
})();
