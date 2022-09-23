// import { setReadable } from '../emitters';
// import { AsyncIterator } from './AsyncIterator';

// // Stores the history of a source, so it can be cloned
// class HistoryReader<T> {
//   private _source: AsyncIterator<T>;
//   private _history: T[] = [];
//   private _trackers: Set<ClonedIterator<T>> = new Set();

//   onParentReadable() {
//     for (const tracker of this._trackers)
//       tracker.readable = true;
//   }

//   constructor(source: AsyncIterator<T>) {
//     this._source = source;

//     // If the source is still live, set up clone tracking;
//     // otherwise, the clones just read from the finished history
//     if (!source.done) {
//       // When the source becomes readable, makes all clones readable
//       const setReadable = () => {
//         for (const tracker of this._trackers)
//           tracker.readable = true;
//       };

//       // When the source errors, re-emits the error
//       const emitError = (error: Error) => {
//         for (const tracker of this._trackers)
//           tracker.emit('error', error);
//       };

//       // When the source ends, closes all clones that are fully read
//       const end = () => {
//         // Close the clone if all items had been emitted
//         for (const tracker of this._trackers) {
//           if ((tracker as any)._sourceStarted !== false &&
//             (tracker as any)._readPosition === this._history.length)
//             tracker.close();
//         }
//         this._trackers.clear();

//         // Remove source listeners, since no further events will be emitted
//         source.removeListener('end', end);
//         source.removeListener('error', emitError);
//         source.removeListener('readable', setReadable);
//       };

//       // Listen to source events to trigger events in subscribed clones
//       source.on('end', end);
//       source.on('error', emitError);
//       source.on('readable', setReadable);
//     }
//   }

//   // Registers a clone for history updates
//   register(clone: ClonedIterator<T>) {
//     // Tracking is only needed if the source is still live
//     if (!this._source.done)
//       this._trackers.add(clone);
//   }

//   // Unregisters a clone for history updates
//   unregister(clone: ClonedIterator<T>) {
//     this._trackers.delete(clone);
//   }

//   // Tries to read the item at the given history position
//   readAt(pos: number) {
//     let item = null;
//     // Retrieve an item from history when available
//     if (pos < this._history.length)
//       item = this._history[pos];
//     // Read a new item from the source when possible
//     else if (!this._source.done && (item = this._source.read()) !== null)
//       this._history[pos] = item;
//     return item;
//   }

//   // Determines whether the given position is the end of the source
//   endsAt(pos: number) {
//     return this._source.done && this._history.length === pos;
//   }
// }
