// import { AsyncIterator } from "./AsyncIterator";
// import { SynchronousTransformIterator } from "./SynchronousTransformIterator";

// /**
//  * A synchronous mapping function from one element to another.
//  * A return value of `null` means that nothing should be emitted for a particular item.
//  */
// export type MapFunction<S, D = S> = (item: S) => D | null;

// export class OneElementPrependIterator<S> extends SynchronousTransformIterator<S> {
//   /**
//    * Applies the given mapping to the source iterator.
//    */
//   constructor(
//     source: AsyncIterator<S>,
//     private item: S | null
//   ) {
//     super(source);
//   }

//   /* Tries to read the next item from the iterator. */
//   safeRead(): D | null {
//     let { item, source } = this;

//     if (item !== null) {
//       this.item = null;
//       return item;
//     }

//     while ((item = this.source.read()) !== null) {
//       if ((item = this.map(item)) !== null)
//         return item;
//     }
//     return null;
//   }
// }
