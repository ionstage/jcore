/**
 * jCore v0.3.0
 * (c) 2016 iOnStage
 * Released under the MIT License.
 */

(function(global) {
  'use strict';

  if (!global.requestAnimationFrame) {
    global.requestAnimationFrame = function(callback) {
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

  dom.rect = function(el) {
    return el.getBoundingClientRect();
  };

  dom.offsetLeft = function(el) {
    return dom.rect(el).left - el.scrollLeft - dom.rect(document.body).left;
  };

  dom.offsetTop = function(el) {
    return dom.rect(el).top - el.scrollTop - dom.rect(document.body).top;
  };

  dom.on = function(el, type, listener, useCapture) {
    el.addEventListener(type, listener, !!useCapture);
  };

  dom.off = function(el, type, listener, useCapture) {
    el.removeEventListener(type, listener, !!useCapture);
  };

  dom.supportsTouch = function() {
    return ('createTouch' in document);
  };

  dom.changedTouch = function(event) {
    return (dom.supportsTouch() && 'changedTouches' in event ? event.changedTouches[0] : null);
  };

  dom.eventType = function(name) {
    switch (name) {
      case 'start':
        return (dom.supportsTouch() ? 'touchstart' : 'mousedown');
      case 'move':
        return (dom.supportsTouch() ? 'touchmove' : 'mousemove');
      case 'end':
        return (dom.supportsTouch() ? 'touchend' : 'mouseup');
      default:
        throw new Error('Invalid event type');
    }
  };

  dom.pageX = function(event) {
    return (dom.changedTouch(event) || event).pageX;
  };

  dom.pageY = function(event) {
    return (dom.changedTouch(event) || event).pageY;
  };

  dom.clientX = function(event) {
    return (dom.changedTouch(event) || event).clientX;
  };

  dom.clientY = function(event) {
    return (dom.changedTouch(event) || event).clientY;
  };

  dom.identifier = function(event) {
    var touch = dom.changedTouch(event);
    return (touch ? touch.identifier : null);
  };

  dom.Draggable = (function() {
    var Draggable = function(element) {
      this.element = element;
      this.start = this.start.bind(this);
      this.move = this.move.bind(this);
      this.end = this.end.bind(this);
      this.onstart = null;
      this.onmove = null;
      this.onend = null;
      this.lock = false;
      this.identifier = null;
      this.startPageX = 0;
      this.startPageY = 0;
      this.context = {};
    };

    Draggable.prototype.enable = function(listeners) {
      this.onstart = listeners.onstart;
      this.onmove = listeners.onmove;
      this.onend = listeners.onend;
      dom.on(this.element, dom.eventType('start'), this.start);
    };

    Draggable.prototype.disable = function() {
      dom.off(this.element, dom.eventType('start'), this.start);
      dom.off(document, dom.eventType('move'), this.move);
      dom.off(document, dom.eventType('end'), this.end);
      this.onstart = null;
      this.onmove = null;
      this.onend = null;
      this.lock = false;
      this.context = {};
    };

    Draggable.prototype.start = function(event) {
      if (this.lock) {
        return;
      }

      this.lock = true;
      this.identifier = dom.identifier(event);
      this.startPageX = dom.pageX(event);
      this.startPageY = dom.pageY(event);

      var x = dom.clientX(event) - dom.offsetLeft(this.element);
      var y = dom.clientY(event) - dom.offsetTop(this.element);
      this.onstart.call(null, x, y, event, this.context);

      dom.on(document, dom.eventType('move'), this.move);
      dom.on(document, dom.eventType('end'), this.end);
    };

    Draggable.prototype.move = function(event) {
      if (this.identifier && this.identifier !== dom.identifier(event)) {
        return;
      }

      var dx = dom.pageX(event) - this.startPageX;
      var dy = dom.pageY(event) - this.startPageY;
      this.onmove.call(null, dx, dy, event, this.context);
    };

    Draggable.prototype.end = function(event) {
      if (this.identifier && this.identifier !== dom.identifier(event)) {
        return;
      }

      dom.off(document, dom.eventType('move'), this.move);
      dom.off(document, dom.eventType('end'), this.end);

      var dx = dom.pageX(event) - this.startPageX;
      var dy = dom.pageY(event) - this.startPageY;
      this.onend.call(null, dx, dy, event, this.context);

      this.lock = false;
    };

    return Draggable;
  })();

  var Component = function(props) {
    this.element = this.prop(props.element || this.render());
    this.parentElement = this.prop(this.element().parentNode);
    this.relations = [];
    this.cache = {};
    this.listeners = {};
  };

  Component.prototype.findElement = function(selectors) {
    return this.element().querySelector(selectors);
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
    if (this.relations.indexOf(relation) === -1) {
      this.relations.push(relation);
    }
  };

  Component.prototype.removeRelation = function(relation) {
    var index = this.relations.indexOf(relation);
    if (index !== -1) {
      this.relations.splice(index, 1);
    }
  };

  Component.prototype.on = function(type, listener) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  };

  Component.prototype.emit = function() {
    var args = Array.prototype.slice.call(arguments);
    var type = args.shift();
    var listeners = this.listeners[type];
    if (!listeners) {
      return;
    }
    for (var i = 0, len = listeners.length; i < len; i++) {
      listeners[i].apply(this, args);
    }
  };

  Component.prototype.removeAllListeners = function(type) {
    if (this.listeners[type]) {
      delete this.listeners[type];
    } else {
      this.listeners = {};
    }
  };

  Component.prototype.redraw = function() {
    var element = this.element();
    var parentElement = this.parentElement();
    this.onredraw();
    if (parentElement && parentElement !== element.parentNode) {
      this.onappend();
      parentElement.appendChild(element);
    } else if (!parentElement && element.parentNode) {
      this.onremove();
      element.parentNode.removeChild(element);
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
      if (value !== this.cache[key]) {
        this.cache[key] = value;
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
      this.requestID = global.requestAnimationFrame(this.onanimate.bind(this));
    };

    Main.prototype.update = function(index) {
      for (var ci = index, clen = this.dirtyComponents.length; ci < clen; ci++) {
        var component = this.dirtyComponents[ci];
        var relations = component.relations;
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
    this.component = component;
    this.draggable = new dom.Draggable(component.element());
  };

  Draggable.prototype.enable = function() {
    this.draggable.enable({
      onstart: this.onstart.bind(this, this.component),
      onmove: this.onmove.bind(this, this.component),
      onend: this.onend.bind(this, this.component),
    });
  };

  Draggable.prototype.disable = function() {
    this.draggable.disable();
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
    global.jCore = jCore;
  }
})(this);
