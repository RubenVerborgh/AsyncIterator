import { AsyncIterator } from "./AsyncIterator";
import { addSyncErrorForwardingDestination, removeSyncErrorForwardingDestination } from "../addDestination";
import { end } from "../emitters";

// TODO: Exploit the fact that we have access to synchronous readable events to go straight to the iterator
// that emitted readable.

/**
  An iterator that generates items by reading from multiple other iterators.
  @extends module:asynciterator.AsyncIterator
*/
export class UnionIterator<T> extends AsyncIterator<T> {
  private maybeReadable: Set<AsyncIterator<T>> = new Set();
  private live: Set<AsyncIterator<T>> = new Set();
  
  /**
   * Applies the given mapping to the source iterator.
   */
   constructor(
    protected source: AsyncIterator<AsyncIterator<T>>,
    private maxParallelIterators: number = Infinity
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

  onParentReadable(parent: AsyncIterator<T> | AsyncIterator<AsyncIterator<T>>) {
    if (parent !== this.source) {
      this.maybeReadable.add(parent as AsyncIterator<T>);
      this.readable = true;
    } else if (this.live.size < this.maxParallelIterators) {
      this.readable = true;
    }
  }

  // TODO: See if case of elements being added to maybeReadable during read() call needs to be handled
  // TODO: See if it is more performant to wrap this all in a try/catch rather than having 
  // addSyncErrorForwardingDestination and removeSyncErrorForwardingDestination listeners
  read(): T | null {
    const { maybeReadable, live, source, maxParallelIterators } = this;
    let item: | T | null = null;
    let iterator: AsyncIterator<T> | null;

    // TODO: Investigate the performance impact of sets
    for (iterator of maybeReadable) {
      if (iterator.readable && (item = iterator.read()) !== null)
        return item;

      maybeReadable.delete(iterator);

      if (iterator.done) {
        removeSyncErrorForwardingDestination(iterator);
        live.delete(iterator);
      }
    }

    while (live.size < maxParallelIterators && source.readable && (iterator = source.read()) !== null) {
      addSyncErrorForwardingDestination.call(this, iterator);

      if (iterator.readable && (item = iterator.read()) !== null) {
        live.add(iterator);

        if (iterator.readable) {
          maybeReadable.add(iterator);
        }

        return item;
      } 
      
      if (iterator.done)
        removeSyncErrorForwardingDestination(iterator);
      else
        live.add(iterator);
    }

    this.readable = false;

    if (live.size === 0 && source.done)
      end.call(this);

    return null;
  }
}
