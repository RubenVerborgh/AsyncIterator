var EventEmitter = require('events').EventEmitter,
    util = require('util');

/**
   Creates an iterator that allows pull-based access to a stream of objects.
   It emits the following events:
   - `readable` when one or more items can be read
   - `end` when there are no more items
   - `error` when a non-recoverable error occurs
*/
function Iterator(options) {
  if (!(this instanceof Iterator))
    return new Iterator(options);
  EventEmitter.call(this);
}
util.inherits(Iterator, EventEmitter);

/** Tries to read an item from the iterator; returns the item, or `null` if none is available. **/
Iterator.prototype.read = function () {
  throw new Error('The read method has not been implemented.');
};

/** Asynchronously emits the given event. */
Iterator.prototype._emitAsync = function (eventName, a, b, c) {
  setImmediate(emit, this, eventName, a, b, c);
};
function emit(self, eventName, a, b, c) { self.emit(eventName, a, b, c); }

/** Ends the iterator. */
Iterator.prototype._end = function () {
  setImmediate(endIterator, this);
};
function endIterator(self) {
  self.emit('end');
  self.addListener = self.on = self.once = self.emit = deleteEvents;
  delete self._events;
}
function deleteEvents() { delete this._events; }

/** Indicates whether reading more items from this iterator is not possible. **/
Iterator.prototype.ended = false;

/** Makes the current class a superclass of the given class. */
Iterator.makeSuperclassOf = function makeSuperclassOf(subclass) {
  util.inherits(subclass, this);
  subclass.makeSuperclassOf = makeSuperclassOf;
};



/** Creates an iterator that doesn't return any items. **/
function EmptyIterator(options) {
  if (!(this instanceof EmptyIterator))
    return new EmptyIterator(options);
  Iterator.call(this, options);
  this._end();
}
Iterator.makeSuperclassOf(EmptyIterator);

/** Tries to read an item from the iterator; returns the item, or `null` if none is available. **/
EmptyIterator.prototype.read = function () { return null; };

/** Indicates whether reading more items from this iterator is not possible. **/
EmptyIterator.prototype.ended = true;



/** Creates an iterator that returns a single item. **/
function SingletonIterator(item, options) {
  if (!(this instanceof SingletonIterator))
    return new SingletonIterator(item, options);
  Iterator.call(this, options);

  if (item === null)
    return this._end();

  this._item = item;
  this._emitAsync('readable');
}
Iterator.makeSuperclassOf(SingletonIterator);

/** Tries to read an item from the iterator; returns the item, or `null` if none is available. **/
SingletonIterator.prototype.read = function () {
  var item = null;
  if ('_item' in this) {
    item = this._item;
    delete this._item;
    this._end();
  }
  return item;
};

/** Indicates whether reading more items from this iterator is not possible. **/
Object.defineProperty(SingletonIterator.prototype, 'ended', {
  get: function () { return !('_item' in this); },
});



/** Creates an iterator that returns items from the given array. **/
function ArrayIterator(items, options) {
  if (!(this instanceof ArrayIterator))
    return new ArrayIterator(items, options);
  Iterator.call(this, options);

  if (!(items && items.length > 0))
    return this._end();

  this._buffer = items.slice();
  this._emitAsync('readable');
}
Iterator.makeSuperclassOf(ArrayIterator);

/** Tries to read an item from the iterator; returns the item, or `null` if none is available. **/
ArrayIterator.prototype.read = function () {
  var buffer = this._buffer;
  if (!buffer) return null;

  var item = buffer.shift();
  if (buffer.length === 0) {
    delete this._buffer;
    this._end();
  }
  return item;
};

/** Indicates whether reading more items from this iterator is not possible. **/
Object.defineProperty(ArrayIterator.prototype, 'ended', {
  get: function () { return !('_buffer' in this); },
});

// Export all submodules
module.exports = {
  Iterator: Iterator,
  EmptyIterator: EmptyIterator,
  SingletonIterator: SingletonIterator,
  ArrayIterator: ArrayIterator,
};
