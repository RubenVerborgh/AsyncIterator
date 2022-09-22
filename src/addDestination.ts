import { DESTINATION, _READABLE } from './symbols';
import { setReadable } from './emitters/setReadable';
import { AsyncIteratorBase } from './interface';

export function addDestination<T, K>(this: AsyncIteratorBase<T>, source: AsyncIteratorBase<K>) {
  if (DESTINATION in source) {
    throw new Error("Attempted to add destination to asynciterator source with existing destination");
  }
  source[DESTINATION] = this;
  // source.on('readable', setReadable);
  // source.on(_READABLE, setReadable);
  // source.on('end', setReadable);
  // TODO: See if the fact that we are using bind means that this is actually a new function
  source.on('readable', setReadable.bind(this));
  source.on(_READABLE, setReadable.bind(this));
  source.on('end', setReadable.bind(this));
  // TODO: Handle errors
}

export function removeDestination<T>(source: AsyncIteratorBase<T>) {
  delete source[DESTINATION];
  source.off('readable', setReadable);
  source.off(_READABLE, setReadable);
  source.off('end', setReadable);
  // TODO: Handle errors
}

