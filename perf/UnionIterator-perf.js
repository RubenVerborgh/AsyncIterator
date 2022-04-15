import { UnionIterator, range } from '../dist/asynciterator.js';
import { promisifyEventEmitter } from 'event-emitter-promisify'

let it;

// Warmup

console.time('For loop with 5x10^9 elems');
for (let i = 0; i < 5_000_000_000; i++);
console.timeEnd('For loop with 5x10^9 elems');

console.time('UnionIterator 2 x 10^7 iterators');
for (let i = 0; i < 5; i++) {
  it = new UnionIterator([range(0, 10_000_000), range(0, 10_000_000)]);
  await promisifyEventEmitter(it.on('data', () => {}))
}
console.timeEnd('UnionIterator 2 x 10^7 iterators');

console.time('UnionIterator 1000 x 20_000 iterators');
for (let i = 0; i < 5; i++) {
  it = new UnionIterator(range(0, 1000).map(() => range(0, 20_000)));
  await promisifyEventEmitter(it.on('data', () => {}))
}
console.timeEnd('UnionIterator 1000 x 20_000 iterators');

console.time('UnionIterator 1000 x 20_000 iterators - maxBufferSize of 1');
for (let i = 0; i < 5; i++) {
  it = new UnionIterator(range(0, 1000).map(() => range(0, 20_000)));
  await promisifyEventEmitter(it.on('data', () => {}))
}
console.timeEnd('UnionIterator 1000 x 20_000 iterators - maxBufferSize of 1');
