import { setReadable } from '../emitters/setReadable';
import { AsyncIterator } from './AsyncIterator';

/**
 An iterator that synchronously transforms every item from its source
 by applying a mapping function.
 @extends module:asynciterator.AsyncIterator
*/
export abstract class SynchronousTransformIterator<S, D = S> extends AsyncIterator<D> {
  protected readonly _source: InternalSource<S>;
  protected readonly _destroySource: boolean;
  // TODO: See if we need to bind to this
  protected readonly onParentReadable = setReadable

  /**
   * Applies the given mapping to the source iterator.
   */
  constructor(
    source: AsyncIterator<S>,
    options: SourcedIteratorOptions = {}
  ) {
    super();
    this._source = ensureSourceAvailable(source);
    this._destroySource = options.destroySource !== false;

    // Close if the source is already empty
    if (source.done) {
      this.close();
    }
    // Otherwise, wire up the source for reading
    else {
      this._source._destination = this;
      this._source.on('end', destinationClose);
      this._source.on('error', destinationEmitError);
      this._source.on('readable', destinationSetReadable);
      this.readable = this._source.readable;
    }
  }

  protected abstract safeRead(): D | null;

  /* Tries to read the next item from the iterator. */
  read(): D | null {
    if (!this.done) {
      // Try to read an item that maps to a non-null value
      if (this._source.readable) {
        const item = this.safeRead();
        if (item !== null) {
          return item;
        }
      }
      this.readable = false;

      // Close this iterator if the source is empty
      if (this._source.done)
        this.close();
    }
    return null;
  }

  /* Cleans up the source iterator and ends. */
  protected _end(destroy: boolean) {
    this._source.removeListener('end', destinationClose);
    this._source.removeListener('error', destinationEmitError);
    this._source.removeListener('readable', destinationSetReadable);
    delete this._source._destination;
    if (this._destroySource)
      this._source.destroy();
    super._end(destroy);
  }
}
