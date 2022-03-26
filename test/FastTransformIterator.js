import {
  FastTransformIterator,
  range,
} from '../dist/asynciterator.js';

describe('FastTransformIterator (development mode)', () => {
  let iterator;
  beforeEach(() => {
    process.env.NODE_ENV === 'development';
    iterator = new FastTransformIterator(range(0, 2));
  });
  it('Should handle no transforms', async () => {
    iterator.read().should.equal(0);
    iterator.read().should.equal(1);
    iterator.read().should.equal(2);
  });
  it('Should handle no transforms arrayified', async () => {
    (await iterator.toArray()).should.deep.equal([0, 1, 2]);
  });
  it('Should apply maps that doubles correctly', async () => {
    (await iterator.map(x => x * 2).toArray()).should.deep.equal([0, 2, 4]);
  });
  it('Should apply maps that doubles correctly', async () => {
    (await iterator.map(x => `x${x}`).toArray()).should.deep.equal(['x0', 'x1', 'x2']);
  });
  it('Should apply filter correctly', async () => {
    (await iterator.filter(x => x % 2 === 0).toArray()).should.deep.equal([0, 2]);
  });
  it('Should apply filter then map correctly', async () => {
    (await iterator.filter(x => x % 2 === 0).map(x => `x${x}`).toArray()).should.deep.equal(['x0', 'x2']);
  });
  it('Should apply map then filter correctly (1)', async () => {
    (await iterator.map(x => x).filter(x => x % 2 === 0).toArray()).should.deep.equal([0, 2]);
  });
  it('Should apply map then filter to false correctly', async () => {
    (await iterator.map(x => `x${x}`).filter(x => true).toArray()).should.deep.equal(['x0', 'x1', 'x2']);
  });
  it('Should apply map then filter to true correctly', async () => {
    (await iterator.map(x => `x${x}`).filter(x => false).toArray()).should.deep.equal([]);
  });
  it('Should apply filter to false then map correctly', async () => {
    (await iterator.filter(x => true).map(x => `x${x}`).toArray()).should.deep.equal(['x0', 'x1', 'x2']);
  });
  it('Should apply filter to true then map correctly', async () => {
    (await iterator.filter(x => false).map(x => `x${x}`).filter(x => false).toArray()).should.deep.equal([]);
  });
  it('Should apply filter one then double', async () => {
    (await iterator.filter(x => x !== 1).map(x => x * 2).toArray()).should.deep.equal([0, 4]);
  });
  it('Should apply double then filter one', async () => {
    (await iterator.map(x => x * 2).filter(x => x !== 1).toArray()).should.deep.equal([0, 2, 4]);
  });
  it('Should apply map then filter correctly', async () => {
    (await iterator.map(x => `x${x}`).filter(x => (x[1] === '0')).toArray()).should.deep.equal(['x0']);
  });
  it('Should handle transforms', async () => {
    iterator = iterator.syncTransform(function* (data) {
      yield `x${data}`;
      yield `y${data}`;
    });
    (await iterator.toArray()).should.deep.equal(['x0', 'y0', 'x1', 'y1', 'x2', 'y2']);
  });
  it('Should handle transforms and maps', async () => {
    iterator = iterator.syncTransform(function* (data) {
      yield `x${data}`;
      yield `y${data}`;
    }).map(x => `z${x}`);
    (await iterator.toArray()).should.deep.equal(['zx0', 'zy0', 'zx1', 'zy1', 'zx2', 'zy2']);
  });
  it('Should handle maps and transforms', async () => {
    iterator = iterator.map(x => `z${x}`).syncTransform(function* (data) {
      yield `x${data}`;
      yield `y${data}`;
    });
    (await iterator.toArray()).should.deep.equal(['xz0', 'yz0', 'xz1', 'yz1', 'xz2', 'yz2']);
  });

  it('Should throw errors when misusing the iterator', () => {
    iterator.map(x => x);
    expect(() => { iterator.map(x => x); }).to.throw(Error);
  });
});


describe('FastTransformIterator (production mode)', () => {
  let iterator;
  beforeEach(() => {
    process.env.NODE_ENV === 'production';
    iterator = new FastTransformIterator(range(0, 2));
  });
  it('Should handle no transforms', async () => {
    iterator.read().should.equal(0);
    iterator.read().should.equal(1);
    iterator.read().should.equal(2);
  });
  it('Should handle no transforms arrayified', async () => {
    (await iterator.toArray()).should.deep.equal([0, 1, 2]);
  });
  it('Should apply maps that doubles correctly', async () => {
    (await iterator.map(x => x * 2).toArray()).should.deep.equal([0, 2, 4]);
  });
  it('Should apply maps that doubles correctly', async () => {
    (await iterator.map(x => `x${x}`).toArray()).should.deep.equal(['x0', 'x1', 'x2']);
  });
  it('Should apply filter correctly', async () => {
    (await iterator.filter(x => x % 2 === 0).toArray()).should.deep.equal([0, 2]);
  });
  it('Should apply filter then map correctly', async () => {
    (await iterator.filter(x => x % 2 === 0).map(x => `x${x}`).toArray()).should.deep.equal(['x0', 'x2']);
  });
  it('Should apply map then filter correctly (1)', async () => {
    (await iterator.map(x => x).filter(x => x % 2 === 0).toArray()).should.deep.equal([0, 2]);
  });
  it('Should apply map then filter to false correctly', async () => {
    (await iterator.map(x => `x${x}`).filter(x => true).toArray()).should.deep.equal(['x0', 'x1', 'x2']);
  });
  it('Should apply map then filter to true correctly', async () => {
    (await iterator.map(x => `x${x}`).filter(x => false).toArray()).should.deep.equal([]);
  });
  it('Should apply filter to false then map correctly', async () => {
    (await iterator.filter(x => true).map(x => `x${x}`).toArray()).should.deep.equal(['x0', 'x1', 'x2']);
  });
  it('Should apply filter to true then map correctly', async () => {
    (await iterator.filter(x => false).map(x => `x${x}`).filter(x => false).toArray()).should.deep.equal([]);
  });
  it('Should apply filter one then double', async () => {
    (await iterator.filter(x => x !== 1).map(x => x * 2).toArray()).should.deep.equal([0, 4]);
  });
  it('Should apply double then filter one', async () => {
    (await iterator.map(x => x * 2).filter(x => x !== 1).toArray()).should.deep.equal([0, 2, 4]);
  });
  it('Should apply map then filter correctly', async () => {
    (await iterator.map(x => `x${x}`).filter(x => (x[1] === '0')).toArray()).should.deep.equal(['x0']);
  });
  it('Should handle transforms', async () => {
    iterator = iterator.syncTransform(function* (data) {
      yield `x${data}`;
      yield `y${data}`;
    });
    (await iterator.toArray()).should.deep.equal(['x0', 'y0', 'x1', 'y1', 'x2', 'y2']);
  });
  it('Should handle transforms and maps', async () => {
    iterator = iterator.syncTransform(function* (data) {
      yield `x${data}`;
      yield `y${data}`;
    }).map(x => `z${x}`);
    (await iterator.toArray()).should.deep.equal(['zx0', 'zy0', 'zx1', 'zy1', 'zx2', 'zy2']);
  });
  it('Should handle maps and transforms', async () => {
    iterator = iterator.map(x => `z${x}`).syncTransform(function* (data) {
      yield `x${data}`;
      yield `y${data}`;
    });
    (await iterator.toArray()).should.deep.equal(['xz0', 'yz0', 'xz1', 'yz1', 'xz2', 'yz2']);
  });
});

