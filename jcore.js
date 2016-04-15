(function(global) {
  'use strict';

  if (!global.requestAnimationFrame) {
    global.requestAnimationFrame = function(callback) {
      return setTimeout(callback, 1000 / 60);
    };
  }

  var identity = function(value) {
    return value;
  };

  var Component = function() {
    this.relations = this.prop([]);
  };

  Component.prototype.prop = function(initialValue, defaultValue, converter) {
    if (typeof converter !== 'function')
      converter = identity;

    var cache = converter(initialValue, defaultValue);

    return function(value) {
      if (typeof value === 'undefined')
        return cache;

      if (value === cache)
        return;

      cache = converter(value, cache);

      this.markDirty();
    };
  };

  Component.prototype.redraw = function() {};

  Component.prototype.markDirty = (function() {
    var dirtyComponents = [];
    var requestId = null;

    var updateRelations = function(index) {
      for (var i = index, len = dirtyComponents.length; i < len; i++) {
        var component = dirtyComponents[i];
        component.relations().forEach(function(relation) {
          relation.update(component);
        });
      }

      // may be inserted other dirty components by updating relations
      if (dirtyComponents.length > len)
        updateRelations(len);
    };

    var callback = function() {
      updateRelations(0);

      dirtyComponents.forEach(function(component) {
        component.redraw();
      });

      dirtyComponents = [];
      requestId = null;
    };

    return function() {
      if (dirtyComponents.indexOf(this) === -1)
        dirtyComponents.push(this);

      if (requestId !== null)
        return;

      requestId = global.requestAnimationFrame(callback);
    };
  })();

  var Relation = function() {};

  Relation.prototype.prop = function(initialValue) {
    var cache = initialValue;

    return function(value) {
      if (typeof value === 'undefined')
        return cache;

      cache = value;
    };
  };

  Relation.prototype.update = function() {};

  var jCore = {
    Component: Component,
    Relation: Relation
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = jCore;
  else
    global.jCore = jCore;
})(this);
