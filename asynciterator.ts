/**
 * An asynchronous iterator library for advanced object pipelines
 * @module asynciterator
 */

import { EventEmitter } from 'events';
import createTaskScheduler from './taskscheduler';
import type { Task, TaskScheduler } from './taskscheduler';

let taskScheduler: TaskScheduler = createTaskScheduler();

/** Schedules the given task for asynchronous execution. */
export function scheduleTask(task: Task): void {
  taskScheduler(task);
}

/** Returns the asynchronous task scheduler. */
export function getTaskScheduler(): TaskScheduler {
  return taskScheduler;
}

/** Sets the asynchronous task scheduler. */
export function setTaskScheduler(scheduler: TaskScheduler): void {
  taskScheduler = scheduler;
}

/**
  ID of the INIT state.
  An iterator is initializing if it is preparing main item generation.
  It can already produce items.
  @type integer
*/
export const INIT = 1 << 0;

/**
  ID of the OPEN state.
  An iterator is open if it can generate new items.
  @type integer
*/
export const OPEN = 1 << 1;

/**
  ID of the CLOSING state.
  An iterator is closing if item generation is pending but will not be scheduled again.
  @type integer
*/
export const CLOSING = 1 << 2;

/**
  ID of the CLOSED state.
  An iterator is closed if it no longer actively generates new items.
  Items might still be available.
  @type integer
*/
export const CLOSED = 1 << 3;

/**
  ID of the ENDED state.
  An iterator has ended if no further items will become available.
  The 'end' event is guaranteed to have been called when in this state.
  @type integer
*/
export const ENDED = 1 << 4;

/**
  ID of the DESTROYED state.
  An iterator has been destroyed
  after calling {@link module:asynciterator.AsyncIterator#destroy}.
  The 'end' event has not been called, as pending elements were voided.
  @type integer
*/
export const DESTROYED = 1 << 5;


/**
  An asynchronous iterator provides pull-based access to a stream of objects.
  @extends module:asynciterator.EventEmitter
*/
export class AsyncIterator<T> extends EventEmitter {
  protected _state: number;
  private _readable = false;
  protected _properties?: { [name: string]: any };
  protected _propertyCallbacks?: { [name: string]: [(value: any) => void] };

  /** Creates a new `AsyncIterator`. */
  constructor(initialState = OPEN) {
    super();
    this._state = initialState;
    this.on('newListener', waitForDataListener);
  }

  /**
    Changes the iterator to the given state if possible and necessary,
    possibly emitting events to signal that change.
    @protected
    @param {integer} newState The ID of the new state
    @param {boolean} [eventAsync=false] Whether resulting events should be emitted asynchronously
    @returns {boolean} Whether the state was changed
    @emits module:asynciterator.AsyncIterator.end
  */
  protected _changeState(newState: number, eventAsync = false) {
    // Validate the state change
    const valid = newState > this._state && this._state < ENDED;
    if (valid) {
      this._state = newState;
      // Emit the `end` event when changing to ENDED
      if (newState === ENDED) {
        if (!eventAsync)
          this.emit('end');
        else
          taskScheduler(() => this.emit('end'));
      }
    }
    return valid;
  }

  /**
    Tries to read the next item from the iterator.
    This is the main method for reading the iterator in _on-demand mode_,
    where new items are only created when needed by consumers.
    If no items are currently available, this methods returns `null`.
    The {@link module:asynciterator.event:readable} event
    will then signal when new items might be ready.
    To read all items from the iterator,
    switch to _flow mode_ by subscribing
    to the {@link module:asynciterator.event:data} event.
    When in flow mode, do not use the `read` method.
    @returns {object?} The next item, or `null` if none is available
  */
  read(): T | null {
    return null;
  }

  /**
    The iterator emits a `readable` event when it might have new items available
    after having had no items available right before this event.
    If the iterator is not in flow mode, items can be retrieved
    by calling {@link module:asynciterator.AsyncIterator#read}.
    @event module:asynciterator.readable
  */

  /**
    The iterator emits a `data` event with a new item as soon as it becomes available.
    When one or more listeners are attached to the `data` event,
    the iterator switches to _flow mode_,
    generating and emitting new items as fast as possible.
    This drains the source and might create backpressure on the consumers,
    so only subscribe to this event if this behavior is intended.
    In flow mode, don't use {@link module:asynciterator.AsyncIterator#read}.
    To switch back to _on-demand mode_, remove all listeners from the `data` event.
    You can then obtain items through `read` again.
    @event module:asynciterator.data
    @param {object} item The new item
  */

  /**
    Invokes the callback for each remaining item in the iterator.
    Switches the iterator to flow mode.
    @param {Function} callback A function that will be called with each item
    @param {object?} self The `this` pointer for the callback
  */
  forEach(callback: (item: T) => void, self?: object) {
    this.on('data', self ? callback.bind(self) : callback);
  }

  /**
    Stops the iterator from generating new items.
    Already generated items or terminating items can still be emitted.
    After this, the iterator will end asynchronously.
    @emits module:asynciterator.AsyncIterator.end
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
    but instead implement {@link module:asynciterator.AsyncIterator#_destroy}.
    @param {Error} [cause] An optional error to emit.
    @emits module:asynciterator.AsyncIterator.end
    @emits module:asynciterator.AsyncIterator.error Only if an error is passed.
  */
  destroy(cause?: Error) {
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
    Called by {@link module:asynciterator.AsyncIterator#destroy}.
    Implementers can override this, but this should not be called directly.
    @param {?Error} cause The reason why the iterator is destroyed.
    @param {Function} callback A callback function with an optional error argument.
  */
  protected _destroy(cause: Error | undefined, callback: (error?: Error) => void) {
    callback();
  }

  /**
    Ends the iterator and cleans up.
    Should never be called before {@link module:asynciterator.AsyncIterator#close};
    typically, `close` is responsible for calling `_end`.
    @param {boolean} [destroy] If the iterator should be forcefully destroyed.
    @protected
    @emits module:asynciterator.AsyncIterator.end
  */
  protected _end(destroy = false) {
    if (this._changeState(destroy ? DESTROYED : ENDED)) {
      this._readable = false;
      this.removeAllListeners('readable');
      this.removeAllListeners('data');
      this.removeAllListeners('end');
    }
  }

  /**
    Asynchronously calls `_end`.
    @protected
  */
  protected _endAsync() {
    taskScheduler(() => this._end());
  }

  /**
    The `end` event is emitted after the last item of the iterator has been read.
    @event module:asynciterator.end
  */

  /**
    Gets or sets whether this iterator might have items available for read.
    A value of `false` means there are _definitely_ no items available;
    a value of `true` means items _might_ be available.
    @type boolean
    @emits module:asynciterator.AsyncIterator.readable
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
        taskScheduler(() => this.emit('readable'));
    }
  }

  /**
    Gets whether the iterator has stopped generating new items.
    @type boolean
    @readonly
  */
  get closed() {
    return this._state >= CLOSING;
  }

  /**
    Gets whether the iterator has finished emitting items.
    @type boolean
    @readonly
  */
  get ended() {
    return this._state === ENDED;
  }

  /**
    Gets whether the iterator has been destroyed.
    @type boolean
    @readonly
  */
  get destroyed() {
    return this._state === DESTROYED;
  }

  /**
    Gets whether the iterator will not emit anymore items,
    either due to being closed or due to being destroyed.
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
  protected _toStringDetails() {
    return '';
  }

  /**
    Consume all remaining items of the iterator into an array that will be returned asynchronously.
    @param {object} [options] Settings for array creation
    @param {integer} [options.limit] The maximum number of items to place in the array.
   */
  toArray(options?: { limit?: number }): Promise<T[]> {
    const items: T[] = [];
    const limit = typeof options?.limit === 'number' ? options.limit : Infinity;

    return limit <= 0 ? Promise.resolve(items) : new Promise<T[]>((resolve, reject) => {
      // Collect and return all items up to the limit
      const resolveItems = () => resolve(items);
      const pushItem = (item: T) => {
        items.push(item);
        if (items.length >= limit) {
          this.removeListener('error', reject);
          this.removeListener('data', pushItem);
          this.removeListener('end', resolveItems);
          resolve(items);
        }
      };

      // Start item collection
      this.on('error', reject);
      this.on('data', pushItem);
      this.on('end', resolveItems);
    });
  }

  /**
    Retrieves the property with the given name from the iterator.
    If no callback is passed, it returns the value of the property
    or `undefined` if the property is not set.
    If a callback is passed, it returns `undefined`
    and calls the callback with the property the moment it is set.
    @param {string} propertyName The name of the property to retrieve
    @param {Function?} [callback] A one-argument callback to receive the property value
    @returns {object?} The value of the property (if set and no callback is given)
  */
  getProperty<P>(propertyName: string, callback?: (value: P) => void): P | undefined {
    const properties = this._properties;
    // If no callback was passed, return the property value
    if (!callback)
      return properties && properties[propertyName];
    // If the value has been set, send it through the callback
    if (properties && (propertyName in properties)) {
      taskScheduler(() => callback(properties[propertyName]));
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
  setProperty<P>(propertyName: string, value: P) {
    const properties = this._properties || (this._properties = Object.create(null));
    properties[propertyName] = value;
    // Execute getter callbacks that were waiting for this property to be set
    const propertyCallbacks = this._propertyCallbacks || {};
    const callbacks = propertyCallbacks[propertyName];
    if (callbacks) {
      delete propertyCallbacks[propertyName];
      taskScheduler(() => {
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
    const properties = this._properties;
    const copy : { [name: string] : any } = {};
    for (const name in properties)
      copy[name] = properties[name];
    return copy;
  }

  /**
    Sets all of the given properties.
    @param {object} properties Key/value pairs of properties to set
  */
  setProperties(properties: { [name: string] : any }) {
    for (const propertyName in properties)
      this.setProperty(propertyName, properties[propertyName]);
  }

  /**
    Copies the given properties from the source iterator.
    @param {module:asynciterator.AsyncIterator} source The iterator to copy from
    @param {Array} propertyNames List of property names to copy
  */
  copyProperties(source: AsyncIterator<any>, propertyNames: string[]) {
    for (const propertyName of propertyNames) {
      source.getProperty(propertyName, value =>
        this.setProperty(propertyName, value));
    }
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
    @param {Array|module:asynciterator.AsyncIterator} [options.prepend] Items to insert before the source items
    @param {Array|module:asynciterator.AsyncIterator} [options.append]  Items to insert after the source items
    @returns {module:asynciterator.AsyncIterator} A new iterator that maps the items from this iterator
  */
  transform<D>(options: TransformOptions<T, D>) : AsyncIterator<D> {
    return new SimpleTransformIterator<T, D>(this, options);
  }

  /**
    Maps items from this iterator using the given function.
    After this operation, only read the returned iterator instead of the current one.
    @param {Function} map A mapping function to call on this iterator's (remaining) items
    @param {object?} self The `this` pointer for the mapping function
    @returns {module:asynciterator.AsyncIterator} A new iterator that maps the items from this iterator
  */
  map<D>(map: (item: T) => D, self?: any): AsyncIterator<D> {
    return this.transform({ map: self ? map.bind(self) : map });
  }

  /**
    Return items from this iterator that match the filter.
    After this operation, only read the returned iterator instead of the current one.
    @param {Function} filter A filter function to call on this iterator's (remaining) items
    @param {object?} self The `this` pointer for the filter function
    @returns {module:asynciterator.AsyncIterator} A new iterator that filters items from this iterator
  */
  filter<K extends T>(filter: (item: T) => item is K, self?: any): AsyncIterator<K>;
  filter(filter: (item: T) => boolean, self?: any): AsyncIterator<T>;
  filter(filter: (item: T) => boolean, self?: any): AsyncIterator<T> {
    return this.transform({ filter: self ? filter.bind(self) : filter });
  }

  /**
    Prepends the items after those of the current iterator.
    After this operation, only read the returned iterator instead of the current one.
    @param {Array|module:asynciterator.AsyncIterator} items Items to insert before this iterator's (remaining) items
    @returns {module:asynciterator.AsyncIterator} A new iterator that prepends items to this iterator
  */
  prepend(items: T[] | AsyncIterator<T>): AsyncIterator<T> {
    return this.transform({ prepend: items });
  }

  /**
    Appends the items after those of the current iterator.
    After this operation, only read the returned iterator instead of the current one.
    @param {Array|module:asynciterator.AsyncIterator} items Items to insert after this iterator's (remaining) items
    @returns {module:asynciterator.AsyncIterator} A new iterator that appends items to this iterator
  */
  append(items: T[] | AsyncIterator<T>): AsyncIterator<T> {
    return this.transform({ append: items });
  }

  /**
    Surrounds items of the current iterator with the given items.
    After this operation, only read the returned iterator instead of the current one.
    @param {Array|module:asynciterator.AsyncIterator} prepend Items to insert before this iterator's (remaining) items
    @param {Array|module:asynciterator.AsyncIterator} append Items to insert after this iterator's (remaining) items
    @returns {module:asynciterator.AsyncIterator} A new iterator that appends and prepends items to this iterator
  */
  surround(prepend: AsyncIteratorOrArray<T>, append: AsyncIteratorOrArray<T>): AsyncIterator<T> {
    return this.transform({ prepend, append });
  }

  /**
    Skips the given number of items from the current iterator.
    The current iterator may not be read anymore until the returned iterator ends.
    @param {integer} offset The number of items to skip
    @returns {module:asynciterator.AsyncIterator} A new iterator that skips the given number of items
  */
  skip(offset: number): AsyncIterator<T> {
    return this.transform({ offset });
  }

  /**
    Limits the current iterator to the given number of items.
    The current iterator may not be read anymore until the returned iterator ends.
    @param {integer} limit The maximum number of items
    @returns {module:asynciterator.AsyncIterator} A new iterator with at most the given number of items
  */
  take(limit: number): AsyncIterator<T> {
    return this.transform({ limit });
  }

  /**
    Limits the current iterator to the given range.
    The current iterator may not be read anymore until the returned iterator ends.
    @param {integer} start Index of the first item to return
    @param {integer} end Index of the last item to return
    @returns {module:asynciterator.AsyncIterator} A new iterator with items in the given range
  */
  range(start: number, end: number): AsyncIterator<T> {
    return this.transform({ offset: start, limit: Math.max(end - start + 1, 0) });
  }

  /**
    Creates a copy of the current iterator,
    containing all items emitted from this point onward.
    Further copies can be created; they will all start from this same point.
    After this operation, only read the returned copies instead of the original iterator.
    @returns {module:asynciterator.AsyncIterator} A new iterator that contains all future items of this iterator
  */
  clone(): ClonedIterator<T> {
    return new ClonedIterator<T>(this);
  }
}

// Starts emitting `data` events when `data` listeners are added
function waitForDataListener(this: AsyncIterator<any>, eventName: string) {
  if (eventName === 'data') {
    this.removeListener('newListener', waitForDataListener);
    addSingleListener(this, 'readable', emitData);
    if (this.readable)
      taskScheduler(() => emitData.call(this));
  }
}
// Emits new items though `data` events as long as there are `data` listeners
function emitData(this: AsyncIterator<any>) {
  // While there are `data` listeners and items, emit them
  let item;
  while (this.listenerCount('data') !== 0 && (item = this.read()) !== null)
    this.emit('data', item);
  // Stop draining the source if there are no more `data` listeners
  if (this.listenerCount('data') === 0 && !this.done) {
    this.removeListener('readable', emitData);
    addSingleListener(this, 'newListener', waitForDataListener);
  }
}

// Adds the listener to the event, if it has not been added previously.
function addSingleListener(source: EventEmitter, eventName: string,
                           listener: (...args: any[]) => void) {
  if (!source.listeners(eventName).includes(listener))
    source.on(eventName, listener);
}


/**
  An iterator that doesn't emit any items.
  @extends module:asynciterator.AsyncIterator
*/
export class EmptyIterator<T> extends AsyncIterator<T> {
  /** Creates a new `EmptyIterator`. */
  constructor() {
    super();
    this._changeState(ENDED, true);
  }
}


/**
  An iterator that emits a single item.
  @extends module:asynciterator.AsyncIterator
*/
export class SingletonIterator<T> extends AsyncIterator<T> {
  private _item: T | null;

  /**
    Creates a new `SingletonIterator`.
    @param {object} item The item that will be emitted.
  */
  constructor(item: T) {
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
  protected _toStringDetails() {
    return this._item === null ? '' : `(${this._item})`;
  }
}


/**
  An iterator that emits the items of a given array.
  @extends module:asynciterator.AsyncIterator
*/
export class ArrayIterator<T> extends AsyncIterator<T> {
  private _buffer?: T[];
  protected _currentIndex: number;
  protected _sourceStarted: boolean;

  /**
    Creates a new `ArrayIterator`.
    @param {Array} items The items that will be emitted.
  */
  constructor(items?: Iterable<T>, { autoStart = true } = {}) {
    super();
    const buffer = items ? [...items] : [];
    this._sourceStarted = autoStart !== false;
    this._currentIndex = 0;
    if (this._sourceStarted && buffer.length === 0)
      this.close();
    else
      this._buffer = buffer;
    this.readable = true;
  }

  /* Reads an item from the iterator. */
  read() {
    if (!this._sourceStarted)
      this._sourceStarted = true;

    let item = null;
    let { _currentIndex, _buffer } = this;
    if (_buffer) {
      if (_currentIndex < _buffer.length) {
        item = _buffer[_currentIndex];
        _currentIndex += 1;
      }
      if (_currentIndex === _buffer.length) {
        delete this._buffer;
        this.close();
      }
      this._currentIndex = _currentIndex;
    }
    return item;
  }

  /* Generates details for a textual representation of the iterator. */
  protected _toStringDetails() {
    return `(${this._buffer ? this._buffer.length - this._currentIndex : 0})`;
  }

  /* Called by {@link module:asynciterator.AsyncIterator#destroy} */
  protected _destroy(cause: Error | undefined, callback: (error?: Error) => void) {
    delete this._buffer;
    callback();
  }
}


/**
  An iterator that enumerates integers in a certain range.
  @extends module:asynciterator.AsyncIterator
*/
export class IntegerIterator extends AsyncIterator<number> {
  private _next: number;
  private _step: number;
  private _last: number;

  /**
    Creates a new `IntegerIterator`.
    @param {object} [options] Settings of the iterator
    @param {integer} [options.start=0] The first number to emit
    @param {integer} [options.end=Infinity] The last number to emit
    @param {integer} [options.step=1] The increment between two numbers
  */
  constructor({ start = 0, step = 1, end } :
      { start?: number, step?: number, end?: number } = {}) {
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
    if (Number.isFinite(end as number))
      end = Math.trunc(end as number);
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
  protected _toStringDetails() {
    return `(${this._next}...${this._last})`;
  }
}


/**
  A iterator that maintains an internal buffer of items.
  This class serves as a base class for other iterators
  with a typically complex item generation process.
  @extends module:asynciterator.AsyncIterator
*/
export class BufferedIterator<T> extends AsyncIterator<T> {
  private _buffer: T[] = [];
  private _maxBufferSize = 4;
  protected _reading = true;
  protected _pushedCount = 0;
  protected _sourceStarted: boolean;

  /**
    Creates a new `BufferedIterator`.
    @param {object} [options] Settings of the iterator
    @param {integer} [options.maxBufferSize=4] The number of items to preload in the internal buffer
    @param {boolean} [options.autoStart=true] Whether buffering starts directly after construction
  */
  constructor({ maxBufferSize = 4, autoStart = true } = {}) {
    super(INIT);
    this.maxBufferSize = maxBufferSize;
    taskScheduler(() => this._init(autoStart));
    this._sourceStarted = autoStart !== false;
  }

  /**
    The maximum number of items to preload in the internal buffer.
    A `BufferedIterator` tries to fill its buffer as far as possible.
    Set to `Infinity` to fully drain the source.
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
  protected _init(autoStart: boolean) {
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
  protected _begin(done: () => void) {
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

    // An explicit read kickstarts the source
    if (!this._sourceStarted)
      this._sourceStarted = true;

    // Try to retrieve an item from the buffer
    const buffer = this._buffer;
    let item;
    if (buffer.length !== 0) {
      item = buffer.shift() as T;
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
  protected _read(count: number, done: () => void) {
    done();
  }

  /**
    Adds an item to the internal buffer.
    @protected
    @param {object} item The item to add
    @emits module:asynciterator.AsyncIterator.readable
  */
  protected _push(item: T) {
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
    @emits module:asynciterator.AsyncIterator.readable
  */
  protected _fillBuffer() {
    let neededItems: number;
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
  protected _fillBufferAsync() {
    // Acquire reading lock to avoid recursive reads
    if (!this._reading) {
      this._reading = true;
      taskScheduler(() => {
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
    @emits module:asynciterator.AsyncIterator.end
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
    @emits module:asynciterator.AsyncIterator.end
  */
  protected _completeClose() {
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

  /* Called by {@link module:asynciterator.AsyncIterator#destroy} */
  protected _destroy(cause: Error | undefined, callback: (error?: Error) => void) {
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
  protected _flush(done: () => void) {
    done();
  }

  /**
    Generates details for a textual representation of the iterator.
    @protected
   */
  protected _toStringDetails() {
    const buffer = this._buffer, { length } = buffer;
    return `{${length ? `next: ${buffer[0]}, ` : ''}buffer: ${length}}`;
  }
}

/**
  An iterator that generates items based on a source iterator.
  This class serves as a base class for other iterators.
  @extends module:asynciterator.BufferedIterator
*/
export class TransformIterator<S, D = S> extends BufferedIterator<D> {
  protected _source?: InternalSource<S>;
  protected _createSource?: (() => AsyncIteratorOrPromise<S>) | null;
  protected _destroySource: boolean;
  protected _optional: boolean;
  protected _boundPush = (item: D) => this._push(item);

  /**
    Creates a new `TransformIterator`.
    @param {module:asynciterator.AsyncIterator|Readable} [source] The source this iterator generates items from
    @param {object} [options] Settings of the iterator
    @param {integer} [options.maxBufferSize=4] The maximum number of items to keep in the buffer
    @param {boolean} [options.autoStart=true] Whether buffering starts directly after construction
    @param {boolean} [options.optional=false] If transforming is optional, the original item is pushed when its transformation yields no items
    @param {boolean} [options.destroySource=true] Whether the source should be destroyed when this transformed iterator is closed or destroyed
    @param {module:asynciterator.AsyncIterator} [options.source] The source this iterator generates items from
  */
  constructor(source?: SourceExpression<S>,
              options: TransformIteratorOptions<S> =
                source as TransformIteratorOptions<S> || {}) {
    super(options);

    // Shift parameters if needed
    if (!isSourceExpression(source))
      source = options.source;
    // The passed source is an AsyncIterator or readable stream
    if (isEventEmitter(source)) {
      this.source = source;
    }
    // The passed value is a promise or source creation function
    else if (source) {
      this._createSource = isPromise(source) ? () => source as any : source;
      if (this._sourceStarted)
        this._loadSourceAsync();
    }
    // Set other options
    this._optional = Boolean(options.optional);
    this._destroySource = options.destroySource !== false;
  }

  /**
    The source this iterator generates items from.
    @type module:asynciterator.AsyncIterator
  */
  get source() : AsyncIterator<S> | undefined {
    if (isFunction(this._createSource))
      this._loadSourceAsync();
    return this._source;
  }

  set source(value: AsyncIterator<S> | undefined) {
    // Validate and set source
    const source = this._source = this._validateSource(value);
    source._destination = this;

    // Close this iterator if the source has already ended
    if (source.done) {
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
    Initializes a source that was set through a promise
    @protected
  */
  protected _loadSourceAsync() {
    if (isFunction(this._createSource)) {
      // Assign the source after resolving
      Promise.resolve(this._createSource()).then(source => {
        delete this._createSource;
        this.source = source;
        this._fillBuffer();
      }, error => this.emit('error', error));
      // Signal that source creation is pending
      this._createSource = null;
    }
  }

  /**
    Validates whether the given iterator can be used as a source.
    @protected
    @param {object} source The source to validate
    @param {boolean} allowDestination Whether the source can already have a destination
  */
  protected _validateSource(source?: AsyncIterator<S>, allowDestination = false) {
    if (this._source || typeof this._createSource !== 'undefined')
      throw new Error('The source cannot be changed after it has been set');
    if (!source || !isFunction(source.read) || !isFunction(source.on))
      throw new Error(`Invalid source: ${source}`);
    if (!allowDestination && (source as any)._destination)
      throw new Error('The source already has a destination');
    return source as InternalSource<S>;
  }

  /**
    Tries to read transformed items.
  */
  protected _read(count: number, done: () => void) {
    const next = () => {
      // Continue transforming until at least `count` items have been pushed
      if (this._pushedCount < count && !this.closed)
        taskScheduler(() => this._readAndTransform(next, done));
      else
        done();
    };
    this._readAndTransform(next, done);
  }

  /**
    Reads a transforms an item
  */
  protected _readAndTransform(next: () => void, done: () => void) {
    // If the source exists and still can read items,
    // try to read and transform the next item.
    let item;
    const source = this.source as InternalSource<S>;
    if (!source || source.done || (item = source.read()) === null)
      done();
    else if (!this._optional)
      this._transform(item, next, this._boundPush);
    else
      this._optionalTransform(item, next);
  }

  /**
    Tries to transform the item;
    if the transformation yields no items, pushes the original item.
  */
  protected _optionalTransform(item: S, done: () => void) {
    const pushedCount = this._pushedCount;
    this._transform(item, () => {
      if (pushedCount === this._pushedCount)
        this._push(item as any as D);
      done();
    }, this._boundPush);
  }

  /**
    Generates items based on the item from the source.
    Implementers should add items through {@link BufferedIterator#_push}.
    The default implementation pushes the source item as-is.
    @protected
    @param {object} item The last read item from the source
    @param {function} done To be called when reading is complete
    @param {function} push A callback to push zero or more transformation results.
  */
  protected _transform(item: S, done: () => void, push: (item: D) => void) {
    push(item as any as D);
    done();
  }

  /**
    Closes the iterator when pending items are transformed.
    @protected
  */
  protected _closeWhenDone() {
    this.close();
  }

  /* Cleans up the source iterator and ends. */
  protected _end(destroy: boolean) {
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

function destinationEmitError<S>(this: InternalSource<S>, error: Error) {
  this._destination.emit('error', error);
}
function destinationCloseWhenDone<S>(this: InternalSource<S>) {
  (this._destination as any)._closeWhenDone();
}
function destinationFillBuffer<S>(this: InternalSource<S>) {
  if ((this._destination as any)._sourceStarted !== false)
    (this._destination as any)._fillBuffer();
}


/**
  An iterator that generates items based on a source iterator
  and simple transformation steps passed as arguments.
  @extends module:asynciterator.TransformIterator
*/
export class SimpleTransformIterator<S, D = S> extends TransformIterator<S, D> {
  private _offset = 0;
  private _limit = Infinity;
  private _prepender?: AsyncIterator<D>;
  private _appender?: AsyncIterator<D>;
  private _filter = (item: S) => true;
  private _map?: (item: S) => D;

  /**
    Creates a new `SimpleTransformIterator`.
    @param {module:asynciterator.AsyncIterator|Readable} [source] The source this iterator generates items from
    @param {object|Function} [options] Settings of the iterator, or the transformation function
    @param {integer} [options.maxbufferSize=4] The maximum number of items to keep in the buffer
    @param {boolean} [options.autoStart=true] Whether buffering starts directly after construction
    @param {module:asynciterator.AsyncIterator} [options.source] The source this iterator generates items from
    @param {integer} [options.offset] The number of items to skip
    @param {integer} [options.limit] The maximum number of items
    @param {Function} [options.filter] A function to synchronously filter items from the source
    @param {Function} [options.map] A function to synchronously transform items from the source
    @param {Function} [options.transform] A function to asynchronously transform items from the source
    @param {boolean} [options.optional=false] If transforming is optional, the original item is pushed when its mapping yields `null` or its transformation yields no items
    @param {Array|module:asynciterator.AsyncIterator} [options.prepend] Items to insert before the source items
    @param {Array|module:asynciterator.AsyncIterator} [options.append]  Items to insert after the source items
  */
  constructor(source?: SourceExpression<S>,
              options?: TransformOptions<S, D> |
                       TransformOptions<S, D> & ((item: S, done: () => void) => void)) {
    super(source, options as TransformIteratorOptions<S>);

    // Set transformation steps from the options
    options = options || (!isSourceExpression(source) ? source : null as any);
    if (options) {
      const transform = isFunction(options) ? options : options.transform;
      const { limit, offset, filter, map, prepend, append } = options;
      // Don't emit any items when bounds are unreachable
      if (offset === Infinity || limit === -Infinity) {
        this._limit = 0;
      }
      else {
        if (Number.isFinite(offset as number))
          this._offset = Math.max(Math.trunc(offset as number), 0);
        if (Number.isFinite(limit as number))
          this._limit = Math.max(Math.trunc(limit as number), 0);
        if (isFunction(filter))
          this._filter = filter;
        if (isFunction(map))
          this._map = map;
        this._transform = isFunction(transform) ? transform : null as any;
      }
      if (prepend)
        this._prepender = isEventEmitter(prepend) ? prepend : fromArray(prepend);
      if (append)
        this._appender = isEventEmitter(append) ? append : fromArray(append);
    }
  }

  /* Tries to read and transform items */
  protected _read(count: number, done: () => void) {
    const next = () => this._readAndTransformSimple(count, nextAsync, done);
    this._readAndTransformSimple(count, nextAsync, done);
    function nextAsync() {
      taskScheduler(next);
    }
  }

  /* Reads and transform items */
  protected _readAndTransformSimple(count: number, next: () => void, done: () => void) {
    // Verify we have a readable source
    let item;
    const { source } = this;
    if (!source || source.done) {
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
      const mappedItem = typeof this._map === 'undefined' ? item : this._map(item);
      // Skip `null` items, pushing the original item if the mapping was optional
      if (mappedItem === null) {
        if (this._optional)
          this._push(item as any as D);
      }
      // Skip the asynchronous phase if no transformation was specified
      else if (!isFunction(this._transform)) {
        this._push(mappedItem as D);
      }
      // Asynchronously transform the item, and wait for `next` to call back
      else {
        if (!this._optional)
          this._transform(mappedItem as S, next, this._boundPush);
        else
          this._optionalTransform(mappedItem as S, next);
        return;
      }

      // Stop when we've reached the limit
      if (--this._limit === 0)
        this.close();
    }
    done();
  }

  // Prepends items to the iterator
  protected _begin(done: () => void) {
    this._insert(this._prepender, done);
    delete this._prepender;
  }

  // Appends items to the iterator
  protected _flush(done: () => void) {
    this._insert(this._appender, done);
    delete this._appender;
  }

  // Inserts items in the iterator
  protected _insert(inserter: AsyncIterator<D> | undefined, done: () => void) {
    const push = (item: D) => this._push(item);
    if (!inserter || inserter.done) {
      done();
    }
    else {
      inserter.on('data', push);
      inserter.on('end', end);
    }
    function end() {
      (inserter as AsyncIterator<D>).removeListener('data', push);
      (inserter as AsyncIterator<D>).removeListener('end', end);
      done();
    }
  }
}


/**
  An iterator that generates items by transforming each item of a source
  with a different iterator.
  @extends module:asynciterator.TransformIterator
*/
export class MultiTransformIterator<S, D = S> extends TransformIterator<S, D> {
  private _transformerQueue: { item: S | null, transformer: InternalSource<D> }[] = [];

  /**
   Creates a new `MultiTransformIterator`.
   @param {module:asynciterator.AsyncIterator|Readable} [source] The source this iterator generates items from
   @param {object|Function} [options] Settings of the iterator, or the transformation function
   @param {integer} [options.maxbufferSize=4] The maximum number of items to keep in the buffer
   @param {boolean} [options.autoStart=true] Whether buffering starts directly after construction
   @param {module:asynciterator.AsyncIterator} [options.source] The source this iterator generates items from
   @param {integer} [options.offset] The number of items to skip
   @param {integer} [options.limit] The maximum number of items
   @param {Function} [options.filter] A function to synchronously filter items from the source
   @param {Function} [options.map] A function to synchronously transform items from the source
   @param {Function} [options.transform] A function to asynchronously transform items from the source
   @param {boolean} [options.optional=false] If transforming is optional, the original item is pushed when its mapping yields `null` or its transformation yields no items
   @param {Function} [options.multiTransform] A function to asynchronously transform items to iterators from the source
   @param {Array|module:asynciterator.AsyncIterator} [options.prepend] Items to insert before the source items
   @param {Array|module:asynciterator.AsyncIterator} [options.append]  Items to insert after the source items
   */
  constructor(source: AsyncIterator<S>,
              options?: MultiTransformOptions<S, D> |
                        MultiTransformOptions<S, D> & ((item: S) => AsyncIterator<D>)) {
    super(source, options as TransformIteratorOptions<S>);

    // Set transformation steps from the options
    if (options) {
      const multiTransform = isFunction(options) ? options : options.multiTransform;
      if (multiTransform)
        this._createTransformer = multiTransform;
    }
  }

  /* Tries to read and transform items */
  protected _read(count: number, done: () => void) {
    // Remove transformers that have ended
    const transformerQueue = this._transformerQueue, optional = this._optional;
    let head, item;
    while ((head = transformerQueue[0]) && head.transformer.done) {
      // If transforming is optional, push the original item if none was pushed
      if (optional && head.item !== null) {
        count--;
        this._push(head.item as any as D);
      }
      // Remove listeners from the transformer
      transformerQueue.shift();
      const { transformer } = head;
      transformer.removeListener('end', destinationFillBuffer);
      transformer.removeListener('readable', destinationFillBuffer);
      transformer.removeListener('error', destinationEmitError);
    }

    // Create new transformers if there are less than the maximum buffer size
    const { source } = this;
    while (source && !source.done && transformerQueue.length < this.maxBufferSize) {
      // Read an item to create the next transformer
      item = source.read();
      if (item === null)
        break;
      // Create the transformer and listen to its events
      const transformer = (this._createTransformer(item) ||
        new EmptyIterator()) as InternalSource<D>;
      transformer._destination = this;
      transformer.on('end', destinationFillBuffer);
      transformer.on('readable', destinationFillBuffer);
      transformer.on('error', destinationEmitError);
      transformerQueue.push({ transformer, item });
    }

    // Try to read `count` items from the transformer
    head = transformerQueue[0];
    if (head) {
      const { transformer } = head;
      while (count-- > 0 && (item = transformer.read()) !== null) {
        this._push(item);
        // If a transformed item was pushed, no need to push the original anymore
        if (optional)
          head.item = null;
      }
    }
    // End the iterator if the source has ended
    else if (source && source.done) {
      this.close();
    }
    done();
  }

  /**
    Creates a transformer for the given item.
    @param {object} item The last read item from the source
    @returns {module:asynciterator.AsyncIterator} An iterator that transforms the given item
  */
  protected _createTransformer(item: S): AsyncIterator<D> {
    return new SingletonIterator<D>(item as any as D);
  }

  /* Closes the iterator when pending items are transformed. */
  protected _closeWhenDone() {
    // Only close if all transformers are read
    if (!this._transformerQueue.length)
      this.close();
  }
}

/**
  An iterator that generates items by reading from multiple other iterators.
  @extends module:asynciterator.BufferedIterator
*/
export class UnionIterator<T> extends BufferedIterator<T> {
  private _sources : InternalSource<T>[] = [];
  private _pending? : { sources?: AsyncIterator<AsyncIterator<T>> };
  private _currentSource = -1;

  /**
    Creates a new `UnionIterator`.
    @param {module:asynciterator.AsyncIterator|Array} [sources] The sources to read from
    @param {object} [options] Settings of the iterator
  */
  constructor(sources: AsyncIteratorOrArray<AsyncIterator<T>>,
              options: BufferedIteratorOptions = {}) {
    super(options);
    const autoStart = options.autoStart !== false;

    // Sources have been passed as an iterator
    if (isEventEmitter(sources)) {
      sources.on('error', error => this.emit('error', error));
      this._pending = { sources };
      if (autoStart)
        this._loadSources();
    }
    // Sources have been passed as a non-empty array
    else if (Array.isArray(sources) && sources.length > 0) {
      for (const source of sources)
        this._addSource(source as InternalSource<T>);
    }
    // Sources are an empty list
    else if (autoStart) {
      this.close();
    }
  }

  // Loads sources passed as an iterator
  protected _loadSources() {
    // Obtain sources iterator
    const sources = this._pending!.sources!;
    delete this._pending!.sources;

    // Close immediately if done
    if (sources.done) {
      delete this._pending;
      this.close();
    }
    // Otherwise, set up source reading
    else {
      sources.on('data', source => {
        this._addSource(source as InternalSource<T>);
        this._fillBufferAsync();
      });
      sources.on('end', () => {
        delete this._pending;
        this._fillBuffer();
      });
    }
  }

  // Adds the given source to the internal sources array
  protected _addSource(source: InternalSource<T>) {
    if (!source.done) {
      this._sources.push(source);
      source._destination = this;
      source.on('error', destinationEmitError);
      source.on('readable', destinationFillBuffer);
      source.on('end', destinationRemoveEmptySources);
    }
  }

  // Removes sources that will no longer emit items
  protected _removeEmptySources() {
    this._sources = this._sources.filter((source, index) => {
      // Adjust the index of the current source if needed
      if (source.done && index <= this._currentSource)
        this._currentSource--;
      return !source.done;
    });
    this._fillBuffer();
  }

  // Reads items from the next sources
  protected _read(count: number, done: () => void): void {
    // Start source loading if needed
    if (this._pending?.sources)
      this._loadSources();

    // Try to read `count` items
    let lastCount = 0, item : T | null;
    while (lastCount !== (lastCount = count)) {
      // Try every source at least once
      for (let i = 0; i < this._sources.length && count > 0; i++) {
        // Pick the next source
        this._currentSource = (this._currentSource + 1) % this._sources.length;
        const source = this._sources[this._currentSource];
        // Attempt to read an item from that source
        if ((item = source.read()) !== null) {
          count--;
          this._push(item);
        }
      }
    }

    // Close this iterator if all of its sources have been read
    if (!this._pending && this._sources.length === 0)
      this.close();
    done();
  }
}

function destinationRemoveEmptySources<T>(this: InternalSource<T>) {
  (this._destination as any)._removeEmptySources();
}


/**
  An iterator that copies items from another iterator.
  @extends module:asynciterator.TransformIterator
*/
export class ClonedIterator<T> extends TransformIterator<T> {
  private _readPosition = 0;

  /**
    Creates a new `ClonedIterator`.
    @param {module:asynciterator.AsyncIterator|Readable} [source] The source this iterator copies items from
  */
  constructor(source: AsyncIterator<T>) {
    super(source, { autoStart: false });
    this._reading = false;
  }

  protected _init() {
    // skip buffered iterator initialization, since we read from history
  }

  close() {
    // skip buffered iterator cleanup
    AsyncIterator.prototype.close.call(this);
  }

  // The source this iterator copies items from
  get source(): AsyncIterator<T> | undefined {
    return super.source;
  }

  set source(value: AsyncIterator<T> | undefined) {
    // Validate and set the source
    const source = this._source = this._validateSource(value);
    // Create a history reader for the source if none already existed
    const history = (source && (source as any)._destination) ||
      (source._destination = new HistoryReader<T>(source) as any);

    // Close this clone if history is empty and the source has ended
    if (history.endsAt(0)) {
      this.close();
    }
    else {
      // Subscribe to history events
      history.register(this);
      // If there are already items in history, this clone is readable
      // If the source has a lazy start, always mark this iterator as readable without eagerly triggering a read.
      if ((source as any)._sourceStarted === false || history.readAt(0) !== null)
        this.readable = true;
    }

    // Hook pending property callbacks to the source
    const propertyCallbacks = this._propertyCallbacks;
    for (const propertyName in propertyCallbacks) {
      const callbacks = propertyCallbacks[propertyName];
      for (const callback of callbacks)
        this._getSourceProperty(propertyName, callback);
    }
  }

  /**
    Validates whether the given iterator can be used as a source.
    @protected
    @param {object} source The source to validate
    @param {boolean} allowDestination Whether the source can already have a destination
  */
  protected _validateSource(source?: AsyncIterator<T>, allowDestination = false) {
    const history = (source && (source as any)._destination);
    return super._validateSource(source, !history || history instanceof HistoryReader);
  }

  // Retrieves the property with the given name from the clone or its source.
  getProperty<P>(propertyName: string, callback?: (value: P) => void): P | undefined {
    const { source } = this, properties = this._properties,
          hasProperty = properties && (propertyName in properties);
    // If no callback was passed, return the property value
    if (!callback) {
      return hasProperty ? properties && properties[propertyName] :
        source && source.getProperty(propertyName);
    }
    // Try to look up the property in this clone
    super.getProperty(propertyName, callback);
    // If the property is not set on this clone, it might become set on the source first
    if (source && !hasProperty)
      this._getSourceProperty(propertyName, callback);
    return undefined;
  }

  // Retrieves the property with the given name from the source
  protected _getSourceProperty<P>(propertyName: string, callback: (value: P) => void) {
    (this.source as AsyncIterator<T>).getProperty<P>(propertyName, value => {
      // Only send the source's property if it was not set on the clone in the meantime
      if (!this._properties || !(propertyName in this._properties))
        callback(value);
    });
  }

  // Retrieves all properties of the iterator and its source.
  getProperties() {
    const base = this.source ? this.source.getProperties() : {},
          properties = this._properties;
    for (const name in properties)
      base[name] = properties[name];
    return base;
  }

  /* Generates details for a textual representation of the iterator. */
  protected _toStringDetails() {
    return `{source: ${this.source ? this.source.toString() : 'none'}}`;
  }

  /* Tries to read an item */
  read() {
    // An explicit read kickstarts the source
    if (!this._sourceStarted)
      this._sourceStarted = true;

    const source = this.source as InternalSource<T>;
    let item = null;
    if (!this.done && source) {
      // Try to read an item at the current point in history
      const history = source._destination as any as HistoryReader<T>;
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
  protected _end(destroy: boolean) {
    // Unregister from a possible history reader
    const source = this.source as InternalSource<T>;
    const history = source?._destination as any as HistoryReader<T>;
    if (history)
      history.unregister(this);

    // Don't call TransformIterator#_end,
    // as it would make the source inaccessible for other clones
    (BufferedIterator.prototype as any)._end.call(this, destroy);
  }
}


// Stores the history of a source, so it can be cloned
class HistoryReader<T> {
  private _source: AsyncIterator<T>;
  private _clones: ClonedIterator<T>[] | null = null;
  private _history: T[] = [];

  constructor(source: AsyncIterator<T>) {
    // If the source can still emit items, set up cloning
    this._source = source;
    if (!source.done) {
      // When the source becomes readable, makes all clones readable
      const setReadable = () => {
        for (const clone of this._clones as ClonedIterator<T>[])
          clone.readable = true;
      };

      // When the source errors, re-emits the error
      const emitError = (error: Error) => {
        for (const clone of this._clones as ClonedIterator<T>[])
          clone.emit('error', error);
      };

      // When the source ends, closes all clones that are fully read
      const end = () => {
        // Close the clone if all items had been emitted
        for (const clone of this._clones as ClonedIterator<T>[]) {
          if ((clone as any)._sourceStarted !== false &&
            (clone as any)._readPosition === this._history.length)
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
  register(clone: ClonedIterator<T>) {
    if (this._clones !== null)
      this._clones.push(clone);
  }

  // Unregisters a clone for history updates
  unregister(clone: ClonedIterator<T>) {
    if (this._clones !== null)
      this._clones = this._clones.filter(c => c !== clone);
  }

  // Tries to read the item at the given history position
  readAt(pos: number) {
    let item = null;
    // Retrieve an item from history when available
    if (pos < this._history.length)
      item = this._history[pos];
    // Read a new item from the source when possible
    else if (!this._source.done && (item = this._source.read()) !== null)
      this._history[pos] = item;
    return item;
  }

  // Determines whether the given position is the end of the source
  endsAt(pos: number) {
    return this._source.done && this._history.length === pos;
  }
}

/**
  Creates an iterator that wraps around a given iterator or readable stream.
  Use this to convert an iterator-like object into a full-featured AsyncIterator.
  After this operation, only read the returned iterator instead of the given one.
  @function
  @param {module:asynciterator.AsyncIterator|Readable} [source] The source this iterator generates items from
  @param {object} [options] Settings of the iterator
  @returns {module:asynciterator.AsyncIterator} A new iterator with the items from the given iterator
*/
export function wrap<T>(source: EventEmitter | Promise<EventEmitter>, options?: TransformIteratorOptions<T>) {
  return new TransformIterator<T>(source as AsyncIterator<T> | Promise<AsyncIterator<T>>, options);
}

/**
  Creates an empty iterator.
 */
export function empty<T>() {
  return new EmptyIterator<T>();
}

/**
  Creates an iterator with a single item.
  @param {object} item the item
 */
export function single<T>(item: T) {
  return new SingletonIterator<T>(item);
}

/**
  Creates an iterator for the given array.
  @param {Array} items the items
 */
export function fromArray<T>(items: Iterable<T>) {
  return new ArrayIterator<T>(items);
}

/**
  Creates an iterator containing all items from the given iterators.
  @param {Array} items the items
 */
export function union<T>(sources: AsyncIteratorOrArray<AsyncIterator<T>>) {
  return new UnionIterator<T>(sources);
}

/**
  Creates an iterator of integers for the given numeric range.
  @param {Array} items the items
 */
export function range(start: number, end: number, step?: number) {
  return new IntegerIterator({ start, end, step });
}

// Determines whether the given object is a function
function isFunction(object: any): object is Function {
  return typeof object === 'function';
}

// Determines whether the given object is an EventEmitter
function isEventEmitter(object: any): object is EventEmitter {
  return object && typeof object.on === 'function';
}

// Determines whether the given object is a promise
function isPromise<T>(object: any): object is Promise<T> {
  return object && typeof object.then === 'function';
}

// Determines whether the given object is a source expression
function isSourceExpression<T>(object: any): object is SourceExpression<T> {
  return object && (isEventEmitter(object) || isPromise(object) || isFunction(object));
}

export interface BufferedIteratorOptions {
  maxBufferSize?: number;
  autoStart?: boolean;
}

export interface TransformIteratorOptions<S> extends BufferedIteratorOptions {
  source?: SourceExpression<S>;
  optional?: boolean;
  destroySource?: boolean;
}

export interface TransformOptions<S, D> extends TransformIteratorOptions<S> {
  offset?: number;
  limit?: number;
  prepend?: AsyncIteratorOrArray<D>;
  append?: AsyncIteratorOrArray<D>;

  filter?: (item: S) => boolean;
  map?: (item: S) => D;
  transform?: (item: S, done: () => void, push: (item: D) => void) => void;
}

export interface MultiTransformOptions<S, D> extends TransformOptions<S, D> {
  multiTransform?: (item: S) => AsyncIterator<D>;
}

type AsyncIteratorOrArray<T> =
  T[] |
  AsyncIterator<T>;

type AsyncIteratorOrPromise<T> =
  AsyncIterator<T> |
  Promise<AsyncIterator<T>>;

type SourceExpression<T> =
  AsyncIteratorOrPromise<T> |
  (() => AsyncIteratorOrPromise<T>);

type InternalSource<T> =
  AsyncIterator<T> & { _destination: AsyncIterator<any> };
