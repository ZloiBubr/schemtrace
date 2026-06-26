// NE555 timer — standard DIP-8 pin order: numbers run around the body, down the
// left side (1-4, top to bottom) then up the right side (5-8, bottom to top),
// with the pin-1 marker at the top-left.
SCH.define({
  type: 'ne555', aka: ['555', 'ne555d', 'ne555p'],
  category: 'ic', series: 'timer', name: 'NE555', ref: 'U',
  showName: true, lead: 1, pinSpace: 2, w: 8,
  sides: {
    left:  ['1:GND', '2:TR', '3:Q', '4:R'],
    right: ['8:V+', '7:DIS', '6:THR', '5:CV']
  },
  draw: function (p) { SCH.icBody(p); }
});
