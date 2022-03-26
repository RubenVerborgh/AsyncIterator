
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
  it('should not let an instance of AsyncIterator pass through without wrapping if letIteratorThrough option is not set', () => {
    const source = new ArrayIterator([0, 1, 2, 3, 4]);
    const wrapped = wrap(source);
    wrapped.should.not.equal(source);
    wrapped.should.be.instanceof(WrappingIterator);
  });

  it('should not let an instance of AsyncIterator pass through without wrapping if letIteratorThrough option is set to false', () => {
    const source = new ArrayIterator([0, 1, 2, 3, 4]);
    const wrapped = wrap(source, { letIteratorThrough: false });
    wrapped.should.not.equal(source);
    wrapped.should.be.instanceof(WrappingIterator);
  });

  it('should let an instance of AsyncIterator pass through without wrapping if letIteratorThrough option is set to true', () => {
    const source = new ArrayIterator([0, 1, 2, 3, 4]);
    const wrapped = wrap(source, { letIteratorThrough: true });
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

  it('should return a TransformIterator when transform options are passed', () => {
    const source = new ArrayIterator([0, 1, 2, 3, 4]);
    const options = { maxBufferSize: 42 };
    const wrapped = wrap(source, options);
    wrapped.should.be.instanceof(TransformIterator);
  });

  it('should return a WrappingIterator when no options object is passed', () => {
    const source = new IteratorLike();
    const wrapped = wrap(source);
    wrapped.should.be.instanceof(WrappingIterator);
  });
});
