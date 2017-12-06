var assert = require('assert');
var jsdom = require('jsdom');
var sinon = require('sinon');
var jCore = require('../jcore.js');
var Component = jCore.Component;
var Relation = jCore.Relation;

global.document = (new jsdom.JSDOM()).window.document;

describe('Component', function() {
  beforeEach(function() {
    Component.main.dirtyComponents = [];
    Component.main.requestID = 0;
  });

  describe('#element', function() {
    it('should return element object', function() {
      var e = {};
      var C = Component.inherits();
      var c = new C({ element: e });
      assert.equal(c.element(), e);
    });
  });

  describe('#parentElement', function() {
    it('should return parent element object', function() {
      var e = { parentNode: {} };
      var C = Component.inherits();
      var c = new C({ element: e });
      assert.equal(c.parentElement(), e.parentNode);
    });
  });

  describe('#findElement', function() {
    it('should return child element object', function() {
      var C = Component.inherits();
      var c = new C();
      var e = c.element();
      e.innerHTML = '<div class="test"></div>';
      assert.equal(c.findElement('.test'), e.children[0]);
    });
  });

  describe('#addRelation', function() {
    it('should append relation object', function() {
      var C = Component.inherits();
      var c = new C();
      var r = {};
      c.addRelation(r);
      assert.equal(c.relations[0], r);
    });
  });

  describe('#markDirty', function() {
    it('should call redraw() of component', function(done) {
      var C = Component.inherits();
      var c = new C();
      c.redraw = sinon.spy(done);
      c.markDirty();
    });

    it('should not add dirty component twice', function() {
      var C = Component.inherits();
      var c0 = new C();
      var c1 = new C();
      c0.markDirty();
      c1.markDirty();
      c1.markDirty();
      assert.equal(Component.main.dirtyComponents.length, 2);
    });
  });

  describe('#render', function() {
    it('should call without element property', function() {
      var C = Component.inherits();
      C.prototype.render = sinon.spy(Component.prototype.render);
      var c = new C();
      assert(c.render.called);
    });
  });

  describe('#oninit', function() {
    it('should call on initialization', function() {
      var C = Component.inherits(function() {
        this.oninit = sinon.spy();
      });
      var c = new C();
      assert(c.oninit.called);
    });
  });

  describe('.main', function() {
    it('should mark dirty component', function() {
      var C = Component.inherits();
      var c = new C();
      c.markDirty();
      assert.equal(Component.main.dirtyComponents[0], c);
      assert.notEqual(Component.main.requestID, 0);
    });

    it('update components', function(done) {
      var C = Component.inherits();
      var c0 = new C();
      var c1 = new C();
      var c2 = new C();
      c0.relations = [{ update: sinon.spy(function() { c1.markDirty(); }) }];
      c1.relations = [{ update: sinon.spy(function() { c2.markDirty(); }) }];
      c2.redraw = sinon.spy(done);
      c0.markDirty();
    });
  });

  describe('.inherits', function() {
    it('should return constructor', function() {
      var C = Component.inherits();
      var c = new C();
      assert(c instanceof Component);
    });
  });
});
