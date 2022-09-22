import { AsyncIteratorBase } from '../interface';
import { emitReadable } from './emitReadable';
import { setFlowing } from './setFlowing';

export function newListener<T>(this: AsyncIteratorBase<T>, eventName: string) {
  switch (eventName) {
    case 'readable':
      if (this._readable)
        emitReadable.call(this);
      break;
    case 'data':
      setFlowing.call(this);
      break;
  }
  
  
  if (this._readable) {
    switch (eventName) {
      case 'readable':
        emitReadable.call(this);
        break;
      // TODO: We still need to toggle on flowing mode even if readable is false
      case 'data':
        setFlowing.call(this);
        break;
    }
  }
}



// export function newListener<T>(this: AsyncIteratorBase<T>, eventName: string) {
//   if (this._readable) {
//     switch (eventName) {
//       case 'readable':
//         emitReadable.call(this);
//         break;
//       // TODO: We still need to toggle on flowing mode even if readable is false
//       case 'data':
//         setFlowing.call(this);
//         break;
//     }
//   }
// }
