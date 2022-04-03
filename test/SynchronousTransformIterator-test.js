import {
  AsyncIterator,
  ArrayIterator,
  SynchronousTransformIterator,
} from '../dist/asynciterator.js';

import { EventEmitter } from 'events';

class _SynchronousTransformIterator extends SynchronousTransformIterator {
  read() {
    return this._readSource();
  }
}

describe('SynchronousTransformIterator', () => {
  describe('The SynchronousTransformIterator function', () => {
    describe('the result when called with `new`', () => {
      let instance;
      before(() => {
        instance = new _SynchronousTransformIterator(new ArrayIterator([]));
      });

      it('should be a SynchronousTransformIterator object', () => {
        instance.should.be.an.instanceof(SynchronousTransformIterator);
      });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });
  });

  describe('A SynchronousTransformIterator', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator([0, 1, 2, 3, 4, 5, 6]);
      iterator = new _SynchronousTransformIterator(source);
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should return all items', () => {
        items.should.deep.equal([0, 1, 2, 3, 4, 5, 6]);
      });
    });
  });

  describe('A SynchronousTransformIterator with a source that emits 0 items', () => {
    it('should not return any items', done => {
      const items = [];
      const iterator = new _SynchronousTransformIterator(new ArrayIterator([]));
      iterator.on('data', item => { items.push(item); });
      iterator.on('end', () => {
        items.should.deep.equal([]);
        done();
      });
    });
  });

  describe('A SynchronousTransformIterator with a source that is already ended', () => {
    it('should not return any items', done => {
      const items = [];
      const source = new ArrayIterator([]);
      source.on('end', () => {
        const iterator = new _SynchronousTransformIterator(source);
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', () => {
          items.should.deep.equal([]);
          done();
        });
      });
    });
  });
});
