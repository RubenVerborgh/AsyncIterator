import {
  wrapIterator,
} from '../dist/asynciterator.js';

describe('wrapIterator', () => {
  it('Should wrap correctly', async () => {
    (await wrapIterator((function * () {
      yield 1;
      yield 2;
      yield 3;
    })()).toArray()).should.deep.equal([1, 2, 3]);
  });
});
