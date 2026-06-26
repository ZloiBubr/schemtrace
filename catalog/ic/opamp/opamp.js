// Op-amp — classic triangle symbol with +/- inputs, output tip, and power
// rails. Pins: '-' (2), '+' (3), out (1), V+ (8), V- (4). Aliases cover a few
// common part numbers so e.g.  U1 njm4558  works.
SCH.define({
  type: 'opamp', aka: ['njm4558', 'tl072', 'ne5532'],
  category: 'ic', series: 'opamp', name: 'OPAMP', ref: 'U',
  showName: false, w: 8, h: 8, hideNames: true, labelPos: 'inside',
  pins: {
    '-':  { at: [0, 2.5], side: 'l', num: '2' },
    '+':  { at: [0, 5.5], side: 'l', num: '3' },
    'out':{ at: [8, 4], side: 'r', num: '1' },
    'V+': { at: [4, 0], side: 't', num: '8' },
    'V-': { at: [4, 8], side: 'b', num: '4' }
  },
  draw: function (p) {
    // triangle: apex (output) right, inputs left. Power leads must land on the
    // slanted top/bottom edges, so compute where x=4 meets each edge.
    var lx = 1.5, apex = 7, topY = 1, botY = 7, midY = 4;
    var slope = (midY - topY) / (apex - lx);
    var edgeTop = topY + (4 - lx) * slope;              // top edge y at x=4
    var edgeBot = botY - (4 - lx) * slope;              // bottom edge y at x=4
    // leads
    p.line(0, 2.5, lx, 2.5);                            // - input
    p.line(0, 5.5, lx, 5.5);                            // + input
    p.line(apex, 4, 8, 4);                              // output
    p.line(4, 0, 4, edgeTop);                           // V+ (touches top edge)
    p.line(4, edgeBot, 4, 8);                           // V- (touches bottom edge)
    // triangle body
    p.polygon([[lx, topY], [lx, botY], [apex, midY]], { fill: p.theme.body });
    // input markers — sit near the inputs with clearance from the edges
    p.line(2.15, 2.5, 2.95, 2.5);                       // minus
    p.line(2.15, 5.5, 2.95, 5.5);                       // plus
    p.line(2.55, 5.1, 2.55, 5.9);
  }
});
