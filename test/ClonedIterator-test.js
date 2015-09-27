var ClonedIterator = require('../asynciterator').ClonedIterator;

var TransformIterator = require('../asynciterator').TransformIterator,
    AsyncIterator = require('../asynciterator').AsyncIterator,
    BufferedIterator = require('../asynciterator').BufferedIterator,
    EmptyIterator = require('../asynciterator').EmptyIterator,
    ArrayIterator = require('../asynciterator').ArrayIterator,
    EventEmitter = require('events').EventEmitter;

describe('ClonedIterator', function () {
  describe('The ClonedIterator function', function () {
    describe('the result when called without `new`', function () {
      var instance;
      before(function () { instance = ClonedIterator(); });

      it('should be a ClonedIterator object', function () {
        instance.should.be.an.instanceof(ClonedIterator);
      });

      it('should be a TransformIterator object', function () {
        instance.should.be.an.instanceof(TransformIterator);
      });

      it('should be a BufferedIterator object', function () {
        instance.should.be.an.instanceof(BufferedIterator);
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
      before(function () { instance = new ClonedIterator(); });

      it('should be a ClonedIterator object', function () {
        instance.should.be.an.instanceof(ClonedIterator);
      });

      it('should be a TransformIterator object', function () {
        instance.should.be.an.instanceof(TransformIterator);
      });

      it('should be a BufferedIterator object', function () {
        instance.should.be.an.instanceof(BufferedIterator);
      });

      it('should be an AsyncIterator object', function () {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', function () {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });
  });

  describe('Cloning an iterator that already has a destination', function () {
    it('should throw an exception', function () {
      var source = new AsyncIterator(), destination = new TransformIterator(source);
      source.should.have.property('_destination', destination);
      (function () { source.clone(); }).should.throw('The source already has a destination');
    });
  });

  describe('Cloning an empty iterator', function () {
    var clones = createClones(function () { return new EmptyIterator(); });

    describeClones(clones, function (getClone, getIterator) {
      it('should have the original iterator as source', function () {
        getClone().source.should.equal(getIterator());
      });

      it('should not have emitted the `readable` event', function () {
        getClone()._eventCounts.readable.should.equal(0);
      });

      it('should have emitted the `end` event', function () {
        getClone()._eventCounts.end.should.equal(1);
      });

      it('should have ended', function () {
        getClone().ended.should.be.true;
      });

      it('should not be readable', function () {
        getClone().readable.should.be.false;
      });

      it('should return undefined on read', function () {
        expect(getClone().read()).to.be.undefined;
      });
    });
  });

  describe('Cloning an iterator that asynchronously closes', function () {
    function createIterator() { return new BufferedIterator(); }

    function beforeClosing(getClone, getIterator, index) {
      describe('before closing', function () {
        it('should have the original iterator as source', function () {
          getClone().source.should.equal(getIterator());
        });

        if (index === 0) {
          it('should not have emitted the `readable` event', function () {
            getClone()._eventCounts.readable.should.equal(0);
          });
        }

        it('should not have emitted the `end` event', function () {
          getClone()._eventCounts.end.should.equal(0);
        });

        it('should not have ended', function () {
          getClone().ended.should.be.false;
        });

        if (index === 0) {
          it('should not be readable', function () {
            getClone().readable.should.be.false;
          });

          it('should return undefined on read', function () {
            expect(getClone().read()).to.be.undefined;
          });
        }
      });
    }

    function afterItem(getClone, getIterator, index) {
      describe('after emitting an item', function () {
        if (index === 0)
          before(function () { getIterator()._push('a'); });

        it('should have emitted the `readable` event', function () {
          getClone()._eventCounts.readable.should.equal(1);
        });

        it('should not have emitted the `end` event', function () {
          getClone()._eventCounts.end.should.equal(0);
        });

        it('should not have ended', function () {
          getClone().ended.should.be.false;
        });

        it('should be readable', function () {
          getClone().readable.should.be.true;
        });

        it('should read the item', function () {
          expect(getClone().read()).to.equal('a');
        });
      });
    }

    function afterClosing(getClone, getIterator, index) {
      describe('after closing', function () {
        if (index === 0)
          before(function () { getIterator().close(); });

        it('should not have emitted anymore `readable` events', function () {
          getClone()._eventCounts.readable.should.equal(1);
        });

        it('should have emitted the `end` event', function () {
          getClone()._eventCounts.end.should.equal(1);
        });

        it('should have ended', function () {
          getClone().ended.should.be.true;
        });

        it('should not be readable', function () {
          getClone().readable.should.be.false;
        });

        it('should return undefined on read', function () {
          expect(getClone().read()).to.be.undefined;
        });
      });
    }

    describe('reading sequentially', function () {
      var clones = createClones(createIterator);
      describeClones(clones, function (getClone, getIterator, index) {
        beforeClosing(getClone, getIterator, index);
        afterItem(getClone, getIterator, index);
        afterClosing(getClone, getIterator, index);
      });
    });

    describe('reading in parallel', function () {
      var clones = createClones(createIterator);
      describeClones(clones, beforeClosing);
      describeClones(clones, afterItem);
      describeClones(clones, afterClosing);
    });
  });

  describe('Cloning a one-element iterator', function () {
    function createIterator() { return new ArrayIterator(['a']); }

    function beforeReading(getClone, getIterator) {
      describe('before reading an item', function () {
        it('should have the original iterator as source', function () {
          getClone().source.should.equal(getIterator());
        });

        it('should have emitted the `readable` event', function () {
          getClone()._eventCounts.readable.should.equal(1);
        });

        it('should not have emitted the `end` event', function () {
          getClone()._eventCounts.end.should.equal(0);
        });

        it('should not have ended', function () {
          getClone().ended.should.be.false;
        });

        it('should be readable', function () {
          getClone().readable.should.be.true;
        });
      });
    }

    function afterReading(getClone) {
      describe('after reading an item', function () {
        var item;
        before(function () { item = getClone().read(); });

        it('should have read the item', function () {
          expect(item).to.equal('a');
        });

        it('should not have emitted the `readable` event anymore', function () {
          getClone()._eventCounts.readable.should.equal(1);
        });

        it('should have emitted the `end` event', function () {
          getClone()._eventCounts.end.should.equal(1);
        });

        it('should have ended', function () {
          getClone().ended.should.be.true;
        });

        it('should not be readable', function () {
          getClone().readable.should.be.false;
        });

        it('should return undefined on read', function () {
          expect(getClone().read()).to.be.undefined;
        });
      });
    }

    describe('reading sequentially', function () {
      var clones = createClones(createIterator);
      describeClones(clones, function (getClone, getIterator, index) {
        beforeReading(getClone, getIterator, index);
        afterReading(getClone, getIterator, index);
      });
    });

    describe('reading in parallel', function () {
      var clones = createClones(createIterator);
      describeClones(clones, beforeReading);
      describeClones(clones, afterReading);
    });
  });

  describe('Cloning a two-element iterator', function () {
    function createIterator() { return new ArrayIterator(['a', 'b']); }

    function beforeReading(getClone, getIterator) {
      describe('before reading an item', function () {
        it('should have the original iterator as source', function () {
          getClone().source.should.equal(getIterator());
        });

        it('should have emitted the `readable` event', function () {
          getClone()._eventCounts.readable.should.equal(1);
        });

        it('should not have emitted the `end` event', function () {
          getClone()._eventCounts.end.should.equal(0);
        });

        it('should not have ended', function () {
          getClone().ended.should.be.false;
        });

        it('should be readable', function () {
          getClone().readable.should.be.true;
        });
      });
    }

    function afterReadingFirst(getClone) {
      describe('after reading the first item', function () {
        var item;
        before(function () { item = getClone().read(); });

        it('should have read the item', function () {
          expect(item).to.equal('a');
        });

        it('should not have emitted the `readable` event anymore', function () {
          getClone()._eventCounts.readable.should.equal(1);
        });

        it('should not have emitted the `end` event', function () {
          getClone()._eventCounts.end.should.equal(0);
        });

        it('should not have ended', function () {
          getClone().ended.should.be.false;
        });

        it('should be readable', function () {
          getClone().readable.should.be.true;
        });
      });
    }

    function afterReadingSecond(getClone) {
      describe('after reading the second item', function () {
        var item;
        before(function () { item = getClone().read(); });

        it('should have read the item', function () {
          expect(item).to.equal('b');
        });

        it('should not have emitted the `readable` event anymore', function () {
          getClone()._eventCounts.readable.should.equal(1);
        });

        it('should have emitted the `end` event', function () {
          getClone()._eventCounts.end.should.equal(1);
        });

        it('should have ended', function () {
          getClone().ended.should.be.true;
        });

        it('should not be readable', function () {
          getClone().readable.should.be.false;
        });

        it('should return undefined on read', function () {
          expect(getClone().read()).to.be.undefined;
        });
      });
    }

    describe('reading sequentially', function () {
      var clones = createClones(createIterator);
      describeClones(clones, function (getClone, getIterator, index) {
        beforeReading(getClone, getIterator, index);
        afterReadingFirst(getClone, getIterator, index);
        afterReadingSecond(getClone, getIterator, index);
      });
    });

    describe('reading in parallel', function () {
      var clones = createClones(createIterator);
      describeClones(clones, beforeReading);
      describeClones(clones, afterReadingFirst);
      describeClones(clones, afterReadingSecond);
    });
  });

  describe('Cloning an iterator with properties', function () {
    var iterator, clone;
    before(function () {
      iterator = new AsyncIterator();
      iterator.setProperty('foo', 'FOO');
      iterator.setProperty('bar', 'BAR');
      clone = iterator.clone();
    });

    describe('before a property is set on the clone', function () {
      var callback;
      before(function () {
        callback = sinon.stub();
        clone.getProperty('foo', callback);
      });

      it('should return the property from the original without callback', function () {
        expect(clone.getProperty('foo')).to.equal('FOO');
      });

      it('should return the property from the original with callback', function () {
        callback.should.have.been.calledOnce;
        callback.should.have.been.calledWith('FOO');
      });
    });

    describe('after a property is changed on the original', function () {
      var callback;
      before(function () {
        iterator.setProperty('foo', 'FOO2');
        callback = sinon.stub();
        clone.getProperty('foo', callback);
      });

      it('should return the property from the original without callback', function () {
        expect(clone.getProperty('foo')).to.equal('FOO2');
      });

      it('should return the property from the original with callback', function () {
        callback.should.have.been.calledOnce;
        callback.should.have.been.calledWith('FOO2');
      });
    });

    describe('after a property is set on the clone', function () {
      var callback;
      before(function () {
        clone.setProperty('bar', 'NEWBAR');
        callback = sinon.stub();
        clone.getProperty('bar', callback);
      });

      it('should not have changed the original', function () {
        expect(iterator.getProperty('bar')).to.equal('BAR');
      });

      it('should return the new property without callback', function () {
        expect(clone.getProperty('bar')).to.equal('NEWBAR');
      });

      it('should return the new property with callback', function () {
        callback.should.have.been.calledOnce;
        callback.should.have.been.calledWith('NEWBAR');
      });
    });

    describe('a property callback for a property first set on the clone', function () {
      var callback;
      before(function () {
        callback = sinon.stub();
        clone.getProperty('cloneFirst', callback);
      });

      describe('before the property is set', function () {
        it('should not call the callback', function () {
          callback.should.not.have.been.called;
        });
      });

      describe('after the property is set on the clone', function () {
        before(function () {
          clone.setProperty('cloneFirst', 'CLONE');
          callback.should.not.have.been.called;
        });

        it('should call the callback with the value', function () {
          callback.should.have.been.calledOnce;
          callback.should.have.been.calledWith('CLONE');
        });

        it("should return the clone's property value", function () {
          expect(clone.getProperty('cloneFirst')).to.equal('CLONE');
        });
      });

      describe('after the property is set on the original', function () {
        before(function () {
          iterator.setProperty('cloneFirst', 'ORIGINAL');
        });

        it('should not call the callback anymore', function () {
          callback.should.have.been.calledOnce;
        });

        it("should return the clone's property value", function () {
          expect(clone.getProperty('cloneFirst')).to.equal('CLONE');
        });
      });
    });

    describe('a property callback for a property first set on the original', function () {
      var callback;
      before(function () {
        callback = sinon.stub();
        clone.getProperty('originalFirst', callback);
      });

      describe('before the property is set', function () {
        it('should not call the callback', function () {
          callback.should.not.have.been.called;
        });
      });

      describe('after the property is set on the original', function () {
        before(function () {
          iterator.setProperty('originalFirst', 'ORIGINAL');
          callback.should.not.have.been.called;
        });

        it('should call the callback with the value', function () {
          callback.should.have.been.calledOnce;
          callback.should.have.been.calledWith('ORIGINAL');
        });

        it('should return the original property value', function () {
          expect(clone.getProperty('originalFirst')).to.equal('ORIGINAL');
        });
      });

      describe('after the property is set on the clone', function () {
        before(function () {
          iterator.setProperty('originalFirst', 'CLONE');
        });

        it('should not call the callback anymore', function () {
          callback.should.have.been.calledOnce;
        });

        it("should return the clone's property value", function () {
          expect(clone.getProperty('originalFirst')).to.equal('CLONE');
        });
      });
    });
  });

  describe('Cloning an iterator that errors', function () {
    var iterator, clones;
    before(function () {
      iterator = new AsyncIterator();
      clones = [iterator.clone(), iterator.clone()];
      clones[2] = clones[1].clone();
      clones[3] = clones[2].clone();
      clones.forEach(function (clone) {
        clone.errorHandler = sinon.stub();
        clone.on('error', clone.errorHandler);
      });
    });

    describe('before an error occurs', function () {
      it('non of the clones should have emitted any error', function () {
        clones.forEach(function (clone) {
          clone.errorHandler.should.not.have.been.called;
        });
      });
    });

    describe('after a first error occurs', function () {
      var error1;
      before(function () {
        clones.forEach(function (clone) {
          clone.errorHandler.reset();
        });
        iterator.emit('error', error1 = new Error('error1'));
      });

      it('all clones should re-emit the error', function () {
        clones.forEach(function (clone) {
          clone.errorHandler.should.have.been.calledOnce;
          clone.errorHandler.should.have.been.calledWith(error1);
        });
      });
    });

    describe('after a second error occurs', function () {
      var error2;
      before(function () {
        clones.forEach(function (clone) {
          clone.errorHandler.reset();
        });
        iterator.emit('error', error2 = new Error('error2'));
      });

      it('all clones should re-emit the error', function () {
        clones.forEach(function (clone) {
          clone.errorHandler.should.have.been.calledOnce;
          clone.errorHandler.should.have.been.calledWith(error2);
        });
      });
    });

    describe('after the iterator has ended and errors again', function () {
      before(function (done) {
        clones.forEach(function (clone) {
          clone.errorHandler.reset();
        });
        iterator.close();
        iterator.on('end', function () {
          function noop() {}
          iterator.on('error', noop); // avoid triggering the default error handler
          iterator.emit('error', new Error('error3'));
          iterator.removeListener('error', noop);
          done();
        });
      });

      it('no clone should re-emit the error', function () {
        clones.forEach(function (clone) {
          clone.errorHandler.should.not.have.been.called;
        });
      });

      it('should not leave any error handlers attached', function () {
        iterator.listenerCount('error').should.equal(0);
      });
    });
  });
});

// Returns a wrapper function that remembers its return value for subsequent calls
function memoize(func, arg) {
  var result;
  return function () { return result || (result = func(arg)); };
}

// Creates a single clone
function createClone(getSource) {
  var clone = getSource().clone();
  captureEvents(clone, 'readable', 'end');
  return clone;
}

// Returns a hash of functions that create clones
function createClones(createIterator) {
  var clones = { iterator: memoize(createIterator) };
  ['clone 1', 'clone 2'].forEach(function (id) {
    var getClone = clones[id] = memoize(createClone, clones.iterator);
    clones['clone of ' +  id] = memoize(createClone, getClone);
  });
  return clones;
}

// Returns a `describe` environment for each of the clones
function describeClones(clones, describeClone) {
  Object.keys(clones).forEach(function (id, index) {
    // The item at index 0 is the iterator creation function
    if (index > 0) {
      var getClone = clones[id];
      describe(id, function () {
       // Pre-load the clone so events can fire
        before(function () { getClone(); });
        describeClone(getClone, clones.iterator, index - 1);
      });
    }
  });
}
