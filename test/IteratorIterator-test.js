import {
  fromIterator,
  fromIterable,
  IteratorIterator,
} from '../dist/asynciterator.js';

function *testYield() {
  yield 1;
  yield 2;
  yield 3;
}

describe('IteratorIterator', () => {
  it('Should wrap correctly', async () => {
    (await new IteratorIterator(testYield()).toArray()).should.deep.equal([1, 2, 3]);
  });
});

describe('fromIterator', () => {
  it('Should wrap correctly', async () => {
    (await fromIterator(testYield()).toArray()).should.deep.equal([1, 2, 3]);
  });
});

describe('fromIterable', () => {
  it('Should wrap correctly', async () => {
    (await fromIterable({ [Symbol.iterator]: testYield }).toArray()).should.deep.equal([1, 2, 3]);
  });
});
