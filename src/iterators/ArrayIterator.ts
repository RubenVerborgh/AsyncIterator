import { end } from "../emitters";
import { AsyncIterator } from "./AsyncIterator";

/**
  An iterator that emits the items of a given array.
  @extends module:asynciterator.AsyncIterator
*/
export class ArrayIterator<T> extends AsyncIterator<T> {
  private _buffer?: T[];
  protected _index: number;
  protected _truncateThreshold: number;

  /**
    Creates a new `ArrayIterator`.
    @param {Array} items The items that will be emitted.
    @param {boolean} [options.preserve=true] If false, the passed array can be safely modified
  */
  constructor(items: Iterable<T> = [], { preserve = true } = {}) {
    super();
    const buffer = preserve || !Array.isArray(items) ? [...items] : items;
    this._index = 0;
    this._truncateThreshold = preserve ? -1 : 64;
    if (buffer.length !== 0)
      this._buffer = buffer;
    this.readable = true;
  }

  /* Reads an item from the iterator. */
  read(): T | null {
    let item: T | null = null;

    if (this._buffer) {
      // Emit the current item
      if (this._index < this._buffer.length)
        item = this._buffer[this._index++];
      // Close when all elements have been returned
      if (this._index === this._buffer.length) {
        delete this._buffer;
      }
      // Do need keep old items around indefinitely
      else if (this._index === this._truncateThreshold) {
        this._buffer.splice(0, this._truncateThreshold);
        this._index = 0;
      }
    }
    else {
      end.call(this)
    }

    return item;
  }

  /* Generates details for a textual representation of the iterator. */
  protected _toStringDetails() {
    return `(${this._buffer ? this._buffer.length - this._index : 0})`;
  }

  /**
   Consume all remaining items of the iterator into an array that will be returned asynchronously.
   @param {object} [options] Settings for array creation
   @param {integer} [options.limit] The maximum number of items to place in the array.
   */
  toArray(options: { limit?: number } = {}): Promise<T[]> {
    if (!this._buffer)
      return Promise.resolve([]);

    // Determine start and end index
    const { length } = this._buffer;
    const start = this._index;
    const _end = typeof options.limit !== 'number' ? length : start + options.limit;

    // Slice the items off the buffer
    const items = this._buffer.slice(start, _end);
    this._index = _end;
    // Close this iterator when we're past the end
    if (_end >= length)
      end.call(this);

    return Promise.resolve(items);
  }
}


/**
  Creates an iterator for the given array.
  @param {Array} items the items
 */
export function fromArray<T>(items: Iterable<T>): AsyncIterator<T> {
  return new ArrayIterator<T>(items);
}
