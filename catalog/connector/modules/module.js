// Generic module / breakout box — labelled body, 2 pins per side by default.
// Resize with *w,h; good as a placeholder for any sub-board.
SCH.define({
  type: 'module',
  category: 'connector', series: 'modules', name: 'MODULE', ref: 'M',
  showName: true, flexW: true, flexH: true, w: 8, h: 6, lead: 1,
  sides: { left: ['1', '2'], right: ['3', '4'] },
  draw: function (p) { SCH.icBody(p); }
});
