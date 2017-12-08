/**
 * jCore v0.2.0
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

  var Draggable = function() {};

  Draggable.inherits = function(initializer) {
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
