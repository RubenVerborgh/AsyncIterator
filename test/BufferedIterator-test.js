import {
  AsyncIterator,
  BufferedIterator,
} from '../asynciterator.js';

import { EventEmitter } from 'events';
import queueMicrotask from 'queue-microtask';

describe('BufferedIterator', () => {
  describe('The BufferedIterator function', () => {
    describe('the result when called with `new`', () => {
      let instance;
      before(() => { instance = new BufferedIterator(); });

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

  describe('A BufferedIterator without arguments', () => {
    let iterator;
    before(() => {
      iterator = new BufferedIterator();
      captureEvents(iterator, 'readable', 'end');
    });

    it('should have maxBufferSize 4', () => {
      iterator.maxBufferSize.should.equal(4);
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[BufferedIterator {buffer: 0}]');
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

    it('should not have been destroyed', () => {
      iterator.destroyed.should.be.false;
    });

    it('should not be done', () => {
      iterator.done.should.be.false;
    });

    it('should not be readable', () => {
      iterator.readable.should.be.false;
    });

    it('should return null when `read` is called', () => {
      expect(iterator.read()).to.be.null;
    });

    describe('after `close` is called', () => {
      before(() => {
        iterator.close();
      });

      it('should have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should have ended', () => {
        iterator.ended.should.be.true;
      });

      it('should not have been destroyed', () => {
        iterator.destroyed.should.be.false;
      });

      it('should be done', () => {
        iterator.done.should.be.true;
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('should allow pushing but have no effect', () => {
        iterator._push(1);
        iterator.toString().should.equal('[BufferedIterator {buffer: 0}]');
      });
    });
  });

  describe('A BufferedIterator that closes itself synchronously on read', () => {
    function createIterator(options) {
      const iterator = new BufferedIterator(options);
      iterator._read = function (count, done) { this.close(); done(); };
      sinon.spy(iterator, '_read');
      return captureEvents(iterator, 'readable', 'end');
    }

    describe('without autoStart', () => {
      let iterator;
      before(() => { iterator = createIterator({ autoStart: false }); });

      describe('before `read` has been called', () => {
        it('should have emitted the `readable` event', () => {
          iterator._eventCounts.readable.should.equal(1);
        });

        it('should not have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          iterator.ended.should.be.false;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should not be done', () => {
          iterator.done.should.be.false;
        });

        it('should be readable', () => {
          iterator.readable.should.be.true;
        });

        it('should not have called _read', () => {
          iterator._read.should.not.have.been.called;
        });
      });

      describe('after `read` has been called the first time', () => {
        let item;
        before(() => { item = iterator.read(); });

        it('should have returned null', () => {
          expect(item).to.be.null;
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

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should be done', () => {
          iterator.done.should.be.true;
        });

        it('should not be readable', () => {
          iterator.readable.should.be.false;
        });

        it('should have called `_read` with 4 (the default maximum buffer size)', () => {
          iterator._read.should.have.been.calledOnce;
          iterator._read.should.have.been.calledWith(4);
        });
      });

      describe('after `read` has been called the second time', () => {
        let item;
        before(() => { item = iterator.read(); });

        it('should have returned null', () => {
          expect(item).to.be.null;
        });

        it('should not have emitted the `readable` event anymore', () => {
          iterator._eventCounts.readable.should.equal(1);
        });

        it('should not have emitted another `end` event', () => {
          iterator._eventCounts.end.should.equal(1);
        });

        it('should have ended', () => {
          iterator.ended.should.be.true;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should be done', () => {
          iterator.done.should.be.true;
        });

        it('should not be readable', () => {
          iterator.readable.should.be.false;
        });

        it('should not have called `_read` anymore', () => {
          iterator._read.should.have.been.calledOnce;
        });
      });
    });

    describe('with autoStart', () => {
      let iterator;
      before(() => { iterator = createIterator(); });

      describe('before `read` has been called', () => {
        it('should not have emitted the `readable` event', () => {
          iterator._eventCounts.readable.should.equal(0);
        });

        it('should have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(1);
        });

        it('should have ended', () => {
          iterator.ended.should.be.true;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should be done', () => {
          iterator.done.should.be.true;
        });

        it('should not be readable', () => {
          iterator.readable.should.be.false;
        });

        it('should have called `_read` with 4 (the default maximum buffer size)', () => {
          iterator._read.should.have.been.calledOnce;
          iterator._read.should.have.been.calledWith(4);
        });
      });

      describe('after `read` has been called', () => {
        let item;
        before(() => { item = iterator.read(); });

        it('should have returned null', () => {
          expect(item).to.be.null;
        });

        it('should not have emitted the `readable` event', () => {
          iterator._eventCounts.readable.should.equal(0);
        });

        it('should not have emitted another `end` event', () => {
          iterator._eventCounts.end.should.equal(1);
        });

        it('should have ended', () => {
          iterator.ended.should.be.true;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should be done', () => {
          iterator.done.should.be.true;
        });

        it('should not be readable', () => {
          iterator.readable.should.be.false;
        });

        it('should not have called `_read` anymore', () => {
          iterator._read.should.have.been.calledOnce;
        });
      });
    });
  });

  describe('A BufferedIterator that closes itself asynchronously on read', () => {
    function createIterator(options) {
      const iterator = new BufferedIterator(options);
      iterator._read = function (count, done) {
        queueMicrotask(() => {
          this.close();
          done();
        });
      };
      sinon.spy(iterator, '_read');
      return captureEvents(iterator, 'readable', 'end');
    }

    describe('without autoStart', () => {
      let iterator;
      before(() => { iterator = createIterator({ autoStart: false }); });

      describe('before `read` has been called', () => {
        it('should have emitted the `readable` event', () => {
          iterator._eventCounts.readable.should.equal(1);
        });

        it('should not have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          iterator.ended.should.be.false;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should not be done', () => {
          iterator.done.should.be.false;
        });

        it('should be readable', () => {
          iterator.readable.should.be.true;
        });

        it('should not have called _read', () => {
          iterator._read.should.not.have.been.called;
        });
      });

      describe('after `read` has been called the first time', () => {
        let item;
        before(() => { item = iterator.read(); });

        it('should have returned null', () => {
          expect(item).to.be.null;
        });

        it('should not have emitted another `readable` event', () => {
          iterator._eventCounts.readable.should.equal(1);
        });

        it('should have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(1);
        });

        it('should have ended', () => {
          iterator.ended.should.be.true;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should be done', () => {
          iterator.done.should.be.true;
        });

        it('should not be readable', () => {
          iterator.readable.should.be.false;
        });

        it('should have called `_read` with 4 (the default maximum buffer size)', () => {
          iterator._read.should.have.been.calledOnce;
          iterator._read.should.have.been.calledWith(4);
        });
      });

      describe('after `read` has been called the second time', () => {
        let item;
        before(() => { item = iterator.read(); });

        it('should have returned null', () => {
          expect(item).to.be.null;
        });

        it('should not have emitted another `readable` event', () => {
          iterator._eventCounts.readable.should.equal(1);
        });

        it('should not have emitted another `end` event', () => {
          iterator._eventCounts.end.should.equal(1);
        });

        it('should have ended', () => {
          iterator.ended.should.be.true;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should be done', () => {
          iterator.done.should.be.true;
        });

        it('should not be readable', () => {
          iterator.readable.should.be.false;
        });

        it('should not have called `_read` anymore', () => {
          iterator._read.should.have.been.calledOnce;
        });
      });
    });

    describe('with autoStart', () => {
      let iterator;
      before(() => { iterator = createIterator(); });

      describe('before `read` has been called', () => {
        it('should not have emitted the `readable` event', () => {
          iterator._eventCounts.readable.should.equal(0);
        });

        it('should have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(1);
        });

        it('should have ended', () => {
          iterator.ended.should.be.true;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should be done', () => {
          iterator.done.should.be.true;
        });

        it('should not be readable', () => {
          iterator.readable.should.be.false;
        });

        it('should have called `_read` with 4 (the default maximum buffer size)', () => {
          iterator._read.should.have.been.calledOnce;
          iterator._read.should.have.been.calledWith(4);
        });
      });

      describe('after `read` has been called', () => {
        let item;
        before(() => { item = iterator.read(); });

        it('should have returned null', () => {
          expect(item).to.be.null;
        });

        it('should not have emitted the `readable` event', () => {
          iterator._eventCounts.readable.should.equal(0);
        });

        it('should not have emitted another `end` event', () => {
          iterator._eventCounts.end.should.equal(1);
        });

        it('should have ended', () => {
          iterator.ended.should.be.true;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should be done', () => {
          iterator.done.should.be.true;
        });

        it('should not be readable', () => {
          iterator.readable.should.be.false;
        });

        it('should not have called `_read` anymore', () => {
          iterator._read.should.have.been.calledOnce;
        });
      });
    });
  });

  describe('A BufferedIterator that is being closed', () => {
    let iterator;
    before(() => {
      iterator = new BufferedIterator();
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[BufferedIterator {buffer: 0}]');
    });

    describe('before it has been closed', () => {
      it('should not have emitted the `readable` event', () => {
        iterator._eventCounts.readable.should.equal(0);
      });

      it('should not have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', () => {
        iterator.ended.should.be.false;
      });

      it('should not have been destroyed', () => {
        iterator.destroyed.should.be.false;
      });

      it('should not be done', () => {
        iterator.done.should.be.false;
      });

      it('should return null on read', () => {
        expect(iterator.read()).to.be.null;
      });
    });

    describe('after it has been closed', () => {
      before(() => { iterator.close(); });

      it('should not have emitted the `readable` event', () => {
        iterator._eventCounts.readable.should.equal(0);
      });

      it('should have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should have ended', () => {
        iterator.ended.should.be.true;
      });

      it('should not have been destroyed', () => {
        iterator.destroyed.should.be.false;
      });

      it('should be done', () => {
        iterator.done.should.be.true;
      });

      it('should return null on read', () => {
        expect(iterator.read()).to.be.null;
      });
    });
  });

  describe('A BufferedIterator that is being closed while reading is in progress', () => {
    let iterator, _readDone;
    function createIterator() {
      iterator = new BufferedIterator({ autoStart: false, maxBufferSize: 1 });
      iterator._read = function (count, done) { _readDone = done; };
      sinon.spy(iterator, '_read');
      captureEvents(iterator, 'readable', 'end');
    }

    describe('when the iterator is closed synchronously after `read` is called', () => {
      before(createIterator);

      it('should provide a readable `toString` representation', () => {
        iterator.toString().should.equal('[BufferedIterator {buffer: 0}]');
      });

      describe('before the iterator has been closed', () => {
        it('should not have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          iterator.ended.should.be.false;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should not be done', () => {
          iterator.done.should.be.false;
        });

        it('should not have called `_read`', () => {
          iterator._read.should.have.callCount(0);
        });
      });

      describe('after `read` is called and the iterator has been closed', () => {
        before(() => {
          iterator.read();
          iterator.close();
          // _readDone cannot be called, as _read should never be called either
          // because the iterator closes before an asynchronous _read can take place
        });

        it('should have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(1);
        });

        it('should have ended', () => {
          iterator.ended.should.be.true;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should be done', () => {
          iterator.done.should.be.true;
        });

        it('should not have called `_read`', () => {
          iterator._read.should.have.callCount(0);
        });
      });
    });

    describe('when the iterator is closed asynchronously after `read` is called', () => {
      before(createIterator);

      it('should provide a readable `toString` representation', () => {
        iterator.toString().should.equal('[BufferedIterator {buffer: 0}]');
      });

      describe('before the iterator has been closed', () => {
        it('should not have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          iterator.ended.should.be.false;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should not be done', () => {
          iterator.done.should.be.false;
        });

        it('should not have called `_read`', () => {
          iterator._read.should.have.callCount(0);
        });
      });

      describe('after `read` is called and the iterator has been closed', () => {
        before(() => {
          iterator.read();
          queueMicrotask(() => { _readDone(); });
          queueMicrotask(() => { iterator.close(); });
        });

        it('should have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(1);
        });

        it('should have ended', () => {
          iterator.ended.should.be.true;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should be done', () => {
          iterator.done.should.be.true;
        });

        it('should have called `_read` once', () => {
          iterator._read.should.have.callCount(1);
        });
      });
    });

    describe('when an item is pushed, and read before closing', () => {
      before(createIterator);

      describe('before the iterator has been closed', () => {
        it('should provide a readable `toString` representation', () => {
          iterator.toString().should.equal('[BufferedIterator {buffer: 0}]');
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

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should not be done', () => {
          iterator.done.should.be.false;
        });

        it('should be readable', () => {
          iterator.readable.should.be.true;
        });

        it('should return null when `read` is called', () => {
          expect(iterator.read()).to.be.null;
        });

        it('should have called `_read` once', () => {
          iterator._read.should.have.callCount(1);
        });
      });

      describe('after an item is pushed', () => {
        before(() => { iterator._push('a'); });

        it('should provide a readable `toString` representation', () => {
          iterator.toString().should.equal('[BufferedIterator {next: a, buffer: 1}]');
        });

        it('should have emitted another `readable` event', () => {
          iterator._eventCounts.readable.should.equal(2);
        });

        it('should not have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          iterator.ended.should.be.false;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should not be done', () => {
          iterator.done.should.be.false;
        });

        it('should be readable', () => {
          iterator.readable.should.be.true;
        });

        it('should not have called `_read` anymore', () => {
          iterator._read.should.have.callCount(1);
        });
      });

      describe('after an item is read', () => {
        let item;
        before(() => { item = iterator.read(); });

        it('should not have emitted another `readable` event', () => {
          iterator._eventCounts.readable.should.equal(2);
        });

        it('should not have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          iterator.ended.should.be.false;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should not be done', () => {
          iterator.done.should.be.false;
        });

        it('should be readable', () => {
          iterator.readable.should.be.true;
        });

        it('should have returned the pushed item', () => {
          item.should.equal('a');
        });

        it('should not have called `_read` anymore', () => {
          iterator._read.should.have.callCount(1);
        });
      });

      describe('after the iterator has been closed', () => {
        before(() => { iterator.close(); });

        it('should not have emitted another `readable` event', () => {
          iterator._eventCounts.readable.should.equal(2);
        });

        it('should not have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          iterator.ended.should.be.false;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should not be done', () => {
          iterator.done.should.be.false;
        });

        it('should be readable', () => {
          iterator.readable.should.be.true;
        });

        it('should not have called `_read` anymore', () => {
          iterator._read.should.have.callCount(1);
        });
      });

      describe('after reading has finished', () => {
        before(() => { _readDone(); });

        it('should not have emitted another `readable` event', () => {
          iterator._eventCounts.readable.should.equal(2);
        });

        it('should have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(1);
        });

        it('should have ended', () => {
          iterator.ended.should.be.true;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should be done', () => {
          iterator.done.should.be.true;
        });

        it('should not be readable', () => {
          iterator.readable.should.be.false;
        });

        it('should return null when `read` is called', () => {
          expect(iterator.read()).to.be.null;
        });

        it('should not have called `_read` anymore', () => {
          iterator._read.should.have.callCount(1);
        });
      });
    });

    describe('when an item is pushed, and read after closing', () => {
      before(createIterator);

      describe('before the iterator has been closed', () => {
        it('should have emitted the `readable` event', () => {
          iterator._eventCounts.readable.should.equal(1);
        });

        it('should not have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          iterator.ended.should.be.false;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should not be done', () => {
          iterator.done.should.be.false;
        });

        it('should be readable', () => {
          iterator.readable.should.be.true;
        });

        it('should return null when `read` is called', () => {
          expect(iterator.read()).to.be.null;
        });

        it('should have called `_read` once', () => {
          iterator._read.should.have.callCount(1);
        });
      });

      describe('after an item is pushed', () => {
        before(() => { iterator._push('a'); });

        it('should have emitted another `readable` event', () => {
          iterator._eventCounts.readable.should.equal(2);
        });

        it('should not have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          iterator.ended.should.be.false;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should not be done', () => {
          iterator.done.should.be.false;
        });

        it('should be readable', () => {
          iterator.readable.should.be.true;
        });

        it('should not have called `_read` anymore', () => {
          iterator._read.should.have.callCount(1);
        });
      });

      describe('after the iterator has been closed', () => {
        before(() => { iterator.close(); });

        it('should not have emitted another `readable` event', () => {
          iterator._eventCounts.readable.should.equal(2);
        });

        it('should not have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          iterator.ended.should.be.false;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should not be done', () => {
          iterator.done.should.be.false;
        });

        it('should be readable', () => {
          iterator.readable.should.be.true;
        });

        it('should not have called `_read` anymore', () => {
          iterator._read.should.have.callCount(1);
        });
      });

      describe('after an item is read', () => {
        let item;
        before(() => { item = iterator.read(); });

        it('should not have emitted another `readable` event', () => {
          iterator._eventCounts.readable.should.equal(2);
        });

        it('should not have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          iterator.ended.should.be.false;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should not be done', () => {
          iterator.done.should.be.false;
        });

        it('should be readable', () => {
          iterator.readable.should.be.true;
        });

        it('should have returned the pushed item', () => {
          item.should.equal('a');
        });

        it('should not have called `_read` anymore', () => {
          iterator._read.should.have.callCount(1);
        });
      });

      describe('after reading has finished', () => {
        before(() => { _readDone(); });

        it('should not have emitted another `readable` event', () => {
          iterator._eventCounts.readable.should.equal(2);
        });

        it('should have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(1);
        });

        it('should have ended', () => {
          iterator.ended.should.be.true;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should be done', () => {
          iterator.done.should.be.true;
        });

        it('should not be readable', () => {
          iterator.readable.should.be.false;
        });

        it('should return null when `read` is called', () => {
          expect(iterator.read()).to.be.null;
        });

        it('should not have called `_read` anymore', () => {
          iterator._read.should.have.callCount(1);
        });
      });
    });
  });

  describe('A BufferedIterator that synchronously pushes "a" and ends', () => {
    function createIterator(options) {
      const iterator = new BufferedIterator(options);
      iterator._read = function (count, done) { this._push('a'); this.close(); done(); };
      sinon.spy(iterator, '_read');
      return captureEvents(iterator, 'readable', 'end');
    }

    describe('without autoStart', () => {
      let iterator;
      before(() => { iterator = createIterator({ autoStart: false }); });

      it('should provide a readable `toString` representation', () => {
        iterator.toString().should.equal('[BufferedIterator {buffer: 0}]');
      });

      describe('before `read` has been called', () => {
        it('should have emitted the `readable` event', () => {
          iterator._eventCounts.readable.should.equal(1);
        });

        it('should not have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          iterator.ended.should.be.false;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should not be done', () => {
          iterator.done.should.be.false;
        });

        it('should be readable', () => {
          iterator.readable.should.be.true;
        });

        it('should not have called _read', () => {
          iterator._read.should.not.have.been.called;
        });
      });

      describe('after `read` has been called the first time', () => {
        let item;
        before(() => { item = iterator.read(); });

        it('should have returned null', () => {
          expect(item).to.be.null;
        });

        it('should have emitted another `readable` event', () => {
          iterator._eventCounts.readable.should.equal(2);
        });

        it('should not have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          iterator.ended.should.be.false;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should not be done', () => {
          iterator.done.should.be.false;
        });

        it('should be readable', () => {
          iterator.readable.should.be.true;
        });

        it('should have called `_read` with 4 (the default maximum buffer size)', () => {
          iterator._read.should.have.been.calledOnce;
          iterator._read.should.have.been.calledWith(4);
        });
      });

      describe('after `read` has been called the second time', () => {
        let item;
        before(() => { item = iterator.read(); });

        it('should have returned "a"', () => {
          expect(item).to.equal('a');
        });

        it('should not have emitted another `readable` event', () => {
          iterator._eventCounts.readable.should.equal(2);
        });

        it('should have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(1);
        });

        it('should have ended', () => {
          iterator.ended.should.be.true;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should be done', () => {
          iterator.done.should.be.true;
        });

        it('should not be readable', () => {
          iterator.readable.should.be.false;
        });

        it('should have called `_read` with 4 (the default maximum buffer size)', () => {
          iterator._read.should.have.been.calledOnce;
          iterator._read.should.have.been.calledWith(4);
        });
      });

      describe('after `read` has been called the third time', () => {
        let item;
        before(() => { item = iterator.read(); });

        it('should have returned null', () => {
          expect(item).to.be.null;
        });

        it('should not have emitted another `readable` event', () => {
          iterator._eventCounts.readable.should.equal(2);
        });

        it('should not have emitted another `end` event', () => {
          iterator._eventCounts.end.should.equal(1);
        });

        it('should have ended', () => {
          iterator.ended.should.be.true;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should be done', () => {
          iterator.done.should.be.true;
        });

        it('should not be readable', () => {
          iterator.readable.should.be.false;
        });

        it('should not have called `_read` anymore', () => {
          iterator._read.should.have.been.calledOnce;
        });
      });
    });

    describe('with autoStart', () => {
      let iterator;
      before(() => { iterator = createIterator(); });

      it('should provide a readable `toString` representation', () => {
        iterator.toString().should.equal('[BufferedIterator {next: a, buffer: 1}]');
      });

      describe('before `read` has been called', () => {
        it('should have emitted the `readable` event', () => {
          iterator._eventCounts.readable.should.equal(1);
        });

        it('should not have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          iterator.ended.should.be.false;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should not be done', () => {
          iterator.done.should.be.false;
        });

        it('should be readable', () => {
          iterator.readable.should.be.true;
        });

        it('should have called `_read` with 4 (the default maximum buffer size)', () => {
          iterator._read.should.have.been.calledOnce;
          iterator._read.should.have.been.calledWith(4);
        });
      });

      describe('after `read` has been called', () => {
        let item;
        before(() => { item = iterator.read(); });

        it('should have returned "a"', () => {
          expect(item).to.equal('a');
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

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should be done', () => {
          iterator.done.should.be.true;
        });

        it('should not be readable', () => {
          iterator.readable.should.be.false;
        });

        it('should not have called `_read` anymore', () => {
          iterator._read.should.have.been.calledOnce;
        });
      });
    });
  });

  describe('A BufferedIterator that pushes "a" (sync) and "b" and "c" (async) on every read', () => {
    function createIterator(options) {
      const iterator = new BufferedIterator(options);
      iterator._read = function (count, done) {
        this._push('a');
        queueMicrotask(() => {
          this._push('b');
          this._push('c');
          done();
        });
      };
      sinon.spy(iterator, '_read');
      return captureEvents(iterator, 'readable', 'end');
    }

    describe('with autoStart enabled', () => {
      let iterator;
      before(() => { iterator = createIterator(); });

      it('should provide a readable `toString` representation', () => {
        iterator.toString().should.equal('[BufferedIterator {next: a, buffer: 3}]');
      });

      describe('before `read` has been called', () => {
        it('should have emitted the `readable` event', () => {
          iterator._eventCounts.readable.should.equal(1);
        });

        it('should not have emitted the `end` event', () => {
          iterator._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          iterator.ended.should.be.false;
        });

        it('should not have been destroyed', () => {
          iterator.destroyed.should.be.false;
        });

        it('should not be done', () => {
          iterator.done.should.be.false;
        });

        it('should be readable', () => {
          iterator.readable.should.be.true;
        });

        it('should have called `_read` with 4 (the maximum buffer size)', () => {
          iterator._read.should.have.been.calledOnce;
          iterator._read.getCall(0).args[0].should.equal(4);
        });
      });

      describe('after `read` has been called the first time', () => {
        let item;
        before(() => {
          item = iterator.read();
          iterator._read.should.have.been.calledOnce; // ensure `_read` is not called synchronously
        });

        it('should have returned "a"', () => {
          expect(item).to.equal('a');
        });

        it('should not have emitted another `readable` event yet', () => {
          iterator._eventCounts.readable.should.equal(1);
        });

        it('should have called `_read` with 2 (number of free places in buffer)', () => {
          iterator._read.should.have.been.calledTwice;
          iterator._read.getCall(1).args[0].should.equal(2);
        });
      });

      describe('after `read` has been called the second time', () => {
        let item;
        before(() => { item = iterator.read(); });

        it('should have returned "b"', () => {
          expect(item).to.equal('b');
        });

        it('should not have emitted another `readable` event yet', () => {
          iterator._eventCounts.readable.should.equal(1);
        });

        it('should not have called `_read` anymore (because buffer is full)', () => {
          iterator._read.should.have.been.calledTwice;
        });
      });

      describe('after `read` is called six more times', () => {
        const items = [];
        before(() => {
          for (let i = 0; i < 6; i++)
            items.push(iterator.read());
        });

        it('should have returned all remaining items in the buffer', () => {
          // plus `null` for two reads past the end of the buffer
          expect(items).to.deep.equal(['c', 'a', 'b', 'c', null, null]);
        });

        it('should have emitted another `readable` event', () => {
          iterator._eventCounts.readable.should.equal(2);
        });

        it('should have called `_read` then with 4 (to fill the entire buffer)', () => {
          iterator._read.should.have.callCount(3);
          iterator._read.getCall(2).args[0].should.equal(4);
        });
      });
    });
  });

  describe('A BufferedIterator with `_read` that calls `done` multiple times', () => {
    let iterator, readDone;
    before(done => {
      iterator = new BufferedIterator({ autoStart: false });
      iterator._read = function (count, callback) { readDone = callback; };
      // `queueMicrotask` because reading directly after construction does not call `_read`;
      // this is necessary to enable attaching a `_begin` hook after construction
      queueMicrotask(() => { iterator.read(); done(); });
    });

    it('should cause an exception', () => {
      readDone.should.not.throw();
      readDone.should.throw('done callback called multiple times');
      readDone.should.throw('done callback called multiple times');
    });
  });

  describe('A BufferedIterator with `_read` that does not call `done`', () => {
    let iterator;
    before(() => {
      iterator = new BufferedIterator();
      iterator._read = function () { this._push('a'); };
    });

    it('should return the first item on read', () => {
      expect(iterator.read()).to.equal('a');
    });

    it('should return null on subsequent reads', () => {
      expect(iterator.read()).to.be.null;
    });
  });

  describe('A BufferedIterator with `_read` that calls `read`', () => {
    let iterator;
    before(() => {
      let counter = 0;
      iterator = new BufferedIterator();
      iterator._read = function () { this.read(); this._push(counter++); };
    });

    it('should return the first item on read', () => {
      expect(iterator.read()).to.equal(0);
    });

    it('should return null on subsequent reads', () => {
      expect(iterator.read()).to.be.null;
    });
  });

  describe('A BufferedIterator with a synchronous beginning', () => {
    let iterator;
    before(() => {
      iterator = new BufferedIterator();
      iterator._begin = function (done) {
        this._push('x');
        this._push('y');
        done();
      };
      iterator._read = function (item, done) {
        this._push('a');
        this.close();
        done();
      };
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[BufferedIterator {next: x, buffer: 3}]');
    });

    describe('before reading an item', () => {
      it('should have emitted the `readable` event', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', () => {
        iterator.ended.should.be.false;
      });

      it('should not have been destroyed', () => {
        iterator.destroyed.should.be.false;
      });

      it('should not be done', () => {
        iterator.done.should.be.false;
      });

      it('should be readable', () => {
        iterator.readable.should.be.true;
      });
    });

    describe('after reading the beginning items', () => {
      const items = [];
      before(() => {
        for (let i = 0; i < 2; i++)
          items.push(iterator.read());
      });

      it('should have read the beginning items', () => {
        items.should.deep.equal(['x', 'y']);
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

      it('should not have been destroyed', () => {
        iterator.destroyed.should.be.false;
      });

      it('should not be done', () => {
        iterator.done.should.be.false;
      });

      it('should be readable', () => {
        iterator.readable.should.be.true;
      });
    });

    describe('after reading the item', () => {
      let item;
      before(() => { item = iterator.read(); });

      it('should have read the item', () => {
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

      it('should not have been destroyed', () => {
        iterator.destroyed.should.be.false;
      });

      it('should be done', () => {
        iterator.done.should.be.true;
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('should return null when `read` is called', () => {
        expect(iterator.read()).to.be.null;
      });
    });
  });

  describe('A BufferedIterator that pushes less than `maxBufferSize` items before _read', () => {
    let iterator;
    before(() => {
      iterator = new BufferedIterator();
      for (let i = 0; i < 3; i++)
        iterator._push(i);
      sinon.spy(iterator, '_read');
    });

    it('should call _read with the remaining number of items', () => {
      iterator._read.should.have.been.calledOnce;
      iterator._read.should.have.been.calledWith(1);
    });
  });

  describe('A BufferedIterator that pushes `maxBufferSize` items before _read', () => {
    let iterator;
    before(() => {
      iterator = new BufferedIterator();
      for (let i = 0; i < 4; i++)
        iterator._push(i);
      sinon.spy(iterator, '_read');
    });

    it('should not call _read', () => {
      iterator._read.should.not.have.been.called;
    });
  });

  describe('A BufferedIterator that starts reading before _read is called', () => {
    let iterator;
    before(() => {
      iterator = new BufferedIterator();
      // Forcibly change the status to 'reading',
      // to test if the iterator deals with such an exceptional situation
      iterator._changeState = function () { iterator._reading = true; };
      sinon.spy(iterator, '_read');
    });

    it('should not call _read', () => {
      iterator._read.should.not.have.been.called;
    });
  });

  describe('A BufferedIterator that closes before _completeClose is called', () => {
    let iterator;
    before(() => {
      iterator = new BufferedIterator();
      iterator.close();
      iterator._changeState(AsyncIterator.CLOSED);
      sinon.spy(iterator, '_flush');
    });

    it('should not call _flush', () => {
      iterator._flush.should.not.have.been.called;
    });
  });

  describe('A BufferedIterator with an asynchronous beginning', () => {
    let iterator;
    before(() => {
      iterator = new BufferedIterator();
      iterator._begin = function (done) {
        queueMicrotask(() => {
          iterator._push('x');
          iterator._push('y');
          done();
        });
      };
      iterator._read = function (item, done) {
        this._push('a');
        this.close();
        done();
      };
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[BufferedIterator {next: x, buffer: 3}]');
    });

    describe('before reading an item', () => {
      it('should have emitted the `readable` event', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', () => {
        iterator.ended.should.be.false;
      });

      it('should not have been destroyed', () => {
        iterator.destroyed.should.be.false;
      });

      it('should not be done', () => {
        iterator.done.should.be.false;
      });

      it('should be readable', () => {
        iterator.readable.should.be.true;
      });
    });

    describe('after reading the beginning items', () => {
      const items = [];
      before(() => {
        for (let i = 0; i < 2; i++)
          items.push(iterator.read());
      });

      it('should have read the beginning items', () => {
        items.should.deep.equal(['x', 'y']);
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

      it('should not have been destroyed', () => {
        iterator.destroyed.should.be.false;
      });

      it('should not be done', () => {
        iterator.done.should.be.false;
      });

      it('should be readable', () => {
        iterator.readable.should.be.true;
      });
    });

    describe('after reading the item', () => {
      let item;
      before(() => { item = iterator.read(); });

      it('should have read the item', () => {
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

      it('should not have been destroyed', () => {
        iterator.destroyed.should.be.false;
      });

      it('should be done', () => {
        iterator.done.should.be.true;
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('should return null when `read` is called', () => {
        expect(iterator.read()).to.be.null;
      });
    });
  });

  describe('A BufferedIterator with `_begin` that calls `done` multiple times', () => {
    let iterator, beginDone;
    before(() => {
      iterator = new BufferedIterator();
      iterator._begin = function (done) { beginDone = done; };
    });

    it('should cause an exception', () => {
      beginDone.should.not.throw();
      beginDone.should.throw('done callback called multiple times');
      beginDone.should.throw('done callback called multiple times');
    });
  });

  describe('A BufferedIterator with `_begin` that does not call `done`', () => {
    let iterator;
    before(() => {
      iterator = new BufferedIterator();
      iterator._begin = function () { this._push('a'); };
      iterator.close();
      sinon.spy(iterator, '_read');
      captureEvents(iterator, 'end');
    });

    it('should be readable', () => {
      iterator.readable.should.be.true;
    });

    it('should return the first item on read', () => {
      expect(iterator.read()).to.equal('a');
    });

    it('should return null on subsequent reads', () => {
      expect(iterator.read()).to.be.null;
    });

    it('should not have emitted the `end` event', () => {
      iterator._eventCounts.end.should.equal(0);
    });

    it('should not have ended', () => {
      iterator.ended.should.be.false;
    });

    it('should not have been destroyed', () => {
      iterator.destroyed.should.be.false;
    });

    it('should not be done', () => {
      iterator.done.should.be.false;
    });

    it('should be readable after reading', () => {
      iterator.readable.should.be.false;
    });

    it('should not have called _read', () => {
      iterator._read.should.not.have.been.called;
    });
  });

  describe('A BufferedIterator with a synchronous flush', () => {
    let iterator;
    before(() => {
      iterator = new BufferedIterator();
      iterator._read = function (item, done) {
        this._push('a');
        this.close();
        done();
      };
      iterator._flush = function (done) {
        this._push('x');
        this._push('y');
        done();
      };
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[BufferedIterator {next: a, buffer: 3}]');
    });

    describe('before reading an item', () => {
      it('should have emitted the `readable` event', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', () => {
        iterator.ended.should.be.false;
      });

      it('should not have been destroyed', () => {
        iterator.destroyed.should.be.false;
      });

      it('should not be done', () => {
        iterator.done.should.be.false;
      });

      it('should be readable', () => {
        iterator.readable.should.be.true;
      });
    });

    describe('after reading the item', () => {
      let item;
      before(() => { item = iterator.read(); });

      it('should have read the item', () => {
        item.should.equal('a');
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

      it('should not have been destroyed', () => {
        iterator.destroyed.should.be.false;
      });

      it('should not be done', () => {
        iterator.done.should.be.false;
      });

      it('should be readable', () => {
        iterator.readable.should.be.true;
      });
    });

    describe('after reading the flushed items', () => {
      const items = [];
      before(() => {
        for (let i = 0; i < 2; i++)
          items.push(iterator.read());
      });

      it('should have read the flushed items', () => {
        items.should.deep.equal(['x', 'y']);
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

      it('should not have been destroyed', () => {
        iterator.destroyed.should.be.false;
      });

      it('should be done', () => {
        iterator.done.should.be.true;
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('should return null when `read` is called', () => {
        expect(iterator.read()).to.be.null;
      });
    });
  });

  describe('A BufferedIterator with an asynchronous flush', () => {
    let iterator;
    before(() => {
      iterator = new BufferedIterator();
      iterator._read = function (item, done) {
        this._push('a');
        this.close();
        done();
      };
      iterator._flush = function (done) {
        queueMicrotask(() => {
          iterator._push('x');
          iterator._push('y');
          done();
        });
      };
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[BufferedIterator {next: a, buffer: 3}]');
    });

    describe('before reading an item', () => {
      it('should have emitted the `readable` event', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', () => {
        iterator.ended.should.be.false;
      });

      it('should not have been destroyed', () => {
        iterator.destroyed.should.be.false;
      });

      it('should not be done', () => {
        iterator.done.should.be.false;
      });

      it('should be readable', () => {
        iterator.readable.should.be.true;
      });
    });

    describe('after reading the item', () => {
      let item;
      before(() => { item = iterator.read(); });

      it('should have read the item', () => {
        item.should.equal('a');
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

      it('should not have been destroyed', () => {
        iterator.destroyed.should.be.false;
      });

      it('should not be done', () => {
        iterator.done.should.be.false;
      });

      it('should be readable', () => {
        iterator.readable.should.be.true;
      });
    });

    describe('after reading the flushed items', () => {
      const items = [];
      before(() => {
        for (let i = 0; i < 2; i++)
          items.push(iterator.read());
      });

      it('should have read the flushed items', () => {
        items.should.deep.equal(['x', 'y']);
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

      it('should not have been destroyed', () => {
        iterator.destroyed.should.be.false;
      });

      it('should be done', () => {
        iterator.done.should.be.true;
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('should return null when `read` is called', () => {
        expect(iterator.read()).to.be.null;
      });
    });
  });

  describe('A BufferedIterator with `_flush` that calls `done` multiple times', () => {
    let iterator, flushDone;
    before(() => {
      iterator = new BufferedIterator();
      iterator._flush = function (done) { flushDone = done; };
      iterator.close();
      iterator.read();
    });

    it('should cause an exception', () => {
      flushDone.should.not.throw();
      flushDone.should.throw('done callback called multiple times');
      flushDone.should.throw('done callback called multiple times');
    });
  });

  describe('A BufferedIterator with `_flush` that does not call `done`', () => {
    let iterator;
    before(() => {
      iterator = new BufferedIterator();
      iterator._flush = function () { this._push('a'); };
      iterator.close();
      captureEvents(iterator, 'end');
    });

    it('should return the first item on read', () => {
      expect(iterator.read()).to.equal('a');
    });

    it('should return null on subsequent reads', () => {
      expect(iterator.read()).to.be.null;
    });

    it('should not have emitted the `end` event', () => {
      iterator._eventCounts.end.should.equal(0);
    });

    it('should not have ended', () => {
      iterator.ended.should.be.false;
    });

    it('should not have been destroyed', () => {
      iterator.destroyed.should.be.false;
    });

    it('should not be done', () => {
      iterator.done.should.be.false;
    });
  });

  describe('A BufferedIterator with a synchronous flush that is destroyed', () => {
    let iterator;
    before(() => {
      iterator = new BufferedIterator({ maxBufferSize: 1 });
      iterator._read = function (item, done) {
        this._push('a');
        done();
      };
      iterator._flush = function (done) {
        this._push('x');
        this._push('y');
        done();
      };
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[BufferedIterator {next: a, buffer: 1}]');
    });

    describe('before reading an item', () => {
      it('should have emitted the `readable` event', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', () => {
        iterator.ended.should.be.false;
      });

      it('should not have been destroyed', () => {
        iterator.destroyed.should.be.false;
      });

      it('should not be done', () => {
        iterator.done.should.be.false;
      });

      it('should be readable', () => {
        iterator.readable.should.be.true;
      });
    });

    describe('after reading the item and destroying', () => {
      let item;
      before(() => {
        item = iterator.read();
        iterator.destroy();
      });

      it('should have read the item', () => {
        item.should.equal('a');
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

      it('should have been destroyed', () => {
        iterator.destroyed.should.be.true;
      });

      it('should be done', () => {
        iterator.done.should.be.true;
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('should return null when `read` is called', () => {
        expect(iterator.read()).to.be.null;
      });
    });
  });

  describe('A BufferedIterator with an asynchronous flush that is destroyed', () => {
    let iterator;
    before(() => {
      iterator = new BufferedIterator({ maxBufferSize: 1 });
      iterator._read = function (item, done) {
        this._push('a');
        done();
      };
      iterator._flush = function (done) {
        queueMicrotask(() => {
          iterator._push('x');
          iterator._push('y');
          done();
        });
      };
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[BufferedIterator {next: a, buffer: 1}]');
    });

    describe('before reading an item', () => {
      it('should have emitted the `readable` event', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', () => {
        iterator.ended.should.be.false;
      });

      it('should not have been destroyed', () => {
        iterator.destroyed.should.be.false;
      });

      it('should not be done', () => {
        iterator.done.should.be.false;
      });

      it('should be readable', () => {
        iterator.readable.should.be.true;
      });
    });

    describe('after reading the item and destroying', () => {
      let item;
      before(() => {
        item = iterator.read();
        iterator.destroy();
      });

      it('should have read the item', () => {
        item.should.equal('a');
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

      it('should have been destroyed', () => {
        iterator.destroyed.should.be.true;
      });

      it('should be done', () => {
        iterator.done.should.be.true;
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('should return null when `read` is called', () => {
        expect(iterator.read()).to.be.null;
      });
    });
  });

  describe('A BufferedIterator created with a maximum buffer size', () => {
    it('changes non-numeric maximum buffer sizes into 4', () => {
      (new BufferedIterator({ maxBufferSize: 'b' })).maxBufferSize.should.equal(4);
    });

    it('changes negative maximum buffer sizes into 1', () => {
      (new BufferedIterator({ maxBufferSize: -37 })).maxBufferSize.should.equal(1);
    });

    it('changes a 0 maximum buffer sizes into 1', () => {
      (new BufferedIterator({ maxBufferSize: 0 })).maxBufferSize.should.equal(1);
    });

    it('retains a positive integer maximum buffer size', () => {
      (new BufferedIterator({ maxBufferSize: 7 })).maxBufferSize.should.equal(7);
    });

    it('floors a positive non-integer maximum buffer size', () => {
      (new BufferedIterator({ maxBufferSize: 7.5 })).maxBufferSize.should.equal(7);
    });

    it('retains an infinite maximum buffer size', () => {
      (new BufferedIterator({ maxBufferSize: Infinity })).maxBufferSize.should.equal(Infinity);
    });

    describe('when changing the buffer size', () => {
      let iterator;
      before(() => {
        iterator = new BufferedIterator({ maxBufferSize: 6 });
        iterator._read = sinon.spy(function (count, done) {
          for (let i = 0; i < 4; i++)
            this._push(i);
          done();
        });
      });

      describe('before changing', () => {
        it('should have called _read', () => {
          iterator._read.should.have.callCount(1);
        });
      });

      describe('to a different value', () => {
        before(() => {
          iterator.maxBufferSize = 8.4;
        });

        it('should change the value', () => {
          iterator.maxBufferSize.should.equal(8);
        });

        it('should have called _read again', () => {
          iterator._read.should.have.callCount(2);
        });
      });

      describe('to the same value', () => {
        before(() => {
          iterator.maxBufferSize = 8.6;
        });

        it('should not change the value', () => {
          iterator.maxBufferSize.should.equal(8);
        });

        it('should not have called _read again', () => {
          iterator._read.should.have.callCount(2);
        });
      });
    });
  });

  describe('A BufferedIterator created with an infinite maximum buffer size', () => {
    let iterator, i = 0;
    before(done => {
      iterator = new BufferedIterator({ maxBufferSize: Infinity });
      iterator._read = sinon.spy(function (count, next) {
        this._push(++i);
        if (i === 10) {
          this.close();
          done();
        }
        next();
      });
    });

    it('reads the source until the end', () => {
      iterator._read.should.have.callCount(10);
    });

    it('calls `_read` on the source with a count of 128', () => {
      iterator._read.getCall(0).args[0].should.equal(128);
    });
  });

  describe('A BufferedIterator create with a finite maximum buffer size', () => {
    let iterator, i = 0, beforeDone;
    before(() => {
      iterator = new BufferedIterator({ maxBufferSize: 4 });
      iterator._read = sinon.spy(function (count, next) {
        this._push(++i);
        if (i === 10) {
          this.close();
          beforeDone();
        }
        next();
      });
    });

    describe('before the maximum buffer size is increased to infinity', () => {
      it('reads the source twice', () => {
        iterator._read.should.have.callCount(2);
      });
    });

    describe('after the maximum buffer size is increased to infinity', () => {
      before(done => {
        iterator.maxBufferSize = Infinity;
        beforeDone = done;
      });

      it('reads the source until the end', () => {
        iterator._read.should.have.callCount(10);
      });
    });
  });

  describe('A BufferedIterator that is destroyed', () => {
    let iterator, i = 0;
    before(() => {
      iterator = new BufferedIterator();
      iterator._read = sinon.spy(function (count, next) {
        this._push(++i);
        next();
      });
      captureEvents(iterator, 'data', 'end', 'readable');
      iterator.destroy();
    });

    it('should not call _read()', () => {
      iterator._read.should.have.callCount(0);
    });

    it('should allow pushing but have no effect', () => {
      iterator._push(10);
      iterator.toString().should.equal('[BufferedIterator {buffer: 0}]');
    });

    it('should have an empty buffer', () => {
      iterator._buffer.length.should.equal(0);
    });

    it('should not have ended', () => {
      iterator.ended.should.be.false;
    });

    it('should have been destroyed', () => {
      iterator.destroyed.should.be.true;
    });

    it('should be done', () => {
      iterator.done.should.be.true;
    });

    it('should not be readable', () => {
      iterator.readable.should.be.false;
    });

    it('cannot be made readable again', () => {
      iterator.readable = true;
      iterator.readable.should.be.false;
    });

    it('should return null when trying to read', () => {
      expect(iterator.read()).to.be.null;
    });

    it('should not have any listeners for data, readable, or end', () => {
      expect(iterator._events).to.not.contain.key('data');
      expect(iterator._events).to.not.contain.key('readable');
      expect(iterator._events).to.not.contain.key('end');
    });
  });

  describe('A BufferedIterator that is destroyed after the first item', () => {
    let iterator, i = 0;
    before(() => {
      iterator = new BufferedIterator();
      iterator._read = sinon.spy(function (count, next) {
        this._push(++i);
        next();
        if (i === 1)
          iterator.destroy();
      });
      captureEvents(iterator, 'data', 'end', 'readable');
    });

    it('should have called _read() once', () => {
      iterator._read.should.have.callCount(1);
    });

    it('should have an empty buffer', () => {
      iterator._buffer.length.should.equal(0);
    });

    it('should not have ended', () => {
      iterator.ended.should.be.false;
    });

    it('should have been destroyed', () => {
      iterator.destroyed.should.be.true;
    });

    it('should be done', () => {
      iterator.done.should.be.true;
    });

    it('should not be readable', () => {
      iterator.readable.should.be.false;
    });

    it('cannot be made readable again', () => {
      iterator.readable = true;
      iterator.readable.should.be.false;
    });

    it('should return null when trying to read', () => {
      expect(iterator.read()).to.be.null;
    });

    it('should not have any listeners for data, readable, or end', () => {
      expect(iterator._events).to.not.contain.key('data');
      expect(iterator._events).to.not.contain.key('readable');
      expect(iterator._events).to.not.contain.key('end');
    });
  });

  describe('A BufferedIterator that is destroyed after the first item but before the next call', () => {
    let iterator, i = 0;
    before(() => {
      iterator = new BufferedIterator();
      iterator._read = sinon.spy(function (count, next) {
        this._push(++i);
        if (i === 1)
          iterator.destroy();
        next();
      });
      captureEvents(iterator, 'data', 'end', 'readable');
    });

    it('should have called _read() once', () => {
      iterator._read.should.have.callCount(1);
    });

    it('should have an empty buffer', () => {
      iterator._buffer.length.should.equal(0);
    });

    it('should not have ended', () => {
      iterator.ended.should.be.false;
    });

    it('should have been destroyed', () => {
      iterator.destroyed.should.be.true;
    });

    it('should be done', () => {
      iterator.done.should.be.true;
    });

    it('should not be readable', () => {
      iterator.readable.should.be.false;
    });

    it('cannot be made readable again', () => {
      iterator.readable = true;
      iterator.readable.should.be.false;
    });

    it('should return null when trying to read', () => {
      expect(iterator.read()).to.be.null;
    });

    it('should not have any listeners for data, readable, or end', () => {
      expect(iterator._events).to.not.contain.key('data');
      expect(iterator._events).to.not.contain.key('readable');
      expect(iterator._events).to.not.contain.key('end');
    });
  });
});
