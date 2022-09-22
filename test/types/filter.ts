// @ts-nocheck
import { ArrayIterator } from '../../asynciterator';
import type { AsyncIterator } from '../../asynciterator';

const iterator = new ArrayIterator<string | number>([1, 'h', 4, 5, 7, 's']);

const filteredIteratorReturnIs: AsyncIterator<string> = iterator.filter<string>(
  (item): item is string => typeof item === 'string'
);

const filteredIteratorReturnBool: AsyncIterator<string | number> = iterator.filter(
  (item): boolean => typeof item === 'string'
);

const filteredIteratorReturnTrue: AsyncIterator<string | number> = iterator.filter(
  () => true
);

export {
  filteredIteratorReturnIs,
  filteredIteratorReturnBool,
  filteredIteratorReturnTrue,
};
