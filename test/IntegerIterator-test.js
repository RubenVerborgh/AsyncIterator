import {
  AsyncIterator,
  IntegerIterator,
  range,
} from '../dist/asynciterator.js';

import { EventEmitter } from 'events';

describe('IntegerIterator', () => {
  describe('The IntegerIterator function', () => {
    describe('the result when called with `new`', () => {
      let instance;
      before(() => { instance = new IntegerIterator(); });

      it('should be an IntegerIterator object', () => {
        instance.should.be.an.instanceof(IntegerIterator);
      });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });

    describe('the result when called through `range', () => {
      let instance;
      before(() => { instance = range(); });

      it('should be an IntegerIterator object', () => {
        instance.should.be.an.instanceof(IntegerIterator);
      });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });
  });

  describe('An IntegerIterator without arguments', () => {
    let iterator;
    before(() => {
      iterator = new IntegerIterator();
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[IntegerIterator (0...Infinity)]');
    });

    describe('before reading', () => {
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

    describe('when reading items', () => {
      it('should return 0 on read call 1', () => {
        expect(iterator.read()).to.equal(0);
      });

      it('should return 1 on read call 2', () => {
        expect(iterator.read()).to.equal(1);
      });

      it('should return 2 on read call 3', () => {
        expect(iterator.read()).to.equal(2);
      });

      it('should not have emitted more `readable` events', () => {
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
  });

  describe('An IntegerIterator from -5 to 10 in steps of 5', () => {
    let iterator;
    before(() => {
      iterator = new IntegerIterator({ start: -5, end: 10, step: 5 });
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[IntegerIterator (-5...10)]');
    });

    describe('before reading', () => {
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

    describe('when reading items', () => {
      it('should return -5 on read call 1', () => {
        expect(iterator.read()).to.equal(-5);
      });

      it('should return 0 on read call 2', () => {
        expect(iterator.read()).to.equal(0);
      });

      it('should return 5 on read call 3', () => {
        expect(iterator.read()).to.equal(5);
      });

      it('should not have emitted more `readable` events', () => {
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

    describe('when reading the final item', () => {
      it('should return 10 on read call 4', () => {
        expect(iterator.read()).to.equal(10);
      });

      it('should not have emitted more `readable` events', () => {
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

      it('should return null on read call 5', () => {
        expect(iterator.read()).to.equal(null);
      });
    });
  });


  describe('An IntegerIterator from 10 to -5 in steps of -5', () => {
    let iterator;
    before(() => {
      iterator = new IntegerIterator({ start: 10, end: -5, step: -5 });
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[IntegerIterator (10...-5)]');
    });

    describe('before reading', () => {
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

    describe('when reading items', () => {
      it('should return 10 on read call 1', () => {
        expect(iterator.read()).to.equal(10);
      });

      it('should return 5 on read call 2', () => {
        expect(iterator.read()).to.equal(5);
      });

      it('should return 0 on read call 3', () => {
        expect(iterator.read()).to.equal(0);
      });

      it('should not have emitted more `readable` events', () => {
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

    describe('when reading the final item', () => {
      it('should return -5 on read call 4', () => {
        expect(iterator.read()).to.equal(-5);
      });

      it('should not have emitted more `readable` events', () => {
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

      it('should return null on read call 5', () => {
        expect(iterator.read()).to.equal(null);
      });
    });
  });

  describe('An IntegerIterator starting at Infinity', () => {
    let iterator;
    before(() => {
      iterator = new IntegerIterator({ start: Infinity });
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[IntegerIterator (Infinity...Infinity)]');
    });

    describe('before reading', () => {
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
        expect(iterator.read()).to.equal(null);
      });
    });
  });

  describe('An IntegerIterator starting at Infinity and counting down', () => {
    let iterator;
    before(() => {
      iterator = new IntegerIterator({ start: Infinity, step: -1 });
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[IntegerIterator (Infinity...-Infinity)]');
    });

    describe('before reading', () => {
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
        expect(iterator.read()).to.equal(null);
      });
    });
  });

  describe('An IntegerIterator starting at -Infinity', () => {
    let iterator;
    before(() => {
      iterator = new IntegerIterator({ start: -Infinity });
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[IntegerIterator (-Infinity...Infinity)]');
    });

    describe('before reading', () => {
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
        expect(iterator.read()).to.equal(null);
      });
    });
  });

  describe('An IntegerIterator stopping at -Infinity', () => {
    let iterator;
    before(() => {
      iterator = new IntegerIterator({ end: -Infinity });
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[IntegerIterator (0...-Infinity)]');
    });

    describe('before reading', () => {
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
        expect(iterator.read()).to.equal(null);
      });
    });
  });

  describe('An IntegerIterator with Infinity as step size', () => {
    let iterator;
    before(() => {
      iterator = new IntegerIterator({ step: Infinity });
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[IntegerIterator (0...Infinity)]');
    });

    describe('when reading items', () => {
      it('should return 0 on read call 1', () => {
        expect(iterator.read()).to.equal(0);
      });

      it('should return Infinity on read call 1', () => {
        expect(iterator.read()).to.equal(Infinity);
      });

      it('should return Infinity on read call 2', () => {
        expect(iterator.read()).to.equal(Infinity);
      });
    });
  });
});
