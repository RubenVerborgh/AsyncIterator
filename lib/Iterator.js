var EventEmitter = require('events').EventEmitter;

/**
  Creates a new `Iterator`.
  @constructor
  @classdesc An iterator allows pull-based access to a stream of objects.
  @extends EventEmiter
**/
function Iterator() {
  if (!(this instanceof Iterator))
    return new Iterator();
  EventEmitter.call(this);
}

/**
  Makes the specified class inherit from the current class.
  @function
  @name Iterator.isPrototypeOf
  @param {Function} child The class that will inherit from the current class.
**/
(function isPrototypeOf(child) {
  child.isPrototypeOf = isPrototypeOf;
  child.prototype = Object.create(this.prototype,
    { constructor: { value: child, configurable: true, writable: true }});
})
.call(EventEmitter, Iterator);

/**
 * Tries to read the next item from the iterator.
 * @returns {object?} The next item, or `undefined` if none is available
**/
Iterator.prototype.read = function () { };
/**
 * Emitted when the iterator possibly has new items available,
 * which can be retrieved by calling {@link Iterator#read}.
 *
 * @event Iterator.readable
**/

/**
 * Asynchronously emits the event on this iterator.
 * @protected
 * @param {string} eventName The name of the event
 * @param {...object} param The parameters of the event
**/
Iterator.prototype._emitAsync = function (eventName, a, b, c) {
  setImmediate(emit, this, eventName, a, b, c);
};
function emit(self, eventName, a, b, c) { self.emit(eventName, a, b, c); }

/**
 * Stops the iterator from generating new items.
 *
 * Already generated items, or terminating items, can still be emitted.
 *
 * @emits Iterator.end
**/
Iterator.prototype.close = function () {
  if (!this.closed) {
    this._closed = true;
    this._endAsync();
  }
};

/**
 * Terminates the iterator asynchronously, so no more items can be emitted.
 *
 * Should never be called before {@link Iterator#close};
 * typically, `close` is responsible for calling `_endAsync`.
 *
 * @protected
 * @emits Iterator.end
**/
Iterator.prototype._endAsync = function () {
  setImmediate(endIterator, this);
};
function endIterator(self) {
  delete self._closed;
  self.emit('end');
  self.addListener = self.on = self.once = self.emit = deleteEvents;
  delete self._events;
}
function deleteEvents() { delete this._events; }
/**
 * Emitted after the last item of the iterator has been read.
 *
 * @event Iterator.end
**/

/**
 * Whether the iterator has stopped generating new items
 * @name Iterator#closed
 * @type boolean
**/
Object.defineProperty(Iterator.prototype, 'closed', {
  get: function () { return !!this._closed || this.ended; },
});

/**
 * Whether the iterator has stopped emitting items
 * @name Iterator#ended
 * @type boolean
**/
Object.defineProperty(Iterator.prototype, 'ended', {
  get: function () { return this.emit === deleteEvents; },
});



/**
  Creates a new `EmptyIterator`.
  @constructor
  @classdesc An iterator that doesn't emit any items.
  @extends Iterator
**/
function EmptyIterator() {
  if (!(this instanceof EmptyIterator))
    return new EmptyIterator();
  Iterator.call(this);
  this.close();
}
Iterator.isPrototypeOf(EmptyIterator);



/**
  Creates a new `SingletonIterator`.
  @constructor
  @classdesc An iterator that emits a single item.
  @param {object} item The item that will be emitted.
  @extends Iterator
**/
function SingletonIterator(item) {
  if (!(this instanceof SingletonIterator))
    return new SingletonIterator(item);
  Iterator.call(this);

  if (item === undefined)
    this.close();
  else {
    this._item = item;
    this._emitAsync('readable');
  }
}
Iterator.isPrototypeOf(SingletonIterator);

/* Reads the item from the iterator. */
SingletonIterator.prototype.read = function () {
  var item = this._item;
  this.close();
  return item;
};

/* Closes the iterator. */
SingletonIterator.prototype.close = function () {
  Iterator.prototype.close.call(this);
  delete this._item;
};



/**
  Creates a new `ArrayIterator`.
  @constructor
  @classdesc An iterator that emits the items of a given array.
  @param {Array} items The items that will be emitted.
  @extends Iterator
**/
function ArrayIterator(items) {
  if (!(this instanceof ArrayIterator))
    return new ArrayIterator(items);
  Iterator.call(this);

  if (!(items && items.length > 0))
    return this.close();

  this._buffer = items.slice();
  this._emitAsync('readable');
}
Iterator.isPrototypeOf(ArrayIterator);

/* Reads an item from the iterator. */
ArrayIterator.prototype.read = function () {
  var buffer = this._buffer;
  if (buffer !== undefined) {
    var item = buffer.shift();
    if (buffer.length === 0) {
      this.close();
      delete this._buffer;
    }
    return item;
  }
};



/**
  Creates a new `BufferedIterator`.
  @constructor
  @classdesc A writable iterator that maintains an internal buffer of items.

  This class serves as a base class for other iterators
  with a typically complex item generation process.
  @param {object} [options] Settings of the iterator
  @param {number} [options.bufferSize=4] The number of items to keep in the buffer
  @extends Iterator
**/
function BufferedIterator(options) {
  if (!(this instanceof BufferedIterator))
    return new BufferedIterator(options);
  Iterator.call(this);

  // Initialize the internal buffer
  var bufferSize = options && options.bufferSize;
  this._bufferSize = bufferSize = isFinite(bufferSize) && bufferSize >= 0 ? ~~bufferSize : 4;
  if (bufferSize !== 0) {
    this._buffer = [];
    this._fillBufferAsync();
  }
}
Iterator.isPrototypeOf(BufferedIterator);

/**
 * Tries to read the next item from the iterator.
 *
 * If the buffer is empty,
 * this method calls {@link BufferedIterator#_read} to fetch items.
 * @returns {object?} The next item, or `undefined` if none is available
**/
BufferedIterator.prototype.read = function () {
  if (this.ended) return;

  // Try to retrieve an item from the buffer
  var buffer = this._buffer, item = buffer && buffer.shift();
  // If no item was available in the buffer, try the internal _read method
  if (item === undefined) {
    this._read(1);
    item = (buffer = this._buffer) && buffer.shift();
  }

  // If the buffer is empty, either end the iterator or fill it
  if (buffer === undefined || buffer.length === 0)
    this._closed ? this._endAsync() : this._fillBufferAsync();

  return item;
};

/**
 * Tries to generate the given number of items.
 *
 * Implementers should add `count` items through {@link BufferedIterator#_push}.
 * @param {number} count The number of items to generate
 * @protected
**/
BufferedIterator.prototype._read = function (count) { };

/**
 * Adds an item to the internal buffer.
 * @param {object} item The item to add
 * @protected
 * @emits Iterator.readable
**/
BufferedIterator.prototype._push = function (item) {
  if (this.ended) throw new Error('Cannot push after the iterator was ended.');
  this._buffer ? this._buffer.push(item) : this._buffer = [item];
};

/**
 * Tries to fill the internal buffer asynchronously until `options.bufferSize` items are present.
 *
 * This method calls {@link BufferedIterator#_read} to fetch items.
 * @protected
 * @emits Iterator.readable
**/
BufferedIterator.prototype._fillBufferAsync = function () {
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

/* Closes the iterator. */
BufferedIterator.prototype.close = function () {
  if (!this.closed) {
    // When the iterator is closed, only buffered items can still be emitted
    this._closed = true;
    // If the buffer is empty, no more items will be emitted
    if (this._buffer === undefined || this._buffer.length === 0)
      this._endAsync();
  }
};



// Export all submodules
module.exports = {
  Iterator: Iterator,
  EmptyIterator: EmptyIterator,
  SingletonIterator: SingletonIterator,
  ArrayIterator: ArrayIterator,
  BufferedIterator: BufferedIterator,
};
