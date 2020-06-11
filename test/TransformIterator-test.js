import {
  AsyncIterator,
  BufferedIterator,
  EmptyIterator,
  ArrayIterator,
  TransformIterator,
  wrap,
} from '../asynciterator.js';

import { EventEmitter } from 'events';
import queueMicrotask from 'queue-microtask';

describe('TransformIterator', () => {
  describe('The TransformIterator function', () => {
    describe('the result when called with `new`', () => {
      let instance;
      before(() => { instance = new TransformIterator(); });

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

    describe('the result when called through `wrap`', () => {
      let instance;
      before(() => { instance = wrap(); });

      it('should be an TransformIterator object', () => {
        instance.should.be.an.instanceof(TransformIterator);
      });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });
  });

  describe('A TransformIterator', () => {
    it('disallows setting a falsy object as source', () => {
      const iterator = new TransformIterator();
      (function () { iterator.source = null; })
        .should.throw('Invalid source: null');
    });

    it('disallows setting an object without `read` function as source', () => {
      const iterator = new TransformIterator();
      (function () { iterator.source = { read: 1, on() { /* */ } }; })
        .should.throw('Invalid source: [object Object]');
    });

    it('disallows setting an object without `on` function as source', () => {
      const iterator = new TransformIterator();
      (function () { iterator.source = { on: 1, read() { /* */ } }; })
        .should.throw('Invalid source: [object Object]');
    });

    it('disallows setting another source after one has been set', () => {
      const iterator = new TransformIterator();
      iterator.source = new EmptyIterator();
      (function () { iterator.source = new EmptyIterator(); })
        .should.throw('The source cannot be changed after it has been set');
    });

    it('allows setting the source through the first argument', () => {
      const source = new EmptyIterator(),
            iterator = new TransformIterator(source);
      iterator.source.should.equal(source);
    });

    it('allows setting the source through an options hash as first argument', () => {
      const source = new EmptyIterator(),
            iterator = new TransformIterator({ source });
      iterator.source.should.equal(source);
    });

    it('allows setting the source through an options hash as second argument', () => {
      const source = new EmptyIterator(),
            iterator = new TransformIterator(null, { source });
      iterator.source.should.equal(source);
    });

    it('gives precedence to a source as first argument', () => {
      const sourceA = new EmptyIterator(),
            sourceB = new EmptyIterator(),
            iterator = new TransformIterator(sourceA, { source: sourceB });
      iterator.source.should.equal(sourceA);
    });

    it('does not allow setting a source that already has a destination', () => {
      const source = new EmptyIterator(),
            iteratorA = new TransformIterator(),
            iteratorB = new TransformIterator();
      (function () { iteratorA.source = source; }).should.not.throw();
      (function () { iteratorB.source = source; }).should.throw('The source already has a destination');
    });
  });

  describe('A TransformIterator without source', () => {
    let iterator;
    before(() => {
      iterator = new TransformIterator();
      captureEvents(iterator, 'readable', 'end');
    });

    describe('before closing', () => {
      it('should have undefined as `source` property', () => {
        expect(iterator.source).to.be.undefined;
      });

      it('should not have emitted the `readable` event', () => {
        iterator._eventCounts.readable.should.equal(0);
      });

      it('should not have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', () => {
        iterator.ended.should.be.false;
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('should return null when `read` is called', () => {
        expect(iterator.read()).to.be.null;
      });
    });

    describe('after closing', () => {
      before(() => {
        iterator.close();
      });

      it('should have undefined as `source` property', () => {
        expect(iterator.source).to.be.undefined;
      });

      it('should not have emitted the `readable` event', () => {
        iterator._eventCounts.readable.should.equal(0);
      });

      it('should have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should have ended', () => {
        iterator.ended.should.be.true;
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('should return null when `read` is called', () => {
        expect(iterator.read()).to.be.null;
      });
    });
  });

  describe('A TransformIterator initialized with an empty source', () => {
    let iterator, source;
    before(() => {
      iterator = new TransformIterator(source = new EmptyIterator());
      captureEvents(iterator, 'readable', 'end');
      expect(source._events).to.not.contain.key('data');
      expect(source._events).to.not.contain.key('readable');
      expect(source._events).to.not.contain.key('end');
    });

    it('should expose the source in the `source` property', () => {
      iterator.source.should.equal(source);
    });

    it('should not have emitted the `readable` event', () => {
      iterator._eventCounts.readable.should.equal(0);
    });

    it('should have emitted the `end` event', () => {
      iterator._eventCounts.end.should.equal(1);
    });

    it('should have ended', () => {
      iterator.ended.should.be.true;
    });

    it('should not be readable', () => {
      iterator.readable.should.be.false;
    });

    it('should return null when read is called', () => {
      expect(iterator.read()).to.be.null;
    });
  });

  describe('A TransformIterator initialized with a source that ends asynchronously', () => {
    let iterator, source;
    before(() => {
      iterator = new TransformIterator(source = new AsyncIterator());
      captureEvents(iterator, 'readable', 'end');
    });

    describe('before the source ends', () => {
      it('should not have emitted the `readable` event', () => {
        iterator._eventCounts.readable.should.equal(0);
      });

      it('should not have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', () => {
        iterator.ended.should.be.false;
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('should return null when read is called', () => {
        expect(iterator.read()).to.be.null;
      });
    });

    describe('when the source emits a `readable` event (but does not actually contain items)', () => {
      before(() => { source.emit('readable'); });

      it('should not have emitted the `readable` event', () => {
        iterator._eventCounts.readable.should.equal(0);
      });

      it('should not have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', () => {
        iterator.ended.should.be.false;
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('should return null when read is called', () => {
        expect(iterator.read()).to.be.null;
      });
    });

    describe('after the source ends', () => {
      before(() => { source.close(); });

      it('should not have emitted the `readable` event', () => {
        iterator._eventCounts.readable.should.equal(0);
      });

      it('should have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should have ended', () => {
        iterator.ended.should.be.true;
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('should return null when read is called', () => {
        expect(iterator.read()).to.be.null;
      });
    });
  });

  describe('A default TransformIterator with a one-item source', () => {
    let iterator, source;
    before(() => {
      iterator = new TransformIterator(source = new ArrayIterator(['a']));
      captureEvents(iterator, 'readable', 'end');
      sinon.spy(source, 'read');
      // intentionally break source cleanup to verify whether destination does it
      source._terminate = function () { this._changeState(AsyncIterator.ENDED); };
    });

    describe('before reading an item', () => {
      it('should have called `read` on the source', () => {
        source.read.should.have.been.calledOnce;
      });

      it('should have emitted the `readable` event', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', () => {
        iterator.ended.should.be.false;
      });

      it('should be readable', () => {
        iterator.readable.should.be.true;
      });
    });

    describe('after reading an item', () => {
      let item;
      before(() => { item = iterator.read(); });

      it('should have read the original item', () => {
        item.should.equal('a');
      });

      it('should not have emitted the `readable` event anymore', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should have ended', () => {
        iterator.ended.should.be.true;
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('should return null when `read` is called', () => {
        expect(iterator.read()).to.be.null;
      });

      it('should not leave `readable` listeners on the source', () => {
        EventEmitter.listenerCount(source, 'readable').should.equal(0);
      });

      it('should not leave `end` listeners on the source', () => {
        EventEmitter.listenerCount(source, 'end').should.equal(0);
      });

      it('should remove itself as destination from the source', () => {
        source.should.not.have.key('_destination');
      });
    });
  });

  describe('A TransformIterator that synchronously transforms a two-item source', () => {
    let iterator, source;
    before(() => {
      iterator = new TransformIterator(source = new ArrayIterator(['a', 'b', 'c']));
      iterator._transform = function (item, done) {
        this._push(`${item }1`);
        this._push(`${item }2`);
        done();
      };
      captureEvents(iterator, 'readable', 'end');
      sinon.spy(source, 'read');
      // intentionally break source cleanup to verify whether destination does it
      source._terminate = function () { this._changeState(AsyncIterator.ENDED); };
    });

    describe('before reading an item', () => {
      it('should have called `read` on the source', () => {
        source.read.should.have.been.called;
      });

      it('should have emitted the `readable` event', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', () => {
        iterator.ended.should.be.false;
      });

      it('should be readable', () => {
        iterator.readable.should.be.true;
      });
    });

    describe('after reading one item', () => {
      let item;
      before(() => { item = iterator.read(); });

      it('should have read the transformed item', () => {
        item.should.equal('a1');
      });

      it('should not have emitted the `readable` event anymore', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', () => {
        iterator.ended.should.be.false;
      });

      it('should be readable', () => {
        iterator.readable.should.be.true;
      });
    });

    describe('after reading the remaining items', () => {
      const items = [];
      before(() => {
        for (let i = 0; i < 5; i++)
          items.push(iterator.read());
      });

      it('should have read the transformed items', () => {
        items.should.deep.equal(['a2', 'b1', 'b2', 'c1', 'c2']);
      });

      it('should not have emitted the `readable` event anymore', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should have ended', () => {
        iterator.ended.should.be.true;
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('should return null when `read` is called', () => {
        expect(iterator.read()).to.be.null;
      });

      it('should not leave `readable` listeners on the source', () => {
        EventEmitter.listenerCount(source, 'readable').should.equal(0);
      });

      it('should not leave `end` listeners on the source', () => {
        EventEmitter.listenerCount(source, 'end').should.equal(0);
      });

      it('should remove itself as destination from the source', () => {
        source.should.not.have.key('_destination');
      });
    });
  });

  describe('A TransformIterator that asynchronously transforms a two-item source', () => {
    let iterator, source;
    before(() => {
      iterator = new TransformIterator(source = new ArrayIterator(['a', 'b', 'c']));
      iterator._transform = function (item, done) {
        queueMicrotask(() => {
          iterator._push(`${item }1`);
          iterator._push(`${item }2`);
          done();
        });
      };
      captureEvents(iterator, 'readable', 'end');
      sinon.spy(source, 'read');
      // intentionally break source cleanup to verify whether destination does it
      source._terminate = function () { this._changeState(AsyncIterator.ENDED); };
    });

    describe('before reading an item', () => {
      it('should have called `read` on the source', () => {
        source.read.should.have.been.called;
      });

      it('should have emitted the `readable` event', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', () => {
        iterator.ended.should.be.false;
      });

      it('should be readable', () => {
        iterator.readable.should.be.true;
      });
    });

    describe('after reading one item', () => {
      let item;
      before(() => { item = iterator.read(); });

      it('should have read the transformed item', () => {
        item.should.equal('a1');
      });

      it('should not have emitted the `readable` event anymore', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', () => {
        iterator.ended.should.be.false;
      });

      it('should be readable', () => {
        iterator.readable.should.be.true;
      });
    });

    describe('after reading the remaining items', () => {
      const items = [];
      before(() => {
        for (let i = 0; i < 5; i++)
          items.push(iterator.read());
      });

      it('should have read the transformed items', () => {
        items.should.deep.equal(['a2', 'b1', 'b2', 'c1', 'c2']);
      });

      it('should not have emitted the `readable` event anymore', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should have ended', () => {
        iterator.ended.should.be.true;
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('should return null when `read` is called', () => {
        expect(iterator.read()).to.be.null;
      });

      it('should not leave `readable` listeners on the source', () => {
        EventEmitter.listenerCount(source, 'readable').should.equal(0);
      });

      it('should not leave `end` listeners on the source', () => {
        EventEmitter.listenerCount(source, 'end').should.equal(0);
      });

      it('should remove itself as destination from the source', () => {
        source.should.not.have.key('_destination');
      });
    });
  });

  describe('A TransformIterator that synchronously transforms a three-item source but asynchronously completes', () => {
    let iterator, source;
    before(() => {
      let i = 0;
      source = new ArrayIterator(['a', 'b', 'c']);
      iterator = new TransformIterator(source);
      iterator._transform = sinon.spy(function (item, done) {
        this._push(item + (++i));
        queueMicrotask(done);
      });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should execute the transform function on all items in order', () => {
        items.should.deep.equal(['a1', 'b2', 'c3']);
      });

      it('should have called _transform once for each item', () => {
        iterator._transform.should.have.been.calledThrice;
      });

      it('should have called _transform function with the iterator as `this`', () => {
        iterator._transform.alwaysCalledOn(iterator).should.be.true;
      });
    });
  });

  describe('A TransformIterator with destroySource set to its default', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator([1, 2, 3]);
      iterator = new TransformIterator(source, { autoStart: false });
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
      iterator = new TransformIterator(source, { autoStart: false, destroySource: false });
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
      iterator = new TransformIterator(source);
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

  describe('A TransformIterator that skips many items', () => {
    let iterator, source, i = 1;
    before(() => {
      source = new AsyncIterator();
      source.read = sinon.spy(() => i++);
      iterator = new TransformIterator(source);
      iterator._transform = function (item, done) {
        if (item % 10 === 0)
          this._push(item);
        done();
      };
      captureEvents(iterator, 'readable', 'end');
    });

    describe('before reading an item', () => {
      it('should have called `read` on the source', () => {
        source.read.should.have.been.called;
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
        item.should.equal(10);
      });

      it('should have called `read` on the source until it had sufficient items', () => {
        source.read.should.have.callCount(50);
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

    describe('after reading a second item', () => {
      let item;
      before(() => {
        item = iterator.read();
      });

      it('should read the correct item', () => {
        item.should.equal(20);
      });

      it('should have called `read` on the source until it had sufficient items', () => {
        source.read.should.have.callCount(60);
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
  });

  describe('A TransformIterator that closes during the tranformation', () => {
    let iterator, source;
    before(() => {
      source = new AsyncIterator();
      source.read = sinon.spy(() => 1);
      iterator = new TransformIterator(source);
      iterator._transform = function (item, done) {
        this._push(item);
        this.close();
        done();
      };
      captureEvents(iterator, 'readable', 'end');
    });

    describe('before reading an item', () => {
      it('should have called `read` on the source', () => {
        source.read.should.have.been.called;
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

      it('should not leave `readable` listeners on the source', () => {
        EventEmitter.listenerCount(source, 'readable').should.equal(0);
      });

      it('should not leave `end` listeners on the source', () => {
        EventEmitter.listenerCount(source, 'end').should.equal(0);
      });

      it('should not leave `error` listeners on the source', () => {
        EventEmitter.listenerCount(source, 'error').should.equal(0);
      });
    });
  });

  describe('A TransformIterator with optional set to false', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator([1, 2, 3, 4, 5, 6]);
      iterator = new TransformIterator(source, { optional: false });
      iterator._transform = function (item, done) {
        if (item % 3 !== 0)
          this._push(`t${ item}`);
        done();
      };
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should return items not transformed into null', () => {
        items.should.deep.equal(['t1', 't2', 't4', 't5']);
      });
    });
  });

  describe('A TransformIterator with optional set to true', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator([1, 2, 3, 4, 5, 6]);
      iterator = new TransformIterator(source, { optional: true });
      iterator._transform = function (item, done) {
        if (item % 3 !== 0)
          this._push(`t${ item}`);
        done();
      };
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should return the transformed items, or if none, the item itself', () => {
        items.should.deep.equal(['t1', 't2', 3, 't4', 't5', 6]);
      });
    });
  });
});
