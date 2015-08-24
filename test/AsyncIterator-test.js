var AsyncIterator = require('../asynciterator').AsyncIterator;

var EventEmitter = require('events').EventEmitter;

describe('AsyncIterator', function () {
  describe('The AsyncIterator function', function () {
    describe('the result when called without `new`', function () {
      var instance;
      before(function () { instance = AsyncIterator(); });

      it('should be an AsyncIterator object', function () {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', function () {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });

    describe('the result when called with `new`', function () {
      var instance;
      before(function () { instance = new AsyncIterator(); });

      it('should be an AsyncIterator object', function () {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', function () {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });
  });

  describe('A default AsyncIterator instance', function () {
    var iterator;
    before(function () {
      iterator = new AsyncIterator();
      captureEvents(iterator, 'data', 'readable', 'end');
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

      it('should not have any listeners for data, readable, or end', function () {
        iterator._events.should.not.contain.key('data');
        iterator._events.should.not.contain.key('readable');
        iterator._events.should.not.contain.key('end');
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

      it('should not have any listeners for data, readable, or end', function () {
        iterator._events.should.not.contain.key('data');
        iterator._events.should.not.contain.key('readable');
        iterator._events.should.not.contain.key('end');
      });
    });
  });

  describe('An AsyncIterator instance without items', function () {
    var iterator, dataListener;
    before(function () {
      iterator = new AsyncIterator();
    });

    describe('after a data listener is attached', function () {
      before(function () {
        iterator.on('data', dataListener = sinon.spy());
      });

      it('should not have emitted the `data` event', function () {
        dataListener.should.not.have.been.called;
      });
    });

    describe('after the iterator has ended', function () {
      before(function () {
        iterator.close();
      });

      it('should not have emitted the `data` event', function () {
        dataListener.should.not.have.been.called;
      });
    });
  });

  describe('An AsyncIterator instance with 1 item', function () {
    var iterator, dataListener;
    before(function () {
      var items = [1];
      iterator = new AsyncIterator();
      iterator.readable = true;
      iterator.read = function () { return items.shift() || iterator.close(); };
    });

    describe('after a data listener is attached', function () {
      before(function () {
        iterator.on('data', dataListener = sinon.spy());
      });

      it('should have emitted the `data` event with the item', function () {
        dataListener.should.have.been.calledOnce;
        dataListener.should.have.been.calledWith(1);
      });
    });

    describe('after the iterator has been closed', function () {
      it('should not have emitted another `data` event', function () {
        dataListener.should.have.been.calledOnce;
      });
    });
  });

  describe('An AsyncIterator instance to which items are added', function () {
    var iterator, dataListener1, dataListener2, items = [];
    before(function () {
      iterator = new AsyncIterator();
      iterator.readable = true;
      iterator.read = sinon.spy(function () { return items.shift(); });
    });

    describe('after two items are added', function () {
      before(function () {
        items.push(1, 2);
        iterator.emit('readable');
      });

      it('should not have called `read`', function () {
        iterator.read.should.not.have.been.called;
      });
    });

    describe('after a `data` listener is attached', function () {
      before(function () {
        iterator.on('data', dataListener1 = sinon.spy());
      });

      it('should have emitted the `data` event for both items', function () {
        dataListener1.should.have.callCount(2);
        dataListener1.getCall(0).args[0].should.equal(1);
        dataListener1.getCall(1).args[0].should.equal(2);
      });

      it('should have called `read` for both items, plus one check afterwards', function () {
        iterator.read.should.have.callCount(2 + 1);
      });

      it('should only have one `readable` listener', function () {
        EventEmitter.listenerCount(iterator, 'readable').should.equal(1);
      });

      it('should not be listening for the `newListener` event', function () {
        EventEmitter.listenerCount(iterator, 'newListener').should.equal(0);
      });
    });

    describe('after a second `data` listener is attached', function () {
      before(function () {
        iterator.on('data', dataListener2 = sinon.spy());
      });

      it('should not emit `data` events on either listener', function () {
        dataListener1.should.have.callCount(2);
        dataListener2.should.have.callCount(0);
      });

      it('should not have called `read` more', function () {
        iterator.read.should.have.callCount(3);
      });

      it('should only have one `readable` listener', function () {
        EventEmitter.listenerCount(iterator, 'readable').should.equal(1);
      });

      it('should not be listening for the `newListener` event', function () {
        EventEmitter.listenerCount(iterator, 'newListener').should.equal(0);
      });
    });

    describe('after two more data items are added', function () {
      before(function () {
        items.push(3, 4);
        iterator.emit('readable');
      });

      it('should have emitted the `data` event for both items', function () {
        dataListener1.should.have.callCount(4);
        dataListener1.getCall(2).args[0].should.equal(3);
        dataListener1.getCall(3).args[0].should.equal(4);
        dataListener2.should.have.callCount(2);
        dataListener2.getCall(0).args[0].should.equal(3);
        dataListener2.getCall(1).args[0].should.equal(4);
      });

      it('should have called `read` for all four items, plus two checks afterwards', function () {
        iterator.read.should.have.callCount(4 + 2);
      });
    });

    describe('after the two listeners are removed and two new items are added', function () {
      before(function () {
        iterator.removeListener('data', dataListener1);
        iterator.removeListener('data', dataListener2);

        items.push(5, 6);
        iterator.emit('readable');
      });

      it('should not have called `read` anymore', function () {
        iterator.read.should.have.callCount(4 + 2);
      });

      it('should not be listening for the `readable` event anymore', function () {
        EventEmitter.listenerCount(iterator, 'readable').should.equal(0);
      });
    });

    describe('after the `data` listeners are attached again', function () {
      before(function () {
        iterator.on('data', dataListener1);
        iterator.on('data', dataListener2);
      });

      it('should have emitted the `data` event for both new items', function () {
        dataListener1.should.have.callCount(6);
        dataListener1.getCall(4).args[0].should.equal(5);
        dataListener1.getCall(5).args[0].should.equal(6);
        dataListener2.should.have.callCount(4);
        dataListener2.getCall(2).args[0].should.equal(5);
        dataListener2.getCall(3).args[0].should.equal(6);
      });

      it('should have called `read` for all six items, plus three checks afterwards', function () {
        iterator.read.should.have.callCount(6 + 3);
      });

      it('should only have one `readable` listener', function () {
        EventEmitter.listenerCount(iterator, 'readable').should.equal(1);
      });

      it('should not be listening for the `newListener` event', function () {
        EventEmitter.listenerCount(iterator, 'newListener').should.equal(0);
      });
    });

    describe('after the iterator is closed', function () {
      before(function () {
        iterator.close();
      });

      it('should not have listeners for the `data` event', function () {
        EventEmitter.listenerCount(iterator, 'readable').should.equal(0);
      });

      it('should not be listening for the `readable` event', function () {
        EventEmitter.listenerCount(iterator, 'readable').should.equal(0);
      });

      it('should not be listening for the `newListener` event', function () {
        EventEmitter.listenerCount(iterator, 'newListener').should.equal(0);
      });
    });
  });
});
