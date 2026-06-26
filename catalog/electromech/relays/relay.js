// Relay — coil driving an SPDT contact (shown de-energized, resting on NC).
// Pins: a1/a2 coil, com pole, no / nc contacts.
SCH.define({
  type: 'relay', aka: ['k'],
  category: 'electromech', series: 'relays', name: 'Relay', ref: 'K',
  w: 11, h: 8, labelPos: 'bottom',
  pins: {
    'a1':  { at: [0, 2], side: 'l' },
    'a2':  { at: [0, 6], side: 'l' },
    'com': { at: [11, 4], side: 'r' },
    'no':  { at: [11, 7], side: 'r' },
    'nc':  { at: [11, 1], side: 'r' }
  },
  draw: function (p) {
    // coil
    p.line(0, 2, 2, 2);
    p.line(0, 6, 2, 6);
    p.rect(2, 2, 2, 4);
    // mechanical link from coil to the armature (dashed)
    p.line(4, 4, 7.85, 2.8, { 'stroke-dasharray': '2 2' });
    // SPDT contact: COM pole pivots up to NC (closed) past NO (open)
    p.line(11, 4, 7, 4);            // com lead to pivot
    p.line(7, 4, 8.7, 1.6);        // armature arm (resting on NC)
    p.line(11, 1, 8.7, 1.6);       // NC lead (touching)
    p.dot(8.7, 1.6);
    p.line(11, 7, 8.7, 6.2);       // NO lead (open)
    p.circle(8.7, 6.2, 0.18);      // NO contact (not touched)
  }
});
