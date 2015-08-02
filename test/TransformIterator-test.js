var TransformIterator = require('../asynciterator').TransformIterator;

var AsyncIterator = require('../asynciterator').AsyncIterator,
    BufferedIterator = require('../asynciterator').BufferedIterator,
    EmptyIterator = require('../asynciterator').EmptyIterator,
    ArrayIterator = require('../asynciterator').ArrayIterator,
    EventEmitter = require('events').EventEmitter;

describe('TransformIterator', function () {
  describe('The TransformIterator function', function () {
    describe('the result when called without `new`', function () {
      var instance;
      before(function () { instance = TransformIterator(); });

      it('should be a TransformIterator object', function () {
        instance.should.be.an.instanceof(TransformIterator);
      });

      it('should be an AsyncIterator object', function () {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', function () {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });

    describe('the result when called with `new`', function () {
      var instance;
      before(function () { instance = new TransformIterator(); });

      it('should be a TransformIterator object', function () {
        instance.should.be.an.instanceof(TransformIterator);
      });

      it('should be an AsyncIterator object', function () {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', function () {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });
  });

  describe('A TransformIterator', function () {
    it('disallows setting a falsy object as source', function () {
      var iterator = new TransformIterator();
      (function () { iterator.source = null; })
      .should.throw('Invalid source: null');
    });

    it('disallows setting an object without `read` function as source', function () {
      var iterator = new TransformIterator();
      (function () { iterator.source = { read: 1, on: function () {} }; })
      .should.throw('Invalid source: [object Object]');
    });

    it('disallows setting an object without `on` function as source', function () {
      var iterator = new TransformIterator();
      (function () { iterator.source = { on: 1, read: function () {} }; })
      .should.throw('Invalid source: [object Object]');
    });

    it('disallows setting another source after one has been set', function () {
      var iterator = new TransformIterator();
      iterator.source = new EmptyIterator();
      (function () { iterator.source = new EmptyIterator(); })
      .should.throw('The source cannot be changed after it has been set');
    });

    it('allows setting the source through the first argument', function () {
      var source = new EmptyIterator(),
          iterator = new TransformIterator(source);
      iterator.source.should.equal(source);
    });

    it('allows setting the source through an options hash as first argument', function () {
      var source = new EmptyIterator(),
          iterator = new TransformIterator({ source: source });
      iterator.source.should.equal(source);
    });

    it('allows setting the source through an options hash as second argument', function () {
      var source = new EmptyIterator(),
          iterator = new TransformIterator(null, { source: source });
      iterator.source.should.equal(source);
    });

    it('gives precedence to a source as first argument', function () {
      var sourceA = new EmptyIterator(),
          sourceB = new EmptyIterator(),
          iterator = new TransformIterator(sourceA, { source: sourceB });
      iterator.source.should.equal(sourceA);
    });

    it('does not allow setting a source that already has a destination', function () {
      var source = new EmptyIterator(),
          iteratorA = new TransformIterator(),
          iteratorB = new TransformIterator();
      (function () { iteratorA.source = source; }).should.not.throw();
      (function () { iteratorB.source = source; }).should.throw('The source already has a destination');
    });
  });

  describe('A TransformIterator without arguments', function () {
    var iterator;
    before(function () {
      iterator = new TransformIterator();
      captureEvents(iterator, 'readable', 'end');
    });

    it('should have undefined as `source` property', function () {
      expect(iterator.source).to.be.undefined;
    });

    it('should not have emitted the `readable` event', function () {
      iterator._eventCounts.readable.should.equal(0);
    });

    it('should not have emitted the `end` event', function () {
      iterator._eventCounts.end.should.equal(0);
    });

    it('should not have ended', function () {
      iterator.ended.should.be.false;
    });

    it('should return undefined when `read` is called', function () {
      expect(iterator.read()).to.be.undefined;
    });
  });

  describe('A TransformIterator initialized with an empty source', function () {
    var iterator, source;
    before(function () {
      iterator = new TransformIterator(source = new EmptyIterator());
      captureEvents(iterator, 'readable', 'end');
      source._events.should.not.contain.key('data');
      source._events.should.not.contain.key('readable');
      source._events.should.not.contain.key('end');
    });

    it('should expose the source in the `source` property', function () {
      iterator.source.should.equal(source);
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

  describe('A TransformIterator initialized with a source that ends asynchronously', function () {
    var iterator, source;
    before(function () {
      iterator = new TransformIterator(source = new AsyncIterator());
      captureEvents(iterator, 'readable', 'end');
    });

    describe('before the source ends', function () {
      it('should not have emitted the `readable` event', function () {
        iterator._eventCounts.readable.should.equal(0);
      });

      it('should not have emitted the `end` event', function () {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', function () {
        iterator.ended.should.be.false;
      });

      it('should return undefined when read is called', function () {
        expect(iterator.read()).to.be.undefined;
      });
    });

    describe('after the source ends', function () {
      before(function () { source.close(); });

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

  describe('A default TransformIterator with a one-item source', function () {
    var iterator, source;
    before(function () {
      iterator = new TransformIterator(source = new ArrayIterator(['a']));
      captureEvents(iterator, 'readable', 'end');
      sinon.spy(source, 'read');
      // intentionally break source cleanup to verify whether destination does it
      source._terminate = function () { this._changeState(AsyncIterator.ENDED); };
    });

    describe('before reading an item', function () {
      it('should have called `read` on the source', function () {
        source.read.should.have.been.calledOnce;
      });

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

    describe('after reading an item', function () {
      var item;
      before(function () { item = iterator.read(); });

      it('should have read the original item', function () {
        item.should.equal('a');
      });

      it('should not have emitted the `readable` event anymore', function () {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should have emitted the `end` event', function () {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should have ended', function () {
        iterator.ended.should.be.true;
      });

      it('should return undefined when `read` is called', function () {
        expect(iterator.read()).to.be.undefined;
      });

      it('should not leave `readable` listeners on the source', function () {
        EventEmitter.listenerCount(source, 'readable').should.equal(0);
      });

      it('should not leave `end` listeners on the source', function () {
        EventEmitter.listenerCount(source, 'end').should.equal(0);
      });

      it('should remove itself as destination from the source', function () {
        source.should.not.have.key('_destination');
      });
    });
  });
});
