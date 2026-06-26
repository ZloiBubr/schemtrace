// Pin header / connector — pins down the right side, one per 2 cells of height.
// Size via the DSL token *w,h (only height applies; width is fixed) or opts.h —
// e.g. `*1,8` → height 8 → 4 pins. Default height 8 → 4 pins.
SCH.define({
  type: 'header', aka: ['conn', 'connector'],
  category: 'connector', series: 'headers', name: 'HEADER', ref: 'J',
  w: 3, flexH: true, h: 8, showName: false,
  // pins generated lazily from height in draw via a fixed map for default;
  // here we predefine up to the body height in 2-cell steps.
  pins: (function () {
    var p = {}; for (var i = 1; i <= 16; i++) p[i] = { at: [3, i * 2 - 1], side: 'r', num: '' + i }; return p;
  })(),
  draw: function (p) {
    var n = Math.round(p.size.h / 2);
    p.rect(0, 0, 1.4, p.size.h, { fill: p.theme.body });
    for (var i = 1; i <= n; i++) {
      var y = i * 2 - 1;
      p.line(1.4, y, 3, y);
      p.rect(0.3, y - 0.35, 0.7, 0.7, { fill: p.inst.color || p.theme.part });
    }
  }
});
