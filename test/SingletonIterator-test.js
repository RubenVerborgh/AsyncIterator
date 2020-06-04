const AsyncIterator = require('../asynciterator');
const { EventEmitter } = require('events');

const { SingletonIterator } = AsyncIterator;

describe('SingletonIterator', () => {
  describe('The SingletonIterator function', () => {
    describe('the result when called with `new`', () => {
      let instance;
      before(() => { instance = new SingletonIterator(); });

      it('should be a SingletonIterator object', () => {
        instance.should.be.an.instanceof(SingletonIterator);
      });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });

    describe('the result when called through `single`', () => {
      let instance;
      before(() => { instance = AsyncIterator.single(); });

      it('should be a SingletonIterator object', () => {
        instance.should.be.an.instanceof(SingletonIterator);
      });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });
  });

  describe('An SingletonIterator without item', () => {
    let iterator;
    before(() => {
      iterator = new SingletonIterator(null);
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[SingletonIterator]');
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

  describe('An SingletonIterator with an item', () => {
    let iterator, item;
    before(() => {
      iterator = new SingletonIterator(1);
      captureEvents(iterator, 'readable', 'end');
    });

    describe('before calling read', () => {
      it('should provide a readable `toString` representation', () => {
        iterator.toString().should.equal('[SingletonIterator (1)]');
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

    describe('after calling read for the first time', () => {
      before(() => { item = iterator.read(); });

      it('should provide a readable `toString` representation', () => {
        iterator.toString().should.equal('[SingletonIterator]');
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

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });
    });
  });
});
