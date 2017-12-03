var assert = require('assert');
var jsdom = require('jsdom');
var sinon = require('sinon');
var jCore = require('../jcore.js');

global.document = (new jsdom.JSDOM()).window.document;

describe('Component', function() {
  describe('#element', function() {
    it('should return element object', function() {
      var e = {};
      var C = jCore.Component.inherits();
      var c = new C({ element: e });
      assert.equal(c.element(), e);
    });
  });

  describe('#render', function() {
    it('should call without element property', function() {
      var C = jCore.Component.inherits();
      C.prototype.render = sinon.spy();
      var c = new C();
      assert(c.render.called);
    });
  });

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
