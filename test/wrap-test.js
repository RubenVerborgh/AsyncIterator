
import {
  wrap,
  ArrayIterator,
  TransformIterator,
  WrappingIterator,
} from '../dist/asynciterator.js';

import { EventEmitter } from 'events';

class IteratorLike extends EventEmitter {
  constructor() {
    super();
    this._count = 0;
  }

  read() {
    if (this._count >= 5) {
      this.emit('end');
      return null;
    }
    return this._count++;
  }
}

describe('The wrap() function', () => {
  it('should let an instance of AsyncIterator pass through without wrapping', () => {
    const source = new ArrayIterator([0, 1, 2, 3, 4]);
    const wrapped = wrap(source);
    wrapped.should.equal(source);
    wrapped.should.be.instanceof(ArrayIterator);
  });

  it('should emit an error when an incompatible source is passed', done => {
    const source = {};
    const wrapped = wrap(source);
    wrapped.on('error', err => {
      err;
      done();
    });
  });

  it('should return a TransformIterator when an options object is passed', () => {
    const source = new ArrayIterator([0, 1, 2, 3, 4]);
    const options = { map: num => num * 2 };
    const wrapped = wrap(source, options);
    wrapped.should.be.instanceof(TransformIterator);
  });

  it('should return a WrappingIterator when no options object is passed', () => {
    const source = new IteratorLike();
    const wrapped = wrap(source);
    wrapped.should.be.instanceof(WrappingIterator);
  });
});
