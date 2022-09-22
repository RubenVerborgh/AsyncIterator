import { AsyncIteratorBase } from '../interface';

export function emitError<T>(this: AsyncIteratorBase<T>, error: any) {
  if (this.listenerCount('error') === 0)
    throw error;
  else
    this.emit('error', error);
}
