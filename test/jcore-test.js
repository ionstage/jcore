var assert = require('assert');
var jsdom = require('jsdom');
var sinon = require('sinon');
var jCore = require('../jcore.js');
var Component = jCore.Component;
var Relation = jCore.Relation;
var Draggable = jCore.Draggable;

global.document = (new jsdom.JSDOM()).window.document;

describe('Component', function() {
  beforeEach(function() {
    Component.main.dirtyComponents = [];
    Component.main.requestID = 0;
  });

  describe('#element', function() {
    it('should return element', function() {
      var e = document.createElement('div');
      var c = new Component({ element: e });
      assert.equal(c.element(), e);
    });
  });

  describe('#parentElement', function() {
    it('should return parent element', function() {
      var e = document.createElement('div');
      var p = document.createElement('div');
      p.appendChild(e);
      var c = new Component({ element: e });
      assert.equal(c.parentElement(), p);
    });
  });

  describe('#findElement', function() {
    it('should return child element', function() {
      var e = document.createElement('div');
      var c = new Component({ element: e });
      e.innerHTML = '<div class="test"></div>';
      assert.equal(c.findElement('.test'), e.children[0]);
    });
  });

  describe('#addRelation', function() {
    it('should append relation', function() {
      var c = new Component({});
      var r = new Relation();
      c.addRelation(r);
      assert.equal(c.relations[0], r);
    });
  });

  describe('#removeRelation', function() {
    it('should remove relation', function() {
      var c = new Component({});
      var r = new Relation();
      c.addRelation(r);
      c.removeRelation(r);
      assert.equal(c.relations.length, 0);
    });
  });

  describe('#on', function() {
    it('should register listener', function() {
      var c = new Component({});
      var l = function() {};
      c.on('test', l);
      assert.equal(c.listeners.test[0], l);
    });
  });

  describe('#emit', function() {
    it('should call registered listener', function() {
      var c = new Component({});
      var l = sinon.spy();
      c.on('test', l);
      c.emit('test', 0, 1);
      assert(l.calledWith(0, 1));
    });
  });

  describe('#removeAllListeners', function() {
    it('should remove listeners of the specified type', function() {
      var c = new Component({});
      c.on('test', function() {});
      c.on('test', function() {});
      c.on('test2', function() {});
      c.removeAllListeners('test');
      assert(!c.listeners.test);
      assert.equal(c.listeners.test2.length, 1);
    });

    it('should remove all listeners', function() {
      var c = new Component({});
      c.on('test', function() {});
      c.on('test', function() {});
      c.on('test2', function() {});
      c.removeAllListeners();
      assert(!c.listeners.test);
      assert(!c.listeners.test2);
    });
  });

  describe('#redraw', function() {
    it('should call onredraw()', function() {
      var c = new Component({});
      c.onredraw = sinon.spy();
      c.redraw();
      assert(c.onredraw.called);
    });

    it('should append element', function() {
      var c = new Component({});
      var p = document.createElement('div');
      c.onappend = sinon.spy();
      c.parentElement(p);
      c.redraw();
      assert(c.onappend.called);
      assert.equal(c.element().parentNode, p);
    });

    it('should remove element', function() {
      var c = new Component({});
      var p = document.createElement('div');
      p.appendChild(c.element());
      c.onremove = sinon.spy();
      c.parentElement(null);
      c.redraw();
      assert(c.onremove.called);
      assert(!c.element().parentNode);
    });
  });

  describe('#redrawBy', function() {
    it('should call callback function on context of its method', function() {
      var c = new Component({});
      c.a = c.prop(0);
      c.b = c.prop(0);
      c.a(1);
      var callback = sinon.spy(function(a, b) {
        assert.equal(a, this.a());
        assert.equal(b, this.b());
      });
      c.redrawBy('a', 'b', callback);
      assert(callback.called);
    });

    it('should not call callback function without changing', function() {
      var c = new Component({});
      c.a = c.prop(0);
      c.cache.a = 0;
      var callback = sinon.spy();
      c.redrawBy('a', callback);
      assert(callback.notCalled);
    });

    it('should update cache', function() {
      var c = new Component({});
      c.a = c.prop(0);
      c.a(1);
      assert.notEqual(c.cache.a, 1);
      c.redrawBy('a', function() {
        assert.equal(c.cache.a, 1);
      });
      assert.equal(c.cache.a, 1);
    });
  });

  describe('#markDirty', function() {
    it('should call redraw() of component', function(done) {
      var c = new Component({});
      c.redraw = sinon.spy(done);
      c.markDirty();
    });

    it('should not add dirty component twice', function() {
      var c0 = new Component({});
      var c1 = new Component({});
      c0.markDirty();
      c1.markDirty();
      c1.markDirty();
      assert.equal(Component.main.dirtyComponents.length, 2);
    });
  });

  describe('#render', function() {
    it('should call without element property', function() {
      Component.prototype.render = sinon.spy(Component.prototype.render);
      var c = new Component({});
      assert(c.render.called);
    });
  });

  describe('#oninit', function() {
    it('should call on initialization', function() {
      var C = Component.inherits();
      C.prototype.oninit = sinon.spy();
      var c = new C();
      assert(c.oninit.called);
    });
  });

  describe('.main', function() {
    it('should mark dirty component', function() {
      var c = new Component({});
      c.markDirty();
      assert.equal(Component.main.dirtyComponents[0], c);
      assert.notEqual(Component.main.requestID, 0);
    });

    it('update components', function(done) {
      var c0 = new Component({});
      var c1 = new Component({});
      var c2 = new Component({});
      var r0 = new Relation();
      var r1 = new Relation();
      r0.update = function() { c1.markDirty(); };
      r1.update = function() { c2.markDirty(); };
      c0.relations = [r0];
      c1.relations = [r1];
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

describe('Relation', function() {
  describe('.inherits', function() {
    it('should return constructor', function() {
      var R = Relation.inherits();
      var r = new R();
      assert(r instanceof Relation);
    });
  });
});

describe('Draggable', function() {
  describe('#draggable', function() {
    it('should have element', function() {
      var e = document.createElement('div');
      var c = new Component({ element: e });
      var d = new Draggable({ component: c });
      assert.equal(d.draggable.element, e);
    });

    it('should handle drag event', function() {
      var e = document.createElement('div');
      var c = new Component({ element: e });
      var d = new Draggable({ component: c });
      d.draggable.enable({ onstart: sinon.spy(), onmove: sinon.spy(), onend: sinon.spy() });
      var supportsTouch = ('createTouch' in document);

      var ev = document.createEvent('Event');
      ev.initEvent((supportsTouch ? 'touchstart' : 'mousedown'), true, true);
      e.dispatchEvent(ev);
      assert(d.draggable.onstart.called);

      ev = document.createEvent('Event');
      ev.initEvent((supportsTouch ? 'touchmove' : 'mousemove'), true, true);
      document.dispatchEvent(ev);
      assert(d.draggable.onmove.called);

      ev = document.createEvent('Event');
      ev.initEvent((supportsTouch ? 'touchend' : 'mouseup'), true, true);
      document.dispatchEvent(ev);
      assert(d.draggable.onend.called);
    });
  });

  describe('#enable', function() {
    it('should enable event listeners of draggable', function() {
      var d = new Draggable({ component : new Component({}) });
      d.draggable.enable = sinon.spy(d.draggable.enable);
      d.onstart = sinon.spy();
      d.onmove = sinon.spy();
      d.onend = sinon.spy();
      d.enable();
      d.draggable.onstart();
      d.draggable.onmove();
      d.draggable.onend();
      assert(d.draggable.enable.called);
      assert(d.onstart.called);
      assert(d.onmove.called);
      assert(d.onend.called);
    });
  });

  describe('#disable', function() {
    it('should disable event listeners of draggable', function() {
      var d = new Draggable({ component : new Component({}) });
      d.draggable.disable = sinon.spy(d.draggable.disable);
      d.disable();
      assert(d.draggable.disable.called);
      assert(!d.onstart.called);
      assert(!d.onmove.called);
      assert(!d.onend.called);
    });
  });

  describe('.inherits', function() {
    it('should return constructor', function() {
      var D = Draggable.inherits();
      var d = new D({ component : new Component({}) });
      assert(d instanceof Draggable);
    });
  });
});
