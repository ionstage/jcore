var assert = require('assert');
var sinon = require('sinon');
var jCore = require('../jcore.js');

describe('Component', function() {
  describe('#oninit', function() {
    it('should call on initialization', function() {
      var C = jCore.Component.inherits(function() {
        this.oninit = sinon.spy();
      });
      var c = new C();
      assert(c.oninit.called);
    });
  });

  describe('.inherits', function() {
    it('should return constructor', function() {
      var C = jCore.Component.inherits();
      var c = new C();
      assert(c instanceof jCore.Component);
    });
  });
});
