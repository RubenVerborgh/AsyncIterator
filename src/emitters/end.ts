
import { AsyncIteratorBase } from '../interface';
import { ENDED } from '../states';

export function end<T>(this: AsyncIteratorBase<T>) {
  if (this._state < ENDED) {
    this._state = ENDED;
    this._readable = false;
    this.emit('end');
    // Cleanup
    this.removeAllListeners();
  }
}