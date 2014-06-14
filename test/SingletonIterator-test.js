var SingletonIterator = require('../pullme').SingletonIterator;

var Iterator = require('../pullme').Iterator;

describe('SingletonIterator', function () {
  describe('The SingletonIterator module', function () {
    it('should make SingletonIterator objects', function () {
      SingletonIterator().should.be.an.instanceof(SingletonIterator);
    });

    it('should be an SingletonIterator constructor', function () {
      new SingletonIterator().should.be.an.instanceof(SingletonIterator);
    });

    it('should make Iterator objects', function () {
      SingletonIterator().should.be.an.instanceof(Iterator);
    });

    it('should be an EventEmitter constructor', function () {
      new SingletonIterator().should.be.an.instanceof(Iterator);
    });
  });

  describe('An SingletonIterator without item', function () {
    var iterator;
    before(function () {
      iterator = new SingletonIterator();
      captureEvents(iterator, 'readable', 'end');
    });

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
      expect(iterator.read()).to.be.undefined;
    });
  });

  describe('An SingletonIterator with an item', function () {
    var iterator, item;
    before(function () {
      iterator = new SingletonIterator(1);
      captureEvents(iterator, 'readable', 'end');
    });

    describe('before calling read', function () {
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

    describe('after calling read for the first time', function () {
      before(function () { item = iterator.read(); });

      it('should read the first item of the array', function () {
        item.should.equal(1);
      });

      it('should return undefined when read is called again', function () {
        expect(iterator.read()).to.be.undefined;
      });

      it('should have emitted the `end` event', function () {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should have ended', function () {
        iterator.ended.should.be.true;
      });
    });
  });
});
