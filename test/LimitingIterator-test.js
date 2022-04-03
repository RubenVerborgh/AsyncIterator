import {
  AsyncIterator,
  ArrayIterator,
  LimitingIterator,
} from '../dist/asynciterator.js';

import { EventEmitter } from 'events';

describe('LimitingIterator', () => {
  describe('The LimitingIterator function', () => {
    describe('the result when called with `new`', () => {
      let instance;
      before(() => {
        instance = new LimitingIterator(new ArrayIterator([]), 10);
      });

      it('should be a LimitingIterator object', () => {
        instance.should.be.an.instanceof(LimitingIterator);
      });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });
  });

  describe('A LimitingIterator', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator([0, 1, 2, 3, 4, 5, 6]);
      iterator = new LimitingIterator(source, 4);
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should return items limited to the specified limit', () => {
        items.should.deep.equal([0, 1, 2, 3]);
      });
    });
  });

  describe('A LimitingIterator with a source that emits 0 items', () => {
    it('should not return any items', done => {
      const items = [];
      const iterator = new LimitingIterator(new ArrayIterator([]), 10);
      iterator.on('data', item => { items.push(item); });
      iterator.on('end', () => {
        items.should.deep.equal([]);
        done();
      });
    });
  });

  describe('A LimitingIterator with a limit of 0 items', () => {
    it('should not emit any items', done => {
      const items = [];
      const iterator = new LimitingIterator(new ArrayIterator([0, 1, 2]), 0);
      iterator.on('data', item => { items.push(item); });
      iterator.on('end', () => {
        items.should.deep.equal([]);
        done();
      });
    });
  });

  describe('A LimitingIterator with a limit of Infinity items', () => {
    it('should emit all items', done => {
      const items = [];
      const iterator = new LimitingIterator(new ArrayIterator([0, 1, 2, 3, 4, 5, 6]), Infinity);
      iterator.on('data', item => { items.push(item); });
      iterator.on('end', () => {
        items.should.deep.equal([0, 1, 2, 3, 4, 5, 6]);
        done();
      });
    });
  });
});
