import {
  AsyncIterator,
  ArrayIterator,
  FilteringIterator,
} from '../dist/asynciterator.js';

import { EventEmitter } from 'events';

describe('FilteringIterator', () => {
  describe('The FilteringIterator function', () => {
    describe('the result when called with `new`', () => {
      let instance;
      before(() => {
        instance = new FilteringIterator(new ArrayIterator([]), item => true);
      });

      it('should be a FilteringIterator object', () => {
        instance.should.be.an.instanceof(FilteringIterator);
      });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });
  });

  describe('A FilteringIterator', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator([0, 1, 2, 3, 4, 5, 6]);
      iterator = new FilteringIterator(source, item => item % 2 === 0);
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should return items mapped according to the mapping function', () => {
        items.should.deep.equal([0, 2, 4, 6]);
      });
    });
  });

  describe('A FilteringIterator with a source that emits 0 items', () => {
    it('should not return any items', done => {
      const items = [];
      const iterator = new FilteringIterator(new ArrayIterator([]), () => true);
      iterator.on('data', item => { items.push(item); });
      iterator.on('end', () => {
        items.should.deep.equal([]);
        done();
      });
    });
  });
});
