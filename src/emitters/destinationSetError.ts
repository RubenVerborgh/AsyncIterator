import { AsyncIteratorBase } from "../interface";
import { DESTINATION } from "../symbols";
import { setReadable } from "./setReadable";

export function destinationSetError<T>(this: { [DESTINATION]: { pendingError: any } & AsyncIteratorBase<T> }, error: any) {
  this[DESTINATION].pendingError = error;
  setReadable.call(this[DESTINATION]);
}
