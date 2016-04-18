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

  var lastIndexOf = function(array, value) {
    for (var i = array.length - 1; i >= 0; i--) {
      if (array[i] === value)
        return i;
    }

    return -1;
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
      for (var ci = index, clen = dirtyComponents.length; ci < clen; ci++) {
        var component = dirtyComponents[ci];
        var relations = component.relations();

        for (var ri = 0, rlen = relations.length; ri < rlen; ri++) {
          relations[ri].update(component);
        }
      }

      // may be inserted other dirty components by updating relations
      if (dirtyComponents.length > clen)
        updateRelations(clen);
    };

    var callback = function() {
      updateRelations(0);

      for (var i = 0, len = dirtyComponents.length; i < len; i++) {
        dirtyComponents[i].redraw();
      }

      dirtyComponents = [];
      requestId = null;
    };

    return function() {
      if (lastIndexOf(dirtyComponents, this) === -1)
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
