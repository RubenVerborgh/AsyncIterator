import {
  AsyncIterator,
  EmptyIterator,
  empty,
  wrap,
} from '../dist/asynciterator.js';

import { EventEmitter } from 'events';

describe('EmptyIterator', () => {
  describe('The EmptyIterator function', () => {
    describe('the result when called with `new`', () => {
      let instance;
      before(() => { instance = new EmptyIterator(); });

      it('should be an EmptyIterator object', () => {
        instance.should.be.an.instanceof(EmptyIterator);
      });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });

    describe('the result when called through `.empty`', () => {
      let instance;
      before(() => { instance = empty(); });

      it('should be an EmptyIterator object', () => {
        instance.should.be.an.instanceof(EmptyIterator);
      });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });

    describe('the result when called through `.wrap`', () => {
      let instance;
      before(() => { instance = wrap(); });

      it('should be an EmptyIterator object', () => {
        instance.should.be.an.instanceof(EmptyIterator);
      });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });
  });

  describe('An EmptyIterator without arguments', () => {
    let iterator;
    before(() => {
      iterator = new EmptyIterator();
      captureEvents(iterator, 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[EmptyIterator]');
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
});
