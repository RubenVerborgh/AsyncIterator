import { addSyncErrorForwardingDestination, removeSyncErrorForwardingDestination } from '../addDestination';
import { end } from '../emitters';
import { setReadable } from '../emitters/setReadable';
import { AsyncIterator } from './AsyncIterator';

/**
 An iterator that synchronously transforms every item from its source
 by applying a mapping function.
 @extends module:asynciterator.AsyncIterator
*/
abstract class SynchronousTransformIterator<S, D = S> extends AsyncIterator<D> {
  // TODO: See if we don't need to bind to this
  // Optimisation - in the case of the composite iterator
  // public onParentReadable = setReadable.bind(this);

  /**
   * Applies the given mapping to the source iterator.
   */
  constructor(
    protected source: AsyncIterator<S>
  ) {
    super();
    // TODO: See if we need this
    // I don't think we do if we can assume the source is an asynciterator
    // ensureSourceAvailable(source);

    // In synchronous transformations we assume that .read() on super classes are only made at the same time
    // as the current read call and hence it is safe to forward the error immediately.
    addSyncErrorForwardingDestination.call(this, source);
    this.readable = source.readable;
  }

  protected abstract safeRead(): D | null;

  /* Tries to read the next item from the iterator. */
  read(): D | null {
    // Try to read an item that maps to a non-null value
    // TODO: See if we actually need to *check* readability here
    if (this.source.readable) {
      const item = this.safeRead();
      if (item !== null) {
        return item;
      }
    }

    // Close this iterator if the source is empty
    if (this.source.done) {
      removeSyncErrorForwardingDestination(this.source);
      end.call(this);
    }

    this.readable = false;

    return null;
  }
}

SynchronousTransformIterator.prototype.onParentReadable = setReadable;

export {
  SynchronousTransformIterator
};
