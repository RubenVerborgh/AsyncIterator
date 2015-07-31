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
  this._changeStatus(status || IDLE, true);
}

/**
  Names of possible iterator statuses.
  The status' position in the array corresponds to its ID.
  @name AsyncIterator.STATUSES
  @type String[]
*/
var STATUSES = AsyncIterator.STATUSES = ['IDLE', 'READABLE', 'CLOSED', 'ENDED'];
var IDLE = 0, READABLE = 1, CLOSED = 2, ENDED = 3;
STATUSES.forEach(function (status, id) { AsyncIterator[status] = id; });

/**
  ID of the IDLE status.
  An iterator is idle if it is in none of the other states.
  @name AsyncIterator.IDLE
  @type integer
*/

/**
  ID of the READABLE status.
  An iterator is readable if it _might_ have an item ready to read.
  @name AsyncIterator.READABLE
  @type integer
*/

/**
  ID of the CLOSED status.
  An iterator is closed if it no longer generates new items. Items might still be available.
  @name AsyncIterator.CLOSED
  @type integer
*/

/**
  ID of the ENDED status.
  An iterator has ended if no further items will become available.
  @name AsyncIterator.ENDED
  @type integer
*/


/**
  Makes the specified iterator inherit from the current iterator.
  @function
  @name AsyncIterator.isPrototypeOf
  @param {Function} child The iterator that should inherit from the current iterator.
**/
(function isPrototypeOf(child) {
  var prototype = child.prototype = Object.create(this.prototype,
    { constructor: { value: child, configurable: true, writable: true }});
  child.isPrototypeOf = isPrototypeOf;
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
  // Validate the status change
  var oldStatus = this._status, event;
  if (newStatus === oldStatus || oldStatus === ENDED ||
      (oldStatus === CLOSED && newStatus !== ENDED)) return false;

  // Determine the event name
  switch (newStatus) {
  case READABLE:
    event = 'readable';
    break;
  case ENDED:
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
  if (!listeners || (isFunction(listeners) ? listeners !== listener
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
  if (this._changeStatus(CLOSED))
    this._end();
};

/**
 * Writes terminating items with {@link AsyncIterator#_flush},
 * and then asynchronously ends the iterator with {@link AsyncIterator#_terminate}.
 *
 * Should never be called before {@link AsyncIterator#close};
 * typically, `close` is responsible for calling `_end`.
 *
 * @protected
 * @emits AsyncIterator.end
**/
AsyncIterator.prototype._end = function () {
  var self = this;
  this._flush(function () {
    if (self) {
      setImmediate(terminate, self);
      self = null;
    }
  });
};

/**
 * Writes terminating items.
 *
 * Should never be called before {@link AsyncIterator#_end};
 * typically, `_end` is responsible for calling `_flush`.
 *
 * @protected
 * @param {function} done To be called when termination is complete
**/
AsyncIterator.prototype._flush = function (done) { done(); };

/**
 * Terminates the iterator, so no more items can be emitted.
 *
 * Should never be called before {@link AsyncIterator#_end};
 * typically, `_end` is responsible for calling `_terminate`.
 *
 * @protected
 * @emits AsyncIterator.end
**/
AsyncIterator.prototype._terminate = function () {
  if (this._changeStatus(ENDED)) {
    this.removeAllListeners('readable');
    this.removeAllListeners('data');
    this.removeAllListeners('end');
  }
};
function terminate(self) { self._terminate(); }
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
  get: function () { return this._status === CLOSED || this._status === ENDED; },
  enumerable: true,
});

/**
 * Whether the iterator has stopped emitting items
 * @name AsyncIterator#ended
 * @type boolean
**/
Object.defineProperty(AsyncIterator.prototype, 'ended', {
  get: function () { return this._status === ENDED; },
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
    if (this._status === READABLE)
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
function call(func, self) { func.call(self); }



/**
  Creates a new `EmptyIterator`.
  @constructor
  @classdesc An iterator that doesn't emit any items.
  @extends AsyncIterator
**/
function EmptyIterator() {
  if (!(this instanceof EmptyIterator))
    return new EmptyIterator();
  AsyncIterator.call(this, ENDED);
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
    this._item = item, this._changeStatus(READABLE, true);
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

  this._buffer = Array.prototype.slice.call(items);
  this._changeStatus(READABLE, true);
}
AsyncIterator.isPrototypeOf(ArrayIterator);

/* Reads an item from the iterator. */
ArrayIterator.prototype.read = function () {
  var buffer = this._buffer;
  if (buffer) {
    var item = buffer.shift();
    if (!buffer.length) {
      this.close();
      delete this._buffer;
    }
    return item;
  }
};



/**
  Creates a new `IntegerIterator`.
  @constructor
  @classdesc An iterator that enumerates integers in a certain range.
  @param {object} [options] Settings of the iterator
  @param {integer} [options.start=0] The first number to emit
  @param {integer} [options.end=Infinity] The last number to emit
  @param {integer} [options.step=1] The increment between two numbers
  @extends AsyncIterator
**/
function IntegerIterator(options) {
  if (!(this instanceof IntegerIterator))
    return new IntegerIterator(options);
  AsyncIterator.call(this);

  // Set start, end, and step
  options = options || {};
  var step = options.step, limit, last = options.end, next = options.start;
  this._step = step  = isFinite(step) ? ~~step : 1;
  limit      = step >= 0 ? Infinity : -Infinity; // counting towards plus or minus infinity?
  this._last = last  = isFinite(last) ? ~~last : (last === -limit ? last : limit);
  this._next = next  = typeof next !== 'number' ? 0 : (isFinite(next) ? ~~next : next);

  // Start iteration if there is at least one item; close otherwise
  if (!isFinite(next) || (step >= 0 ? next > last : next < last))
    this.close();
  else
    this._changeStatus(READABLE, true);
}
AsyncIterator.isPrototypeOf(IntegerIterator);

/* Reads an item from the iterator. */
IntegerIterator.prototype.read = function () {
  if (!this.closed) {
    var current = this._next, step = this._step, last = this._last, next = this._next += step;
    if (step >= 0 ? next > last : next < last)
      this.close();
    return current;
  }
};



/**
  Creates a new `BufferedIterator`.
  @constructor
  @classdesc A iterator that maintains an internal buffer of items.

  This class serves as a base class for other iterators
  with a typically complex item generation process.
  @param {object} [options] Settings of the iterator
  @param {integer} [options.bufferSize=4] The number of items to keep in the buffer
  @param {boolean} [options.autoStart=true] Whether buffering starts directly after construction
  @extends AsyncIterator
**/
function BufferedIterator(options) {
  if (!(this instanceof BufferedIterator))
    return new BufferedIterator(options);
  AsyncIterator.call(this);

  options = options || {};

  // Initialize the internal buffer
  var bufferSize = options.bufferSize, autoStart = options.autoStart;
  this._buffer = [];
  this._bufferSize = bufferSize = isFinite(bufferSize) ? Math.max(~~bufferSize, 1) : 4;
  this._reading = false; // whether a `_read` operation is scheduled or executing

  // Start buffering
  if (autoStart === undefined || autoStart)
    fillBufferAsync(this);
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
  var buffer = this._buffer, item = buffer.shift();
  if (item === undefined)
    this._changeStatus(IDLE);

  // If the buffer is becoming empty, either fill it or end the iterator
  if (!this._reading) {
    if (buffer.length < this._bufferSize) {
      // If the iterator is not closed and thus may still generate new items, fill the buffer
      if (!this.closed)
        fillBufferAsync(this);
      // No new items will be generated, so if none are buffered, the iterator ends here
      else if (!buffer.length)
        this._end();
    }
  }

  return item;
};

/**
 * Tries to generate the given number of items.
 *
 * Implementers should add `count` items through {@link BufferedIterator#_push}.
 * @param {integer} count The number of items to generate
 * @param {function} done To be called when reading is complete
 * @protected
**/
BufferedIterator.prototype._read = function (count, done) { done(); };

/**
 * Adds an item to the internal buffer.
 * @param {object} item The item to add
 * @protected
 * @emits AsyncIterator.readable
**/
BufferedIterator.prototype._push = function (item) {
  if (this.ended)
    throw new Error('Cannot push after the iterator was ended.');
  this._buffer.push(item);
  this._changeStatus(READABLE, true);
};

/**
 * Fills the internal buffer until `this.bufferSize` items are present.
 *
 * This method calls {@link BufferedIterator#_read} to fetch items.
 * @protected
 * @emits AsyncIterator.readable
**/
BufferedIterator.prototype._fillBuffer = function () {
  var buffer = this._buffer;
  // If the iterator has closed in the meantime, don't generate new items anymore
  if (this.closed) {
    this._reading = false;
    // End the iterator if no items are left in the buffer
    if (!buffer.length)
      this._end();
  }
  // Try to fill empty spaces in the buffer by generating new items
  else {
    var neededItems = this._bufferSize - buffer.length, self = this;
    // Try to read the needed number of items
    if (neededItems <= 0)
      this._reading = false;
    else {
      this._reading = true;
      this._read(neededItems, function () {
        // Verify the callback is only called once
        if (!neededItems)
          throw new Error('done callback called multiple times');
        neededItems = 0;
        self._reading = false;
        // If the buffer still contains items, `read` is responsible for ending the iterator.
        // If no items are buffered and the iterator was closed, the iterator ends here.
        if (!buffer.length && self.closed)
          self._end();
      });
    }
  }
};
function fillBuffer(self) { self._fillBuffer(); }
function fillBufferAsync(self) {
  if (!self._reading) {
    self._reading = true;
    setImmediate(fillBuffer, self);
  }
}

/* Closes the iterator. */
BufferedIterator.prototype.close = function () {
  // When the iterator is closed, only pending and buffered items can still be emitted.
  // If the iterator is still reading, `_fillBuffer` is responsible for ending the iterator.
  // If the buffer still contains items, `read` is responsible for ending the iterator.
  // Otherwise, the iterator is not reading and no items are buffered, so the iterator ends here.
  if (this._changeStatus(CLOSED) && !this._reading && !this._buffer.length)
    this._end();
};




/**
  Creates a new `TransformIterator`.
  @constructor
  @classdesc An iterator that generates items based on a source iterator.

  This class serves as a base class for other iterators.
  @param {AsyncIterator} [source] The source this iterator generates items from
  @param {object} [options] Settings of the iterator
  @param {integer} [options.bufferSize=4] The number of items to keep in the buffer
  @param {boolean} [options.autoStart=true] Whether buffering starts directly after construction
  @param {AsyncIterator} [options.source] The source this iterator generates items from
  @extends AsyncIterator
**/
function TransformIterator(source, options) {
  if (!(this instanceof TransformIterator))
    return new TransformIterator(source, options);
  // Shift arguments if the first is not a source
  if (!source || !isFunction(source.read)) {
    if (!options) options = source;
    source = options && options.source;
  }
  BufferedIterator.call(this, options);
  if (source) this.source = source;
}
BufferedIterator.isPrototypeOf(TransformIterator);

/**
 * The source this iterator generates items from
 * @name AsyncIterator#source
 * @type AsyncIterator
**/
Object.defineProperty(AsyncIterator.prototype, 'source', {
  set: function (source) {
    // Verify and set source
    if (this._source)
      throw new Error('The source cannot be changed after it has been set');
    if (!source || !isFunction(source.read) || !isFunction(source.on))
      throw new Error('Invalid source: ' + source);
    this._source = source;

    // Close this iterator if the source has already ended
    if (source.ended)
      return this.close();

    // React to source events
    var parent = this;
    source.once('end', function () { parent.close(); });
  },
  get: function () { return this._source; },
  enumerable: true,
});




// Determines whether the given object is a function
function isFunction(object) { return typeof object === 'function'; }

// Export all submodules
module.exports = {
  AsyncIterator: AsyncIterator,
  EmptyIterator: EmptyIterator,
  SingletonIterator: SingletonIterator,
  ArrayIterator: ArrayIterator,
  IntegerIterator: IntegerIterator,
  BufferedIterator: BufferedIterator,
  TransformIterator: TransformIterator,
};
