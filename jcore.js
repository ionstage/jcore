(function(global) {
  'use strict';

  var jcore = {};

  if (typeof module !== 'undefined' && module.exports)
    module.exports = jcore;
  else
    global.jcore = jcore;
})(this);
