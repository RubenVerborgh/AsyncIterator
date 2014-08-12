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

/** Tries to read an item from the iterator; returns the item, or `undefined` if none is available. **/
Iterator.prototype.read = function () {
  throw new Error('The read method has not been implemented.');
};

/** Asynchronously emits the given event. */
Iterator.prototype._emitAsync = function (eventName, a, b, c) {
  setImmediate(emit, this, eventName, a, b, c);
};
function emit(self, eventName, a, b, c) { self.emit(eventName, a, b, c); }

/** Stops the iterator from generating more items, eventually leading to the `end` event. */
Iterator.prototype._close = function () {
  if (!this.closed) {
    this._closed = true;
    this._end();
  }
};

/** Asynchronously terminates the iterator, after which no more items will be emitted. */
Iterator.prototype._end = function () {
  setImmediate(endIterator, this);
};
function endIterator(self) {
  delete this._closed;
  self.emit('end');
  self.addListener = self.on = self.once = self.emit = deleteEvents;
  delete self._events;
}
function deleteEvents() { delete this._events; }

/** Indicates whether the iterator has stopped generating new items. */
Object.defineProperty(Iterator.prototype, 'closed', {
  get: function () { return !!this._closed || this.ended; },
});

/** Indicates whether the iterator has stopped emitting items. **/
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

/** Tries to read an item from the iterator; returns the item, or `undefined` if none is available. **/
EmptyIterator.prototype.read = function () { };

/** Indicates whether the iterator has stopped emitting items. **/
EmptyIterator.prototype.ended = true;



/** Creates an iterator that returns a single item. **/
function SingletonIterator(item, options) {
  if (!(this instanceof SingletonIterator))
    return new SingletonIterator(item, options);
  Iterator.call(this, options);

  if (item === undefined)
    return this._end();

  this._item = item;
  this._emitAsync('readable');
}
Iterator.makeSuperclassOf(SingletonIterator);

/** Tries to read an item from the iterator; returns the item, or `undefined` if none is available. **/
SingletonIterator.prototype.read = function () {
  var item = this._item;
  if (item !== undefined) {
    this._close();
    delete this._item;
    return item;
  }
};

/** Indicates whether the iterator has stopped emitting items. **/
Object.defineProperty(SingletonIterator.prototype, 'ended', {
  get: function () { return this._item === undefined; },
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

/** Tries to read an item from the iterator; returns the item, or `undefined` if none is available. **/
ArrayIterator.prototype.read = function () {
  var buffer = this._buffer;
  if (buffer !== undefined) {
    var item = buffer.shift();
    if (buffer.length === 0) {
      this._close();
      delete this._buffer;
    }
    return item;
  }
};

/** Indicates whether the iterator has stopped emitting items. **/
Object.defineProperty(ArrayIterator.prototype, 'ended', {
  get: function () { return this._buffer === undefined; },
});



/** Creates an iterator that keeps an internal buffer of items. **/
function BufferedIterator(options) {
  if (!(this instanceof BufferedIterator))
    return new BufferedIterator(options);
  Iterator.call(this, options);

  // Initialize the internal buffer
  var bufferSize = options && options.bufferSize;
  this._bufferSize = bufferSize = isFinite(bufferSize) && bufferSize >= 0 ? ~~bufferSize : 4;
  if (bufferSize !== 0) {
    this._buffer = [];
    this._fillBuffer();
  }
}
Iterator.makeSuperclassOf(BufferedIterator);

/** Tries to read an item from the iterator; returns the item, or `undefined` if none is available. **/
BufferedIterator.prototype.read = function () {
  if (this.ended) return;

  // Try to retrieve an item from the buffer
  var buffer = this._buffer, item = buffer && buffer.shift();
  // If no item was available in the buffer, try the internal _read method
  if (item === undefined) {
    this._read(1);
    item = (buffer = this._buffer) && buffer.shift();
  }

  // If the buffer is empty, either end the iterator or fill it.
  if (buffer === undefined || buffer.length === 0)
    this._closed ? this._end() : this._fillBuffer();

  return item;
};

/** Tries to generate the indicated number of items.
    Implementers should try to add `count` items through `this._push`. */
BufferedIterator.prototype._read = function (count) { };

/** Adds an item to the internal buffer. */
BufferedIterator.prototype._push = function (item) {
  if (item === null) return this._close();
  if (this.ended) throw new Error('Cannot push after the iterator was ended.');
  this._buffer ? this._buffer.push(item) : this._buffer = [item];
};

/** Tries to fill the internal buffer until the desired number of items is present. */
BufferedIterator.prototype._fillBuffer = function () {
  setImmediate(fillBuffer, this);
};
function fillBuffer(self) {
  var buffer = self._buffer || (self._buffer = []);
  var prevBufferLength = -1, neededItems;
  while (!self.closed && buffer.length !== prevBufferLength &&
         (neededItems = self._bufferSize - (prevBufferLength = buffer.length)) > 0)
    self._read(neededItems);
  (buffer.length === 0) || self.emit('readable');
}

/** Stops the iterator from generating more items, eventually leading to the `end` event. */
BufferedIterator.prototype._close = function () {
  if (!this.closed) {
    this._closed = true;
    if (this._buffer === undefined || this._buffer.length === 0)
      this._end();
  }
};

/** Asynchronously terminates the iterator, after which no more items will be emitted. */
BufferedIterator.prototype._end = function () {
  delete this._bufferSize;
  Iterator.prototype._end.call(this);
};

/** Indicates whether the iterator has stopped emitting items. **/
Object.defineProperty(BufferedIterator.prototype, 'ended', {
  get: function () { return this._bufferSize === undefined; },
});



// Export all submodules
module.exports = {
  Iterator: Iterator,
  EmptyIterator: EmptyIterator,
  SingletonIterator: SingletonIterator,
  ArrayIterator: ArrayIterator,
  BufferedIterator: BufferedIterator,
};
