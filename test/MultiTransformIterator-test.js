const AsyncIterator = require('../asynciterator');
const { EventEmitter } = require('events');

const {
  MultiTransformIterator,
  TransformIterator,
  BufferedIterator,
  EmptyIterator,
  SingletonIterator,
  ArrayIterator,
} = AsyncIterator;

describe('MultiTransformIterator', () => {
  describe('The MultiTransformIterator function', () => {
    describe('the result when called without `new`', () => {
      let instance;
      before(() => { instance = MultiTransformIterator(); });

      it('should be a MultiTransformIterator object', () => {
        instance.should.be.an.instanceof(MultiTransformIterator);
      });

      it('should be a TransformIterator object', () => {
        instance.should.be.an.instanceof(TransformIterator);
      });

      it('should be a BufferedIterator object', () => {
        instance.should.be.an.instanceof(BufferedIterator);
      });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });

    describe('the result when called with `new`', () => {
      let instance;
      before(() => { instance = new MultiTransformIterator(); });

      it('should be a MultiTransformIterator object', () => {
        instance.should.be.an.instanceof(MultiTransformIterator);
      });

      it('should be a TransformIterator object', () => {
        instance.should.be.an.instanceof(TransformIterator);
      });

      it('should be a BufferedIterator object', () => {
        instance.should.be.an.instanceof(BufferedIterator);
      });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });
  });

  describe('A MultiTransformIterator without options', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator(['a', 'b', 'c', 'd', 'e', 'f']);
      iterator = new MultiTransformIterator(source);
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should return items as they are', () => {
        items.should.deep.equal(['a', 'b', 'c', 'd', 'e', 'f']);
      });
    });
  });

  describe('A MultiTransformIterator with transformers that emit 0 items', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator(['a', 'b', 'c', 'd', 'e', 'f']);
      iterator = new MultiTransformIterator(source);
      iterator._createTransformer = sinon.spy(EmptyIterator);
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should not return any items', () => {
        items.should.deep.equal([]);
      });

      it('should have called _createTransformer for each item', () => {
        iterator._createTransformer.should.have.callCount(6);
        iterator._createTransformer.getCall(0).args.should.deep.equal(['a']);
        iterator._createTransformer.getCall(1).args.should.deep.equal(['b']);
        iterator._createTransformer.getCall(2).args.should.deep.equal(['c']);
        iterator._createTransformer.getCall(3).args.should.deep.equal(['d']);
        iterator._createTransformer.getCall(4).args.should.deep.equal(['e']);
        iterator._createTransformer.getCall(5).args.should.deep.equal(['f']);
      });
    });
  });

  describe('A MultiTransformIterator with transformers that synchronously emit 1 item', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator(['a', 'b', 'c', 'd', 'e', 'f']);
      iterator = new MultiTransformIterator(source);
      iterator._createTransformer = sinon.spy(item => new SingletonIterator(`${item }1`));
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should return the transformed items', () => {
        items.should.deep.equal(['a1', 'b1', 'c1', 'd1', 'e1', 'f1']);
      });
    });
  });

  describe('A MultiTransformIterator with transformers that synchronously emit 3 items', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator(['a', 'b', 'c', 'd', 'e', 'f']);
      iterator = new MultiTransformIterator(source);
      iterator._createTransformer = sinon.spy(item => new ArrayIterator([`${item }1`, `${item }2`, `${item }3`]));
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should return the transformed items', () => {
        items.should.deep.equal([
          'a1', 'a2', 'a3',
          'b1', 'b2', 'b3',
          'c1', 'c2', 'c3',
          'd1', 'd2', 'd3',
          'e1', 'e2', 'e3',
          'f1', 'f2', 'f3',
        ]);
      });
    });
  });

  describe('A MultiTransformIterator with transformers that asynchronously close', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator(['a', 'b', 'c', 'd', 'e', 'f']);
      iterator = new MultiTransformIterator(source);
      iterator._createTransformer = sinon.spy(() => {
        const transformer = new BufferedIterator();
        setImmediate(() => {
          transformer.close();
        });
        return transformer;
      });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should not return any items', () => {
        items.should.deep.equal([]);
      });

      it('should have called _createTransformer for each item', () => {
        iterator._createTransformer.should.have.callCount(6);
        iterator._createTransformer.getCall(0).args.should.deep.equal(['a']);
        iterator._createTransformer.getCall(1).args.should.deep.equal(['b']);
        iterator._createTransformer.getCall(2).args.should.deep.equal(['c']);
        iterator._createTransformer.getCall(3).args.should.deep.equal(['d']);
        iterator._createTransformer.getCall(4).args.should.deep.equal(['e']);
        iterator._createTransformer.getCall(5).args.should.deep.equal(['f']);
      });
    });
  });

  describe('A MultiTransformIterator with transformers that asynchronously emit 1 item', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator(['a', 'b', 'c', 'd', 'e', 'f']);
      iterator = new MultiTransformIterator(source);
      iterator._createTransformer = sinon.spy(item => {
        const transformer = new BufferedIterator();
        setImmediate(() => {
          transformer._push(`${item }1`);
          transformer.close();
        });
        return transformer;
      });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should return the transformed items', () => {
        items.should.deep.equal(['a1', 'b1', 'c1', 'd1', 'e1', 'f1']);
      });
    });
  });

  describe('A MultiTransformIterator with transformers that asynchronously emit 3 items', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator(['a', 'b', 'c', 'd', 'e', 'f']);
      iterator = new MultiTransformIterator(source);
      iterator._createTransformer = sinon.spy(item => {
        const transformer = new BufferedIterator();
        setImmediate(() => {
          transformer._push(`${item }1`);
          transformer._push(`${item }2`);
          transformer._push(`${item }3`);
          transformer.close();
        });
        return transformer;
      });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should return the transformed items', () => {
        items.should.deep.equal([
          'a1', 'a2', 'a3',
          'b1', 'b2', 'b3',
          'c1', 'c2', 'c3',
          'd1', 'd2', 'd3',
          'e1', 'e2', 'e3',
          'f1', 'f2', 'f3',
        ]);
      });
    });
  });

  describe('A MultiTransformIterator with optional set to false', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator([1, 2, 3, 4, 5, 6]);
      iterator = new MultiTransformIterator(source, { optional: false });
      iterator._createTransformer = sinon.spy(item => {
        switch (item) {
        case 3: return new EmptyIterator();
        case 6: return null;
        default: return new SingletonIterator(`t${ item}`);
        }
      });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should return the transformed items only', () => {
        items.should.deep.equal(['t1', 't2', 't4', 't5']);
      });
    });
  });

  describe('A MultiTransformIterator with optional set to true', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator([1, 2, 3, 4, 5, 6]);
      iterator = new MultiTransformIterator(source, { optional: true });
      iterator._createTransformer = sinon.spy(item => {
        switch (item) {
        case 3: return new EmptyIterator();
        case 6: return null;
        default: return new SingletonIterator(`t${ item}`);
        }
      });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should return the transformed items, and originals when the transformer is empty', () => {
        items.should.deep.equal(['t1', 't2', 3, 't4', 't5', 6]);
      });
    });
  });

  describe('A MultiTransformIterator with transformers that error', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator(['a', 'b', 'c', 'd', 'e', 'f']);
      iterator = new MultiTransformIterator(source);
      iterator._createTransformer = sinon.spy(item => {
        const transformer = new BufferedIterator();
        setImmediate(() => {
          transformer.emit('error', new Error(`Error ${ item}`));
        });
        return transformer;
      });
      captureEvents(iterator, 'error');
    });

    it('should emit `bufferSize` errors', () => {
      iterator._eventCounts.error.should.equal(4);
    });
  });
});
