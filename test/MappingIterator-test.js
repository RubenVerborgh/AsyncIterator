import {
  AsyncIterator,
  ArrayIterator,
  IntegerIterator,
  MappingIterator,
  range,
  fromArray,
  wrap,
} from '../dist/asynciterator.js';

import { EventEmitter } from 'events';

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
      iterator = new MappingIterator(source, undefined, { destroySource: false });
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
      // eslint-disable-next-line no-loop-func
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

        it('should destroy when closed before being read after map', () => {
          iterator.map(x => x).close();
          iterator.destroyed.should.be.true;
        });

        it('should destroy when closed before being read after map then filter', () => {
          it = iterator.map(x => x);
          it.filter(x => true).close();
          iterator.destroyed.should.be.true;
          it.destroyed.should.be.true;
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

        it('should skip the given number of items', () => {
          items.should.deep.equal(['c', 'd', 'e']);
        });
      });
    });
  });

  describe('The AsyncIterator#take function', () => {
    it('should be a function', () => {
      expect(AsyncIterator.prototype.take).to.be.a('function');
    });

    describe('when called on an iterator', () => {
      let iterator, result;
      before(() => {
        iterator = new ArrayIterator(['a', 'b', 'c', 'd', 'e']);
        result = iterator.take(3);
      });

      describe('the return value', () => {
        const items = [];
        before(done => {
          result.on('data', item => { items.push(item); });
          result.on('end', done);
        });

        it('should take the given number of items', () => {
          items.should.deep.equal(['a', 'b', 'c']);
        });
      });
    });
  });

  describe('The AsyncIterator#range function', () => {
    it('should be a function', () => {
      expect(AsyncIterator.prototype.range).to.be.a('function');
    });

    describe('when called on an iterator', () => {
      let iterator, result;
      before(() => {
        iterator = new IntegerIterator();
        result = iterator.range(20, 29);
      });

      describe('the return value', () => {
        const items = [];
        before(done => {
          result.on('data', item => { items.push(item); });
          result.on('end', done);
        });

        it('should contain the indicated range', () => {
          items.should.have.length(10);
          items[0].should.equal(20);
          items[9].should.equal(29);
        });
      });
    });

    describe('when called on an iterator with an inverse range', () => {
      let iterator, result;
      before(() => {
        iterator = new IntegerIterator();
        sinon.spy(iterator, 'read');
      });

      describe('the return value', () => {
        const items = [];
        before(done => {
          result = iterator.range(30, 20);
          result.on('data', item => { items.push(item); });
          result.on('end', done);
        });

        it('should be empty', () => {
          items.should.be.empty;
        });
      });
    });
  });

  describe('Skipping', () => {
    describe('The .skip function', () => {
      describe('the result', () => {
        let instance;

        before(() => {
          instance = new ArrayIterator([]).skip(10);
        });

        it('should be an AsyncIterator object', () => {
          instance.should.be.an.instanceof(AsyncIterator);
        });

        it('should be an EventEmitter object', () => {
          instance.should.be.an.instanceof(EventEmitter);
        });
      });
    });

    describe('A .skip on an array', () => {
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

    describe('A .skip on a range', () => {
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

    describe('A .skip with a source that emits 0 items', () => {
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

    describe('A .skip with a limit of 0 items', () => {
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

    describe('A .skip with a limit of Infinity items', () => {
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

    describe('.take', () => {
      describe('A .take', () => {
        let iterator, source;
        before(() => {
          source = new ArrayIterator([0, 1, 2, 3, 4, 5, 6]);
          iterator = source.take(4);
        });

        describe('when reading items', () => {
          const items = [];
          before(done => {
            iterator.on('data', item => { items.push(item); });
            iterator.on('end', done);
          });

          it('should return items to the specified take', () => {
            items.should.deep.equal([0, 1, 2, 3]);
          });
        });
      });

      describe('A .take with a source that emits 0 items', () => {
        it('should not return any items', done => {
          const items = [];
          const iterator = new ArrayIterator([]).take(10);
          iterator.on('data', item => { items.push(item); });
          iterator.on('end', () => {
            items.should.deep.equal([]);
            done();
          });
        });
      });

      describe('A .take with a take of 0 items', () => {
        it('should not emit any items', done => {
          const items = [];
          const iterator = new ArrayIterator([0, 1, 2]).take(0);
          iterator.on('data', item => { items.push(item); });
          iterator.on('end', () => {
            items.should.deep.equal([]);
            done();
          });
        });
      });

      describe('A .take with a take of Infinity items', () => {
        it('should emit all items', done => {
          const items = [];
          const iterator = new ArrayIterator([0, 1, 2, 3, 4, 5, 6]).take(Infinity);
          iterator.on('data', item => { items.push(item); });
          iterator.on('end', () => {
            items.should.deep.equal([0, 1, 2, 3, 4, 5, 6]);
            done();
          });
        });
      });
    });
  });
});
