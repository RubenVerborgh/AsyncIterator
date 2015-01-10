var EventEmitter = require('events').EventEmitter;

/**
  Creates a new `Iterator`.
  @constructor
  @classdesc An iterator allows pull-based access to a stream of objects.
  @extends EventEmiter
**/
function Iterator(status) {
  if (!(this instanceof Iterator))
    return new Iterator(status);
  EventEmitter.call(this);
  this.on('newListener', waitForDataListener);
  this._changeStatus(status || this.IDLE, true);
}

/**
  Names of possible iterator statuses.
  The status' position in the array corresponds to its ID.
  @name Iterator.STATUSES
  @type String[]
*/
var STATUSES = ['IDLE', 'READABLE', 'CLOSED', 'ENDED'];

/**
  Makes the specified iterator inherit from the current iterator.
  @function
  @name Iterator.isPrototypeOf
  @param {Function} child The iterator that should inherit from the current iterator.
**/
(function isPrototypeOf(child) {
  // Initialize the child's prototype
  var prototype = child.prototype = Object.create(this.prototype,
    { constructor: { value: child, configurable: true, writable: true }});
  child.isPrototypeOf = isPrototypeOf;

  // Set the child's static properties
  prototype.STATUSES || Object.defineProperty(prototype, 'STATUSES', { value: STATUSES });
  Object.defineProperty(child, 'STATUSES', { value: prototype.STATUSES });
  STATUSES.forEach(function (status, index) {
    status in prototype || Object.defineProperty(prototype, status, { value: index });
    Object.defineProperty(child, status, { value: index });
  });
})
.call(EventEmitter, Iterator);

/**
 * Changes the iterator to the given status if possible and necessary,
 * possibly emitting events to signal that change.
 * @protected
 * @param {integer} newStatus The ID of the new status (from the `STATUSES` array).
 * @param {boolean} [eventAsync=false] Whether resulting events should be emitted asynchronously.
 * @returns boolean Whether the status was changed.
 * @emits Iterator.readable
 * @emits Iterator.end
*/
Iterator.prototype._changeStatus = function (newStatus, eventAsync) {
  // Don't change anything if the iterator was already in the given status
  var oldStatus = this._status, event;
  if (newStatus === oldStatus || oldStatus === this.ENDED) return false;

  // Validate the status change
  switch (newStatus) {
  case this.READABLE:
    if (oldStatus === this.CLOSED) return false;
    event = 'readable';
    break;
  case this.ENDED:
    event = 'end';
    break;
  }

  // Change the internal status
  this._status = newStatus;
  if (event) eventAsync ? this._emitAsync(event) : this.emit(event);
  return true;
};

/**
 * Tries to read the next item from the iterator.
 *
 * This is the main method for reading the iterator in _on-demand mode_,
 * where new items are only created when needed by consumers.
 * If no items are currently available, this methods returns `undefined`.
 * The {@link Iterator.event:readable} event will then signal when new items might be ready.
 *
 * To read all items from the stream,
 * switch to _flow mode_ by subscribing to the {@link Iterator.event:data} event.
 * When in flow mode, do not use the `read` method.
 *
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
 * Verifies whether the iterator has listeners for the given event.
 * @private
 * @param {string} eventName The name of the event
 * @returns {boolean} Whether the iterator has listeners
**/
Iterator.prototype._hasListeners = function (eventName) {
  return this._events && (eventName in this._events);
};

/**
 * Adds the listener to the event, if it has not been added previously.
 * @private
 * @param {string} eventName The name of the event
 * @param {Function} listener The listener to add
**/
Iterator.prototype._addSingleListener = function (eventName, listener) {
  var listeners = this._events && this._events[eventName];
  if (!listeners || (typeof listeners === 'function' ? listeners !== listener
                                                     : listeners.indexOf(listener) < 0))
    this.addListener(eventName, listener);
};

/**
 * Stops the iterator from generating new items.
 *
 * Already generated items, or terminating items, can still be emitted.
 *
 * @emits Iterator.end
**/
Iterator.prototype.close = function () {
  this._changeStatus(this.CLOSED) && this._endAsync();
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
  if (self._changeStatus(self.ENDED)) {
    delete self._events;
    self.addListener = self.on = self.once = self.emit = deleteEvents;
  }
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
  get: function () { return this._status === this.CLOSED || this._status === this.ENDED; },
  enumerable: true,
});

/**
 * Whether the iterator has stopped emitting items
 * @name Iterator#ended
 * @type boolean
**/
Object.defineProperty(Iterator.prototype, 'ended', {
  get: function () { return this._status === this.ENDED; },
  enumerable: true,
});

/**
 * Emitted when a new item is available on the iterator.
 *
 * As soon as one or more listeners are attached to the `data` event,
 * the iterator switches to _flow mode_,
 * generating and emitting new items as fast as possible.
 * This drains the source and might create backpressure on the consumers,
 * so only subscribe to this event if this behavior is intended.
 * In flow mode, don't use the {@link Iterator#read} method.
 *
 * To switch back to _on-demand mode_,
 * remove all listeners from the `data` event.
 * You can then obtain items through {@link Iterator#read} again.
 *
 * @event Iterator.data
 * @param {object} item The new item
**/

// Starts emitting `data` events when `data` listeners are added
function waitForDataListener(eventName, listener) {
  if (eventName === 'data') {
    this.removeListener('newListener', waitForDataListener);
    this._addSingleListener('readable', emitData);
    if (this._status === this.READABLE)
      setImmediate(call, emitData, this);
  }
}
// Emits new items though `data` events as long as there are `data` listeners
function emitData() {
  // While there are `data` listeners and items, emit them
  var item;
  while (this._hasListeners('data') && (item = this.read()) !== undefined)
    this.emit('data', item);
  // Stop draining the source if there are no more `data` listeners
  if (!this._hasListeners('data')) {
    this.removeListener('readable', emitData);
    this._addSingleListener('newListener', waitForDataListener);
  }
}
// Calls the given function with the specified argument as `this` value
function call (func, self) { func.call(self); }



/**
  Creates a new `EmptyIterator`.
  @constructor
  @classdesc An iterator that doesn't emit any items.
  @extends Iterator
**/
function EmptyIterator() {
  if (!(this instanceof EmptyIterator))
    return new EmptyIterator();
  Iterator.call(this, this.ENDED);
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
  else
    this._item = item, this._changeStatus(this.READABLE, true);
}
Iterator.isPrototypeOf(SingletonIterator);

/* Reads the item from the iterator. */
SingletonIterator.prototype.read = function () {
  var item = this._item;
  delete this._item;
  this.close();
  return item;
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
  this._changeStatus(this.READABLE, true);
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
  if (!buffer || buffer.length === 0) {
    if (this.closed)
      this._endAsync();
    else {
      this._changeStatus(this.IDLE);
      this._fillBufferAsync();
    }
  }
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
  this._changeStatus(this.READABLE, true);
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
}

/* Closes the iterator. */
BufferedIterator.prototype.close = function () {
  // When the iterator is closed, only buffered items can still be emitted.
  // If the buffer is empty, no more items will be emitted.
  if (this._changeStatus(this.CLOSED) && (!this._buffer || this._buffer.length === 0))
    this._endAsync();
};



// Export all submodules
module.exports = {
  Iterator: Iterator,
  EmptyIterator: EmptyIterator,
  SingletonIterator: SingletonIterator,
  ArrayIterator: ArrayIterator,
  BufferedIterator: BufferedIterator,
};
