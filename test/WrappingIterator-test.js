import { AsyncIterator, ArrayIterator, WrappingIterator } from '../dist/asynciterator.js';
import { EventEmitter } from 'events';

describe('WrappingIterator', () => {
  describe('The WrappingIterator function', () => {
    describe('the result when called with `new`', () => {
      let instance;

      before(() => {
        instance = new WrappingIterator({});
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
  describe('with an invalid source', () => {
    it('should emit an error', done => {
      const source = {};
      const wrapped = new WrappingIterator(source);
      wrapped.on('error', err => {
        err;
        done();
      });
    });
  });
  describe('with an empty source', () => {
    it('should end when the source ends', done => {
      const source = new ArrayIterator([]);
      const wrapped = new WrappingIterator(source);
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
});
