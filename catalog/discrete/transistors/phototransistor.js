// Phototransistor — NPN with no external base; two arrows of incident light
// point toward the base region. Terminals: c (top), e (bottom).
SCH.define({
  type: 'phototransistor', aka: ['phototr'],
  category: 'discrete', series: 'transistors', name: 'Photo-T', ref: 'Q',
  w: 4, h: 6, hidePins: true, labelPos: 'right',
  pins: { 'c': { at: [3, 0], side: 't' }, 'e': { at: [3, 6], side: 'b' } },
  draw: function (p) {
    var c = p.inst.color || p.theme.part;
    p.circle(2, 3, 1.8);
    p.line(1.2, 1.5, 1.2, 4.5);     // base bar (internal, no lead)
    p.line(1.2, 2.4, 3, 1.2); p.line(3, 1.2, 3, 0);   // collector
    p.line(1.2, 3.6, 3, 4.8); p.line(3, 4.8, 3, 6);   // emitter
    p.polygon([[2.50, 4.46], [1.89, 4.38], [2.19, 3.93]], { fill: c }); // emitter arrow (NPN)
    // incident-light arrows pointing toward the base
    function ray(ox, oy) {
      var ex = ox + 0.8, ey = oy + 0.8;
      p.line(ox, oy, ex, ey);
      p.polygon([[ex, ey], [ex - 0.5, ey - 0.12], [ex - 0.12, ey - 0.5]], { fill: c });
    }
    ray(-1.1, 0.6); ray(-1.6, 1.1);
  }
});
