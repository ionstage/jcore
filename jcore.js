/**
 * jCore v0.3.3
 * (c) 2016 iOnStage
 * Released under the MIT License.
 */

(function() {
  'use strict';

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback) {
      return setTimeout(callback, 1000 / 60);
    };
  }

  var inherits = function(ctor, superCtor) {
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true,
      },
    });
  };

  var dom = {};

  dom.Draggable = (function() {
    var Draggable = function(element) {
      this.element = element;
      this.onstart = null;
      this.onmove = null;
      this.onend = null;
      this.onmousedown = this.onmousedown.bind(this);
      this.onmousemove = this.onmousemove.bind(this);
      this.onmouseup = this.onmouseup.bind(this);
      this.ontouchstart = this.ontouchstart.bind(this);
      this.ontouchmove = this.ontouchmove.bind(this);
      this.ontouchend = this.ontouchend.bind(this);
      this.onscroll = Draggable.debounce(this.onscroll.bind(this), 0);
      this.identifier = null;
      this.startPageX = 0;
      this.startPageY = 0;
      this.startScrollX = 0;
      this.startScrollY = 0;
      this.dScrollX = 0;
      this.dScrollY = 0;
      this.context = null;
    };

    Draggable.debounce = function(func, delay) {
      var t = 0;
      var ctx = null;
      var args = null;
      return function() {
        ctx = this;
        args = arguments;
        if (t) {
          clearTimeout(t);
        }
        t = setTimeout(function() {
          func.apply(ctx, args);
          t = 0;
          ctx = null;
          args = null;
        }, delay);
      };
    };

    Draggable.supportsTouch = function() {
      return 'ontouchstart' in window || (typeof DocumentTouch !== 'undefined' && document instanceof DocumentTouch);
    };

    Draggable.getOffset = function(element) {
      var rect = element.getBoundingClientRect();
      var bodyRect = document.body.getBoundingClientRect();
      var bodyStyle = window.getComputedStyle(document.body);
      var x = rect.left - element.scrollLeft - bodyRect.left + parseInt(bodyStyle.marginLeft, 10);
      var y = rect.top - element.scrollTop - bodyRect.top + parseInt(bodyStyle.marginTop, 10);
      return { x: x, y: y };
    };

    Draggable.getScrollOffset = function(element) {
      var x = 0;
      var y = 0;
      var el = element.parentNode;
      while (el) {
        x += el.scrollLeft || 0;
        y += el.scrollTop || 0;
        el = el.parentNode;
      }
      return { x: x, y: y };
    };

    Draggable.prototype.enable = function(listeners) {
      this.onstart = listeners.onstart;
      this.onmove = listeners.onmove;
      this.onend = listeners.onend;
      this.context = {};
      var type = (Draggable.supportsTouch() ? 'touchstart' : 'mousedown');
      this.element.addEventListener(type, this['on' + type], { passive: false });
    };

    Draggable.prototype.disable = function() {
      var supportsTouch = Draggable.supportsTouch();
      var startType = (supportsTouch ? 'touchstart' : 'mousedown');
      var moveType = (supportsTouch ? 'touchmove' : 'mousemove');
      var endType = (supportsTouch ? 'touchend' : 'mouseup');
      this.element.removeEventListener(startType, this['on' + startType], { passive: false });
      document.removeEventListener(moveType, this['on' + moveType]);
      document.removeEventListener(endType, this['on' + endType]);
      document.removeEventListener('scroll', this.onscroll, true);
      this.context = null;
    };

    Draggable.prototype.onmousedown = function(event) {
      var offset = Draggable.getOffset(event.target);
      var x = event.clientX - offset.x;
      var y = event.clientY - offset.y;
      this.startPageX = event.pageX;
      this.startPageY = event.pageY;
      var scrollOffset = Draggable.getScrollOffset(event.target);
      this.startScrollX = scrollOffset.x;
      this.startScrollY = scrollOffset.y;
      this.dScrollX = 0;
      this.dScrollY = 0;
      this.onstart.call(null, x, y, event, this.context);
      document.addEventListener('mousemove', this.onmousemove);
      document.addEventListener('mouseup', this.onmouseup);
      document.addEventListener('scroll', this.onscroll, true);
    };

    Draggable.prototype.onmousemove = function(event) {
      var dx = event.pageX - this.startPageX + this.dScrollX;
      var dy = event.pageY - this.startPageY + this.dScrollY;
      this.onmove.call(null, dx, dy, event, this.context);
    };

    Draggable.prototype.onmouseup = function(event) {
      document.removeEventListener('mousemove', this.onmousemove);
      document.removeEventListener('mouseup', this.onmouseup);
      document.removeEventListener('scroll', this.onscroll, true);
      var dx = event.pageX - this.startPageX + this.dScrollX;
      var dy = event.pageY - this.startPageY + this.dScrollY;
      this.onend.call(null, dx, dy, event, this.context);
    };

    Draggable.prototype.ontouchstart = function(event) {
      if (event.touches.length > 1) {
        return;
      }
      var touch = event.changedTouches[0];
      var offset = Draggable.getOffset(event.target);
      var x = touch.clientX - offset.x;
      var y = touch.clientY - offset.y;
      this.identifier = touch.identifier;
      this.startPageX = touch.pageX;
      this.startPageY = touch.pageY;
      var scrollOffset = Draggable.getScrollOffset(event.target);
      this.startScrollX = scrollOffset.x;
      this.startScrollY = scrollOffset.y;
      this.dScrollX = 0;
      this.dScrollY = 0;
      this.onstart.call(null, x, y, event, this.context);
      document.addEventListener('touchmove', this.ontouchmove);
      document.addEventListener('touchend', this.ontouchend);
      document.addEventListener('scroll', this.onscroll, true);
    };

    Draggable.prototype.ontouchmove = function(event) {
      var touch = event.changedTouches[0];
      if (touch.identifier !== this.identifier) {
        return;
      }
      var dx = touch.pageX - this.startPageX + this.dScrollX;
      var dy = touch.pageY - this.startPageY + this.dScrollY;
      this.onmove.call(null, dx, dy, event, this.context);
    };

    Draggable.prototype.ontouchend = function(event) {
      var touch = event.changedTouches[0];
      if (touch.identifier !== this.identifier) {
        return;
      }
      document.removeEventListener('touchmove', this.ontouchmove);
      document.removeEventListener('touchend', this.ontouchend);
      document.removeEventListener('scroll', this.onscroll, true);
      var dx = touch.pageX - this.startPageX + this.dScrollX;
      var dy = touch.pageY - this.startPageY + this.dScrollY;
      this.onend.call(null, dx, dy, event, this.context);
    };

    Draggable.prototype.onscroll = function() {
      var scrollOffset = Draggable.getScrollOffset(this.element);
      this.dScrollX = scrollOffset.x - this.startScrollX;
      this.dScrollY = scrollOffset.y - this.startScrollY;
    };

    return Draggable;
  })();

  var Component = function(props) {
    this.el = (props && (props.el || props.element)) || this.render();
    this.parentElement = this.prop(this.el.parentNode);
    this._relations = [];
    this._cache = {};
    this._listeners = {};
  };

  Component.prototype.element = function(el) {
    if (typeof el === 'undefined') {
      return this.el;
    }
    if (el === this.el) {
      return;
    }
    if (el === null) {
      throw new Error('element must not be null');
    }
    this.el = el;
    this.parentElement(this.el.parentNode);
    this.markDirty();
  };

  Component.prototype.findElement = function(selectors) {
    return this.el.querySelector(selectors);
  };

  Component.prototype.prop = function(initialValue) {
    var cache = initialValue;
    return function(value) {
      if (typeof value === 'undefined') {
        return cache;
      }
      if (value === cache) {
        return;
      }
      cache = value;
      this.markDirty();
    };
  };

  Component.prototype.addRelation = function(relation) {
    if (this._relations.indexOf(relation) === -1) {
      this._relations.push(relation);
    }
  };

  Component.prototype.removeRelation = function(relation) {
    var index = this._relations.indexOf(relation);
    if (index !== -1) {
      this._relations.splice(index, 1);
    }
  };

  Component.prototype.on = function(type, listener) {
    if (!this._listeners[type]) {
      this._listeners[type] = [];
    }
    this._listeners[type].push(listener);
  };

  Component.prototype.emit = function() {
    var args = Array.prototype.slice.call(arguments);
    var type = args.shift();
    var listeners = this._listeners[type];
    if (!listeners) {
      return;
    }
    for (var i = 0, len = listeners.length; i < len; i++) {
      listeners[i].apply(this, args);
    }
  };

  Component.prototype.removeAllListeners = function(type) {
    if (this._listeners[type]) {
      delete this._listeners[type];
    } else {
      this._listeners = {};
    }
  };

  Component.prototype.redraw = function() {
    var el = this.el;
    var parentElement = this.parentElement();
    this.onredraw();
    if (parentElement && parentElement !== el.parentNode) {
      this.onappend();
      parentElement.appendChild(el);
    } else if (!parentElement && el.parentNode) {
      this.onremove();
      el.parentNode.removeChild(el);
    }
  };

  Component.prototype.redrawBy = function() {
    var args = Array.prototype.slice.call(arguments);
    var callback = args.pop();
    var isChanged = false;
    var values = [];
    for (var i = 0, len = args.length; i < len; i++) {
      var key = args[i];
      var value = this[key]();
      if (value !== this._cache[key]) {
        this._cache[key] = value;
        isChanged = true;
      }
      values.push(value);
    }
    if (isChanged) {
      callback.apply(this, values);
    }
  };

  Component.prototype.markDirty = function() {
    Component.main.markDirty(this);
  };

  Component.prototype.render = function() {
    return document.createElement('div');
  };

  Component.prototype.oninit = function() {};

  Component.prototype.onappend = function() {};

  Component.prototype.onremove = function() {};

  Component.prototype.onredraw = function() {};

  Component.main = (function() {
    var Main = function() {
      this.dirtyComponents = [];
      this.requestID = 0;
    };

    Main.prototype.markDirty = function(component) {
      if (this.dirtyComponents.lastIndexOf(component) === -1) {
        this.dirtyComponents.push(component);
      }
      if (this.requestID) {
        return;
      }
      this.requestID = window.requestAnimationFrame(this.onanimate.bind(this));
    };

    Main.prototype.update = function(index) {
      for (var ci = index, clen = this.dirtyComponents.length; ci < clen; ci++) {
        var component = this.dirtyComponents[ci];
        var relations = component._relations;
        for (var ri = 0, rlen = relations.length; ri < rlen; ri++) {
          relations[ri].update(component);
        }
      }

      // may be inserted other dirty components by updating relations
      if (this.dirtyComponents.length > clen) {
        this.update(clen);
      }
    };

    Main.prototype.onanimate = function() {
      this.update(0);
      for (var i = 0, len = this.dirtyComponents.length; i < len; i++) {
        this.dirtyComponents[i].redraw();
      }
      this.dirtyComponents = [];
      this.requestID = 0;
    };

    return new Main();
  })();

  Component.inherits = function(initializer) {
    var superCtor = this;
    var ctor = function() {
      var props = (arguments.length !== 0 ? arguments[0] : {});
      superCtor.call(this, props);
      if (typeof initializer === 'function') {
        initializer.call(this, props);
      }
      if (this.constructor === ctor) {
        this.oninit();
      }
    };
    inherits(ctor, superCtor);
    ctor.inherits = superCtor.inherits;
    return ctor;
  };

  var Relation = function() {};

  Relation.prototype.update = function(component) {};

  Relation.inherits = function(initializer) {
    var superCtor = this;
    var ctor = function() {
      if (typeof initializer === 'function') {
        var props = (arguments.length !== 0 ? arguments[0] : {});
        initializer.call(this, props);
      }
    };
    inherits(ctor, superCtor);
    return ctor;
  };

  var Draggable = function(component) {
    this._component = component;
    this._draggable = new dom.Draggable(component.el);
  };

  Draggable.prototype.enable = function() {
    this._draggable.enable({
      onstart: this.onstart.bind(this, this._component),
      onmove: this.onmove.bind(this, this._component),
      onend: this.onend.bind(this, this._component),
    });
  };

  Draggable.prototype.disable = function() {
    this._draggable.disable();
  };

  Draggable.prototype.onstart = function(component, x, y, event, context) {};

  Draggable.prototype.onmove = function(component, dx, dy, event, context) {};

  Draggable.prototype.onend = function(component, dx, dy, event, context) {};

  Draggable.inherits = function() {
    var superCtor = this;
    var ctor = function(component) {
      superCtor.call(this, component);
    };
    inherits(ctor, superCtor);
    return ctor;
  };

  var jCore = {
    Component: Component,
    Relation: Relation,
    Draggable: Draggable,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = jCore;
  } else {
    window.jCore = jCore;
  }
})();
