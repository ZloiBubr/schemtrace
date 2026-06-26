// 16x2 character LCD module — labelled body with the standard 16-pin interface.
SCH.define({
  type: 'lcd1602', aka: ['lcd', 'lcd_16x2'],
  category: 'connector', series: 'modules', name: 'LCD 16x2', ref: 'U',
  showName: true, pinSpace: 2, lead: 1,
  sides: {
    left: ['1:VSS', '2:VDD', '3:VO', '4:RS', '5:RW', '6:E',
           '7:DB0', '8:DB1', '9:DB2', '10:DB3', '11:DB4', '12:DB5',
           '13:DB6', '14:DB7', '15:A', '16:K']
  },
  draw: function (p) { SCH.icBody(p); }
});
