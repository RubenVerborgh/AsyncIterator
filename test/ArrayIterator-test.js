import {
  AsyncIterator,
  ArrayIterator,
  fromArray,
} from '../dist/asynciterator.js';

import { EventEmitter } from 'events';
import { promisifyEventEmitter } from 'event-emitter-promisify';

describe('ArrayIterator', () => {
  describe('The ArrayIterator function', () => {
    describe('the result when called with `new`', () => {
      let instance;
      before(() => { instance = new ArrayIterator([]); });

      it('should be an ArrayIterator object', () => {
        instance.should.be.an.instanceof(ArrayIterator);
      });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });

    describe('the result when called through `fromArray`', () => {
      let instance;
      before(() => { instance = fromArray([]); });

      it('should be an ArrayIterator object', () => {
        instance.should.be.an.instanceof(ArrayIterator);
      });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });
  });

  describe('An ArrayIterator without arguments', () => {
    let iterator;
    before(() => {
      iterator = new ArrayIterator([]);
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[ArrayIterator (0)]');
    });

    it('should have emitted the `readable` event', () => {
      iterator._eventCounts.readable.should.equal(1);
    });

    it('should not have emitted the `end` event', () => {
      iterator._eventCounts.end.should.equal(0);
    });

    it('emit end once data is subscribed', done => {
      iterator.on('end', done);
      iterator.on('data', () => { throw new Error('should not emit data'); });
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

    it('should return null when read is called', () => {
      expect(iterator.read()).to.be.null;
    });
  });

  describe('An ArrayIterator with an empty array', () => {
    let iterator;
    before(() => {
      iterator = new ArrayIterator([]);
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[ArrayIterator (0)]');
    });

    it('should not have emitted the `readable` event', () => {
      iterator._eventCounts.readable.should.equal(1);
    });

    it('should not have emitted the `end` event', () => {
      iterator._eventCounts.end.should.equal(0);
    });

    it('emit end once data is subscribed', done => {
      iterator.on('data', () => { throw new Error('should not emit data'); });
      iterator.on('end', done);
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

    it('should return null when read is called', () => {
      expect(iterator.read()).to.be.null;
    });

    it('should return null when read is called', () => {
      expect(iterator.read()).to.be.null;
    });
  });

  describe('An ArrayIterator with an empty array (no use of flow)', () => {
    let iterator;
    before(() => {
      iterator = new ArrayIterator([]);
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[ArrayIterator (0)]');
    });

    it('should not have emitted the `readable` event', () => {
      iterator._eventCounts.readable.should.equal(1);
    });

    it('should not have emitted the `end` event', () => {
      iterator._eventCounts.end.should.equal(0);
    });

    it('should return null when read is called', () => {
      expect(iterator.read()).to.be.null;
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

    it('should return null when read is called', () => {
      expect(iterator.read()).to.be.null;
    });

    it('should return null when read is called', () => {
      expect(iterator.read()).to.be.null;
    });
  });


  describe('An ArrayIterator with an array [1] (no use of flow)', () => {
    let iterator;
    before(() => {
      iterator = new ArrayIterator([1]);
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[ArrayIterator (1)]');
    });

    it('should not have emitted the `readable` event', () => {
      iterator._eventCounts.readable.should.equal(1);
    });

    it('should not have emitted the `end` event', () => {
      iterator._eventCounts.end.should.equal(0);
    });

    it('should return 1 when read is called', () => {
      expect(iterator.read()).to.equal(1);
    });

    it('should not have emitted the `readable` event', () => {
      iterator._eventCounts.readable.should.equal(1);
    });

    it('should not have emitted the `end` event', () => {
      iterator._eventCounts.end.should.equal(0);
    });

    it('should return null when read is called', () => {
      expect(iterator.read()).to.be.null;
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

    it('should return null when read is called', () => {
      expect(iterator.read()).to.be.null;
    });

    it('should return null when read is called', () => {
      expect(iterator.read()).to.be.null;
    });
  });

  describe('An ArrayIterator with an empty array', () => {
    let iterator;
    before(() => {
      iterator = new ArrayIterator([]);
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[ArrayIterator (0)]');
    });

    describe('before calling read', () => {
      it('should have emitted the `readable` event', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should no have ended', () => {
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

      it('should return null when read is called', () => {
        expect(iterator.read()).to.be.null;
      });

      it('should return null when read is called', () => {
        expect(iterator.read()).to.be.null;
      });
    });

    describe('after calling read', () => {
      let result;
      before(() => {
        result = iterator.read();
      });

      it('should not have emitted the `readable` event anymore', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', () => {
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

      it('should have returned null', () => {
        expect(result).to.be.null;
      });

      it('should return null when read is called', () => {
        expect(iterator.read()).to.be.null;
      });
    });
  });

  describe('An ArrayIterator with a one-item array', () => {
    let iterator, item;
    before(() => {
      iterator = new ArrayIterator([1]);
      captureEvents(iterator, 'readable', 'end');
    });

    describe('before calling read', () => {
      it('should provide a readable `toString` representation', () => {
        iterator.toString().should.equal('[ArrayIterator (1)]');
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
    });

    describe('after calling read for the first time', () => {
      before(() => { item = iterator.read(); });

      it('should provide a readable `toString` representation', () => {
        iterator.toString().should.equal('[ArrayIterator (0)]');
      });

      it('should read the first item of the array', () => {
        item.should.equal(1);
      });

      it('should return null when read is called again', () => {
        expect(iterator.read()).to.be.null;
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
    });
  });

  describe('An ArrayIterator with a three-item array', () => {
    let iterator, item;
    before(() => {
      iterator = new ArrayIterator([1, 2, 3]);
      captureEvents(iterator, 'readable', 'end');
    });

    describe('before calling read', () => {
      it('should provide a readable `toString` representation', () => {
        iterator.toString().should.equal('[ArrayIterator (3)]');
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
    });

    describe('after calling read for the first time', () => {
      before(() => { item = iterator.read(); });

      it('should provide a readable `toString` representation', () => {
        iterator.toString().should.equal('[ArrayIterator (2)]');
      });

      it('should read the first item of the array', () => {
        item.should.equal(1);
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

    describe('after calling read for the second time', () => {
      before(() => { item = iterator.read(); });

      it('should provide a readable `toString` representation', () => {
        iterator.toString().should.equal('[ArrayIterator (1)]');
      });

      it('should read the second item of the array', () => {
        item.should.equal(2);
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

    describe('after calling read for the third time', () => {
      before(() => { item = iterator.read(); });

      it('should provide a readable `toString` representation', () => {
        iterator.toString().should.equal('[ArrayIterator (0)]');
      });

      it('should read the third item of the array', () => {
        item.should.equal(3);
      });

      it('should return null when read is called again', () => {
        expect(iterator.read()).to.be.null;
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
    });
  });

  describe('An ArrayIterator with an iterable object', () => {
    let iterator, item;
    before(() => {
      const items = [1, 2, 3];
      const iterable = {
        next: () => ({ done: items.length === 0, value: items.shift() }),
        [Symbol.iterator]: () => iterable,
      };
      iterator = new ArrayIterator(iterable);
      captureEvents(iterator, 'readable', 'end');
    });

    describe('before calling read', () => {
      it('should provide a readable `toString` representation', () => {
        iterator.toString().should.equal('[ArrayIterator (3)]');
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
    });

    describe('after calling read for the first time', () => {
      before(() => { item = iterator.read(); });

      it('should provide a readable `toString` representation', () => {
        iterator.toString().should.equal('[ArrayIterator (2)]');
      });

      it('should read the first item of the array', () => {
        item.should.equal(1);
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

    describe('after calling read for the second time', () => {
      before(() => { item = iterator.read(); });

      it('should provide a readable `toString` representation', () => {
        iterator.toString().should.equal('[ArrayIterator (1)]');
      });

      it('should read the second item of the array', () => {
        item.should.equal(2);
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

    describe('after calling read for the third time', () => {
      before(() => { item = iterator.read(); });

      it('should provide a readable `toString` representation', () => {
        iterator.toString().should.equal('[ArrayIterator (0)]');
      });

      it('should read the third item of the array', () => {
        item.should.equal(3);
      });

      it('should return null when read is called again', () => {
        expect(iterator.read()).to.be.null;
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
    });
  });

  describe('An ArrayIterator with an array that is modified afterwards', () => {
    let iterator, items;
    before(() => {
      const array = [1, 2, 3];
      iterator = new ArrayIterator(array);

      // Modify the array
      array[0] = 'a';
      array.pop();
      array.pop();

      items = [iterator.read(), iterator.read(), iterator.read(), iterator.read()];
    });

    it('should return the original items', () => {
      items.should.deep.equal([1, 2, 3, null]);
    });
  });

  describe('An ArrayIterator with a two-item array that is destroyed', () => {
    let iterator;
    before(() => {
      iterator = new ArrayIterator([1, 2]);
      captureEvents(iterator, 'readable', 'end');
      iterator.destroy();
    });

    it('should not have emitted a `readable` event', () => {
      iterator._eventCounts.readable.should.equal(0);
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

    it('should have an empty buffer', () => {
      expect(iterator._buffer).to.be.an('undefined');
    });

    describe('after destroy has been called a second time', () => {
      before(() => { iterator.destroy(); });

      it('should not have emitted a `readable` event', () => {
        iterator._eventCounts.readable.should.equal(0);
      });

      it('should not have emitted the `end` event a second time', () => {
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

      it('should return null when trying to read', () => {
        expect(iterator.read()).to.be.null;
      });

      it('should not have any listeners for data, readable, or end', () => {
        expect(iterator._events).to.not.contain.key('data');
        expect(iterator._events).to.not.contain.key('readable');
        expect(iterator._events).to.not.contain.key('end');
      });

      it('should have an empty buffer', () => {
        expect(iterator._buffer).to.be.an('undefined');
      });
    });
  });

  describe('A ArrayIterator with no elements should not emit until read from', () => {
    it('awaiting undefined (with empty array)', async () => {
      const iterator = new ArrayIterator([]);
      iterator.close()
      await undefined;
      await expect(await promisifyEventEmitter(iterator.on('data', () => { /* */ }))).to.be.undefined;
    });

    it('awaiting promise (with empty array)', async () => {
      const iterator = new ArrayIterator([]);
      await Promise.resolve();
      await expect(await promisifyEventEmitter(iterator.on('data', () => { /* */ }))).to.be.undefined;
    });

    it('awaiting undefined (with one element)', async () => {
      const iterator = new ArrayIterator([1]);
      await undefined;
      await expect(await promisifyEventEmitter(iterator.on('data', () => { /* */ }))).to.be.undefined;
    });

    it('awaiting promise (with one element)', async () => {
      const iterator = new ArrayIterator([1]);
      await Promise.resolve();
      await expect(await promisifyEventEmitter(iterator.on('data', () => { /* */ }))).to.be.undefined;
    });
  });

  describe('An ArrayIterator with no elements should not emit until read from (fromArray constructor)', () => {
    it('awaiting undefined (with empty array)', async () => {
      const iterator = fromArray([]);
      await undefined;
      await expect(await promisifyEventEmitter(iterator.on('data', () => { /* */ }))).to.be.undefined;
    });

    it('awaiting promise (with empty array)', async () => {
      const iterator = fromArray([]);
      await Promise.resolve();
      await expect(await promisifyEventEmitter(iterator.on('data', () => { /* */ }))).to.be.undefined;
    });

    it('awaiting undefined (with one element)', async () => {
      const iterator = fromArray([1]);
      await undefined;
      await expect(await promisifyEventEmitter(iterator.on('data', () => { /* */ }))).to.be.undefined;
    });

    it('awaiting promise (with one element)', async () => {
      const iterator = fromArray([1]);
      await Promise.resolve();
      await expect(await promisifyEventEmitter(iterator.on('data', () => { /* */ }))).to.be.undefined;
    });
  });
});
