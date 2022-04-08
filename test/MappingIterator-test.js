import {
  AsyncIterator,
  ArrayIterator,
  MappingIterator,
  range,
  fromArray,
  wrap,
  ENDED,
} from '../dist/asynciterator.js';

import { EventEmitter } from 'events';
import { expect } from 'chai';

describe('MappingIterator', () => {
  describe('The MappingIterator function', () => {
    describe('the result when called with `new`', () => {
      let instance;

      before(() => {
        instance = new MappingIterator(new ArrayIterator([]));
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

  describe('A MappingIterator with an array source', () => {
    let iterator, source;

    before(() => {
      source = new ArrayIterator([0, 1, 2, 3, 4, 5, 6]);
      iterator = new MappingIterator(source);
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

  describe('A MappingIterator with a source that emits 0 items', () => {
    it('should not return any items', done => {
      const items = [];
      const iterator = new MappingIterator(new ArrayIterator([]));
      iterator.on('data', item => { items.push(item); });
      iterator.on('end', () => {
        items.should.deep.equal([]);
        done();
      });
    });
  });

  describe('A MappingIterator with a source that is already ended', () => {
    it('should not return any items', done => {
      const items = [];
      const source = new ArrayIterator([]);
      source.on('end', () => {
        const iterator = new MappingIterator(source);
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', () => {
          items.should.deep.equal([]);
          done();
        });
      });
    });
  });

  describe('A TransformIterator with destroySource set to its default', () => {
    let iterator, source;

    before(() => {
      source = new ArrayIterator([1, 2, 3]);
      iterator = new MappingIterator(source);
    });

    describe('after being closed', () => {
      before(done => {
        iterator.read();
        iterator.close();
        iterator.on('end', done);
      });

      it('should have destroyed the source', () => {
        expect(source).to.have.property('destroyed', true);
      });
    });
  });

  describe('A TransformIterator with destroySource set to false', () => {
    let iterator, source;

    before(() => {
      source = new ArrayIterator([1, 2, 3]);
      iterator = new MappingIterator(source, x => x, { destroySource: false });
    });

    describe('after being closed', () => {
      before(done => {
        iterator.read();
        iterator.close();
        iterator.on('end', done);
      });

      it('should not have destroyed the source', () => {
        expect(source).to.have.property('destroyed', false);
      });
    });
  });

  describe('A TransformIterator with destroySource set to false', () => {
    let iterator, source;

    before(() => {
      source = new ArrayIterator([1, 2, 3]);
      captureEvents(source, 'readable', 'end');
    });

    describe('after being closed', () => {
      it('should read an element from the original source', () => {
        expect(source.read()).to.equal(1);
      });

      it('should read the next elements from the mapping iterator', () => {
        iterator = new MappingIterator(source, x => x, { destroySource: false });
        captureEvents(iterator, 'readable', 'end');

        expect(iterator.read()).to.equal(2);
        expect(iterator.read()).to.equal(3);
        expect(iterator.read()).to.equal(null);
      });

      it('should have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('should have ended', () => {
        iterator.ended.should.be.true;
      });

      it('source should have emitted the `end` event', () => {
        source._eventCounts.end.should.equal(1);
      });

      it('source should not be readable', () => {
        source.readable.should.be.false;
      });

      it('source should have ended', () => {
        source.ended.should.be.true;
      });
    });
  });

  describe('A MappingIterator with a map function', () => {
    let iterator, source, map;
    before(() => {
      let i = 0;
      source = new ArrayIterator(['a', 'b', 'c']);
      map = sinon.spy(item => item + (++i));
      iterator = new MappingIterator(source, map);
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should execute the map function on all items in order', () => {
        items.should.deep.equal(['a1', 'b2', 'c3']);
      });

      it('should have called the map function once for each item', () => {
        map.should.have.been.calledThrice;
      });

      it('should have called the map function with the iterator as `this`', () => {
        map.alwaysCalledOn(iterator).should.be.true;
      });
    });
  });

  describe('A MappingIterator with a map function that returns null', () => {
    let iterator, source, map;
    before(() => {
      let i = 0;
      source = new ArrayIterator(['a', 'b', 'c']);
      map = sinon.spy(item => {
        if (++i === 2)
          return null;
        return item + i;
      });
      iterator = new MappingIterator(source, map);
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should execute the map function on all items in order, skipping null', () => {
        items.should.deep.equal(['a1', 'c3']);
      });

      it('should have called the map function once for each item', () => {
        map.should.have.been.calledThrice;
      });

      it('should have called the map function with the iterator as `this`', () => {
        map.alwaysCalledOn(iterator).should.be.true;
      });
    });
  });

  describe('A MappingIterator with a source that returns null and sets readable false', () => {
    let iterator, source, map;
    before(() => {
      let i = 0;
      source = new AsyncIterator();
      source._readable = true;
      source.read = () => {
        if (i % 2 === 0) {
          i += 1;
          return i;
        }
        source.readable = false;
        return null;
      };
      map = sinon.spy(item => item);
      iterator = new MappingIterator(source, map);
    });

    describe('when reading items', () => {
      it('should be readable to start', () => {
        iterator.readable.should.be.true;
      });

      it('should return 0 for the first item', () => {
        iterator.read().should.equal(1);
      });

      it('should return null for the next item', () => {
        expect(iterator.read()).to.equal(null);
      });

      it('source should should not be readable after null item', () => {
        source.readable.should.be.false;
      });

      it('iterator should should not be readable after null item', () => {
        iterator.readable.should.be.false;
      });
    });
  });

  describe('A MappingIterator with a source that returns null but stays readable', () => {
    let iterator, source, map;
    before(() => {
      let i = 0;
      source = new AsyncIterator();
      source._readable = true;
      source.read = () => {
        if (i % 2 === 0) {
          i += 1;
          return i;
        }
        return null;
      };
      map = sinon.spy(item => item);
      iterator = new MappingIterator(source, map);
    });

    describe('when reading items', () => {
      it('should be readable to start', () => {
        iterator.readable.should.be.true;
      });

      it('should return 0 for the first item', () => {
        iterator.read().should.equal(1);
      });

      it('should return null for the next item', () => {
        expect(iterator.read()).to.equal(null);
      });

      it('source should should not be readable after null item', () => {
        source.readable.should.be.true;
      });

      it('iterator should should not be readable after null item', () => {
        iterator.readable.should.be.false;
      });
    });
  });

  describe('A MappingIterator with a map function that closes', () => {
    let iterator, source, map;
    before(() => {
      source = new AsyncIterator();
      source.read = sinon.spy(() => 1);
      source._readable = true;
      let read = false;
      map = function (item) {
        iterator.close();
        if (read)
          return null;

        read = true;
        return item;
      };
      iterator = new MappingIterator(source, map);
      captureEvents(iterator, 'readable', 'end');
    });

    describe('before reading an item', () => {
      it('should not have called `read` on the source', () => {
        source.read.should.not.have.been.called;
      });

      it('should have emitted the `readable` event', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should be readable', () => {
        iterator.readable.should.be.true;
      });

      it('should not have ended', () => {
        iterator.ended.should.be.false;
      });
    });

    describe('after reading a first item', () => {
      let item;
      before(() => {
        item = iterator.read();
      });

      it('should read the correct item', () => {
        item.should.equal(1);
      });

      it('should have called `read` on the source only once', () => {
        source.read.should.have.been.calledOnce;
      });

      it('should have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('should have ended', () => {
        iterator.ended.should.be.true;
      });
    });

    describe('after attempting to read again', () => {
      before(() => {
        iterator.read();
      });

      it('should have called `read` on the source only once', () => {
        source.read.should.have.been.calledOnce;
      });

      it('should have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('should have ended', () => {
        iterator.ended.should.be.true;
      });
    });
  });

  describe('A MappingIterator with a map function that closes', () => {
    let iterator, source;
    before(() => {
      source = new AsyncIterator();
      source.read = sinon.spy(() => 1);
      source._readable = true;
      iterator = new MappingIterator(source, x => x);
      captureEvents(iterator, 'readable', 'end');
    });

    describe('before reading an item', () => {
      it('should not have called `read` on the source', () => {
        source.read.should.not.have.been.called;
      });

      it('should have emitted the `readable` event', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should be readable', () => {
        iterator.readable.should.be.true;
      });

      it('should not have ended', () => {
        iterator.ended.should.be.false;
      });

      it('should return 1 when read', () => {
        iterator.read().should.equal(1);
      });

      it('should return 1 when read', () => {
        iterator.read().should.equal(1);
      });

      it('should return null when read immediately after source is not readable', () => {
        source.readable = false;
        expect(iterator.read()).to.equal(null);
      });

      it('should return 1 when read on readable source', () => {
        source.readable = true;
        expect(iterator.read()).to.equal(1);
      });

      it('should return null and close if source is not readable and closed', () => {
        source.readable = false;
        source._changeState(ENDED);
        expect(iterator.read()).to.equal(null);
      });

      it('should have be closed after the next tick', () => {
        // TODO: Whilst it is correct to wait a tick to do this, it is actually more performant,
        // and also correct to end *immediately* as this enables a long chain of iterators to be
        // closed on the same tick rather than over the course of multiple ticks. This should be
        // changed and tests added for this when merging into
        // https://github.com/RubenVerborgh/AsyncIterator/pull/45
        expect(iterator.done).to.equal(true);
      });
    });
  });

  describe('A TransformIterator with a source that errors', () => {
    let iterator, source, errorHandler;

    before(() => {
      source = new AsyncIterator();
      iterator = new MappingIterator(source);
      iterator.on('error', errorHandler = sinon.stub());
    });

    describe('before an error occurs', () => {
      it('should not have emitted any error', () => {
        errorHandler.should.not.have.been.called;
      });
    });

    describe('after a first error occurs', () => {
      let error1;
      before(() => {
        errorHandler.reset();
        source.emit('error', error1 = new Error('error1'));
      });

      it('should re-emit the error', () => {
        errorHandler.should.have.been.calledOnce;
        errorHandler.should.have.been.calledWith(error1);
      });
    });

    describe('after a second error occurs', () => {
      let error2;

      before(() => {
        errorHandler.reset();
        source.emit('error', error2 = new Error('error2'));
      });

      it('should re-emit the error', () => {
        errorHandler.should.have.been.calledOnce;
        errorHandler.should.have.been.calledWith(error2);
      });
    });

    describe('after the source has ended and errors again', () => {
      before(done => {
        errorHandler.reset();
        source.close();
        iterator.on('end', () => {
          function noop() { /* */ }
          source.on('error', noop); // avoid triggering the default error handler
          source.emit('error', new Error('error3'));
          source.removeListener('error', noop);
          done();
        });
      });

      it('should not re-emit the error', () => {
        errorHandler.should.not.have.been.called;
      });

      it('should not leave any error handlers attached', () => {
        source.listenerCount('error').should.equal(0);
      });
    });
  });

  describe('A chain of maps and filters', () => {
    for (const iteratorGen of [() => range(0, 2), () => fromArray([0, 1, 2]), () => wrap(range(0, 2))]) {
      describe(`with ${iteratorGen()}`, () => {
        let iterator;

        beforeEach(() => {
          iterator = iteratorGen();
        });

        it('should handle no transforms arrayified', async () => {
          (await iterator.toArray()).should.deep.equal([0, 1, 2]);
        });

        it('should apply maps that doubles correctly', async () => {
          (await iterator.map(x => x * 2).toArray()).should.deep.equal([0, 2, 4]);
        });

        it('should apply maps that doubles correctly and then maybemaps', async () => {
          (await iterator.map(x => x * 2).map(x => x === 2 ? null : x * 3).toArray()).should.deep.equal([0, 12]);
        });

        it('should apply maps that maybemaps correctly', async () => {
          (await iterator.map(x => x === 2 ? null : x * 3).toArray()).should.deep.equal([0, 3]);
        });

        it('should apply maps that maybemaps twice', async () => {
          (await iterator.map(x => x === 2 ? null : x * 3).map(x => x === 0 ? null : x * 3).toArray()).should.deep.equal([9]);
        });

        it('should apply maps that converts to string', async () => {
          (await iterator.map(x => `x${x}`).toArray()).should.deep.equal(['x0', 'x1', 'x2']);
        });

        it('should apply filter correctly', async () => {
          (await iterator.filter(x => x % 2 === 0).toArray()).should.deep.equal([0, 2]);
        });

        it('should apply filter then map correctly', async () => {
          (await iterator.filter(x => x % 2 === 0).map(x => `x${x}`).toArray()).should.deep.equal(['x0', 'x2']);
        });

        it('should apply map then filter correctly (1)', async () => {
          (await iterator.map(x => x).filter(x => x % 2 === 0).toArray()).should.deep.equal([0, 2]);
        });

        it('should apply map then filter to false correctly', async () => {
          (await iterator.map(x => `x${x}`).filter(x => true).toArray()).should.deep.equal(['x0', 'x1', 'x2']);
        });

        it('should apply map then filter to true correctly', async () => {
          (await iterator.map(x => `x${x}`).filter(x => false).toArray()).should.deep.equal([]);
        });

        it('should apply filter to false then map correctly', async () => {
          (await iterator.filter(x => true).map(x => `x${x}`).toArray()).should.deep.equal(['x0', 'x1', 'x2']);
        });

        it('should apply filter to true then map correctly', async () => {
          (await iterator.filter(x => false).map(x => `x${x}`).filter(x => false).toArray()).should.deep.equal([]);
        });

        it('should apply filter one then double', async () => {
          (await iterator.filter(x => x !== 1).map(x => x * 2).toArray()).should.deep.equal([0, 4]);
        });

        it('should apply double then filter one', async () => {
          (await iterator.map(x => x * 2).filter(x => x !== 1).toArray()).should.deep.equal([0, 2, 4]);
        });

        it('should apply map then filter correctly', async () => {
          (await iterator.map(x => `x${x}`).filter(x => (x[1] === '0')).toArray()).should.deep.equal(['x0']);
        });

        it('should correctly apply 3 filters', async () => {
          (await range(0, 5).filter(x => x !== 1).filter(x => x !== 2).filter(x => x !== 2).toArray()).should.deep.equal([0, 3, 4, 5]);
        });

        it('should correctly apply 3 maps', async () => {
          (await range(0, 1).map(x => x * 2).map(x => `z${x}`).map(x => `y${x}`).toArray()).should.deep.equal(['yz0', 'yz2']);
        });

        it('should correctly apply a map, followed by a filter, followed by another map', async () => {
          (await range(0, 1).map(x => x * 2).filter(x => x !== 2).map(x => `y${x}`).toArray()).should.deep.equal(['y0']);
        });

        it('should correctly apply a filter-map-filter', async () => {
          (await range(0, 2).filter(x => x !== 1).map(x => x * 3).filter(x => x !== 6).toArray()).should.deep.equal([0]);
        });

        describe('chaining with .map', () => {
          let iter;

          beforeEach(() => {
            iter = iterator.map(x => x);
          });

          describe('when iter is closed', () => {
            beforeEach(done => {
              iter.on('end', done);
              iter.close();
            });

            it('should have the primary iterator destroyed', () => {
              iter.closed.should.be.true;
              iterator.destroyed.should.be.true;
            });
          });

          describe('nested chaining with .map', () => {
            let nestedIter;

            beforeEach(done => {
              nestedIter = iter.map(x => x);
              nestedIter.on('end', done);
              nestedIter.close();
            });

            it('should have the primary and first level iterator destroyed with the last one closed', () => {
              iterator.destroyed.should.be.true;
              iter.destroyed.should.be.true;
              nestedIter.closed.should.be.true;
            });
          });
        });

        describe('when called on an iterator with a `this` argument', () => {
          const self = {};
          let map, result;

          before(() => {
            let i = 0;
            iterator = new ArrayIterator(['a', 'b', 'c']);
            map = sinon.spy(item => item + (++i));
            result = iterator.map(map, self);
          });

          describe('the return value', () => {
            const items = [];

            before(done => {
              result.on('data', item => { items.push(item); });
              result.on('end', done);
            });

            it('should call the map function once for each item', () => {
              map.should.have.been.calledThrice;
            });

            it('should call the map function with the passed argument as `this`', () => {
              map.alwaysCalledOn(self).should.be.true;
            });
          });
        });

        describe('when called on an iterator with a `this` argument with nested map', () => {
          const self = {};
          let map, result;

          before(() => {
            let i = 0;
            iterator = new ArrayIterator(['a', 'b', 'c']);
            map = sinon.spy(item => item + (++i));
            result = iterator.map(x => x).map(map, self);
          });

          describe('the return value', () => {
            const items = [];

            before(done => {
              result.on('data', item => { items.push(item); });
              result.on('end', done);
            });

            it('should call the map function once for each item', () => {
              map.should.have.been.calledThrice;
            });

            it('should call the map function with the passed argument as `this`', () => {
              map.alwaysCalledOn(self).should.be.true;
            });
          });
        });
      });
    }
  });

  describe('The AsyncIterator#map function', () => {
    it('should be a function', () => {
      expect(AsyncIterator.prototype.map).to.be.a('function');
    });

    describe('when called on an iterator', () => {
      let iterator, map, result;
      before(() => {
        let i = 0;
        iterator = new ArrayIterator(['a', 'b', 'c']);
        map = sinon.spy(item => item + (++i));
        result = iterator.map(map);
      });

      describe('the return value', () => {
        const items = [];
        before(done => {
          result.on('data', item => { items.push(item); });
          result.on('end', done);
        });

        it('should be a MappingIterator', () => {
          result.should.be.an.instanceof(MappingIterator);
        });

        it('should execute the map function on all items in order', () => {
          items.should.deep.equal(['a1', 'b2', 'c3']);
        });

        it('should call the map function once for each item', () => {
          map.should.have.been.calledThrice;
        });

        it('should call the map function with the returned iterator as `this`', () => {
          map.alwaysCalledOn(result).should.be.true;
        });
      });
    });

    describe('when called on an iterator with a `this` argument', () => {
      const self = {};
      let iterator, map, result;
      before(() => {
        let i = 0;
        iterator = new ArrayIterator(['a', 'b', 'c']);
        map = sinon.spy(item => item + (++i));
        result = iterator.map(map, self);
      });

      describe('the return value', () => {
        const items = [];
        before(done => {
          result.on('data', item => { items.push(item); });
          result.on('end', done);
        });

        it('should be a MappingIterator', () => {
          result.should.be.an.instanceof(MappingIterator);
        });

        it('should execute the map function on all items in order', () => {
          items.should.deep.equal(['a1', 'b2', 'c3']);
        });

        it('should call the map function once for each item', () => {
          map.should.have.been.calledThrice;
        });

        it('should call the map function with the passed argument as `this`', () => {
          map.alwaysCalledOn(self).should.be.true;
        });
      });
    });
  });

  describe('The AsyncIterator#filter function', () => {
    it('should be a function', () => {
      expect(AsyncIterator.prototype.filter).to.be.a('function');
    });

    describe('when called on an iterator', () => {
      let iterator, filter, result;
      before(() => {
        iterator = new ArrayIterator(['a', 'b', 'c']);
        filter = sinon.spy(item => item !== 'b');
        result = iterator.filter(filter);
      });

      describe('the return value', () => {
        const items = [];
        before(done => {
          result.on('data', item => { items.push(item); });
          result.on('end', done);
        });

        it('should be a MappingIterator', () => {
          result.should.be.an.instanceof(MappingIterator);
        });

        it('should execute the filter function on all items in order', () => {
          items.should.deep.equal(['a', 'c']);
        });

        it('should call the filter function once for each item', () => {
          filter.should.have.been.calledThrice;
        });

        it('should call the filter function with the returned iterator as `this`', () => {
          filter.alwaysCalledOn(result).should.be.true;
        });
      });
    });

    describe('when called on an iterator with a `this` argument', () => {
      const self = {};
      let iterator, filter, result;
      before(() => {
        iterator = new ArrayIterator(['a', 'b', 'c']);
        filter = sinon.spy(item => item !== 'b');
        result = iterator.filter(filter, self);
      });

      describe('the return value', () => {
        const items = [];
        before(done => {
          result.on('data', item => { items.push(item); });
          result.on('end', done);
        });

        it('should be a MappingIterator', () => {
          result.should.be.an.instanceof(MappingIterator);
        });

        it('should execute the filter function on all items in order', () => {
          items.should.deep.equal(['a', 'c']);
        });

        it('should call the filter function once for each item', () => {
          filter.should.have.been.calledThrice;
        });

        it('should call the filter function with the passed argument as `this`', () => {
          filter.alwaysCalledOn(self).should.be.true;
        });
      });
    });
  });

  describe('The AsyncIterator#uniq function', () => {
    it('should be a function', () => {
      expect(AsyncIterator.prototype.uniq).to.be.a('function');
    });

    describe('when called on an iterator', () => {
      let iterator, result;
      before(() => {
        iterator = new ArrayIterator([1, 1, 2, 1, 1, 2, 2, 3, 3, 3, 3]);
        result = iterator.uniq();
      });

      describe('the return value', () => {
        const items = [];
        before(done => {
          result.on('data', item => { items.push(item); });
          result.on('end', done);
        });

        it('should be a MappingIterator', () => {
          result.should.be.an.instanceof(MappingIterator);
        });

        it('only contains unique items', () => {
          items.should.deep.equal([1, 2, 3]);
        });
      });
    });

    describe('when called with a hashing function', () => {
      let iterator, hash, result;
      before(() => {
        iterator = new ArrayIterator([{ x: 1 }, { x: 1 }, { x: 1 }]);
        hash = sinon.spy(x => JSON.stringify(x));
        result = iterator.uniq(hash);
      });

      describe('the return value', () => {
        const items = [];
        before(done => {
          result.on('data', item => { items.push(item); });
          result.on('end', done);
        });

        it('should be a MappingIterator', () => {
          result.should.be.an.instanceof(MappingIterator);
        });

        it('only contains unique items', () => {
          items.should.deep.equal([{ x: 1 }]);
        });

        it('should call the hash function once for each item', () => {
          hash.should.have.been.calledThrice;
        });

        it('should call the hash function with the returned iterator as `this`', () => {
          hash.alwaysCalledOn(result).should.be.true;
        });
      });
    });
  });

  describe('The AsyncIterator#skip function', () => {
    it('should be a function', () => {
      expect(AsyncIterator.prototype.skip).to.be.a('function');
    });

    describe('when called on an iterator', () => {
      let iterator, result;
      before(() => {
        iterator = new ArrayIterator(['a', 'b', 'c', 'd', 'e']);
        result = iterator.skip(2);
      });

      describe('the return value', () => {
        const items = [];
        before(done => {
          result.on('data', item => { items.push(item); });
          result.on('end', done);
        });

        it('should be a MappingIterator', () => {
          result.should.be.an.instanceof(MappingIterator);
        });

        it('should skip the given number of items', () => {
          items.should.deep.equal(['c', 'd', 'e']);
        });
      });
    });

    describe('on an array', () => {
      let iterator, source;

      before(() => {
        source = new ArrayIterator([0, 1, 2, 3, 4, 5, 6]);
        iterator = source.skip(4);
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

    describe('on a range', () => {
      let iterator, source;

      before(() => {
        source = range(0, 6);
        iterator = source.skip(4);
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

    describe('on a source that emits 0 items', () => {
      it('should not return any items', done => {
        const items = [];
        const iterator = new ArrayIterator([]).skip(10);
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', () => {
          items.should.deep.equal([]);
          done();
        });
      });
    });

    describe('with a limit of 0 items', () => {
      it('should emit all items', done => {
        const items = [];
        const iterator = new ArrayIterator([0, 1, 2, 3, 4, 5, 6]).skip(0);
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', () => {
          items.should.deep.equal([0, 1, 2, 3, 4, 5, 6]);
          done();
        });
      });
    });

    describe('with a limit of Infinity items', () => {
      it('should skip all items', done => {
        const items = [];
        const iterator = new ArrayIterator([0, 1, 2, 3, 4, 5, 6]).skip(Infinity);
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', () => {
          items.should.deep.equal([]);
          done();
        });
      });
    });
  });
});
