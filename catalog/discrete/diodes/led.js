// LED — diode with two emission arrows.
SCH.define({
  type: 'led',
  category: 'discrete', series: 'diodes', name: 'LED', ref: 'D',
  w: 6, h: 3, hidePins: true,
  pins: { 'a': { at: [0, 2], side: 'l' }, 'c': { at: [6, 2], side: 'r' } },
  draw: function (p) {
    var c = p.inst.color || p.theme.part;
    // diode body
    p.line(0, 2, 2.4, 2);
    p.polygon([[2.4, 1.3], [2.4, 2.7], [3.7, 2]], { fill: c });
    p.line(3.7, 1.3, 3.7, 2.7);
    p.line(3.7, 2, 6, 2);
    // two parallel emission arrows at 45°, springing off the junction
    function arrow(ox, oy) {
      var ex = ox + 1.05, ey = oy - 1.05;
      p.line(ox, oy, ex, ey);
      p.polygon([[ex, ey], [ex - 0.52, ey + 0.16], [ex - 0.16, ey + 0.52]], { fill: c });
    }
    arrow(2.95, 1.15); arrow(3.85, 1.05);
  }
});
