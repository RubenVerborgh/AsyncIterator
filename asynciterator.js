import { EventEmitter } from 'events';
import queueMicrotask from 'queue-microtask';

const STATES = ['INIT', 'OPEN', 'CLOSING', 'CLOSED', 'ENDED', 'DESTROYED'];
const INIT = 0, OPEN = 1, CLOSING = 2, CLOSED = 3, ENDED = 4, DESTROYED = 5;

/**
  An asynchronous iterator provides pull-based access to a stream of objects.
  @extends EventEmitter
*/
export class AsyncIterator extends EventEmitter {
  /** Creates a new `AsyncIterator`. */
  constructor() {
    super();
    this._state = OPEN;
    this._readable = false;
    this.on('newListener', waitForDataListener);
  }

  /**
    Changes the iterator to the given state if possible and necessary,
    possibly emitting events to signal that change.
    @protected
    @param {integer} newState The ID of the new state (from the `STATES` array)
    @param {boolean} [eventAsync=false] Whether resulting events should be emitted asynchronously
    @returns {boolean} Whether the state was changed
    @emits AsyncIterator.end
  */
  _changeState(newState, eventAsync) {
    // Validate the state change
    const valid = newState > this._state && this._state < ENDED;
    if (valid) {
      this._state = newState;
      // Emit the `end` event when changing to ENDED
      if (newState === ENDED) {
        if (!eventAsync)
          this.emit('end');
        else
          queueMicrotask(() => this.emit('end'));
      }
    }
    return valid;
  }

  /**
    Tries to read the next item from the iterator.
    This is the main method for reading the iterator in _on-demand mode_,
    where new items are only created when needed by consumers.
    If no items are currently available, this methods returns `null`.
    The {@link AsyncIterator.event:readable} event
    will then signal when new items might be ready.
    To read all items from the iterator,
    switch to _flow mode_ by subscribing to the {@link AsyncIterator.event:data} event.
    When in flow mode, do not use the `read` method.
    @returns {object?} The next item, or `null` if none is available
  */
  read() {
    return null;
  }

  /**
    The iterator emits a `readable` event when it might have new items available
    after having had no items available right before this event.
    If the iterator is not in flow mode,
    items can be retrieved by calling {@link AsyncIterator#read}.
    @event AsyncIterator.readable
  */

  /**
    The iterator emits a `data` event with a new item as soon as it becomes available.
    When one or more listeners are attached to the `data` event,
    the iterator switches to _flow mode_,
    generating and emitting new items as fast as possible.
    This drains the source and might create backpressure on the consumers,
    so only subscribe to this event if this behavior is intended.
    In flow mode, don't use the {@link AsyncIterator#read} method.
    To switch back to _on-demand mode_, remove all listeners from the `data` event.
    You can then obtain items through {@link AsyncIterator#read} again.
    @event AsyncIterator.data
    @param {object} item The new item
  */

  /**
    Invokes the callback for each remaining item in the iterator.
    Switches the iterator to flow mode.
    @param {Function} callback A function that will be called with each item
    @param {object?} self The `this` pointer for the callback
  */
  each(callback, self) {
    this.on('data', self ? callback.bind(self) : callback);
  }

  /**
    Verifies whether the iterator has listeners for the given event.
    @private
    @param {string} eventName The name of the event
    @returns {boolean} Whether the iterator has listeners
  */
  _hasListeners(eventName) {
    return this._events && (eventName in this._events);
  }

  /**
    Adds the listener to the event, if it has not been added previously.
    @private
    @param {string} eventName The name of the event
    @param {Function} listener The listener to add
  */
  _addSingleListener(eventName, listener) {
    const listeners = this._events && this._events[eventName];
    if (!listeners ||
        (isFunction(listeners) ? listeners !== listener : listeners.indexOf(listener) < 0))
      this.on(eventName, listener);
  }

  /**
    Stops the iterator from generating new items.
    Already generated items or terminating items can still be emitted.
    After this, the iterator will end asynchronously.
    @emits AsyncIterator.end
  */
  close() {
    if (this._changeState(CLOSED))
      this._endAsync();
  }

  /**
    Destroy the iterator and stop it from generating new items.
    This will not do anything if the iterator was already ended or destroyed.
    All internal resources will be released an no new items will be emitted,
    even not already generated items.
    Implementors should not override this method,
    but instead implement {@link AsyncIterator#_destroy}.
    @param {Error} [cause] An optional error to emit.
    @emits AsyncIterator.end
    @emits AsyncIterator.error Only emitted if an error is passed.
  */
  destroy(cause) {
    if (!this.done) {
      this._destroy(cause, error => {
        cause = cause || error;
        if (cause)
          this.emit('error', cause);
        this._end(true);
      });
    }
  }

  /**
    Called by {@link AsyncIterator#destroy}.
    Implementers can override this, but this should not be called directly.
    @param {?Error} cause The reason why the iterator is destroyed.
    @param {Function} callback A callback function with an optional error argument.
  */
  _destroy(cause, callback) {
    callback();
  }

  /**
    Ends the iterator and cleans up.
    Should never be called before {@link AsyncIterator#close};
    typically, `close` is responsible for calling `_end`.
    @param {boolean} [destroy] If the iterator should be forcefully destroyed.
    @protected
    @emits AsyncIterator.end
  */
  _end(destroy) {
    if (this._changeState(destroy ? DESTROYED : ENDED)) {
      this._readable = false;
      this.removeAllListeners('readable');
      this.removeAllListeners('data');
      this.removeAllListeners('end');
    }
  }

  /**
    Asynchronously calls `_end`.
  */
  _endAsync() {
    queueMicrotask(() => this._end());
  }

  /**
    Emitted after the last item of the iterator has been read.
    @event AsyncIterator.end
  */

  /**
    Gets or sets whether this iterator might have items available for read.
    A value of `false` means there are _definitely_ no items available;
    a value of `true` means items _might_ be available.
    @name AsyncIterator#readable
    @type boolean
    @emits AsyncIterator.readable
  */
  get readable() {
    return this._readable;
  }

  set readable(readable) {
    readable = Boolean(readable) && !this.done;
    // Set the readable value only if it has changed
    if (this._readable !== readable) {
      this._readable = readable;
      // If the iterator became readable, emit the `readable` event
      if (readable)
        queueMicrotask(() => this.emit('readable'));
    }
  }

  /**
    Gets whether the iterator has stopped generating new items.
    @name AsyncIterator#closed
    @type boolean
    @readonly
  */
  get closed() {
    return this._state >= CLOSING;
  }

  /**
    Gets whether the iterator has finished emitting items.
    @name AsyncIterator#ended
    @type boolean
    @readonly
  */
  get ended() {
    return this._state === ENDED;
  }

  /**
    Gets whether the iterator has been destroyed.
    @name AsyncIterator#destroyed
    @type boolean
    @readonly
  */
  get destroyed() {
    return this._state === DESTROYED;
  }

  /**
    Gets whether the iterator will not emit anymore items,
    either due to being closed or due to being destroyed.
    @name AsyncIterator#done
    @type boolean
    @readonly
  */
  get done() {
    return this._state >= ENDED;
  }

  /* Generates a textual representation of the iterator. */
  toString() {
    const details = this._toStringDetails();
    return `[${this.constructor.name}${details ? ` ${details}` : ''}]`;
  }

  /**
    Generates details for a textual representation of the iterator.
    @protected
  */
  _toStringDetails() {
    return '';
  }

  /**
    Retrieves the property with the given name from the iterator.
    If no callback is passed, it returns the value of the property
    or `undefined` if the property is not set.
    If a callback is passed, it returns `undefined`
    and calls the callback with the property the moment it is set.
    @param {string} propertyName The name of the property to retrieve
    @param {Function} [callback] A one-argument callback to receive the property value
    @returns {object?} The value of the property (if set and no callback is given)
  */
  getProperty(propertyName, callback) {
    const properties = this._properties;
    // If no callback was passed, return the property value
    if (!callback)
      return properties && properties[propertyName];
    // If the value has been set, send it through the callback
    if (properties && (propertyName in properties)) {
      queueMicrotask(() => callback(properties[propertyName]));
    }
    // If the value was not set, store the callback for when the value will be set
    else {
      let propertyCallbacks;
      if (!(propertyCallbacks = this._propertyCallbacks))
        this._propertyCallbacks = propertyCallbacks = Object.create(null);
      if (propertyName in propertyCallbacks)
        propertyCallbacks[propertyName].push(callback);
      else
        propertyCallbacks[propertyName] = [callback];
    }
    return undefined;
  }

  /**
    Sets the property with the given name to the value.
    @param {string} propertyName The name of the property to set
    @param {object?} value The new value of the property
  */
  setProperty(propertyName, value) {
    const properties = this._properties || (this._properties = Object.create(null));
    properties[propertyName] = value;
    // Execute getter callbacks that were waiting for this property to be set
    const propertyCallbacks = this._propertyCallbacks;
    const callbacks = propertyCallbacks && propertyCallbacks[propertyName];
    if (callbacks) {
      delete propertyCallbacks[propertyName];
      queueMicrotask(() => {
        for (const callback of callbacks)
          callback(value);
      });
      // Remove _propertyCallbacks if no pending callbacks are left
      for (propertyName in propertyCallbacks)
        return;
      delete this._propertyCallbacks;
    }
  }

  /**
    Retrieves all properties of the iterator.
    @returns {object} An object with property names as keys.
  */
  getProperties() {
    const properties = this._properties, copy = {};
    for (const name in properties)
      copy[name] = properties[name];
    return copy;
  }

  /**
    Sets all of the given properties.
    @param {object} properties Key/value pairs of properties to set
  */
  setProperties(properties) {
    for (const propertyName in properties)
      this.setProperty(propertyName, properties[propertyName]);
  }

  /**
    Copies the given properties from the source iterator.
    @param {AsyncIterator} source The iterator to copy from
    @param {Array} propertyNames List of property names to copy
  */
  copyProperties(source, propertyNames) {
    for (const propertyName of propertyNames) {
      source.getProperty(propertyName, value =>
        this.setProperty(propertyName, value));
    }
  }

  /**
    Creates an iterator that wraps around a given iterator or readable stream.
    Use this to convert an iterator-like object into a full-featured AsyncIterator.
    After this operation, only read the returned iterator instead of the given one.
    @function
    @param {AsyncIterator|Readable} [source] The source this iterator generates items from
    @param {object} [options] Settings of the iterator
    @returns {AsyncIterator} A new iterator with the items from the given iterator
  */
  static wrap(source, options) {
    return new TransformIterator(source, options);
  }

  /**
    Transforms items from this iterator.
    After this operation, only read the returned iterator instead of the current one.
    @param {object|Function} [options] Settings of the iterator, or the transformation function
    @param {integer} [options.maxbufferSize=4] The maximum number of items to keep in the buffer
    @param {boolean} [options.autoStart=true] Whether buffering starts directly after construction
    @param {integer} [options.offset] The number of items to skip
    @param {integer} [options.limit] The maximum number of items
    @param {Function} [options.filter] A function to synchronously filter items from the source
    @param {Function} [options.map] A function to synchronously transform items from the source
    @param {Function} [options.transform] A function to asynchronously transform items from the source
    @param {boolean} [options.optional=false] If transforming is optional, the original item is pushed when its mapping yields `null` or its transformation yields no items
    @param {Array|AsyncIterator} [options.prepend] Items to insert before the source items
    @param {Array|AsyncIterator} [options.append]  Items to insert after the source items
    @returns {AsyncIterator} A new iterator that maps the items from this iterator
  */
  transform(options) {
    return new SimpleTransformIterator(this, options);
  }

  /**
    Maps items from this iterator using the given function.
    After this operation, only read the returned iterator instead of the current one.
    @param {Function} mapper A mapping function to call on this iterator's (remaining) items
    @param {object?} self The `this` pointer for the mapping function
    @returns {AsyncIterator} A new iterator that maps the items from this iterator
  */
  map(mapper, self) {
    return this.transform({ map: self ? mapper.bind(self) : mapper });
  }

  /**
    Return items from this iterator that match the filter.
    After this operation, only read the returned iterator instead of the current one.
    @param {Function} filter A filter function to call on this iterator's (remaining) items
    @param {object?} self The `this` pointer for the filter function
    @returns {AsyncIterator} A new iterator that filters items from this iterator
  */
  filter(filter, self) {
    return this.transform({ filter: self ? filter.bind(self) : filter });
  }

  /**
    Prepends the items after those of the current iterator.
    After this operation, only read the returned iterator instead of the current one.
    @param {Array|AsyncIterator} items Items to insert before this iterator's (remaining) items
    @returns {AsyncIterator} A new iterator that prepends items to this iterator
  */
  prepend(items) {
    return this.transform({ prepend: items });
  }

  /**
    Appends the items after those of the current iterator.
    After this operation, only read the returned iterator instead of the current one.
    @param {Array|AsyncIterator} items Items to insert after this iterator's (remaining) items
    @returns {AsyncIterator} A new iterator that appends items to this iterator
  */
  append(items) {
    return this.transform({ append: items });
  }

  /**
    Surrounds items of the current iterator with the given items.
    After this operation, only read the returned iterator instead of the current one.
    @param {Array|AsyncIterator} prepend Items to insert before this iterator's (remaining) items
    @param {Array|AsyncIterator} append Items to insert after this iterator's (remaining) items
    @returns {AsyncIterator} A new iterator that appends and prepends items to this iterator
  */
  surround(prepend, append) {
    return this.transform({ prepend, append });
  }

  /**
    Skips the given number of items from the current iterator.
    The current iterator may not be read anymore until the returned iterator ends.
    @param {integer} offset The number of items to skip
    @returns {AsyncIterator} A new iterator that skips the given number of items
  */
  skip(offset) {
    return this.transform({ offset });
  }

  /**
    Limits the current iterator to the given number of items.
    The current iterator may not be read anymore until the returned iterator ends.
    @param {integer} limit The maximum number of items
    @returns {AsyncIterator} A new iterator with at most the given number of items
  */
  take(limit) {
    return this.transform({ limit });
  }

  /**
    Limits the current iterator to the given range.
    The current iterator may not be read anymore until the returned iterator ends.
    @param {integer} start Index of the first item to return
    @param {integer} end Index of the last item to return
    @returns {AsyncIterator} A new iterator with items in the given range
  */
  range(start, end) {
    return this.transform({ offset: start, limit: Math.max(end - start + 1, 0) });
  }

  /**
    Creates a copy of the current iterator,
    containing all items emitted from this point onward.
    Further copies can be created; they will all start from this same point.
    After this operation, only read the returned copies instead of the original iterator.
    @returns {AsyncIterator} A new iterator that contains all future items of this iterator
  */
  clone() {
    return new ClonedIterator(this);
  }
}


// Starts emitting `data` events when `data` listeners are added
function waitForDataListener(eventName) {
  if (eventName === 'data') {
    this.removeListener('newListener', waitForDataListener);
    this._addSingleListener('readable', emitData);
    if (this.readable)
      queueMicrotask(() => emitData.call(this));
  }
}
// Emits new items though `data` events as long as there are `data` listeners
function emitData() {
  // While there are `data` listeners and items, emit them
  let item;
  while (this._hasListeners('data') && (item = this.read()) !== null)
    this.emit('data', item);
  // Stop draining the source if there are no more `data` listeners
  if (!this._hasListeners('data') && !this.done) {
    this.removeListener('readable', emitData);
    this._addSingleListener('newListener', waitForDataListener);
  }
}

/**
  Names of possible iterator states.
  The state's position in the array corresponds to its ID.
  @name AsyncIterator.STATES
  @type String[]
  @protected
*/
AsyncIterator.STATES = STATES;
for (const id in STATES)
  AsyncIterator[STATES[id]] = id;

/**
  ID of the INIT state.
  An iterator is initializing if it is preparing main item generation.
  It can already produce items.
  @name AsyncIterator.INIT
  @type integer
  @protected
*/

/**
  ID of the OPEN state.
  An iterator is open if it can generate new items.
  @name AsyncIterator.OPEN
  @type integer
  @protected
*/

/**
  ID of the CLOSING state.
  An iterator is closing if item generation is pending but will not be scheduled again.
  @name AsyncIterator.CLOSING
  @type integer
  @protected
*/

/**
  ID of the CLOSED state.
  An iterator is closed if it no longer actively generates new items.
  Items might still be available.
  @name AsyncIterator.CLOSED
  @type integer
  @protected
*/

/**
  ID of the ENDED state.
  An iterator has ended if no further items will become available.
  The 'end' event is guaranteed to have been called when in this state.
  @name AsyncIterator.ENDED
  @type integer
  @protected
*/

/**
  ID of the DESTROYED state.
  An iterator has been destroyed after calling {@link AsyncIterator#destroy}.
  The 'end' event has not been called, as pending elements were voided.
  @name AsyncIterator.DESTROYED
  @type integer
  @protected
*/


/**
  An iterator that doesn't emit any items.
  @extends AsyncIterator
*/
export class EmptyIterator extends AsyncIterator {
  /** Creates a new `EmptyIterator`. */
  constructor() {
    super();
    this._changeState(ENDED, true);
  }
}


/**
  An iterator that emits a single item.
  @extends AsyncIterator
*/
export class SingletonIterator extends AsyncIterator {
  /**
    Creates a new `SingletonIterator`.
    @param {object} item The item that will be emitted.
  */
  constructor(item) {
    super();
    this._item = item;
    if (item === null)
      this.close();
    else
      this.readable = true;
  }

  /* Reads the item from the iterator. */
  read() {
    const item = this._item;
    this._item = null;
    this.close();
    return item;
  }

  /* Generates details for a textual representation of the iterator. */
  _toStringDetails() {
    return this._item === null ? '' : `(${ this._item })`;
  }
}


/**
  An iterator that emits the items of a given array.
  @extends AsyncIterator
*/
export class ArrayIterator extends AsyncIterator {
  /**
    Creates a new `ArrayIterator`.
    @param {Array} items The items that will be emitted.
  */
  constructor(items) {
    super();
    if (!(items && items.length > 0))
      return this.close();
    this._buffer = Array.prototype.slice.call(items);
    this.readable = true;
  }

  /* Reads an item from the iterator. */
  read() {
    const buffer = this._buffer;
    let item = null;
    if (buffer) {
      item = buffer.shift();
      if (!buffer.length) {
        delete this._buffer;
        this.close();
      }
    }
    return item;
  }

  /* Generates details for a textual representation of the iterator. */
  _toStringDetails() {
    return `(${ this._buffer && this._buffer.length || 0 })`;
  }

  /* Called by {@link AsyncIterator#destroy} */
  _destroy(error, callback) {
    delete this._buffer;
    callback();
  }
}


/**
  An iterator that enumerates integers in a certain range.
  @extends AsyncIterator
*/
export class IntegerIterator extends AsyncIterator {
  /**
    Creates a new `IntegerIterator`.
    @param {object} [options] Settings of the iterator
    @param {integer} [options.start=0] The first number to emit
    @param {integer} [options.end=Infinity] The last number to emit
    @param {integer} [options.step=1] The increment between two numbers
  */
  constructor({ start = 0, step = 1, end } = {}) {
    super();

    // Determine the first number
    if (Number.isFinite(start))
      start = Math.trunc(start);
    this._next = start;

    // Determine step size
    if (Number.isFinite(step))
      step = Math.trunc(step);
    this._step = step;

    // Determine the last number
    const ascending = step >= 0;
    const direction = ascending ? Infinity : -Infinity;
    if (Number.isFinite(end))
      end = Math.trunc(end);
    else if (end !== -direction)
      end = direction;
    this._last = end;

    // Start iteration if there is at least one item; close otherwise
    if (!Number.isFinite(start) || (ascending ? start > end : start < end))
      this.close();
    else
      this.readable = true;
  }

  /* Reads an item from the iterator. */
  read() {
    if (this.closed)
      return null;
    const current = this._next, step = this._step, last = this._last,
          next = this._next += step;
    if (step >= 0 ? next > last : next < last)
      this.close();
    return current;
  }

  /* Generates details for a textual representation of the iterator. */
  _toStringDetails() {
    return `(${ this._next }...${ this._last })`;
  }
}


/**
  A iterator that maintains an internal buffer of items.
  This class serves as a base class for other iterators
  with a typically complex item generation process.
  @extends AsyncIterator
*/
export class BufferedIterator extends AsyncIterator {
  /**
    Creates a new `BufferedIterator`.
    @param {object} [options] Settings of the iterator
    @param {integer} [options.maxBufferSize=4] The number of items to preload in the internal buffer
    @param {boolean} [options.autoStart=true] Whether buffering starts directly after construction
  */
  constructor({ maxBufferSize = 4, autoStart = true } = {}) {
    super();

    // Set up the internal buffer
    this._state = INIT;
    this._buffer = [];
    this._pushedCount = 0;
    this.maxBufferSize = maxBufferSize;

    // Acquire reading lock to read initialization items
    this._reading = true;
    queueMicrotask(() => this._init(autoStart));
  }

  /**
    The maximum number of items to preload in the internal buffer.
    A `BufferedIterator` tries to fill its buffer as far as possible.
    Set to `Infinity` to fully drain the source.
    @name BufferedIterator#maxBufferSize
    @type number
  */
  get maxBufferSize() {
    return this._maxBufferSize;
  }

  set maxBufferSize(maxBufferSize) {
    // Allow only positive integers and infinity
    if (maxBufferSize !== Infinity) {
      maxBufferSize = !Number.isFinite(maxBufferSize) ? 4 :
        Math.max(Math.trunc(maxBufferSize), 1);
    }
    // Only set the maximum buffer size if it changes
    if (this._maxBufferSize !== maxBufferSize) {
      this._maxBufferSize = maxBufferSize;
      // Ensure sufficient elements are buffered
      if (this._state === OPEN)
        this._fillBuffer();
    }
  }

  /**
    Initializing the iterator by calling {@link BufferedIterator#_begin}
    and changing state from INIT to OPEN.
    @protected
    @param {boolean} autoStart Whether reading of items should immediately start after OPEN.
  */
  _init(autoStart) {
    // Perform initialization tasks
    let doneCalled = false;
    this._reading = true;
    this._begin(() => {
      if (doneCalled)
        throw new Error('done callback called multiple times');
      doneCalled = true;
      // Open the iterator and start buffering
      this._reading = false;
      this._changeState(OPEN);
      if (autoStart)
        this._fillBufferAsync();
      // If reading should not start automatically, the iterator doesn't become readable.
      // Therefore, mark the iterator as (potentially) readable so consumers know it might be read.
      else
        this.readable = true;
    });
  }

  /**
    Writes beginning items and opens iterator resources.
    Should never be called before {@link BufferedIterator#_init};
    typically, `_init` is responsible for calling `_begin`.
    @protected
    @param {function} done To be called when initialization is complete
  */
  _begin(done) {
    done();
  }

  /**
    Tries to read the next item from the iterator.
    If the buffer is empty,
    this method calls {@link BufferedIterator#_read} to fetch items.
    @returns {object?} The next item, or `null` if none is available
  */
  read() {
    if (this.done)
      return null;

    // Try to retrieve an item from the buffer
    const buffer = this._buffer;
    let item;
    if (buffer.length !== 0) {
      item = buffer.shift();
    }
    else {
      item = null;
      this.readable = false;
    }

    // If the buffer is becoming empty, either fill it or end the iterator
    if (!this._reading && buffer.length < this._maxBufferSize) {
      // If the iterator is not closed and thus may still generate new items, fill the buffer
      if (!this.closed)
        this._fillBufferAsync();
      // No new items will be generated, so if none are buffered, the iterator ends here
      else if (!buffer.length)
        this._endAsync();
    }

    return item;
  }

  /**
    Tries to generate the given number of items.
    Implementers should add `count` items through {@link BufferedIterator#_push}.
    @protected
    @param {integer} count The number of items to generate
    @param {function} done To be called when reading is complete
  */
  _read(count, done) {
    done();
  }

  /**
    Adds an item to the internal buffer.
    @protected
    @param {object} item The item to add
    @emits AsyncIterator.readable
  */
  _push(item) {
    if (!this.done) {
      this._pushedCount++;
      this._buffer.push(item);
      this.readable = true;
    }
  }

  /**
    Fills the internal buffer until `this._maxBufferSize` items are present.
    This method calls {@link BufferedIterator#_read} to fetch items.
    @protected
    @emits AsyncIterator.readable
  */
  _fillBuffer() {
    let neededItems;
    // Avoid recursive reads
    if (this._reading) {
      // Do nothing
    }
    // If iterator closing started in the meantime, don't generate new items anymore
    else if (this.closed) {
      this._completeClose();
    }
    // Otherwise, try to fill empty spaces in the buffer by generating new items
    else if ((neededItems = Math.min(this._maxBufferSize - this._buffer.length, 128)) > 0) {
      // Acquire reading lock and start reading, counting pushed items
      this._pushedCount = 0;
      this._reading = true;
      this._read(neededItems, () => {
        // Verify the callback is only called once
        if (!neededItems)
          throw new Error('done callback called multiple times');
        neededItems = 0;
        // Release reading lock
        this._reading = false;
        // If the iterator was closed while reading, complete closing
        if (this.closed) {
          this._completeClose();
        }
        // If the iterator pushed one or more items,
        // it might currently be able to generate additional items
        // (even though all pushed items might already have been read)
        else if (this._pushedCount) {
          this.readable = true;
          // If the buffer is insufficiently full, continue filling
          if (this._buffer.length < this._maxBufferSize / 2)
            this._fillBufferAsync();
        }
      });
    }
  }

  /**
    Schedules `_fillBuffer` asynchronously.
  */
  _fillBufferAsync() {
    // Acquire reading lock to avoid recursive reads
    if (!this._reading) {
      this._reading = true;
      queueMicrotask(() => {
        // Release reading lock so _fillBuffer` can take it
        this._reading = false;
        this._fillBuffer();
      });
    }
  }

  /**
    Stops the iterator from generating new items
    after a possible pending read operation has finished.
    Already generated, pending, or terminating items can still be emitted.
    After this, the iterator will end asynchronously.
    @emits AsyncIterator.end
  */
  close() {
    // If the iterator is not currently reading, we can close immediately
    if (!this._reading)
      this._completeClose();
    // Closing cannot complete when reading, so temporarily assume CLOSING state
    // `_fillBuffer` becomes responsible for calling `_completeClose`
    else
      this._changeState(CLOSING);
  }

  /**
    Stops the iterator from generating new items,
    switching from `CLOSING` state into `CLOSED` state.
    @protected
    @emits AsyncIterator.end
  */
  _completeClose() {
    if (this._changeState(CLOSED)) {
      // Write possible terminating items
      this._reading = true;
      this._flush(() => {
        if (!this._reading)
          throw new Error('done callback called multiple times');
        this._reading = false;
        // If no items are left, end the iterator
        // Otherwise, `read` becomes responsible for ending the iterator
        if (!this._buffer.length)
          this._endAsync();
      });
    }
  }

  /* Called by {@link AsyncIterator#destroy} */
  _destroy(error, callback) {
    this._buffer = [];
    callback();
  }

  /**
    Writes terminating items and closes iterator resources.
    Should never be called before {@link BufferedIterator#close};
    typically, `close` is responsible for calling `_flush`.
    @protected
    @param {function} done To be called when termination is complete
  */
  _flush(done) {
    done();
  }

  /* Generates details for a textual representation of the iterator. */
  _toStringDetails() {
    const buffer = this._buffer, { length } = buffer;
    return `{${ length ? `next: ${ buffer[0] }, ` : '' }buffer: ${ length }}`;
  }
}


/**
  An iterator that generates items based on a source iterator.
  This class serves as a base class for other iterators.
  @extends BufferedIterator
*/
export class TransformIterator extends BufferedIterator {
  /**
    Creates a new `TransformIterator`.
    @param {AsyncIterator|Readable} [source] The source this iterator generates items from
    @param {object} [options] Settings of the iterator
    @param {integer} [options.maxBufferSize=4] The maximum number of items to keep in the buffer
    @param {boolean} [options.autoStart=true] Whether buffering starts directly after construction
    @param {boolean} [options.optional=false] If transforming is optional, the original item is pushed when its transformation yields no items
    @param {boolean} [options.destroySource=true] Whether the source should be destroyed when this transformed iterator is closed or destroyed
    @param {AsyncIterator} [options.source] The source this iterator generates items from
  */
  constructor(source, options = source || {}) {
    super(options);

    // Initialize source and settings
    if (!source || !isFunction(source.read))
      source = options.source;
    if (source)
      this.source = source;
    this._optional = Boolean(options.optional);
    this._destroySource = options.destroySource !== false;
  }

  /**
    The source this iterator generates items from.
    @name TransformIterator#source
    @type AsyncIterator
  */
  get source() {
    return this._source;
  }

  set source(source) {
    // Validate and set source
    this._source = this._validateSource(source);
    source._destination = this;

    // Close this iterator if the source has already ended
    if (source.ended) {
      this.close();
    }
    // Otherwise, react to source events
    else {
      source.on('end', destinationCloseWhenDone);
      source.on('readable', destinationFillBuffer);
      source.on('error', destinationEmitError);
    }
  }

  /**
    Validates whether the given iterator can be used as a source.
    @protected
    @param {object} source The source to validate
    @param {boolean} allowDestination Whether the source can already have a destination
  */
  _validateSource(source, allowDestination) {
    if (this._source)
      throw new Error('The source cannot be changed after it has been set');
    if (!source || !isFunction(source.read) || !isFunction(source.on))
      throw new Error(`Invalid source: ${ source}`);
    if (!allowDestination && source._destination)
      throw new Error('The source already has a destination');
    return source;
  }

  /**
    Tries to read a transformed item.
  */
  _read(count, done) {
    const next = () => {
      // Continue transforming until at least `count` items have been pushed
      if (this._pushedCount < count && !this.closed)
        queueMicrotask(() => this._readAndTransform(next, done));
      else
        done();
    };
    this._readAndTransform(next, done);
  }

  /**
    Reads a transforms an item
  */
  _readAndTransform(next, done) {
    // If the source exists and still can read items,
    // try to read and transform the next item.
    const source = this._source;
    let item;
    if (source && !source.ended && (item = source.read()) !== null) {
      if (!this._optional)
        this._transform(item, next);
      else
        this._optionalTransform(item, next);
    }
    else { done(); }
  }

  /**
    Tries to transform the item;
    if the transformation yields no items, pushes the original item.
  */
  _optionalTransform(item, done) {
    const pushedCount = this._pushedCount;
    this._transform(item, () => {
      if (pushedCount === this._pushedCount)
        this._push(item);
      done();
    });
  }

  /**
    Generates items based on the item from the source.
    Implementers should add items through {@link BufferedIterator#_push}.
    The default implementation pushes the source item as-is.
    @protected
    @param {object} item The last read item from the source
    @param {function} done To be called when reading is complete
  */
  _transform(item, done) {
    this._push(item);
    done();
  }

  /**
    Closes the iterator when pending items are transformed.
    @protected
  */
  _closeWhenDone() {
    this.close();
  }

  /* Cleans up the source iterator and ends. */
  _end(destroy) {
    const source = this._source;
    if (source) {
      source.removeListener('end', destinationCloseWhenDone);
      source.removeListener('error', destinationEmitError);
      source.removeListener('readable', destinationFillBuffer);
      delete source._destination;
      if (this._destroySource)
        source.destroy();
    }
    super._end(destroy);
  }
}

function destinationEmitError(error) {
  this._destination.emit('error', error);
}
function destinationCloseWhenDone() {
  this._destination._closeWhenDone();
}
function destinationFillBuffer() {
  this._destination._fillBuffer();
}


/**
  An iterator that generates items based on a source iterator
  and simple transformation steps passed as arguments.
  @extends TransformIterator
*/
export class SimpleTransformIterator extends TransformIterator {
  /**
    Creates a new `SimpleTransformIterator`.
    @param {AsyncIterator|Readable} [source] The source this iterator generates items from
    @param {object|Function} [options] Settings of the iterator, or the transformation function
    @param {integer} [options.maxbufferSize=4] The maximum number of items to keep in the buffer
    @param {boolean} [options.autoStart=true] Whether buffering starts directly after construction
    @param {AsyncIterator} [options.source] The source this iterator generates items from
    @param {integer} [options.offset] The number of items to skip
    @param {integer} [options.limit] The maximum number of items
    @param {Function} [options.filter] A function to synchronously filter items from the source
    @param {Function} [options.map] A function to synchronously transform items from the source
    @param {Function} [options.transform] A function to asynchronously transform items from the source
    @param {boolean} [options.optional=false] If transforming is optional, the original item is pushed when its mapping yields `null` or its transformation yields no items
    @param {Array|AsyncIterator} [options.prepend] Items to insert before the source items
    @param {Array|AsyncIterator} [options.append]  Items to insert after the source items
  */
  constructor(source, options) {
    super(source, options);

    // Set transformation steps from the options
    options = options || !isFunction(source && source.read) && source;
    if (options) {
      const transform = isFunction(options) ? options : options.transform;
      const { limit, offset, filter, map, prepend, append } = options;
      // Don't emit any items when bounds are unreachable
      if (offset === Infinity || limit === -Infinity) {
        this._limit = 0;
      }
      else {
        if (Number.isFinite(offset))
          this._offset = Math.max(Math.trunc(offset), 0);
        if (Number.isFinite(limit))
          this._limit = Math.max(Math.trunc(limit), 0);
        if (isFunction(filter))
          this._filter = filter;
        if (isFunction(map))
          this._map = map;
        if (isFunction(transform))
          this._transform = transform;
      }
      if (prepend)
        this._prepender = prepend.on ? prepend : new ArrayIterator(prepend);
      if (append)
        this._appender = append.on ? append : new ArrayIterator(append);
    }
  }

  /* Tries to read and transform items */
  _read(count, done) {
    const next = () => this._readAndTransformSimple(count, nextAsync, done);
    function nextAsync() {
      queueMicrotask(next);
    }
    this._readAndTransformSimple(count, nextAsync, done);
  }

  /* Reads and transform items */
  _readAndTransformSimple(count, next, done) {
    // Verify we have a readable source
    const source = this._source;
    let item;
    if (!source || source.ended) {
      done();
      return;
    }
    // Verify we are still below the limit
    if (this._limit === 0)
      this.close();

    // Try to read the next item until at least `count` items have been pushed
    while (!this.closed && this._pushedCount < count && (item = source.read()) !== null) {
      // Verify the item passes the filter and we've reached the offset
      if (!this._filter(item) || this._offset !== 0 && this._offset--)
        continue;

      // Synchronously map the item
      const mappedItem = this._map === null ? item : this._map(item);
      // Skip `null` items, pushing the original item if the mapping was optional
      if (mappedItem === null) {
        if (this._optional)
          this._push(item);
      }
      // Skip the asynchronous phase if no transformation was specified
      else if (this._transform === null) {
        this._push(mappedItem);
      }
      // Asynchronously transform the item, and wait for `next` to call back
      else {
        if (!this._optional)
          this._transform(mappedItem, next);
        else
          this._optionalTransform(mappedItem, next);
        return;
      }

      // Stop when we've reached the limit
      if (--this._limit === 0)
        this.close();
    }
    done();
  }

  // Prepends items to the iterator
  _begin(done) {
    this._insert(this._prepender, done);
    delete this._prepender;
  }

  // Appends items to the iterator
  _flush(done) {
    this._insert(this._appender, done);
    delete this._appender;
  }

  // Inserts items in the iterator
  _insert(inserter, done) {
    const push = item => this._push(item);
    if (!inserter || inserter.ended) {
      done();
    }
    else {
      inserter.on('data', push);
      inserter.on('end', end);
    }
    function end() {
      inserter.removeListener('data', push);
      inserter.removeListener('end', end);
      done();
    }
  }
}

// Default settings
Object.assign(SimpleTransformIterator.prototype, {
  _offset: 0,
  _limit: Infinity,
  _map: null,
  _transform: null,
  _filter: () => true,
});


/**
  An iterator that generates items by transforming each item of a source
  with a different iterator.
  @extends TransformIterator
*/
export class MultiTransformIterator extends TransformIterator {
  /**
    Creates a new `MultiTransformIterator`.
    @param {AsyncIterator|Readable} [source] The source this iterator generates items from
    @param {object} [options] Settings of the iterator
  */
  constructor(source, options) {
    super(source, options);
    this._transformerQueue = [];
  }

  /* Tries to read and transform items */
  _read(count, done) {
    // Remove transformers that have ended
    const transformerQueue = this._transformerQueue,
          source = this._source, optional = this._optional;
    let item, head, transformer;
    while ((head = transformerQueue[0]) && head.transformer.ended) {
      // If transforming is optional, push the original item if none was pushed
      if (optional && head.item !== null) {
        count--;
        this._push(head.item);
      }
      // Remove listeners from the transformer
      head = transformerQueue.shift();
      transformer = head.transformer;
      transformer.removeListener('end', destinationFillBuffer);
      transformer.removeListener('readable', destinationFillBuffer);
      transformer.removeListener('error', destinationEmitError);
    }

    // Create new transformers if there are less than the maximum buffer size
    while (source && !source.ended && transformerQueue.length < this._maxBufferSize) {
      // Read an item to create the next transformer
      item = this._source.read();
      if (item === null)
        break;
      // Create the transformer and listen to its events
      transformer = this._createTransformer(item) || new EmptyIterator();
      transformer._destination = this;
      transformer.on('end', destinationFillBuffer);
      transformer.on('readable', destinationFillBuffer);
      transformer.on('error', destinationEmitError);
      transformerQueue.push({ transformer, item });
    }

    // Try to read `count` items from the transformer
    head = transformerQueue[0];
    if (head) {
      transformer = head.transformer;
      while (count-- > 0 && (item = transformer.read()) !== null) {
        this._push(item);
        // If a transformed item was pushed, no need to push the original anymore
        if (optional)
          head.item = null;
      }
    }
    // End the iterator if the source has ended
    else if (source && source.ended) {
      this.close();
    }
    done();
  }

  /**
    Creates a transformer for the given item.
    @param {object} item The last read item from the source
    @returns {AsyncIterator} An iterator that transforms the given item
  */
  _createTransformer(item) {
    return new SingletonIterator(item);
  }

  /* Closes the iterator when pending items are transformed. */
  _closeWhenDone() {
    // Only close if all transformers are read
    if (!this._transformerQueue.length)
      this.close();
  }
}


/**
  An iterator that copies items from another iterator.
  @extends TransformIterator
*/
export class ClonedIterator extends TransformIterator {
  /**
    Creates a new `ClonedIterator`.
    @param {AsyncIterator|Readable} [source] The source this iterator copies items from
  */
  constructor(source) {
    super(source, { autoStart: false });
    this._reading = false;
    this._readPosition = 0;
  }

  _init() {
    // skip buffered iterator initialization, since we read from history
  }

  close() {
    // skip buffered iterator cleanup
    AsyncIterator.prototype.close.call(this);
  }

  // The source this iterator copies items from
  get source() {
    return this._source;
  }

  set source(source) {
    // Validate and set the source
    let history = source && source._destination;
    this._validateSource(source, !history || history instanceof HistoryReader);
    this._source = source;
    // Create a history reader for the source if none already existed
    if (!history)
      history = source._destination = new HistoryReader(source);

    // Close this clone if history is empty and the source has ended
    if (history.endsAt(0)) {
      this.close();
    }
    else {
      // Subscribe to history events
      history.register(this);
      // If there are already items in history, this clone is readable
      if (history.readAt(0) !== null)
        this.readable = true;
    }

    // Hook pending property callbacks to the source
    const propertyCallbacks = this._propertyCallbacks;
    for (const propertyName in propertyCallbacks) {
      const callbacks = propertyCallbacks[propertyName];
      for (const callback of callbacks)
        this._getSourceProperty(source, propertyName, callback);
    }
  }

  // Retrieves the property with the given name from the clone or its source.
  getProperty(propertyName, callback) {
    const properties = this._properties, source = this._source,
          hasProperty = properties && (propertyName in properties);
    // If no callback was passed, return the property value
    if (!callback)
      return hasProperty ? properties[propertyName] : source && source.getProperty(propertyName);
    // Try to look up the property in this clone
    super.getProperty(propertyName, callback);
    // If the property is not set on this clone, it might become set on the source first
    if (source && !hasProperty)
      this._getSourceProperty(source, propertyName, callback);
    return undefined;
  }

  // Retrieves the property with the given name from the source
  _getSourceProperty(source, propertyName, callback) {
    source.getProperty(propertyName, value => {
      // Only send the source's property if it was not set on the clone in the meantime
      if (!this._properties || !(propertyName in this._properties))
        callback(value);
    });
  }

  // Retrieves all properties of the iterator and its source.
  getProperties() {
    const base = this._source ? this._source.getProperties() : {}, properties = this._properties;
    for (const name in properties)
      base[name] = properties[name];
    return base;
  }

  /* Generates details for a textual representation of the iterator. */
  _toStringDetails() {
    const source = this._source;
    return `{source: ${ source ? source.toString() : 'none' }}`;
  }

  /* Tries to read an item */
  read() {
    const source = this._source;
    let item = null;
    if (!this.done && source) {
      // Try to read an item at the current point in history
      const history = source._destination;
      if ((item = history.readAt(this._readPosition)) !== null)
        this._readPosition++;
      else
        this.readable = false;
      // Close the iterator if we are at the end of the source
      if (history.endsAt(this._readPosition))
        this.close();
    }
    return item;
  }

  /* End the iterator and cleans up. */
  _end(destroy) {
    // Unregister from a possible history reader
    const history = this._source && this._source._destination;
    if (history)
      history.unregister(this);

    // Don't call TransformIterator#_end,
    // as it would make the source inaccessible for other clones
    BufferedIterator.prototype._end.call(this, destroy);
  }
}


// Stores the history of a source, so it can be cloned
class HistoryReader {
  constructor(source) {
    this._source = source;
    this._clones = null;
    this._history = [];

    // If the source can still emit items, set up cloning
    if (!source.ended) {
      // When the source becomes readable, makes all clones readable
      const setReadable = () => {
        for (const clone of this._clones)
          clone.readable = true;
      };

      // When the source errors, re-emits the error
      const emitError = error => {
        for (const clone of this._clones)
          clone.emit('error', error);
      };

      // When the source ends, closes all clones that are fully read
      const end = () => {
        // Close the clone if all items had been emitted
        for (const clone of this._clones) {
          if (clone._readPosition === this._history.length)
            clone.close();
        }
        this._clones = null;

        // Remove source listeners, since no further events will be emitted
        source.removeListener('end', end);
        source.removeListener('error', emitError);
        source.removeListener('readable', setReadable);
      };

      // Listen to source events to trigger events in subscribed clones
      this._clones = [];
      source.on('end', end);
      source.on('error', emitError);
      source.on('readable', setReadable);
    }
  }

  // Registers a clone for history updates
  register(clone) {
    if (this._clones !== null)
      this._clones.push(clone);
  }

  // Unregisters a clone for history updates
  unregister(clone) {
    if (this._clones !== null)
      this._clones = this._clones.filter(c => c !== clone);
  }

  // Tries to read the item at the given history position
  readAt(pos) {
    let item = null;
    // Retrieve an item from history when available
    if (pos < this._history.length)
      item = this._history[pos];
    // Read a new item from the source when possible
    else if (!this._source.ended && (item = this._source.read()) !== null)
      this._history[pos] = item;
    return item;
  }

  // Determines whether the given position is the end of the source
  endsAt(pos) {
    return this._source.ended && this._history.length === pos;
  }
}

/** Creates an empty iterator */
export function empty() {
  return new EmptyIterator();
}

/** Creates an iterator with a single item */
export function single(item) {
  return new SingletonIterator(item);
}

/** Creates an iterator for the given array */
export function fromArray(array) {
  return new ArrayIterator(array);
}

// Determines whether the given object is a function
function isFunction(object) {
  return typeof object === 'function';
}
