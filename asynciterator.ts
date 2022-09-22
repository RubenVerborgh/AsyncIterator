/**
 * An asynchronous iterator library for advanced object pipelines
 * @module asynciterator
 */

import { EventEmitter } from 'events';
import { LinkedList } from './src/linkedlist';
import { createTaskScheduler } from './src/createTaskScheduler';
import type { Task, TaskScheduler } from './src/createTaskScheduler';

let taskScheduler: TaskScheduler = createTaskScheduler();

// Export utilities for reuse
export { LinkedList };

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



/** A synchronous readable event emitted only to internally defined destinations */
const _READABLE = Symbol('_readable')

/** Key indicating the current consumer of a source. */
export const DESTINATION = Symbol('destination');

function emitReadable<T>(this: AsyncIterator<T>) {
  // TODO: Run performance checks with and without the listener count part
  // Note we are allowed to have the listerCount !== 0 part since we emit readable
  // when a new readable listener is attached
  if (this._canEmitReadable && this.listenerCount('readable') !== 0) {
    this._canEmitReadable = false;
    taskScheduler(() => {
      this._canEmitReadable = true;

      // Opt out of emitting readable the iterator has become unreadable before the scheduled task.
      // TODO: See if this is necessary.
      if (this.readable)
        this.emit('readable')
    });
  }
}

// Emits new items though `data` events as long as there are `data` listeners
function emitData(this: AsyncIterator<any>) {
  // While there are `data` listeners and items, emit them
  let item;
  while (this._flowing && (item = this.read()) !== null)
    this.emit('data', item);

  this._emitDataPendingOrRunning = false;
}

// We shouldn't need this since end is emitted as part of read
// function emitEnd<T>(this: AsyncIterator<T>) {
//   if (this._emitEndPending !== true) {
//     taskScheduler(() => {
//       // TODO: Do this properly
//       this._state = ENDED;
//       this.emit('end');
//     });
//   }
// }

function setFlowing<T>(this: AsyncIterator<T>) {
  if (!this._flowing) {
    this._flowing = true;
    this._emitDataPendingOrRunning = true;

    // Whenever we switch back into flowing mode wait a tick before emitting data
    // so users downstream can attach more listeners within the same tick
    taskScheduler(() => {
      emitData.call(this);
    });
  }
}

function removeListener(this: AsyncIterator<any>, eventName: string) {
  if (eventName === 'data' && this.listenerCount('readable') === 0) {
    this._flowing = false;
  }
}

function newListener(this: AsyncIterator<any>, eventName: string) {
  if (this.readable) {
    switch (eventName) {
      case 'readable':
        emitReadable.call(this);
        break;
      case 'data':
        setFlowing.call(this);
        break;
    }
  }
}

function end(this: AsyncIterator<any>) {
  if (this._state < ENDED) {
    this._state = ENDED;
    this._readable = false;
    this.emit('end');
    // Cleanup
    this.removeAllListeners();
  }
}

// TODO: See if we need another _settingReadable baton to prevent call loops
function setReadable(this: AsyncIterator<any>) {
  if (!this._readable && !this.done) {
    this._readable = true;

    // If the iterator is already in flow mode then we can start emitting 'data' events right away
    if (this._flowing && !this._emitDataPendingOrRunning) {
      this._emitDataPendingOrRunning = true;
      emitData.call(this);
    }

    // If there is a destination that we are piping into then let them know that we are readable immediately rather
    // than waiting a tick

    // Note that we also check if this._readable is still true in case running emitData.call(this) has drained all
    // of the readable data already
    if (this._readable && DESTINATION in this)
      this.emit(_READABLE);

    // If the iterator is *still* readable then emit the readable event on the next tick
    if (this._readable)
      emitReadable.call(this);
  }
}

/**
  An asynchronous iterator provides pull-based access to a stream of objects.
  @extends module:asynciterator.EventEmitter
*/
export class AsyncIterator<T> extends EventEmitter {
  protected _state: number;
  protected _readable = false;
  protected _canEmitReadable = true;
  protected _emitDataPendingOrRunning = false;
  protected _flowing = false;
  protected _properties?: { [name: string]: any };
  protected _propertyCallbacks?: { [name: string]: [(value: any) => void] };

  /** Creates a new `AsyncIterator`. */
  constructor(initialState = OPEN) {
    super();
    this._state = initialState;
    this.on('removeListener', removeListener);
    this.on('newListener', newListener);
  }

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
    if (readable)
      setReadable.call(this);
    else
      this._readable = false;
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

  read(): T | null {
    end.call(this);
    return null;
  }
}


/**
 An iterator that synchronously transforms every item from its source
 by applying a mapping function.
 @extends module:asynciterator.AsyncIterator
*/
export class MappingIterator<S, D = S> extends AsyncIterator<D> {
  protected readonly _map: MapFunction<S, D>;
  protected readonly _source: InternalSource<S>;
  protected readonly _destroySource: boolean;

  /**
   * Applies the given mapping to the source iterator.
   */
  constructor(
    source: AsyncIterator<S>,
    map: MapFunction<S, D> = identity as MapFunction<S, D>,
    options: SourcedIteratorOptions = {}
  ) {
    super();
    this._map = map;
    this._source = ensureSourceAvailable(source);
    this._destroySource = options.destroySource !== false;

    // Close if the source is already empty
    if (source.done) {
      setReadable.call(this);
    }
    // Otherwise, wire up the source for reading
    else {
      this._source[DESTINATION] = this;
      this._source.on('end', setReadable);
      this._source.on('readable', setReadable);
      this._source.on(_READABLE, setReadable);
      this.readable = this._source.readable;
    }
  }

  /* Tries to read the next item from the iterator. */
  read(): D | null {
    if (!this.done) {
      // Try to read an item that maps to a non-null value
      if (this._source.readable) {
        let item: S | null, mapped: D | null;
        while ((item = this._source.read()) !== null) {
          if ((mapped = this._map(item)) !== null)
            return mapped;
        }
      }
      this.readable = false;

      // End this iterator if the source is done
      if (this._source.done)
        this._end();
    }
    return null;
  }

  /* Cleans up the source iterator and ends. */
  protected _end() {
    this._source.off('end', setReadable);
    this._source.off('readable', setReadable);
    this._source.off(_READABLE, setReadable);
    delete this._source[DESTINATION];
    end.call(this);
  }
}

// Note - I don't think 'closing' actually makes sense any more.
// You either wait until end within a read event; or you destroy early
// Either that or each read method needs a custom close check
