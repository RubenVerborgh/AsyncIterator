import {
  AsyncIterator,
  ArrayIterator,
  SkippingIterator,
} from '../dist/asynciterator.js';

import { EventEmitter } from 'events';

describe('SkippingIterator', () => {
  describe('The SkippingIterator function', () => {
    describe('the result when called with `new`', () => {
      let instance;
      before(() => {
        instance = new SkippingIterator(new ArrayIterator([]), 10);
      });

      it('should be a SkippingIterator object', () => {
        instance.should.be.an.instanceof(SkippingIterator);
      });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });
  });

  describe('A SkippingIterator', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator([0, 1, 2, 3, 4, 5, 6]);
      iterator = new SkippingIterator(source, 4);
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should return items skipping the specified amount', () => {
        items.should.deep.equal([4, 5, 6]);
      });
    });
  });

  describe('A SkippingIterator with a source that emits 0 items', () => {
    it('should not return any items', done => {
      const items = [];
      const iterator = new SkippingIterator(new ArrayIterator([]), 10);
      iterator.on('data', item => { items.push(item); });
      iterator.on('end', () => {
        items.should.deep.equal([]);
        done();
      });
    });
  });

  describe('A SkippingIterator with a limit of 0 items', () => {
    it('should emit all items', done => {
      const items = [];
      const iterator = new SkippingIterator(new ArrayIterator([0, 1, 2, 3, 4, 5, 6]), 0);
      iterator.on('data', item => { items.push(item); });
      iterator.on('end', () => {
        items.should.deep.equal([0, 1, 2, 3, 4, 5, 6]);
        done();
      });
    });
  });

  describe('A SkippingIterator with a limit of Infinity items', () => {
    it('should skip all items', done => {
      const items = [];
      const iterator = new SkippingIterator(new ArrayIterator([0, 1, 2, 3, 4, 5, 6]), Infinity);
      iterator.on('data', item => { items.push(item); });
      iterator.on('end', () => {
        items.should.deep.equal([]);
        done();
      });
    });
  });
});
