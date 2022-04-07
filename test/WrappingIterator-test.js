import {
  AsyncIterator,
  ArrayIterator,
  WrappingIterator,
  TransformIterator,
  EmptyIterator,
  IntegerIterator,
  fromIterable,
  fromIterator,
  wrap,
} from '../dist/asynciterator.js';

import { EventEmitter } from 'events';
import { Readable } from 'stream';

describe('WrappingIterator', () => {
  describe('The WrappingIterator function', () => {
    describe('the result when called with `new`', () => {
      let instance;
      before(() => { instance = new WrappingIterator(new EmptyIterator()); });

      it('should be an WrappingIterator object', () => {
        instance.should.be.an.instanceof(WrappingIterator);
      });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });
  });

  describe('with an empty iterable', () => {
    let iterator;
    before(() => { iterator = fromIterable((function * () { /* empty */ })()); });

    it('should be readable', () => {
      expect(iterator.readable).to.be.true;
    });

    it('should end after the first invocation of read, which should return null', done => {
      expect(iterator.once('end', done).read()).to.equal(null);
    });

    it('should not be readable anymore', () => {
      expect(iterator.readable).to.equal(false);
    });
  });

  describe('with an iterable that emits one item', () => {
    let iterator;
    before(() => { iterator = fromIterable((function * () { yield 'first'; })()); });

    it('should be readable', () => {
      expect(iterator.readable).to.be.true;
    });

    it('should read the first item', () => {
      expect(iterator.read()).to.equal('first');
    });

    it('should end after the second invocation of read, which should return null', done => {
      expect(iterator.on('end', done).read()).to.equal(null);
    });

    it('should not be readable anymore', () => {
      expect(iterator.readable).to.be.false;
    });
  });

  describe('with an iterable that emits 10 items', () => {
    let iterator;
    beforeEach(() => {
      iterator = new WrappingIterator((function * () {
        for (let i = 0; i < 10; i += 1)
          yield i;
      })());
    });

    it('should emit all items', async () => {
      const arr = await iterator.toArray();
      expect(arr).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  describe('with an iterator that emits one item', () => {
    let iterator;
    before(() => {
      let done = false;
      iterator = fromIterator({
        next: () => {
          if (done)
            return { done };
          done = true;
          return { value: 'first' };
        },
      });
    });

    it('should be readable', () => {
      expect(iterator.readable).to.be.true;
    });

    it('should read the first item', () => {
      expect(iterator.read()).to.equal('first');
    });

    it('should end after the second invocation of read, which should return null', done => {
      expect(iterator.on('end', done).read()).to.equal(null);
    });

    it('should not be readable anymore', () => {
      expect(iterator.readable).to.be.false;
    });
  });

  describe('with an array source', () => {
    let iterator, source;
    before(() => {
      source = [0, 1, 2, 3, 4];
      iterator = new WrappingIterator(source);
    });

    it('should emit all items', async () => {
      expect(await iterator.toArray()).to.deep.equal([0, 1, 2, 3, 4]);
    });
  });

  describe('with an array source', () => {
    let iterator, source;
    before(() => {
      source = Promise.resolve([0, 1, 2, 3, 4]);
      iterator = new WrappingIterator(source);
    });

    it('should emit all items', async () => {
      expect(await iterator.toArray()).to.deep.equal([0, 1, 2, 3, 4]);
    });
  });

  describe('with a stream.Readable source', () => {
    let iterator, source;
    before(() => {
      source = Readable.from([0, 1, 2, 3, 4]);
      iterator = new WrappingIterator(source);
    });

    it('should emit all items', async () => {
      expect(await iterator.toArray()).to.deep.equal([0, 1, 2, 3, 4]);
    });
  });

  describe('with a promisified stream.Readable source', () => {
    let iterator, source;
    before(() => {
      source = Promise.resolve(Readable.from([0, 1, 2, 3, 4]));
      iterator = new WrappingIterator(source);
    });

    it('should emit all items', async () => {
      expect(await iterator.toArray()).to.deep.equal([0, 1, 2, 3, 4]);
    });
  });

  describe('with an AsyncIterator source', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator([0, 1, 2, 3, 4]);
      iterator = new WrappingIterator(source);
    });

    it('should emit all items', async () => {
      expect(await iterator.toArray()).to.deep.equal([0, 1, 2, 3, 4]);
    });
  });

  describe('with a promisified AsyncIterator source', () => {
    let iterator, source;
    before(() => {
      source = Promise.resolve(new ArrayIterator([0, 1, 2, 3, 4]));
      iterator = new WrappingIterator(source);
    });

    it('should emit all items', async () => {
      expect(await iterator.toArray()).to.deep.equal([0, 1, 2, 3, 4]);
    });
  });

  describe('with an EmptyIterator source that never emits a readable event', () => {
    let iterator;
    before(() => {
      iterator = new WrappingIterator(new EmptyIterator());
      captureEvents(iterator, 'readable', 'end');
    });

    it('should have emitted the end event', () => {
      expect(iterator._eventCounts.end).to.equal(1);
    });
  });

  describe('with a promisified IntegerIterator', () => {
    let iterator, source;
    before(() => {
      source = Promise.resolve(new IntegerIterator({ start: 0, step: 1, end: 4 }));
      iterator = new WrappingIterator(source);
      captureEvents(iterator, 'readable');
    });

    it('should have emitted the readable event', () => {
      expect(iterator._eventCounts.readable).to.be.gt(0);
    });

    it('should emit all items', async () => {
      expect(await iterator.toArray()).to.deep.equal([0, 1, 2, 3, 4]);
    });
  });

  describe('with a buffering AsyncIterator source with autoStart: false', () => {
    let iterator, source;
    before(() => {
      source = new TransformIterator(new ArrayIterator([0, 1, 2, 3, 4]), { autoStart: false });
      iterator = new WrappingIterator(source);
      captureEvents(iterator, 'readable');
    });

    it('should have emitted the readable event', () => {
      expect(iterator._eventCounts.readable).to.be.gt(0);
    });

    it('should emit all items', async () => {
      expect(await iterator.toArray()).to.deep.equal([0, 1, 2, 3, 4]);
    });
  });

  describe('with a buffering AsyncIterator source with autoStart: true', () => {
    let iterator;
    let source;

    before(() => {
      source = new TransformIterator(new ArrayIterator([0, 1, 2, 3, 4]), { autoStart: true });
      iterator = new WrappingIterator(source);
      captureEvents(iterator, 'readable');
    });

    it('should have emitted the readable event', () => {
      expect(iterator._eventCounts.readable).to.be.gt(0);
    });

    it('should emit all items', async () => {
      expect(await iterator.toArray()).to.deep.equal([0, 1, 2, 3, 4]);
    });
  });

  describe('with a rejecting promise as a source', () => {
    it('should emit the error', done => {
      const error = new Error('some error');
      const iterator = new WrappingIterator(Promise.reject(error));
      iterator.once('error', e => {
        expect(e).to.equal(error);
        done();
      });
    });
  });

  describe('with a stream.Readable source that emits an error', () => {
    it('should relay the error downstream', done => {
      const error = new Error('some error');
      const source = new Readable({
        read() {
          return null;
        },
      });
      const iterator = new WrappingIterator(source);
      iterator.once('error', e => {
        expect(e).to.equal(error);
        done();
      });
      source.emit('error', error);
    });
  });
});

describe('wrap', () => {
  describe('with a stream.Readable source', () => {
    let iterator;
    let source;
    before(() => {
      source = Readable.from([0, 1, 2, 3, 4]);
      iterator = wrap(source);
    });

    it('should return an instance of WrappingIterator', async () => {
      expect(iterator).to.be.instanceof(WrappingIterator);
    });

    it('should emit all items', async () => {
      expect(await iterator.toArray()).to.deep.equal([0, 1, 2, 3, 4]);
    });
  });

  describe('with a promisified stream.Readable source', () => {
    let iterator, source;
    before(() => {
      source = Promise.resolve(Readable.from([0, 1, 2, 3, 4]));
      iterator = wrap(source);
    });

    it('should return an instance of WrappingIterator', async () => {
      expect(iterator).to.be.instanceof(WrappingIterator);
    });

    it('should emit all items', async () => {
      expect(await iterator.toArray()).to.deep.equal([0, 1, 2, 3, 4]);
    });
  });

  describe('with an AsyncIterator source', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator([0, 1, 2, 3, 4]);
      iterator = wrap(source);
    });

    it('should return the source itself', () => {
      expect(iterator).to.equal(source);
    });

    it('should emit all items', async () => {
      expect(await iterator.toArray()).to.deep.equal([0, 1, 2, 3, 4]);
    });
  });

  describe('with a rejecting promise as a source', () => {
    it('should return an instance of WrappingIterator', done => {
      const err = new Error('some error');
      const iterator = wrap(Promise.reject(err));
      expect(iterator).to.be.instanceof(WrappingIterator);
      iterator.once('error', _err => {
        expect(_err).to.equal(err);
        done();
      });
    });
  });

  describe('with an invalid source', () => {
    it('should throw an error', done => {
      try {
        wrap({});
      }
      catch (err) {
        expect(err.message).to.match(/^Invalid source/);
        done();
      }
    });
  });

  describe('with an instance of Iterator as the source', () => {
    let source;
    let iterator;
    before(() => {
      source = (function * () {
        for (let i = 0; i < 5; i += 1)
          yield i;
      }());
      iterator = wrap(source);
    });

    it('should return an instance of WrappingIterator', () => {
      expect(iterator).to.be.instanceof(WrappingIterator);
    });

    it('should emit all items', async () => {
      expect(await iterator.toArray()).to.deep.equal([0, 1, 2, 3, 4]);
    });
  });

  describe('with an instance of Iterable as the source', () => {
    let source;
    let iterator;
    before(() => {
      source = {
        *[Symbol.iterator]() {
          for (let i = 0; i < 5; i += 1)
            yield i;
        },
      };
      iterator = wrap(source);
    });

    it('should return an instance of WrappingIterator', () => {
      expect(iterator).to.be.instanceof(WrappingIterator);
    });

    it('should emit all items', async () => {
      expect(await iterator.toArray()).to.deep.equal([0, 1, 2, 3, 4]);
    });
  });
});
