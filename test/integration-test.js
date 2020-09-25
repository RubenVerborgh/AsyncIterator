import {
  ArrayIterator,
  TransformIterator,
  UnionIterator,
} from '../dist/asynciterator.js';

describe('Integration tests', () => {
  describe('A sequence of ArrayIterator, TransformIterator, and Unioniterator without autoStart', () => {
    let arrayIterator, transformIterator, unionIterator;

    before(() => {
      arrayIterator = new ArrayIterator([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], { autoStart: false });
      transformIterator = new TransformIterator(arrayIterator, { autoStart: false });
      unionIterator = new UnionIterator([transformIterator], { autoStart: false });
    });

    it('emits a data event', done => {
      unionIterator.once('data', () => done());
    });

    it('emits an end event after reading', done => {
      unionIterator.on('data', () => { /* drain */ });
      unionIterator.on('end', done);
    });
  });
});
