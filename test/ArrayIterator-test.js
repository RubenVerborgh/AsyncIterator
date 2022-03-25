import {
  AsyncIterator,
  ArrayIterator,
  fromArray,
} from '../dist/asynciterator.js';

import { EventEmitter } from 'events';

describe('ArrayIterator', () => {
  describe('The ArrayIterator function', () => {
    describe('the result when called with `new`', () => {
      let instance;
      before(() => { instance = new ArrayIterator(); });

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
      before(() => { instance = fromArray(); });

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
      iterator = new ArrayIterator();
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[ArrayIterator (0)]');
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

    it('should return null when read is called', () => {
      expect(iterator.read()).to.be.null;
    });

    it('should return null when read is called', () => {
      expect(iterator.read()).to.be.null;
    });
  });

  describe('An ArrayIterator with an empty array without autoStart', () => {
    let iterator;
    before(() => {
      iterator = new ArrayIterator([], { autoStart: false });
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

  describe('The default splicing threshold', () => {
    it('should lead the iterator to splice its buffer every 64 items', () => {
      const array = new Array(135).fill(true);
      const iterator = new ArrayIterator(array);
      for (let i = 0; i < 64; i += 1)
        iterator.read();
      iterator._buffer.length.should.equal(71);
      for (let i = 0; i < 64; i += 1)
        iterator.read();
      iterator._buffer.length.should.equal(7);
    });
  });

  describe('A custom splicing threshold', () => {
    it('should lead the iterator to splice its buffer accordingly', () => {
      const array = new Array(135).fill(true);
      const iterator = new ArrayIterator(array, { splicingThreshold: 100 });
      for (let i = 0; i < 100; i += 1)
        iterator.read();
      iterator._buffer.length.should.equal(35);
    });
  });

  describe('An Infinity splicing threshold', () => {
    it('should lead the iterator to never splice its buffer', () => {
      const array = new Array(135).fill(true);
      const iterator = new ArrayIterator(array, { splicingThreshold: Infinity });
      for (let i = 0; i < 100; i += 1)
        iterator.read();
      iterator._buffer.length.should.equal(135);
    });
  });

  describe('The toArray() method', () => {
    it('should return an empty array given an empty source array', async () => {
      const array = [];
      const iterator = new ArrayIterator(array);
      const items = await iterator.toArray();
      items.length.should.equal(0);
    });

    it('should return an empty array given an empty source array, even with the limit option', async () => {
      const array = [];
      const iterator = new ArrayIterator(array);
      const items = await iterator.toArray({ limit: 10 });
      items.length.should.equal(0);
    });

    it('should return a copy of the entire source array if called before any other read operation', async () => {
      const array = [0, 1, 2, 3, 4, 5, 6];
      const iterator = new ArrayIterator(array);
      const items = await iterator.toArray();
      items.should.not.equal(array);
      for (let i = 0; i < array.length; i += 1)
        items[i].should.equal(array[i]);
    });

    it('should return a copy of the entire source array if called before any other read operation with a limit greater than the length of the source array', async () => {
      const array = [0, 1, 2, 3, 4, 5, 6];
      const iterator = new ArrayIterator(array);
      const items = await iterator.toArray({ limit: 10 });
      items.should.not.equal(array);
      for (let i = 0; i < array.length; i += 1)
        items[i].should.equal(array[i]);
    });

    it('should return a portion of the source array if called with the limit option', async () => {
      const array = [0, 1, 2, 3, 4, 5, 6];
      const iterator = new ArrayIterator(array);
      const items = await iterator.toArray({ limit: 2 });
      items.should.not.equal(array);
      for (let i = 0; i < 2; i += 1)
        items[i].should.equal(array[i]);
    });

    it('should return a portion of the source array if called with the limit option after a read operation', async () => {
      const array = [0, 1, 2, 3, 4, 5, 6];
      const iterator = new ArrayIterator(array);
      iterator.read();
      const items = await iterator.toArray({ limit: 2 });
      items.should.not.equal(array);
      for (let i = 0; i < 2; i += 1)
        items[i].should.equal(array[i + 1]);
    });
  });
});
