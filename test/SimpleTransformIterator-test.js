import {
  AsyncIterator,
  SimpleTransformIterator,
  TransformIterator,
  BufferedIterator,
  EmptyIterator,
  ArrayIterator,
  IntegerIterator,
  scheduleTask,
} from '../dist/asynciterator.js';

import { EventEmitter } from 'events';

describe('SimpleTransformIterator', () => {
  describe('The SimpleTransformIterator function', () => {
    describe('the result when called with `new`', () => {
      let instance;
      before(() => { instance = new SimpleTransformIterator(); });

      it('should be a SimpleTransformIterator object', () => {
        instance.should.be.an.instanceof(SimpleTransformIterator);
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

  describe('A SimpleTransformIterator without options', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator(['a', 'b', 'c']);
      iterator = new SimpleTransformIterator(source);
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should return items as they are', () => {
        items.should.deep.equal(['a', 'b', 'c']);
      });
    });
  });

  describe('A SimpleTransformIterator with a map function', () => {
    let iterator, source, map;
    before(() => {
      let i = 0;
      source = new ArrayIterator(['a', 'b', 'c']);
      map = sinon.spy(item => item + (++i));
      iterator = new SimpleTransformIterator(source, { map });
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

  describe('A SimpleTransformIterator with a map function that returns null', () => {
    let iterator, source, map;
    before(() => {
      let i = 0;
      source = new ArrayIterator(['a', 'b', 'c']);
      map = sinon.spy(item => {
        if (++i === 2)
          return null;
        return item + i;
      });
      iterator = new SimpleTransformIterator(source, { map });
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

  describe('A SimpleTransformIterator with a transform function', () => {
    let iterator, source, transform;
    before(() => {
      let i = 0;
      source = new ArrayIterator(['a', 'b', 'c']);
      transform = sinon.spy(function (item, done) {
        this._push(item + (++i));
        done();
      });
      iterator = new SimpleTransformIterator(source, { transform });
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

      it('should have called the transform function once for each item', () => {
        transform.should.have.been.calledThrice;
      });

      it('should have called the transform function with the iterator as `this`', () => {
        transform.alwaysCalledOn(iterator).should.be.true;
      });
    });
  });

  describe('A SimpleTransformIterator with a transform function as only option', () => {
    let iterator, source, transform;
    before(() => {
      let i = 0;
      source = new ArrayIterator(['a', 'b', 'c']);
      transform = sinon.spy(function (item, done) {
        this._push(item + (++i));
        scheduleTask(done);
      });
      iterator = new SimpleTransformIterator(source, transform);
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

      it('should have called the transform function once for each item', () => {
        transform.should.have.been.calledThrice;
      });

      it('should have called the transform function with the iterator as `this`', () => {
        transform.alwaysCalledOn(iterator).should.be.true;
      });
    });
  });

  describe('A SimpleTransformIterator with a transform function that skips many items', () => {
    let iterator, source, transform, i = 1;
    before(() => {
      source = new AsyncIterator();
      source.read = sinon.spy(() => i++);
      transform = function (item, done) {
        if (item % 10 === 0)
          this._push(item);
        done();
      };
      iterator = new SimpleTransformIterator(source, transform);
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

  describe('A SimpleTransformIterator with a transform function that closes', () => {
    let iterator, source, transform;
    before(() => {
      source = new AsyncIterator();
      source.read = sinon.spy(() => 1);
      transform = function (item, done) {
        this._push(item);
        this.close();
        done();
      };
      iterator = new SimpleTransformIterator(source, transform);
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
    });
  });

  describe('A SimpleTransformIterator with a filter function', () => {
    let iterator, source, filter;
    before(() => {
      source = new ArrayIterator(['a', 'b', 'c']);
      filter = sinon.spy(item => item !== 'b');
      iterator = new SimpleTransformIterator(source, { filter });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should execute the filter function on all items in order', () => {
        items.should.deep.equal(['a', 'c']);
      });

      it('should have called the filter function once for each item', () => {
        filter.should.have.been.calledThrice;
      });

      it('should have called the filter function with the iterator as `this`', () => {
        filter.alwaysCalledOn(iterator).should.be.true;
      });
    });
  });

  describe('A SimpleTransformIterator with a prepend array', () => {
    let iterator, source, prepend;
    before(() => {
      source = new ArrayIterator(['a', 'b', 'c']);
      prepend = ['i', 'ii', 'iii'];
      iterator = new SimpleTransformIterator(source, { prepend });
      prepend.push(['iiii']); // modify array to verify it is copied
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should prepend the items to the regular items', () => {
        items.should.deep.equal(['i', 'ii', 'iii', 'a', 'b', 'c']);
      });
    });
  });

  describe('A SimpleTransformIterator with a prepend iterator', () => {
    let iterator, source, prepend;
    before(() => {
      source = new ArrayIterator(['a', 'b', 'c']);
      prepend = new ArrayIterator(['i', 'ii', 'iii']);
      iterator = new SimpleTransformIterator(source, { prepend });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should prepend the items to the regular items', () => {
        items.should.deep.equal(['i', 'ii', 'iii', 'a', 'b', 'c']);
      });
    });
  });

  describe('A SimpleTransformIterator with a prepend iterator that ended', () => {
    let iterator, source, prepend;
    before(() => {
      source = new ArrayIterator(['a', 'b', 'c']);
      prepend = new EmptyIterator();
      iterator = new SimpleTransformIterator(source, { prepend });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should return items as they are', () => {
        items.should.deep.equal(['a', 'b', 'c']);
      });
    });
  });

  describe('A SimpleTransformIterator with an append array', () => {
    let iterator, source, append;
    before(() => {
      source = new ArrayIterator(['a', 'b', 'c']);
      append = ['I', 'II', 'III'];
      iterator = new SimpleTransformIterator(source, { append });
      append.push(['IIII']); // modify array to verify it is copied
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should append the items to the regular items', () => {
        items.should.deep.equal(['a', 'b', 'c', 'I', 'II', 'III']);
      });
    });
  });

  describe('A SimpleTransformIterator with an append iterator', () => {
    let iterator, source, append;
    before(() => {
      source = new ArrayIterator(['a', 'b', 'c']);
      append = new ArrayIterator(['I', 'II', 'III']);
      iterator = new SimpleTransformIterator(source, { append });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should append the items to the regular items', () => {
        items.should.deep.equal(['a', 'b', 'c', 'I', 'II', 'III']);
      });
    });
  });

  describe('A SimpleTransformIterator with an append iterator that ended', () => {
    let iterator, source, append;
    before(() => {
      source = new ArrayIterator(['a', 'b', 'c']);
      append = new EmptyIterator();
      iterator = new SimpleTransformIterator(source, { append });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should return items as they are', () => {
        items.should.deep.equal(['a', 'b', 'c']);
      });
    });
  });

  describe('A SimpleTransformIterator with an offset of 0', () => {
    let iterator, source;
    before(() => {
      source = new IntegerIterator({ start: 1, end: 10 });
      sinon.spy(source, 'read');
      iterator = new SimpleTransformIterator(source, { offset: 0 });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should call `read` on the source 11 times', () => {
        source.read.should.have.callCount(11);
      });

      it('should result in all items', () => {
        items.should.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      });
    });
  });

  describe('A SimpleTransformIterator with an offset of 5', () => {
    let iterator, source;
    before(() => {
      source = new IntegerIterator({ start: 1, end: 10 });
      sinon.spy(source, 'read');
      iterator = new SimpleTransformIterator(source, { offset: 5 });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should call `read` on the source 11 times', () => {
        source.read.should.have.callCount(11);
      });

      it('should result in skipping the first 5 items', () => {
        items.should.deep.equal([6, 7, 8, 9, 10]);
      });
    });
  });

  describe('A SimpleTransformIterator with an offset of +Infinity', () => {
    let iterator, source;
    before(() => {
      source = new IntegerIterator({ start: 1, end: 10 });
      sinon.spy(source, 'read');
      iterator = new SimpleTransformIterator(source, { offset: Infinity, autoStart: false });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should not call `read` on the source', () => {
        source.read.should.not.have.been.called;
      });

      it('should not result in any items', () => {
        items.should.deep.equal([]);
      });
    });
  });

  describe('A SimpleTransformIterator with a negative offset', () => {
    let iterator, source;
    before(() => {
      source = new IntegerIterator({ start: 1, end: 10 });
      sinon.spy(source, 'read');
      iterator = new SimpleTransformIterator(source, { offset: -1 });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should call `read` on the source 11 times', () => {
        source.read.should.have.callCount(11);
      });

      it('should result in all items', () => {
        items.should.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      });
    });
  });

  describe('A SimpleTransformIterator with an offset of -Infinity', () => {
    let iterator, source;
    before(() => {
      source = new IntegerIterator({ start: 1, end: 10 });
      sinon.spy(source, 'read');
      iterator = new SimpleTransformIterator(source, { offset: -Infinity });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should call `read` on the source 11 times', () => {
        source.read.should.have.callCount(11);
      });

      it('should result in all items', () => {
        items.should.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      });
    });
  });

  describe('A SimpleTransformIterator with a limit of 0', () => {
    let iterator, source;
    before(() => {
      source = new IntegerIterator({ start: 1, end: 10 });
      sinon.spy(source, 'read');
      iterator = new SimpleTransformIterator(source, { limit: 0, autoStart: false });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should not call `read` on the source', () => {
        source.read.should.not.have.been.called;
      });

      it('should not result in any items', () => {
        items.should.deep.equal([]);
      });
    });
  });

  describe('A SimpleTransformIterator with a limit of 5', () => {
    let iterator, source;
    before(() => {
      source = new IntegerIterator({ start: 1, end: 10 });
      sinon.spy(source, 'read');
      iterator = new SimpleTransformIterator(source, { limit: 5 });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should call `read` on the source 5 times', () => {
        source.read.should.have.callCount(5);
      });

      it('should result in the first 5 items', () => {
        items.should.deep.equal([1, 2, 3, 4, 5]);
      });
    });
  });

  describe('A SimpleTransformIterator with a limit of +Infinity', () => {
    let iterator, source;
    before(() => {
      source = new IntegerIterator({ start: 1, end: 10 });
      sinon.spy(source, 'read');
      iterator = new SimpleTransformIterator(source, { limit: Infinity });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should call `read` on the source 11 times', () => {
        source.read.should.have.callCount(11);
      });

      it('should result in all items', () => {
        items.should.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      });
    });
  });

  describe('A SimpleTransformIterator with a negative limit', () => {
    let iterator, source;
    before(() => {
      source = new IntegerIterator({ start: 1, end: 10 });
      sinon.spy(source, 'read');
      iterator = new SimpleTransformIterator(source, { limit: -1, autoStart: false });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should not call `read` on the source', () => {
        source.read.should.not.have.been.called;
      });

      it('should not result in any items', () => {
        items.should.deep.equal([]);
      });
    });
  });

  describe('A SimpleTransformIterator with a limit of -Infinity', () => {
    let iterator, source;
    before(() => {
      source = new IntegerIterator({ start: 1, end: 10 });
      sinon.spy(source, 'read');
      iterator = new SimpleTransformIterator(source, { limit: -Infinity, autoStart: false });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should not call `read` on the source', () => {
        source.read.should.not.have.been.called;
      });

      it('should not result in any items', () => {
        items.should.deep.equal([]);
      });
    });
  });

  describe('A SimpleTransformIterator with an offset of 2 and a limit of 3', () => {
    let iterator, source;
    before(() => {
      source = new IntegerIterator({ start: 1, end: 10 });
      sinon.spy(source, 'read');
      iterator = new SimpleTransformIterator(source, { offset: 2, limit: 3 });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should call `read` on the source 5 times', () => {
        source.read.should.have.callCount(5);
      });

      it('should result in skipping 2 items and reading 3', () => {
        items.should.deep.equal([3, 4, 5]);
      });
    });
  });

  describe('A SimpleTransformIterator with offset/limit and a slow source', () => {
    let iterator, source;
    before(() => {
      source = new BufferedIterator();
      sinon.spy(source, 'read');
      iterator = new SimpleTransformIterator({ offset: 2, limit: 3 });
      captureEvents(iterator, 'readable', 'end');
    });

    describe('before the source is set', () => {
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

      it('should return null on read', () => {
        expect(iterator.read()).to.be.null;
      });
    });

    describe('after the source is set', () => {
      before(() => { iterator.source = source; });

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

      it('should return null on read', () => {
        expect(iterator.read()).to.be.null;
      });
    });

    describe('after item 1 becomes available', () => {
      before(() => { source._push('a'); });

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

      it('should return null on read', () => {
        expect(iterator.read()).to.be.null;
      });
    });

    describe('after item 2 becomes available', () => {
      before(() => { source._push('b'); });

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

      it('should return null on read', () => {
        expect(iterator.read()).to.be.null;
      });
    });

    describe('after item 3 becomes available', () => {
      before(() => { source._push('c'); });

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

      it('should return the item on read', () => {
        expect(iterator.read()).to.equal('c');
      });

      it('should return null on subsequent reads', () => {
        expect(iterator.read()).to.be.null;
      });
    });

    describe('after item 4 becomes available', () => {
      before(() => { source._push('d'); });

      it('should have emitted another `readable` event', () => {
        iterator._eventCounts.readable.should.equal(2);
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

      it('should return the item on read', () => {
        expect(iterator.read()).to.equal('d');
      });

      it('should return null on subsequent reads', () => {
        expect(iterator.read()).to.be.null;
      });
    });

    describe('after item 5 becomes available', () => {
      before(() => { source._push('e'); });

      it('should have emitted another `readable` event', () => {
        iterator._eventCounts.readable.should.equal(3);
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

      it('should return the item on read', () => {
        expect(iterator.read()).to.equal('e');
      });

      it('should return null on subsequent reads', () => {
        expect(iterator.read()).to.be.null;
      });
    });

    describe('after item 5 has been read', () => {
      before(() => { source._push('f'); });

      it('should not have emitted the `readable` event anymore', () => {
        iterator._eventCounts.readable.should.equal(3);
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

      it('should return null on read', () => {
        expect(iterator.read()).to.be.null;
      });
    });
  });

  describe('A SimpleTransformIterator with filter/map/prepend/append/offset/limit', () => {
    let iterator, source, filter, map, prepend, append;
    before(() => {
      let i = 0;
      source = new ArrayIterator(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
      sinon.spy(source, 'read');
      filter = sinon.spy(item => item !== 'd');
      map = sinon.spy(item => item + (++i));
      prepend = new ArrayIterator(['i', 'ii', 'iii']);
      append = new ArrayIterator(['I', 'II', 'III']);
      iterator = new SimpleTransformIterator(source, {
        filter, map, prepend, append,
        offset: 2, limit: 3,
      });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should return the processed items', () => {
        items.should.deep.equal(['i', 'ii', 'iii', 'c1', 'e2', 'f3', 'I', 'II', 'III']);
      });

      it('should have called the filter function once for each needed item', () => {
        filter.should.have.callCount(6);
      });

      it('should have called the map function once for each needed item', () => {
        map.should.have.been.calledThrice;
      });

      it('should call `read` on the source 6 times', () => {
        source.read.should.have.callCount(6);
      });

      it('should have called the map function with the iterator as `this`', () => {
        map.alwaysCalledOn(iterator).should.be.true;
      });
    });
  });

  describe('A SimpleTransformIterator with optional set to false', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator([1, 2, 3, 4, 5, 6]);
      iterator = new SimpleTransformIterator(source, {
        optional: false,
        map(item) { return item % 2 === 0 ? null : item; },
        transform(item, done) {
          if (item % 3 !== 0)
            this._push(`t${item}`);
          done();
        },
      });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should return items not transformed/mapped into null', () => {
        items.should.deep.equal(['t1', 't5']);
      });
    });
  });

  describe('A SimpleTransformIterator with optional set to true', () => {
    let iterator, source;
    before(() => {
      source = new ArrayIterator([1, 2, 3, 4, 5, 6]);
      iterator = new SimpleTransformIterator(source, {
        optional: true,
        map(item) { return item % 2 === 0 ? null : item; },
        transform(item, done) {
          if (item % 3 !== 0)
            this._push(`t${item}`);
          done();
        },
      });
    });

    describe('when reading items', () => {
      const items = [];
      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should return the transformed items, or if none, the item itself', () => {
        items.should.deep.equal(['t1', 2, 3, 4, 't5', 6]);
      });
    });
  });

  describe('The AsyncIterator#prepend function', () => {
    it('should be a function', () => {
      expect(AsyncIterator.prototype.prepend).to.be.a('function');
    });

    describe('when called on an iterator', () => {
      let iterator, result;
      before(() => {
        iterator = new ArrayIterator(['a', 'b', 'c']);
        result = iterator.prepend(['i', 'ii', 'iii']);
      });

      describe('the return value', () => {
        const items = [];
        before(done => {
          result.on('data', item => { items.push(item); });
          result.on('end', done);
        });

        it('should prepend the items', () => {
          items.should.deep.equal(['i', 'ii', 'iii', 'a', 'b', 'c']);
        });
      });
    });
  });

  describe('The AsyncIterator#append function', () => {
    it('should be a function', () => {
      expect(AsyncIterator.prototype.append).to.be.a('function');
    });

    describe('when called on an iterator', () => {
      let iterator, result;
      before(() => {
        iterator = new ArrayIterator(['a', 'b', 'c']);
        result = iterator.append(['I', 'II', 'III']);
      });

      describe('the return value', () => {
        const items = [];
        before(done => {
          result.on('data', item => { items.push(item); });
          result.on('end', done);
        });

        it('should append the items', () => {
          items.should.deep.equal(['a', 'b', 'c', 'I', 'II', 'III']);
        });
      });
    });
  });

  describe('The AsyncIterator#surround function', () => {
    it('should be a function', () => {
      expect(AsyncIterator.prototype.surround).to.be.a('function');
    });

    describe('when called on an iterator', () => {
      let iterator, result;
      before(() => {
        iterator = new ArrayIterator(['a', 'b', 'c']);
        result = iterator.surround(['i', 'ii', 'iii'], ['I', 'II', 'III']);
      });

      describe('the return value', () => {
        const items = [];
        before(done => {
          result.on('data', item => { items.push(item); });
          result.on('end', done);
        });

        it('should be a SimpleTransformIterator', () => {
          result.should.be.an.instanceof(SimpleTransformIterator);
        });

        it('should surround the items', () => {
          items.should.deep.equal(['i', 'ii', 'iii', 'a', 'b', 'c', 'I', 'II', 'III']);
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

        it('should be a SimpleTransformIterator', () => {
          result.should.be.an.instanceof(SimpleTransformIterator);
        });

        it('should take the given number of items', () => {
          items.should.deep.equal(['a', 'b', 'c']);
        });
      });
    });

    describe('on an array', () => {
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

    describe('with a source that emits 0 items', () => {
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

    describe('with a take of 0 items', () => {
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

    describe('with a take of Infinity items', () => {
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

        it('should be a SimpleTransformIterator', () => {
          result.should.be.an.instanceof(SimpleTransformIterator);
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

        it('should be a SimpleTransformIterator', () => {
          result.should.be.an.instanceof(SimpleTransformIterator);
        });

        it('should be empty', () => {
          items.should.be.empty;
        });

        it('should not have called `read` on the iterator', () => {
          iterator.read.should.not.have.been.called;
        });
      });
    });
  });

  describe('The AsyncIterator#transform function', () => {
    it('should be a function', () => {
      expect(AsyncIterator.prototype.transform).to.be.a('function');
    });

    describe('when called on an iterator', () => {
      let iterator, map, prepend, append, result;
      before(() => {
        let i = 0;
        iterator = new ArrayIterator(['a', 'b', 'c', 'd', 'e', 'f']);
        map = item => item + (++i);
        prepend = new ArrayIterator(['i', 'ii', 'iii']);
        append = new ArrayIterator(['I', 'II', 'III']);
        result = iterator.transform({
          map, prepend, append,
          offset: 2, limit: 3,
        });
      });

      describe('the return value', () => {
        const items = [];
        before(done => {
          result.on('data', item => { items.push(item); });
          result.on('end', done);
        });

        it('should be a SimpleTransformIterator', () => {
          result.should.be.an.instanceof(SimpleTransformIterator);
        });

        it('should transform the items', () => {
          items.should.deep.equal(['i', 'ii', 'iii', 'c1', 'd2', 'e3', 'I', 'II', 'III']);
        });
      });
    });
  });
});
