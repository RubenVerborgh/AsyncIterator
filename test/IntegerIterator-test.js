var IntegerIterator = require('../asynciterator').IntegerIterator;

var AsyncIterator = require('../asynciterator').AsyncIterator;

describe('IntegerIterator', function () {
  describe('The IntegerIterator module', function () {
    it('should make IntegerIterator objects', function () {
      IntegerIterator().should.be.an.instanceof(IntegerIterator);
    });

    it('should be an IntegerIterator constructor', function () {
      new IntegerIterator().should.be.an.instanceof(IntegerIterator);
    });

    it('should make AsyncIterator objects', function () {
      IntegerIterator().should.be.an.instanceof(AsyncIterator);
    });

    it('should be an EventEmitter constructor', function () {
      new IntegerIterator().should.be.an.instanceof(AsyncIterator);
    });
  });

  describe('An IntegerIterator without arguments', function () {
    var iterator;
    before(function () {
      iterator = new IntegerIterator();
      captureEvents(iterator, 'readable', 'end');
    });

    describe('before reading', function () {
      it('should have emitted the `readable` event', function () {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', function () {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', function () {
        iterator.ended.should.be.false;
      });
    });

    describe('when reading elements', function () {
      it('should return 0 on read call 1', function () {
        expect(iterator.read()).to.equal(0);
      });

      it('should return 1 on read call 2', function () {
        expect(iterator.read()).to.equal(1);
      });

      it('should return 2 on read call 3', function () {
        expect(iterator.read()).to.equal(2);
      });

      it('should not have emitted more `readable` events', function () {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', function () {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', function () {
        iterator.ended.should.be.false;
      });
    });
  });

  describe('An IntegerIterator from -5 to 10 in steps of 5', function () {
    var iterator;
    before(function () {
      iterator = new IntegerIterator({ start: -5, end: 10, step: 5 });
      captureEvents(iterator, 'readable', 'end');
    });

    describe('before reading', function () {
      it('should have emitted the `readable` event', function () {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', function () {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', function () {
        iterator.ended.should.be.false;
      });
    });

    describe('when reading elements', function () {
      it('should return -5 on read call 1', function () {
        expect(iterator.read()).to.equal(-5);
      });

      it('should return 0 on read call 2', function () {
        expect(iterator.read()).to.equal(0);
      });

      it('should return 5 on read call 3', function () {
        expect(iterator.read()).to.equal(5);
      });

      it('should not have emitted more `readable` events', function () {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', function () {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', function () {
        iterator.ended.should.be.false;
      });
    });

    describe('when reading the final element', function () {
      it('should return 10 on read call 4', function () {
        expect(iterator.read()).to.equal(10);
      });

      it('should not have emitted more `readable` events', function () {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should have emitted the `end` event', function () {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should have ended', function () {
        iterator.ended.should.be.true;
      });

      it('should return undefined on read call 5', function () {
        expect(iterator.read()).to.equal(undefined);
      });
    });
  });

  describe('An IntegerIterator from 10 to -5 in steps of 5', function () {
    var iterator;
    before(function () {
      iterator = new IntegerIterator({ start: 10, end: -5, step: 5 });
      captureEvents(iterator, 'readable', 'end');
    });

    describe('before reading', function () {
      it('should not have emitted the `readable` event', function () {
        iterator._eventCounts.readable.should.equal(0);
      });

      it('should have emitted the `end` event', function () {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should have ended', function () {
        iterator.ended.should.be.true;
      });

      it('should return undefined when read is called', function () {
        expect(iterator.read()).to.equal(undefined);
      });
    });
  });

  describe('An IntegerIterator from 10 to -5 in steps of -5', function () {
    var iterator;
    before(function () {
      iterator = new IntegerIterator({ start: 10, end: -5, step: -5 });
      captureEvents(iterator, 'readable', 'end');
    });

    describe('before reading', function () {
      it('should have emitted the `readable` event', function () {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', function () {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', function () {
        iterator.ended.should.be.false;
      });
    });

    describe('when reading elements', function () {
      it('should return 10 on read call 1', function () {
        expect(iterator.read()).to.equal(10);
      });

      it('should return 5 on read call 2', function () {
        expect(iterator.read()).to.equal(5);
      });

      it('should return 0 on read call 3', function () {
        expect(iterator.read()).to.equal(0);
      });

      it('should not have emitted more `readable` events', function () {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', function () {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', function () {
        iterator.ended.should.be.false;
      });
    });

    describe('when reading the final element', function () {
        it('should return -5 on read call 4', function () {
        expect(iterator.read()).to.equal(-5);
      });

      it('should not have emitted more `readable` events', function () {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should have emitted the `end` event', function () {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should have ended', function () {
        iterator.ended.should.be.true;
      });

      it('should return undefined on read call 5', function () {
        expect(iterator.read()).to.equal(undefined);
      });
    });
  });

  describe('An IntegerIterator starting at Infinity', function () {
    var iterator;
    before(function () {
      iterator = new IntegerIterator({ start: Infinity });
      captureEvents(iterator, 'readable', 'end');
    });

    describe('before reading', function () {
      it('should not have emitted the `readable` event', function () {
        iterator._eventCounts.readable.should.equal(0);
      });

      it('should have emitted the `end` event', function () {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should have ended', function () {
        iterator.ended.should.be.true;
      });

      it('should return undefined when read is called', function () {
        expect(iterator.read()).to.equal(undefined);
      });
    });
  });

  describe('An IntegerIterator starting at -Infinity', function () {
    var iterator;
    before(function () {
      iterator = new IntegerIterator({ start: -Infinity });
      captureEvents(iterator, 'readable', 'end');
    });

    describe('before reading', function () {
      it('should not have emitted the `readable` event', function () {
        iterator._eventCounts.readable.should.equal(0);
      });

      it('should have emitted the `end` event', function () {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should have ended', function () {
        iterator.ended.should.be.true;
      });

      it('should return undefined when read is called', function () {
        expect(iterator.read()).to.equal(undefined);
      });
    });
  });

  describe('An IntegerIterator stopping at -Infinity', function () {
    var iterator;
    before(function () {
      iterator = new IntegerIterator({ end: -Infinity });
      captureEvents(iterator, 'readable', 'end');
    });

    describe('before reading', function () {
      it('should not have emitted the `readable` event', function () {
        iterator._eventCounts.readable.should.equal(0);
      });

      it('should have emitted the `end` event', function () {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should have ended', function () {
        iterator.ended.should.be.true;
      });

      it('should return undefined when read is called', function () {
        expect(iterator.read()).to.equal(undefined);
      });
    });
  });
});
