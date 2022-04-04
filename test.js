import { ArrayIterator } from './dist/asynciterator.js'

let i = 0;
const arr = new Array(20_000).fill(true).map(() => i++);

const now = Date.now();
let times = 100;

const loop = () => {
  if (times === 0) {
    console.log('elapsed', Date.now() - now);
    return;
  }
  const iterator = new ArrayIterator(arr)
    .map((item) => item)
    .map((item) => item)
    .filter((item) => item % 2 === 0)
  ;
  iterator.on('data', () => {}).on('end', () => {
    times -= 1;
    loop();
  });
};

loop();
