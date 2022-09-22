import { AsyncIteratorBase } from '../interface';
import { emitData } from './emitData';
import { taskScheduler } from '../taskscheduler';

// Put the iterator into flowing mode - since we are switching from non-flowing to flowing mode,
// we *cannot* start emitting items until the next tick. Hence we switch into the _emitDataPendingOrRunning
// state until the next tick.

export function setFlowing<T>(this: AsyncIteratorBase<T>) {
  if (!this._flowing) {
    this._flowing = true;
    this._emitDataPendingOrRunning = true;

    // Whenever we switch back into flowing mode wait a tick before emitting data
    // so users downstream can attach more listeners within the same tick
    taskScheduler(() => {
      if (this._readable)
        emitData.call(this);
      else
        this._emitDataPendingOrRunning = false;
    });
  }
}
