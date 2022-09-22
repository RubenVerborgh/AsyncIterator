import { AsyncIteratorBase } from '../interface';

// Emits new items though `data` events as long as there are `data` listeners
export function emitData<T>(this: AsyncIteratorBase<T>) {
  // While there are `data` listeners and items, emit them
  let item;
  while (this._flowing && (item = this.read()) !== null)
    this.emit('data', item);

  this._emitDataPendingOrRunning = false;
}
