import { ArrayIterator, range } from '../dist/asynciterator.js';

function noop() {
  // empty function to drain an iterator
}

async function perf(warmupIterator, iterator, description) {
  return new Promise(res => {
    const now = performance.now();
    iterator.on('data', noop);
    iterator.on('end', () => {
      console.log(description, performance.now() - now);
      res();
    });
  });
}

function run(iterator) {
  return new Promise(res => {
    iterator.on('data', noop);
    iterator.on('end', () => {
      res();
    });
  });
}

function baseIterator() {
  return new ArrayIterator(new Array(20_000_000).fill(true).map((_, i) => i));
}

function createMapped(filter) {
  let iterator = baseIterator();
  for (let j = 0; j < 20; j++) {
    iterator = iterator.map(item => item);
    if (filter)
      iterator = iterator.filter(item => item % (j + 2) === 0);
  }
  return iterator;
}

(async () => {
  await run(baseIterator()); // warm-up run

  await perf(baseIterator(), createMapped(), '20,000,000 elems 20 maps\t\t\t\t\t');
  await perf(createMapped(true), createMapped(true), '20,000,000 elems 20 maps 20 filter\t\t\t');

  const now = performance.now();
  for (let j = 0; j < 100_000; j++) {
    let it = range(1, 100);
    for (let k = 0; k < 5; k++)
      it = it.map(item => item);

    await new Promise((resolve, reject) => {
      it.on('data', () => null);
      it.on('end', resolve);
      it.on('error', reject);
    });
  }
  console.log('100,000 iterators each with 5 maps and 100 elements\t', performance.now() - now);
})();
