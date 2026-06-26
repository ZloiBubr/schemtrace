// Momentary push-button (tactile) switch. Two terminals, plunger contact.
SCH.define({
  type: 'pushbutton', aka: ['button', 'sw'],
  category: 'electromech', series: 'switches', name: 'Push', ref: 'SW',
  w: 6, h: 4, hidePins: true,
  pins: { '1': { at: [0, 2], side: 'l' }, '2': { at: [6, 2], side: 'r' } },
  draw: function (p) {
    var c = p.inst.color || p.theme.part;
    // leads + terminal posts
    p.line(0, 2, 1.6, 2);
    p.line(4.4, 2, 6, 2);
    p.line(1.6, 1.7, 1.6, 2.3);
    p.line(4.4, 1.7, 4.4, 2.3);
    // moving contact bar (open, bridging above the gap)
    p.line(1.3, 1.05, 4.7, 1.05);
    // actuator plunger + button cap
    p.line(3, 1.05, 3, 0.35);
    p.line(2.25, 0.35, 3.75, 0.35);
  }
});
