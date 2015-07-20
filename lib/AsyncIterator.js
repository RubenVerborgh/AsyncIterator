var EventEmitter = require('events').EventEmitter;

/**
  Creates a new `AsyncIterator`.
  @constructor
  @classdesc An asynchronous iterator provides pull-based access to a stream of objects.
  @extends EventEmiter
**/
function AsyncIterator(status) {
  if (!(this instanceof AsyncIterator))
    return new AsyncIterator(status);
  EventEmitter.call(this);
  this.on('newListener', waitForDataListener);
  this._changeStatus(status || this.IDLE, true);
}

/**
  Names of possible iterator statuses.
  The status' position in the array corresponds to its ID.
  @name AsyncIterator.STATUSES
  @type String[]
*/
var STATUSES = ['IDLE', 'READABLE', 'CLOSED', 'ENDED'];

/**
  Makes the specified iterator inherit from the current iterator.
  @function
  @name AsyncIterator.isPrototypeOf
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
.call(EventEmitter, AsyncIterator);

/**
 * Changes the iterator to the given status if possible and necessary,
 * possibly emitting events to signal that change.
 * @protected
 * @param {integer} newStatus The ID of the new status (from the `STATUSES` array).
 * @param {boolean} [eventAsync=false] Whether resulting events should be emitted asynchronously.
 * @returns boolean Whether the status was changed.
 * @emits AsyncIterator.readable
 * @emits AsyncIterator.end
*/
AsyncIterator.prototype._changeStatus = function (newStatus, eventAsync) {
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
  if (event) eventAsync ? setImmediate(emit, this, event) : this.emit(event);
  return true;
};
// Emits the event on the given EventEmitter
function emit(self, eventName) { self.emit(eventName); }

/**
 * Tries to read the next item from the iterator.
 *
 * This is the main method for reading the iterator in _on-demand mode_,
 * where new items are only created when needed by consumers.
 * If no items are currently available, this methods returns `undefined`.
 * The {@link AsyncIterator.event:readable} event will then signal when new items might be ready.
 *
 * To read all items from the stream,
 * switch to _flow mode_ by subscribing to the {@link AsyncIterator.event:data} event.
 * When in flow mode, do not use the `read` method.
 *
 * @returns {object?} The next item, or `undefined` if none is available
**/
AsyncIterator.prototype.read = function () { };
/**
 * Emitted when the iterator possibly has new items available,
 * which can be retrieved by calling {@link AsyncIterator#read}.
 *
 * @event AsyncIterator.readable
**/

/**
 * Verifies whether the iterator has listeners for the given event.
 * @private
 * @param {string} eventName The name of the event
 * @returns {boolean} Whether the iterator has listeners
**/
AsyncIterator.prototype._hasListeners = function (eventName) {
  return this._events && (eventName in this._events);
};

/**
 * Adds the listener to the event, if it has not been added previously.
 * @private
 * @param {string} eventName The name of the event
 * @param {Function} listener The listener to add
**/
AsyncIterator.prototype._addSingleListener = function (eventName, listener) {
  var listeners = this._events && this._events[eventName];
  if (!listeners || (typeof listeners === 'function' ? listeners !== listener
                                                     : listeners.indexOf(listener) < 0))
    this.addListener(eventName, listener);
};

/**
 * Stops the iterator from generating new items.
 *
 * Already generated items, or terminating items, can still be emitted.
 * After this, the iterator will end asynchronously.
 *
 * @emits AsyncIterator.end
**/
AsyncIterator.prototype.close = function () {
  this._changeStatus(this.CLOSED) && this._flush();
};

/**
 * Writes terminating items and terminates the iterator asynchronously.
 *
 * Should never be called before {@link AsyncIterator#close};
 * typically, `close` is responsible for calling `_flush`.
 *
 * @emits AsyncIterator.end
**/
AsyncIterator.prototype._flush = function () {
  this._endAsync();
};

/**
 * Terminates the iterator asynchronously, so no more items can be emitted.
 *
 * Should never be called before {@link AsyncIterator#_flush};
 * typically, `_flush` is responsible for calling `_endAsync`.
 *
 * @protected
 * @emits AsyncIterator.end
**/
AsyncIterator.prototype._endAsync = function () {
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
 * @event AsyncIterator.end
**/

/**
 * Whether the iterator has stopped generating new items
 * @name AsyncIterator#closed
 * @type boolean
**/
Object.defineProperty(AsyncIterator.prototype, 'closed', {
  get: function () { return this._status === this.CLOSED || this._status === this.ENDED; },
  enumerable: true,
});

/**
 * Whether the iterator has stopped emitting items
 * @name AsyncIterator#ended
 * @type boolean
**/
Object.defineProperty(AsyncIterator.prototype, 'ended', {
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
 * In flow mode, don't use the {@link AsyncIterator#read} method.
 *
 * To switch back to _on-demand mode_,
 * remove all listeners from the `data` event.
 * You can then obtain items through {@link AsyncIterator#read} again.
 *
 * @event AsyncIterator.data
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
  @extends AsyncIterator
**/
function EmptyIterator() {
  if (!(this instanceof EmptyIterator))
    return new EmptyIterator();
  AsyncIterator.call(this, this.ENDED);
}
AsyncIterator.isPrototypeOf(EmptyIterator);



/**
  Creates a new `SingletonIterator`.
  @constructor
  @classdesc An iterator that emits a single item.
  @param {object} item The item that will be emitted.
  @extends AsyncIterator
**/
function SingletonIterator(item) {
  if (!(this instanceof SingletonIterator))
    return new SingletonIterator(item);
  AsyncIterator.call(this);

  if (item === undefined)
    this.close();
  else
    this._item = item, this._changeStatus(this.READABLE, true);
}
AsyncIterator.isPrototypeOf(SingletonIterator);

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
  @extends AsyncIterator
**/
function ArrayIterator(items) {
  if (!(this instanceof ArrayIterator))
    return new ArrayIterator(items);
  AsyncIterator.call(this);

  if (!(items && items.length > 0))
    return this.close();

  this._buffer = items.slice();
  this._changeStatus(this.READABLE, true);
}
AsyncIterator.isPrototypeOf(ArrayIterator);

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
  @extends AsyncIterator
**/
function BufferedIterator(options) {
  if (!(this instanceof BufferedIterator))
    return new BufferedIterator(options);
  AsyncIterator.call(this);

  // Initialize the internal buffer
  var bufferSize = options && options.bufferSize;
  this._bufferSize = bufferSize = isFinite(bufferSize) && bufferSize >= 0 ? ~~bufferSize : 4;
  if (bufferSize !== 0) {
    this._buffer = [];
    this._fillBufferAsync();
  }
}
AsyncIterator.isPrototypeOf(BufferedIterator);

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
      this._flush();
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
 * @emits AsyncIterator.readable
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
 * @emits AsyncIterator.readable
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
    this._flush();
};

/* Cleans up the iterator. */
BufferedIterator.prototype._flush = function () {
  delete this._buffer;
  this._endAsync();
};



// Export all submodules
module.exports = {
  AsyncIterator: AsyncIterator,
  EmptyIterator: EmptyIterator,
  SingletonIterator: SingletonIterator,
  ArrayIterator: ArrayIterator,
  BufferedIterator: BufferedIterator,
};
