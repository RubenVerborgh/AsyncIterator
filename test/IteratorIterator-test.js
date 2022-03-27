import {
  IteratorIterator,
} from '../dist/asynciterator.js';

describe('IteratorIterator', () => {
  it('Should wrap correctly', async () => {
    (await new IteratorIterator((function * () {
      yield 1;
      yield 2;
      yield 3;
    })()).toArray()).should.deep.equal([1, 2, 3]);
  });
});
