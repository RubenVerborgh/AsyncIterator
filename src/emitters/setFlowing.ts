import { AsyncIteratorBase } from '../interface';
import { emitData } from './emitData';
import { taskScheduler } from '../taskScheduler';

// Put the iterator into flowing mode - since we are switching from non-flowing to flowing mode,
// we *cannot* start emitting items until the next tick. Hence we switch into the _emitDataPendingOrRunning
// state until the next tick.

function emitOrCancelPending<T>(this: AsyncIteratorBase<T>) {
  if (this._readable)
    emitData.call(this);
  else
    this._emitDataPendingOrRunning = false;
}

export function setFlowing<T>(this: AsyncIteratorBase<T>) {
  if (!this._flowing) {
    this._flowing = true;

    // I think this is sufficient to handle the following cases
    // 1. A single data listener is turned on and then off and then on again in the same tick
    // 2. Said listener is turned on in one tick, then off and on again in the next tick [this case is a little more dicy]
    if (!this._emitDataPendingOrRunning) {
      this._emitDataPendingOrRunning = true;

      // Whenever we switch back into flowing mode wait a tick before emitting data
      // so users downstream can attach more listeners within the same tick

      // TODO: See which is more performant
      // taskScheduler(() => {
      //   if (this._readable)
      //     emitData.call(this);
      //   else
      //     this._emitDataPendingOrRunning = false;
      // });

      taskScheduler(emitOrCancelPending.bind(this));
    }
  }
}
