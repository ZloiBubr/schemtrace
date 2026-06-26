// Non-polar capacitor — same two straight parallel plates, marked 'NP'.
SCH.define({
  type: 'cap_np', aka: ['np_cap', 'nonpolar'],
  category: 'passive', series: 'basic', name: 'Cap NP', ref: 'C',
  w: 4, h: 2, hidePins: true,
  pins: { '1': { at: [0, 1], side: 'l' }, '2': { at: [4, 1], side: 'r' } },
  draw: function (p) {
    p.line(0, 1, 1.6, 1);
    p.line(1.6, 0.3, 1.6, 1.7);
    p.line(2.4, 0.3, 2.4, 1.7);
    p.line(2.4, 1, 4, 1);
    // 'NP' tag next to the plate
    var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', 1.0 * p.s); t.setAttribute('y', 0.55 * p.s);
    t.setAttribute('fill', p.inst.color || p.theme.part);
    t.setAttribute('font-size', p.theme.pinSize - 1);
    t.setAttribute('font-family', p.theme.font);
    t.setAttribute('text-anchor', 'end'); t.setAttribute('dominant-baseline', 'middle');
    t.textContent = 'NP'; p.g.appendChild(t);
  }
});
