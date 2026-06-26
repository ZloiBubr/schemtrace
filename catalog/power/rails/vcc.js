// VCC / power rail flag. Single pin at the bottom; value is the rail name (+5V).
SCH.define({
  type: 'vcc', aka: ['power', 'vdd'],
  category: 'power', series: 'rails', name: '+5V', ref: false,
  w: 4, h: 3, hidePins: true, showName: false, hideValue: true,
  pins: { '+': { at: [2, 3], side: 'b' } },
  draw: function (p) {
    p.line(2, 1, 2, 3);
    p.line(0.6, 1, 3.4, 1);           // bar
    if (p.inst.value) {
      var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', 2 * p.s); t.setAttribute('y', 0.4 * p.s);
      t.setAttribute('fill', p.theme.pin); t.setAttribute('font-size', p.theme.fontSize);
      t.setAttribute('font-family', p.theme.font); t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-weight', '600');
      t.textContent = p.inst.value; p.g.appendChild(t);
    }
  }
});
