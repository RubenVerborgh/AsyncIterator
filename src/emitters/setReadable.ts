import { AsyncIteratorBase } from '../interface';
import { ENDED } from '../states';
import { DESTINATION, _READABLE } from '../symbols';
import { emitData } from './emitData';
import { emitReadable } from './emitReadable';

// TODO: See if we need another _settingReadable baton to prevent call loops
export function setReadable(this: AsyncIteratorBase<any>) {
  if (!this._readable && this._state < ENDED) {
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
    // console.log('readable advertised', this._readable, DESTINATION in this, this)
    if (this._readable && DESTINATION in this) {
      // console.log('r2')
      this[DESTINATION]!.onParentReadable!(this);
    }

    // If the iterator is *still* readable then emit the readable event on the next tick
    if (this._readable)
      emitReadable.call(this);
  }
}
