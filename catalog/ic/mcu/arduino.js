// Arduino R3 shield header block — a labelled IC body with the familiar pins.
SCH.define({
  type: 'arduino', aka: ['arduino_r3', 'arduino_r3_shield'],
  category: 'ic', series: 'mcu', name: 'ARDUINO R3', ref: 'J',
  showName: true, pinSpace: 2, lead: 1,
  sides: {
    left:  ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'IOREF', 'RES', 'VIN', '5V', '3V3', 'AREF'],
    right: ['RX', 'TX', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13', 'SDA', 'SCL']
  },
  draw: function (p) { SCH.icBody(p); }
});
