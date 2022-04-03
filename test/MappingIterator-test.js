import {
  AsyncIterator,
  ArrayIterator,
  MappingIterator,
} from '../dist/asynciterator.js';

import { EventEmitter } from 'events';

describe('MappingIterator', () => {
  describe('The MappingIterator function', () => {
    describe('the result when called with `new`', () => {
      let instance;
      before(() => {
        instance = new MappingIterator(new ArrayIterator([]), item => item);
      });

      it('should be a MappingIterator object', () => {
        instance.should.be.an.instanceof(MappingIterator);
      });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });
  });

  describe('A MappingIterator', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator([0, 1, 2, 3, 4, 5, 6]);
      iterator = new MappingIterator(source, item => item * 2);
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should return items mapped according to the mapping function', () => {
        items.should.deep.equal([0, 2, 4, 6, 8, 10, 12]);
      });
    });
  });

  describe('A MappingIterator with a source that emits 0 items', () => {
    it('should not return any items', done => {
      const items = [];
      const iterator = new MappingIterator(new ArrayIterator([]), item => item);
      iterator.on('data', item => { items.push(item); });
      iterator.on('end', () => {
        items.should.deep.equal([]);
        done();
      });
    });
  });
});
