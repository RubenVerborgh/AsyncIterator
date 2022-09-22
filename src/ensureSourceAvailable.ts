import { isFunction } from "./isCheckers";
import { AsyncIteratorBase } from "./interface";
import { DESTINATION } from "./symbols";

// Validates an AsyncIterator for use as a source within another AsyncIterator
export function ensureSourceAvailable<S>(source?: AsyncIteratorBase<S>, allowDestination = false): void {
  if (!source || !isFunction(source.read) || !isFunction(source.on))
    throw new TypeError(`Invalid source: ${source}`);
  if (!allowDestination && DESTINATION in source)
    throw new Error('The source already has a destination');
}
