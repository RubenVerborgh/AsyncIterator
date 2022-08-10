import { UnionIterator, range } from '../dist/asynciterator.js';
import { promisifyEventEmitter } from 'event-emitter-promisify';

let it;

// Warmup

console.time('For loop with 5x10^9 elems');
for (let i = 0; i < 5_000_000_000; i++)
  ;
console.timeEnd('For loop with 5x10^9 elems');

console.time('UnionIterator 2x10^7 iterators');
for (let i = 0; i < 5; i++) {
  it = new UnionIterator([range(0, 10_000_000), range(0, 10_000_000)]);
  await promisifyEventEmitter(it.on('data', () => { /* noop */ }));
}
console.timeEnd('UnionIterator 2x10^7 iterators');

console.time('UnionIterator 1000x500 iterators');
for (let i = 0; i < 5; i++) {
  it = new UnionIterator(range(0, 1000).map(() => range(0, 500)));
  await promisifyEventEmitter(it.on('data', () => { /* noop */ }));
}
console.timeEnd('UnionIterator 1000x500 iterators');


console.time('UnionIterator 1000x500 iterators - max parallelism of 1');
for (let i = 0; i < 5; i++) {
  it = new UnionIterator(range(0, 1000).map(() => range(0, 500)), { maxParallelIterators: 1 });
  await promisifyEventEmitter(it.on('data', () => { /* noop */ }));
}
console.timeEnd('UnionIterator 1000x500 iterators - max parallelism of 1');
