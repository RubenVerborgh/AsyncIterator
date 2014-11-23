var Iterator = require('../pullme').Iterator;

var EventEmitter = require('events').EventEmitter;

describe('Iterator', function () {
  describe('The Iterator module', function () {
    it('should make Iterator objects', function () {
      Iterator().should.be.an.instanceof(Iterator);
    });

    it('should be a Iterator constructor', function () {
      new Iterator().should.be.an.instanceof(Iterator);
    });

    it('should make EventEmitter objects', function () {
      Iterator().should.be.an.instanceof(EventEmitter);
    });

    it('should be a EventEmitter constructor', function () {
      new Iterator().should.be.an.instanceof(EventEmitter);
    });
  });

  describe('A default Iterator instance', function () {
    var iterator;
    before(function () {
      iterator = new Iterator();
      captureEvents(iterator, 'readable', 'end');
    });

    it('should not have emitted the `readable` event', function () {
      iterator._eventCounts.readable.should.equal(0);
    });

    it('should not have emitted the `end` event', function () {
      iterator._eventCounts.end.should.equal(0);
    });

    it('should return undefined when trying to read', function () {
      expect(iterator.read()).to.be.undefined;
    });

    it('should not have ended', function () {
      iterator.ended.should.be.false;
    });

    describe('after close has been called', function () {
      before(function () { iterator.close(); });

      it('should not have emitted the `readable` event', function () {
        iterator._eventCounts.readable.should.equal(0);
      });

      it('should have emitted the `end` event', function () {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should have ended', function () {
        iterator.ended.should.be.true;
      });

      it('should return undefined when trying to read', function () {
        expect(iterator.read()).to.be.undefined;
      });

      it('should not have any listeners', function () {
        iterator.should.not.contain.key('_events');
      });

      it('should not allow adding listeners with `on`', function () {
        iterator.on('end', function () {});
        iterator.should.not.contain.key('_events');
      });

      it('should not allow adding listeners with `once`', function () {
        iterator.on('once', function () {});
        iterator.should.not.contain.key('_events');
      });

      it('should not allow adding listeners with `addListener`', function () {
        iterator.addListener('end', function () {});
        iterator.should.not.contain.key('_events');
      });
    });

    describe('after close has been called a second time', function () {
      before(function () { iterator.close(); });

      it('should not have emitted the `readable` event', function () {
        iterator._eventCounts.readable.should.equal(0);
      });

      it('should not have emitted the `end` event a second time', function () {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should have ended', function () {
        iterator.ended.should.be.true;
      });

      it('should return undefined when trying to read', function () {
        expect(iterator.read()).to.be.undefined;
      });

      it('should not have any listeners', function () {
        iterator.should.not.contain.key('_events');
      });

      it('should not allow adding listeners with `on`', function () {
        iterator.on('end', function () {});
        iterator.should.not.contain.key('_events');
      });

      it('should not allow adding listeners with `once`', function () {
        iterator.on('once', function () {});
        iterator.should.not.contain.key('_events');
      });

      it('should not allow adding listeners with `addListener`', function () {
        iterator.addListener('end', function () {});
        iterator.should.not.contain.key('_events');
      });
    });
  });
});
