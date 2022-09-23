import { AsyncIterator } from "./AsyncIterator";
import { SynchronousTransformIterator } from "./SynchronousTransformIterator";

/**
 * A synchronous mapping function from one element to another.
 * A return value of `null` means that nothing should be emitted for a particular item.
 */
export type MapFunction<S, D = S> = (item: S) => D | null;

export class MappingIterator<S, D = S> extends SynchronousTransformIterator<S, D> {
  /**
   * Applies the given mapping to the source iterator.
   */
  constructor(
    source: AsyncIterator<S>,
    private map: MapFunction<S, D>
  ) {
    super(source);
  }

  /* Tries to read the next item from the iterator. */
  safeRead(): D | null {
    let item: D | S | null;
    while ((item = this.source.read()) !== null) {
      if ((item = this.map(item)) !== null)
        return item;
    }
    return null;
  }
}
