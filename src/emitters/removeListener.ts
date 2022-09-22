import { AsyncIteratorBase } from '../interface';

export function removeListener<T>(this: AsyncIteratorBase<T>, eventName: string) {
  if (eventName === 'data' && this.listenerCount('data') === 0) {
    this._flowing = false;
  }
}
