// Net port / signal flag — a tag carrying a net name, one pin on the left.
// Use the component's value as the net name, e.g.  P1 port "D7" @x,y
SCH.define({
  type: 'port', aka: ['netlabel', 'flag'],
  category: 'misc', series: 'labels', name: 'PORT', ref: false,
  w: 5, h: 2, hidePins: true, showName: false, hideValue: true,
  pins: { 'p': { at: [0, 1], side: 'l' } },
  draw: function (p) {
    p.line(0, 1, 1, 1);
    // pointed tag
    p.polygon([[1, 0.2], [4.2, 0.2], [4.8, 1], [4.2, 1.8], [1, 1.8]], { fill: p.theme.body });
    if (p.inst.value) {
      var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', 2.7 * p.s); t.setAttribute('y', 1.05 * p.s);
      t.setAttribute('fill', p.theme.pin); t.setAttribute('font-size', p.theme.fontSize);
      t.setAttribute('font-family', p.theme.font); t.setAttribute('text-anchor', 'middle');
      t.setAttribute('dominant-baseline', 'middle'); t.setAttribute('font-weight', '600');
      t.textContent = p.inst.value; p.g.appendChild(t);
    }
  }
});
