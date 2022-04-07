import {
  AsyncIterator,
  ArrayIterator,
  fromArray,
  wrap,
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

    describe('the result when called through `wrap`', () => {
      let instance;
      before(() => { instance = wrap([]); });

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

    it('should return an empty array given upon toArray', async () => {
      (await iterator.toArray()).length.should.equal(0);
      (await iterator.toArray({ limnit: 10 })).length.should.equal(0);
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

  describe('An ArrayIterator with a six-item array', () => {
    const array = [0, 1, 2, 3, 4, 5];
    let iterator, items;
    beforeEach(() => {
      iterator = new ArrayIterator(array);
    });

    it('should return all items upon toArray', async () => {
      items = await iterator.toArray();
      items.should.not.equal(array);
      items.should.deep.equal(array);
    });

    it('should return all items upon toArray with limit 10', async () => {
      items = await iterator.toArray({ limit: 10 });
      items.should.not.equal(array);
      items.should.deep.equal(array);
    });

    it('should return 2 items upon toArray with limit 2', async () => {
      items = await iterator.toArray({ limit: 2 });
      items.should.deep.equal([0, 1]);

      items = await iterator.toArray({ limit: 4 });
      items.should.deep.equal([2, 3, 4, 5]);

      items = await iterator.toArray({ limit: 2 });
      items.should.deep.equal([]);
    });

    describe('after reading elements', () => {
      beforeEach(() => {
        expect(iterator.read()).to.equal(0);
        expect(iterator.read()).to.equal(1);
      });

      it('should return all remaining items upon toArray', async () => {
        items = await iterator.toArray();
        items.should.deep.equal([2, 3, 4, 5]);
      });

      it('should return 2 remaining items upon toArray with limit 2', async () => {
        items = await iterator.toArray({ limit: 2 });
        items.should.deep.equal([2, 3]);

        items = await iterator.toArray({ limit: 2 });
        items.should.deep.equal([4, 5]);

        items = await iterator.toArray({ limit: 2 });
        items.should.deep.equal([]);
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
    const count = 256;
    let source;

    beforeEach(() => {
      source = [];
      for (let i = 0; i < count; i++)
        source.push(i);
    });

    describe('with default settings', () => {
      let iterator;
      beforeEach(() => {
        iterator = new ArrayIterator(source);

        // Modify the source
        source[0] = 'a';
        source.pop();
      });

      it('should return the original items', () => {
        expect(iterator.read()).to.equal(0);
        expect(iterator.read()).to.equal(1);
        expect(iterator.read()).to.equal(2);
        expect(iterator.read()).to.equal(3);
      });
    });

    describe('with preserve set to true', () => {
      let iterator;
      beforeEach(() => {
        iterator = new ArrayIterator(source, { preserve: true });

        // Modify the source
        source[0] = 'a';
        source.pop();
      });

      it('should return the original items', () => {
        expect(iterator.read()).to.equal(0);
        expect(iterator.read()).to.equal(1);
        expect(iterator.read()).to.equal(2);
        expect(iterator.read()).to.equal(3);
      });
    });

    describe('with preserve set to false', () => {
      let iterator;
      beforeEach(() => {
        iterator = new ArrayIterator(source, { preserve: false });
      });

      it('should truncate the source array every 64 items', () => {
        source.length.should.equal(count);

        for (let i = 0; i < 64; i++)
          expect(iterator.read()).to.equal(i);
        source.length.should.equal(count - 64);

        for (let i = 64; i < 128; i++)
          expect(iterator.read()).to.equal(i);
        source.length.should.equal(count - 64 - 64);
      });
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
});
