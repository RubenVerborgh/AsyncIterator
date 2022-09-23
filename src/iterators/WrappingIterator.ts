import { isIterable, isIterator, IterableSource } from "../../asynciterator copy";
import { addDestination, addSyncErrorForwardingDestination, MinimalSource, removeSyncErrorForwardingDestination } from "../addDestination";
import { emitError, end, setReadable } from "../emitters";
import { destinationSetError } from "../emitters/destinationSetError";
import { isPromise, isValidSource } from "../isCheckers";
import { DESTINATION } from "../symbols";
import { AsyncIterator } from "./AsyncIterator";

function destinationSetReadable<T>(this: { [DESTINATION]: AsyncIterator<T> }) {
  setReadable.call(this[DESTINATION]);
}

function destinationSourceDone<T>(this: { [DESTINATION]: WrappingIterator<T> }) {
  this[DESTINATION].sourceDone = true;
  setReadable.call(this[DESTINATION]);
}

// TODO: Fix this type
function addSource<T>(this: WrappingIterator<T>, source: AsyncIterator<T> | Iterable<T> | Iterator<T> | any) {
  // Handling internal sources
  if (source instanceof AsyncIterator) {
    this.source = source;
    addSyncErrorForwardingDestination.call(this, source);
    this.readable = source.readable;
    return;
  }
  
  // Handling non-internal synchronous sources
  if (!isIterator<T>(source) && isIterable<T>(source))
    source = source[Symbol.iterator]();

  if (isIterator<T>(source)) {
    const iterator: any = { done: false, readable: true }
    iterator.read = (): T | null => {
      if (iterator.done)
        return null;

      let next: IteratorResult<T>;
      while (!(next = (source as Iterator<T>).next()).done) {
        if (next.value !== null)
          return next.value;
      }

      iterator.done = true;
      iterator.readable = false;
      return null;
    };
    this.source = iterator;
    this.readable = true;
    return;
  }

  // Handling non-internal async sources
  // TODO: Make this an is check
  if (!source) {
    this.sourceDone = true;
    this.readable = true;
  } else if (isValidSource(source)) {
    this.source = source;
    addDestination.call(this, source);
    source.on('end', destinationSourceDone);
    source.on('error', destinationSetError);
    source.on('readable', destinationSetReadable);
  } else {
    this.pendingError = new TypeError(`Invalid source: ${source}`);
  }
}

/**
 * An iterator that takes a variety of iterable objects as a source.
 */
 export class WrappingIterator<T> extends AsyncIterator<T> {
  // TODO: Fix typing
  protected source: { read(): T | null; done: boolean; readable?: boolean; [DESTINATION]?: AsyncIterator<T> } & MinimalSource<T> | null = null;
  sourceDone = false;
  pendingError: any = null;

  constructor(source?: Promise<IterableSource<T>>) {
    super();

    // If promise, set up a temporary source and replace when ready
    if (isPromise(source)) {
      source.then(addSource.bind(this)).catch(error => {
        this.pendingError = error;
      });
    }
    // Otherwise, set the source synchronously
    else if (source) {
      addSource.call(this, source);
    } else {
      this.sourceDone = true;
      this.readable = true;
    }
  }

  read(): T | null {
    const { source } = this;
    if (source !== null && source.readable !== false) {
      const item = source.read();
      if (item !== null)
        return item;
      this.readable = false;
    }

    if (this.sourceDone === true || source?.done === true) {
      if (source !== null) {
        delete source[DESTINATION];
        source.off('end', destinationSourceDone);
        source.off('error', destinationSetError);
        source.off('readable', destinationSetReadable);
        removeSyncErrorForwardingDestination.call(this, source);
        this.source = null;
      }
      end.call(this);
    }

    if (this.pendingError !== null) {
      emitError.call(this, this.pendingError);
      this.pendingError = null;
    }

    return null;
  }
}

WrappingIterator.prototype.onParentReadable = setReadable;
