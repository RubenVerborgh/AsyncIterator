import { AsyncIterator, ArrayIterator, WrappingIterator, wrap, fromArray } from '../dist/asynciterator.js';
import { EventEmitter } from 'events';

describe('WrappingIterator', () => {
  describe('The WrappingIterator function', () => {
    describe('the result when called with `new`', () => {
      let instance;

      before(() => {
        instance = new WrappingIterator(new ArrayIterator([]));
      });

      it('should be a WrappingIterator object', () => {
        instance.should.be.an.instanceof(WrappingIterator);
      });

      it('should be a AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });
  });
  describe('the result when called with new and with an invalid source', () => {
    it('should emit an error', done => {
      const source = {};
      const wrapped = new WrappingIterator(source);
      wrapped.on('error', err => {
        err;
        done();
      });
    });
  });
  describe('with an empty source iterator', () => {
    it('should end when the source iterator ends and letIteratorThrough is not set', done => {
      const source = new ArrayIterator([]);
      const wrapped = new WrappingIterator(source);
      wrapped.on('end', () => {
        done();
      });
    });
    it('should end when the source iterator ends and letIteratorThrough is set to true', done => {
      const source = new ArrayIterator([]);
      const wrapped = new WrappingIterator(source, { letIteratorThrough: true });
      wrapped.on('end', () => {
        done();
      });
    });
  });
  describe('with a non-empty source', () => {
    it('should end when the source ends', done => {
      const source = new ArrayIterator([0, 1, 2, 3, 4]);
      const wrapped = new WrappingIterator(source);
      wrapped.on('data', item => { item; }).on('end', () => {
        done();
      });
    });
    it('should emit items from the source before ending', done => {
      const array = [0, 1, 2, 3, 4];
      const source = new ArrayIterator(array);
      const wrapped = new WrappingIterator(source);
      let i = 0;
      wrapped
        .on('data', item => {
          item.should.equal(array[i++]);
        })
        .on('end', () => {
          done();
        });
    });
  });
  describe('with a promise of a non-empty source', () => {
    it('should emit items from the source before ending', done => {
      const array = [0, 1, 2, 3, 4];
      const source = new ArrayIterator(array);
      const wrapped = new WrappingIterator(Promise.resolve(source));
      let i = 0;
      wrapped
        .on('data', item => {
          item.should.equal(array[i++]);
        })
        .on('end', () => {
          done();
        });
    });
  });
  describe('source with read, on and iterable methods', () => {
    let obj;

    beforeEach(() => {
      obj = fromArray([1]);
      obj[Symbol.iterator] = function * () {
        yield 'x';
        yield 'y';
      };
    });

    it('should prioritize the read method', async () => {
      (await wrap(obj).toArray()).should.deep.equal([1]);
    });
    it('should use the iterator when correctly set-up', async () => {
      (await wrap(obj, { prioritizeIterable: true }).toArray()).should.deep.equal(['x', 'y']);
    });
    it('wrapping should produce a new object', async () => {
      wrap(obj).should.not.equal(obj);
    });
  });
  describe('source that emits an error', () => {
    it('relay the error', done => {
      const err = new Error('some error');
      const source = new ArrayIterator([0, 1, 2, 3]);
      const iterator = new WrappingIterator(source);
      iterator.on('error', iteratorErr => {
        expect(iteratorErr).to.equal(err);
        done();
      });
      source.emit('error', err);
    });
  });
  describe('promise of a source that rejects', () => {
    it('emit the error', done => {
      const err = new Error('some error');
      const iterator = new WrappingIterator(Promise.reject(err));
      iterator.on('error', iteratorErr => {
        expect(iteratorErr).to.equal(err);
        done();
      });
    });
  });
  describe('promise of a source', () => {
    it('read null until the promise resolves', done => {
      const promise = new Promise(resolve => {
        setTimeout(() => {
          resolve(new ArrayIterator([0, 1, 2, 3]));
        }, 10);
      });
      const iterator = new WrappingIterator(promise);
      expect(iterator.readable).to.equal(false);
      expect(iterator.read()).to.equal(null);
      done();
    });
  });
});
