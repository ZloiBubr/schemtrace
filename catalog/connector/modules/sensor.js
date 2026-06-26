// Smoke / gas sensor module (e.g. MQ-2 breakout) — labelled body.
SCH.define({
  type: 'sensor', aka: ['smoke_sensor', 'gas_sensor'],
  category: 'connector', series: 'modules', name: 'SENSOR', ref: 'U',
  showName: true, lead: 1,
  sides: { left: ['1:A1', '2:H1'], right: ['4:B1', '3:H2'] },
  draw: function (p) { SCH.icBody(p); }
});
