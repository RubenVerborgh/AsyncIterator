import { AsyncIteratorBase } from '../interface';
import { taskScheduler } from '../taskScheduler';

function runEmitReadable<T>(this: AsyncIteratorBase<T>) {
  this._canEmitReadable = true;

  // Opt out of emitting readable the iterator has become unreadable before the scheduled task.
  // TODO: See if this is necessary.
  if (this._readable)
    this.emit('readable')
}

export function emitReadable<T>(this: AsyncIteratorBase<T>) {
  // TODO: Run performance checks with and without the listener count part
  // Note we are allowed to have the listerCount !== 0 part since we emit readable
  // when a new readable listener is attached
  if (this._canEmitReadable && this.listenerCount('readable') !== 0) {
    this._canEmitReadable = false;

    taskScheduler(runEmitReadable.bind(this));
    
    // taskScheduler(() => {
    //   this._canEmitReadable = true;

    //   // Opt out of emitting readable the iterator has become unreadable before the scheduled task.
    //   // TODO: See if this is necessary.
    //   if (this._readable)
    //     this.emit('readable')
    // });
  }
}
