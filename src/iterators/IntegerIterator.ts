import { end } from '../emitters';
import { AsyncIterator } from './AsyncIterator';
import { MappingIterator } from "./MappingIterator";
import { UnionIterator } from "./UnionIterator";
import { TransformIterator } from "./AsynchronousTransformIterator";

export class IntegerIterator extends AsyncIterator<number> {
  private _next: number;
  private _step: number;
  private _last: number;

  /**
    Creates a new `IntegerIterator`.
    @param {object} [options] Settings of the iterator
    @param {integer} [options.start=0] The first number to emit
    @param {integer} [options.end=Infinity] The last number to emit
    @param {integer} [options.step=1] The increment between two numbers
  */
  constructor({ start = 0, step = 1, end } :
      { start?: number, step?: number, end?: number } = {}) {
    super();

    this._next = Number.isFinite(start) ? Math.trunc(start) : start;
    this._step = Number.isFinite(step) ? Math.trunc(step) : step;

    // Determine the last number
    const ascending = step >= 0;
    const direction = ascending ? Infinity : -Infinity;
    if (Number.isFinite(end as number))
      end = Math.trunc(end as number);
    else if (end !== -direction)
      end = direction;
    this._last = end;

    // Start iteration if there is at least one item; close otherwise
    this.readable = true;
  }

  /* Reads an item from the iterator. */
  read() {
    const current = this._next,
          step = this._step,
          last = this._last;

    if (step >= 0 ? current > last : current < last) {
      end.call(this);
      return null;
    }

    this._next += step;
    return current;
  }

  /* Generates details for a textual representation of the iterator. */
  protected _toStringDetails() {
    return `(${this._next}...${this._last})`;
  }
}

export function range(start: number, end: number, step?: number) {
  return new IntegerIterator({ start, end, step });
}


console.time('integeriterator')
// let _it: AsyncIterator<AsyncIterator<number>> = new MappingIterator(range(0, 10000), () => range(0, 5000))
let _it: AsyncIterator<AsyncIterator<number>> = new MappingIterator(range(0, 10000), () => range(0, 5000))
const __it = new UnionIterator(_it);

// const it = __it

let x = 0

const it = new TransformIterator(__it, (item, done, push) => {
  x += 1;

  if (x === 10) {
    setTimeout(() => { push(100); done() }, 0)
  } else if (item === 100) {
    Promise.resolve().then(() => {
      push(item);
      done();
    })
  } else {
    push(item);
    done();
  }
})

// const it = __it;

// range(0, 10_000_000);

// for (let i = 0; i < 50; i++) {
//   it = new MappingIterator(it, x => x + 1)
//   if (i % 2 === 0) {
//     it = new MappingIterator(it, x => x % 2 === 0 ? null : x)
//   }
// }

let i = 0;

const it2 = new UnionIterator(new MappingIterator(range(0, 10), x => x === 0 ? it : range(1, 9)))

it2.on('data', (data) => {
  // console.log(data)
  i++;
});
it2.on('end', () => {
  console.log(i);
  console.timeEnd('integeriterator');
})
