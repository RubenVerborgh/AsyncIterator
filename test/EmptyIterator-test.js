var EmptyIterator = require('../asynciterator').EmptyIterator;

var AsyncIterator = require('../asynciterator').AsyncIterator;

describe('EmptyIterator', function () {
  describe('The EmptyIterator module', function () {
    it('should make EmptyIterator objects', function () {
      EmptyIterator().should.be.an.instanceof(EmptyIterator);
    });

    it('should be an EmptyIterator constructor', function () {
      new EmptyIterator().should.be.an.instanceof(EmptyIterator);
    });

    it('should make AsyncIterator objects', function () {
      EmptyIterator().should.be.an.instanceof(AsyncIterator);
    });

    it('should be an EventEmitter constructor', function () {
      new EmptyIterator().should.be.an.instanceof(AsyncIterator);
    });
  });

  describe('An EmptyIterator without arguments', function () {
    var iterator;
    before(function () {
      iterator = new EmptyIterator();
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
});
