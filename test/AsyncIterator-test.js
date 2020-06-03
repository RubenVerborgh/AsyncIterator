const AsyncIterator = require('../asynciterator');

const { EventEmitter } = require('events');

describe('AsyncIterator', () => {
  describe('The AsyncIterator module', () => {
    describe('is a function', () => {
      AsyncIterator.should.be.a('function');
    });

    describe('exposes itself as the AsyncIterator property', () => {
      AsyncIterator.AsyncIterator.should.equal(AsyncIterator);
    });
  });

  describe('The AsyncIterator function', () => {
    describe('the result when called without `new`', () => {
      let instance;
      before(() => { instance = AsyncIterator(); });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });

    describe('the result when called with `new`', () => {
      let instance;
      before(() => { instance = new AsyncIterator(); });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });
  });

  describe('A default AsyncIterator instance', () => {
    let iterator;
    before(() => {
      iterator = new AsyncIterator();
      captureEvents(iterator, 'data', 'readable', 'end');
    });

    it('should provide a readable `toString` representation', () => {
      iterator.toString().should.equal('[AsyncIterator]');
    });

    it('should not have emitted the `readable` event', () => {
      iterator._eventCounts.readable.should.equal(0);
    });

    it('should not have emitted the `end` event', () => {
      iterator._eventCounts.end.should.equal(0);
    });

    it('should return null when trying to read', () => {
      expect(iterator.read()).to.be.null;
    });

    it('should not have ended', () => {
      iterator.ended.should.be.false;
    });

    it('should not have been destroyed', () => {
      iterator.destroyed.should.be.false;
    });

    it('should not be done', () => {
      iterator.done.should.be.false;
    });

    it('should not be readable', () => {
      iterator.readable.should.be.false;
    });

    describe('when readable is set to a truthy value', () => {
      before(() => { iterator.readable = 'a'; });

      it('should have emitted a `readable` event', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should have true as readable value', () => {
        iterator.readable.should.be.true;
      });
    });

    describe('when readable is set to a falsy value', () => {
      before(() => { iterator.readable = null; });

      it('should not have emitted another `readable` event', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should have false as readable value', () => {
        iterator.readable.should.be.false;
      });
    });

    describe('after close has been called', () => {
      before(() => { iterator.close(); });

      it('should not have emitted another `readable` event', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should have ended', () => {
        iterator.ended.should.be.true;
      });

      it('should not have been destroyed', () => {
        iterator.destroyed.should.be.false;
      });

      it('should be done', () => {
        iterator.done.should.be.true;
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('cannot be made readable again', () => {
        iterator.readable = true;
        iterator.readable.should.be.false;
      });

      it('should return null when trying to read', () => {
        expect(iterator.read()).to.be.null;
      });

      it('should not have any listeners for data, readable, or end', () => {
        expect(iterator._events).to.not.contain.key('data');
        expect(iterator._events).to.not.contain.key('readable');
        expect(iterator._events).to.not.contain.key('end');
      });
    });

    describe('after destroy has been called', () => {
      before(() => { iterator.destroy(); });

      it('should not have emitted another `readable` event', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should have ended', () => {
        iterator.ended.should.be.true;
      });

      it('should not have been destroyed', () => {
        iterator.destroyed.should.be.false;
      });

      it('should be done', () => {
        iterator.done.should.be.true;
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('cannot be made readable again', () => {
        iterator.readable = true;
        iterator.readable.should.be.false;
      });

      it('should return null when trying to read', () => {
        expect(iterator.read()).to.be.null;
      });

      it('should not have any listeners for data, readable, or end', () => {
        expect(iterator._events).to.not.contain.key('data');
        expect(iterator._events).to.not.contain.key('readable');
        expect(iterator._events).to.not.contain.key('end');
      });
    });

    describe('after close has been called a second time', () => {
      before(() => { iterator.close(); });

      it('should not have emitted another `readable` event', () => {
        iterator._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event a second time', () => {
        iterator._eventCounts.end.should.equal(1);
      });

      it('should have ended', () => {
        iterator.ended.should.be.true;
      });

      it('should not have been destroyed', () => {
        iterator.destroyed.should.be.false;
      });

      it('should be done', () => {
        iterator.done.should.be.true;
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('should return null when trying to read', () => {
        expect(iterator.read()).to.be.null;
      });

      it('should not have any listeners for data, readable, or end', () => {
        expect(iterator._events).to.not.contain.key('data');
        expect(iterator._events).to.not.contain.key('readable');
        expect(iterator._events).to.not.contain.key('end');
      });
    });
  });

  describe('A default AsyncIterator instance', () => {
    let iterator;
    before(() => {
      iterator = new AsyncIterator();
    });

    describe('when in OPEN state', () => {
      it('cannot transition to OPEN state', () => {
        expect(iterator._changeState(AsyncIterator.OPEN)).to.be.false;
      });

      it('can transition to CLOSED state', () => {
        expect(iterator._changeState(AsyncIterator.CLOSED)).to.be.true;
      });
    });

    describe('when in CLOSED state', () => {
      before(() => {
        iterator._changeState(AsyncIterator.CLOSED);
      });

      it('cannot transition to CLOSED state', () => {
        expect(iterator._changeState(AsyncIterator.CLOSED)).to.be.false;
      });

      it('can transition to ENDED state', () => {
        expect(iterator._changeState(AsyncIterator.ENDED)).to.be.true;
      });
    });

    describe('when in ENDED state', () => {
      before(() => {
        iterator._changeState(AsyncIterator.ENDED);
      });

      it('cannot transition to ENDED state', () => {
        expect(iterator._changeState(AsyncIterator.ENDED)).to.be.false;
      });

      it('cannot transition to DESTROYED state', () => {
        expect(iterator._changeState(AsyncIterator.DESTROYED)).to.be.false;
      });
    });
  });

  describe('A default AsyncIterator instance that is destroyed', () => {
    let iterator;
    before(() => {
      iterator = new AsyncIterator();
      captureEvents(iterator, 'data', 'readable', 'end');
      iterator.destroy();
    });

    it('should not have emitted a `readable` event', () => {
      iterator._eventCounts.readable.should.equal(0);
    });

    it('should not have emitted the `end` event', () => {
      iterator._eventCounts.end.should.equal(0);
    });

    it('should not have ended', () => {
      iterator.ended.should.be.false;
    });

    it('should have been destroyed', () => {
      iterator.destroyed.should.be.true;
    });

    it('should be done', () => {
      iterator.done.should.be.true;
    });

    it('should not be readable', () => {
      iterator.readable.should.be.false;
    });

    it('cannot be made readable again', () => {
      iterator.readable = true;
      iterator.readable.should.be.false;
    });

    it('should return null when trying to read', () => {
      expect(iterator.read()).to.be.null;
    });

    it('should not have any listeners for data, readable, or end', () => {
      expect(iterator._events).to.not.contain.key('data');
      expect(iterator._events).to.not.contain.key('readable');
      expect(iterator._events).to.not.contain.key('end');
    });

    describe('after destroy has been called a second time', () => {
      before(() => { iterator.destroy(); });

      it('should not have emitted a `readable` event', () => {
        iterator._eventCounts.readable.should.equal(0);
      });

      it('should still not have emitted the `end` event', () => {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', () => {
        iterator.ended.should.be.false;
      });

      it('should have been destroyed', () => {
        iterator.destroyed.should.be.true;
      });

      it('should be done', () => {
        iterator.done.should.be.true;
      });

      it('should not be readable', () => {
        iterator.readable.should.be.false;
      });

      it('should return null when trying to read', () => {
        expect(iterator.read()).to.be.null;
      });

      it('should not have any listeners for data, readable, or end', () => {
        expect(iterator._events).to.not.contain.key('data');
        expect(iterator._events).to.not.contain.key('readable');
        expect(iterator._events).to.not.contain.key('end');
      });
    });
  });

  describe('A default AsyncIterator instance that is destroyed with a given error', () => {
    let iterator, err;
    before(() => {
      iterator = new AsyncIterator();
      err = new Error('Some error');
      captureEvents(iterator, 'data', 'readable', 'end', 'error');
      iterator.destroy(err);
    });

    it('should not have emitted a `readable` event', () => {
      iterator._eventCounts.readable.should.equal(0);
    });

    it('should not have emitted the `end` event', () => {
      iterator._eventCounts.end.should.equal(0);
    });

    it('should have emitted the `error` event', () => {
      iterator._eventCounts.error.should.equal(1);
    });

    it('should not have ended', () => {
      iterator.ended.should.be.false;
    });

    it('should have been destroyed', () => {
      iterator.destroyed.should.be.true;
    });

    it('should be done', () => {
      iterator.done.should.be.true;
    });

    it('should not be readable', () => {
      iterator.readable.should.be.false;
    });

    it('cannot be made readable again', () => {
      iterator.readable = true;
      iterator.readable.should.be.false;
    });

    it('should return null when trying to read', () => {
      expect(iterator.read()).to.be.null;
    });

    it('should not have any listeners for data, readable, or end', () => {
      expect(iterator._events).to.not.contain.key('data');
      expect(iterator._events).to.not.contain.key('readable');
      expect(iterator._events).to.not.contain.key('end');
    });
  });

  describe('A default AsyncIterator instance that is destroyed asynchronously', () => {
    let iterator;
    before(() => {
      iterator = new AsyncIterator();
      captureEvents(iterator, 'data', 'readable', 'end');
      iterator._destroy = function (error, callback) {
        setImmediate(callback);
      };
      iterator.destroy();
    });

    it('should not have emitted a `readable` event', () => {
      iterator._eventCounts.readable.should.equal(0);
    });

    it('should not have emitted the `end` event', () => {
      iterator._eventCounts.end.should.equal(0);
    });

    it('should not have ended', () => {
      iterator.ended.should.be.false;
    });

    it('should have been destroyed', () => {
      iterator.destroyed.should.be.true;
    });

    it('should be done', () => {
      iterator.done.should.be.true;
    });

    it('should not be readable', () => {
      iterator.readable.should.be.false;
    });

    it('cannot be made readable again', () => {
      iterator.readable = true;
      iterator.readable.should.be.false;
    });

    it('should return null when trying to read', () => {
      expect(iterator.read()).to.be.null;
    });

    it('should not have any listeners for data, readable, or end', () => {
      expect(iterator._events).to.not.contain.key('data');
      expect(iterator._events).to.not.contain.key('readable');
      expect(iterator._events).to.not.contain.key('end');
    });
  });

  describe('An AsyncIterator instance without items', () => {
    let iterator, dataListener;
    before(() => {
      iterator = new AsyncIterator();
    });

    describe('after a data listener is attached', () => {
      before(() => {
        iterator.on('data', dataListener = sinon.spy());
      });

      it('should not have emitted the `data` event', () => {
        dataListener.should.not.have.been.called;
      });
    });

    describe('after the iterator has ended', () => {
      before(() => {
        iterator.close();
      });

      it('should not have emitted the `data` event', () => {
        dataListener.should.not.have.been.called;
      });
    });
  });

  describe('An AsyncIterator instance with 1 item', () => {
    let iterator, dataListener;
    before(() => {
      const items = [1];
      iterator = new AsyncIterator();
      iterator.readable = true;
      iterator.read = function () { return items.shift() || iterator.close() || null; };
    });

    describe('after a data listener is attached', () => {
      before(() => {
        iterator.on('data', dataListener = sinon.spy());
      });

      it('should have emitted the `data` event with the item', () => {
        dataListener.should.have.been.calledOnce;
        dataListener.should.have.been.calledWith(1);
      });
    });

    describe('after the iterator has been closed', () => {
      it('should not have emitted another `data` event', () => {
        dataListener.should.have.been.calledOnce;
      });
    });
  });

  describe('An AsyncIterator instance to which items are added', () => {
    const items = [];
    let iterator, dataListener1, dataListener2;
    before(() => {
      iterator = new AsyncIterator();
      iterator.readable = true;
      iterator.read = sinon.spy(() => items.shift() || null);
    });

    describe('after two items are added', () => {
      before(() => {
        items.push(1, 2);
        iterator.emit('readable');
      });

      it('should not have called `read`', () => {
        iterator.read.should.not.have.been.called;
      });
    });

    describe('after a `data` listener is attached', () => {
      before(() => {
        iterator.on('data', dataListener1 = sinon.spy());
      });

      it('should have emitted the `data` event for both items', () => {
        dataListener1.should.have.callCount(2);
        dataListener1.getCall(0).args[0].should.equal(1);
        dataListener1.getCall(1).args[0].should.equal(2);
      });

      it('should have called `read` for both items, plus one check afterwards', () => {
        iterator.read.should.have.callCount(2 + 1);
      });

      it('should only have one `readable` listener', () => {
        EventEmitter.listenerCount(iterator, 'readable').should.equal(1);
      });

      it('should not be listening for the `newListener` event', () => {
        EventEmitter.listenerCount(iterator, 'newListener').should.equal(0);
      });
    });

    describe('after a second `data` listener is attached', () => {
      before(() => {
        iterator.on('data', dataListener2 = sinon.spy());
      });

      it('should not emit `data` events on either listener', () => {
        dataListener1.should.have.callCount(2);
        dataListener2.should.have.callCount(0);
      });

      it('should not have called `read` more', () => {
        iterator.read.should.have.callCount(3);
      });

      it('should only have one `readable` listener', () => {
        EventEmitter.listenerCount(iterator, 'readable').should.equal(1);
      });

      it('should not be listening for the `newListener` event', () => {
        EventEmitter.listenerCount(iterator, 'newListener').should.equal(0);
      });
    });

    describe('after two more data items are added', () => {
      before(() => {
        items.push(3, 4);
        iterator.emit('readable');
      });

      it('should have emitted the `data` event for both items', () => {
        dataListener1.should.have.callCount(4);
        dataListener1.getCall(2).args[0].should.equal(3);
        dataListener1.getCall(3).args[0].should.equal(4);
        dataListener2.should.have.callCount(2);
        dataListener2.getCall(0).args[0].should.equal(3);
        dataListener2.getCall(1).args[0].should.equal(4);
      });

      it('should have called `read` for all four items, plus two checks afterwards', () => {
        iterator.read.should.have.callCount(4 + 2);
      });
    });

    describe('after the two listeners are removed and two new items are added', () => {
      before(() => {
        iterator.removeListener('data', dataListener1);
        iterator.removeListener('data', dataListener2);

        items.push(5, 6);
        iterator.emit('readable');
      });

      it('should not have called `read` anymore', () => {
        iterator.read.should.have.callCount(4 + 2);
      });

      it('should not be listening for the `readable` event anymore', () => {
        EventEmitter.listenerCount(iterator, 'readable').should.equal(0);
      });
    });

    describe('after the `data` listeners are attached again', () => {
      before(() => {
        iterator.on('data', dataListener1);
        iterator.on('data', dataListener2);
      });

      it('should have emitted the `data` event for both new items', () => {
        dataListener1.should.have.callCount(6);
        dataListener1.getCall(4).args[0].should.equal(5);
        dataListener1.getCall(5).args[0].should.equal(6);
        dataListener2.should.have.callCount(4);
        dataListener2.getCall(2).args[0].should.equal(5);
        dataListener2.getCall(3).args[0].should.equal(6);
      });

      it('should have called `read` for all six items, plus three checks afterwards', () => {
        iterator.read.should.have.callCount(6 + 3);
      });

      it('should only have one `readable` listener', () => {
        EventEmitter.listenerCount(iterator, 'readable').should.equal(1);
      });

      it('should not be listening for the `newListener` event', () => {
        EventEmitter.listenerCount(iterator, 'newListener').should.equal(0);
      });
    });

    describe('after the iterator is closed', () => {
      before(() => {
        iterator.close();
      });

      it('should not have listeners for the `data` event', () => {
        EventEmitter.listenerCount(iterator, 'readable').should.equal(0);
      });

      it('should not be listening for the `readable` event', () => {
        EventEmitter.listenerCount(iterator, 'readable').should.equal(0);
      });

      it('should not be listening for the `newListener` event', () => {
        EventEmitter.listenerCount(iterator, 'newListener').should.equal(0);
      });
    });
  });

  describe('An AsyncIterator instance to which 2 items are added an will be destroyed', () => {
    const items = [];
    let iterator, dataListener;
    before(() => {
      iterator = new AsyncIterator();
      iterator.readable = true;
      iterator.read = sinon.spy(() => items.shift() || null);

      items.push(1, 2);
      iterator.emit('readable');
    });

    describe('after the iterator is destroyed', () => {
      before(() => {
        iterator.on('data', dataListener = sinon.spy());
        iterator.destroy();
      });

      it('should not have emitted the `data` event for both items', () => {
        dataListener.should.have.callCount(0);
      });

      it('should not have listeners for the `data` event', () => {
        EventEmitter.listenerCount(iterator, 'readable').should.equal(0);
      });

      it('should not be listening for the `readable` event', () => {
        EventEmitter.listenerCount(iterator, 'readable').should.equal(0);
      });

      it('should not be listening for the `newListener` event', () => {
        EventEmitter.listenerCount(iterator, 'newListener').should.equal(0);
      });
    });
  });

  describe('An AsyncIterator instance to which 2 items are added an will be destroyed with an error', () => {
    const items = [];
    let iterator, err, dataListener, errorListener;
    before(() => {
      iterator = new AsyncIterator();
      iterator.readable = true;
      iterator.read = sinon.spy(() => items.shift() || null);

      items.push(1, 2);
      iterator.emit('readable');
    });

    describe('after the iterator is destroyed with an error', () => {
      before(() => {
        err = new Error('My error');
        iterator.on('data', dataListener = sinon.spy());
        iterator.on('error', errorListener = sinon.spy());
        iterator.destroy(err);
      });

      it('should not have emitted the `data` event for both items', () => {
        dataListener.should.have.callCount(0);
      });

      it('should have emitted the `error` event', () => {
        errorListener.should.have.callCount(1);
      });

      it('should not have listeners for the `data` event', () => {
        EventEmitter.listenerCount(iterator, 'readable').should.equal(0);
      });

      it('should not be listening for the `readable` event', () => {
        EventEmitter.listenerCount(iterator, 'readable').should.equal(0);
      });

      it('should not be listening for the `newListener` event', () => {
        EventEmitter.listenerCount(iterator, 'newListener').should.equal(0);
      });
    });
  });

  describe('An AsyncIterator with properties', () => {
    let iterator;
    before(() => {
      iterator = new AsyncIterator();
    });

    describe('when getProperties is called', () => {
      describe('before any property is set', () => {
        it('should return an empty object', () => {
          expect(iterator.getProperties()).to.deep.equal({});
        });
      });

      describe('when the return value is modified', () => {
        before(() => {
          const properties = iterator.getProperties();
          properties.a = 'A';
          properties.b = 'B';
        });

        it('should still return an empty object', () => {
          expect(iterator.getProperties()).to.deep.equal({});
        });
      });

      describe('after a property is set', () => {
        before(() => {
          iterator.setProperty('test', 'xyz');
        });
        it('should return an object with the properties', () => {
          expect(iterator.getProperties()).to.deep.equal({
            test: 'xyz',
          });
        });
      });

      describe('after the property is changed', () => {
        before(() => {
          iterator.setProperty('test', 'abc');
        });

        it('should return an object with the new properties', () => {
          expect(iterator.getProperties()).to.deep.equal({
            test: 'abc',
          });
        });
      });

      describe('after multiple properties are set', () => {
        before(() => {
          iterator.setProperties({ test: 'def', test2: 'ghi' });
        });

        it('should return an object with the new properties', () => {
          expect(iterator.getProperties()).to.deep.equal({
            test:  'def',
            test2: 'ghi',
          });
        });
      });
    });

    describe('when getProperty is called without callback', () => {
      describe('before the property is set', () => {
        it('should return undefined', () => {
          expect(iterator.getProperty('foo')).to.be.undefined;
        });
      });

      describe('after the property is set', () => {
        before(() => {
          iterator.setProperty('foo', 'FOO');
        });

        it('should return value of the property', () => {
          expect(iterator.getProperty('foo')).to.equal('FOO');
        });
      });

      describe('after the property is changed', () => {
        before(() => {
          iterator.setProperty('foo', 'FOOFOO');
        });

        it('should return new value of the property', () => {
          expect(iterator.getProperty('foo')).to.equal('FOOFOO');
        });
      });
    });

    describe('when getProperty is called with a callback', () => {
      let result, callback;
      before(() => {
        callback = sinon.stub();
        result = iterator.getProperty('bar', callback);
      });

      describe('before the property is set', () => {
        it('should return undefined', () => {
          expect(result).to.be.undefined;
        });

        it('should not call the callback', () => {
          callback.should.not.have.been.called;
        });
      });

      describe('after the property is set', () => {
        before(() => {
          iterator.setProperty('bar', 'BAR');
          callback.should.not.have.been.called;
        });

        it('should call the callback with the value', () => {
          callback.should.have.been.calledOnce;
          callback.should.have.been.calledWith('BAR');
        });

        describe('if a new callback is attached', () => {
          let newCallback;
          before(() => {
            newCallback = sinon.stub();
            result = iterator.getProperty('bar', newCallback);
            newCallback.should.not.have.been.called;
          });

          it('should call the callback with the value', () => {
            newCallback.should.have.been.calledOnce;
            newCallback.should.have.been.calledWith('BAR');
          });
        });
      });

      describe('after the property is changed', () => {
        before(() => {
          iterator.setProperty('bar', 'BARBAR');
        });

        it('should not call the callback anymore', () => {
          callback.should.have.been.calledOnce;
        });

        describe('if a new callback is attached', () => {
          let newCallback;
          before(() => {
            newCallback = sinon.stub();
            result = iterator.getProperty('bar', newCallback);
            newCallback.should.not.have.been.called;
          });

          it('should call the callback with the value', () => {
            newCallback.should.have.been.calledOnce;
            newCallback.should.have.been.calledWith('BARBAR');
          });
        });
      });
    });

    describe('when getProperty is called multiple times with a callback', () => {
      const callbacks = [];
      let result;
      before(() => {
        for (let i = 0; i < 5; i++) {
          callbacks[i] = sinon.stub();
          result = iterator.getProperty('bax', callbacks[i]);
        }
      });

      describe('before the property is set', () => {
        it('should return undefined', () => {
          expect(result).to.be.undefined;
        });

        it('should not call any callback', () => {
          for (let i = 0; i < callbacks.length; i++)
            callbacks[i].should.not.have.been.called;
        });
      });

      describe('after the property is set', () => {
        before(() => {
          iterator.setProperty('bax', 'BAX');
          for (let i = 0; i < callbacks.length; i++)
            callbacks[i].should.not.have.been.called;
        });

        it('should call the callbacks with the value', () => {
          for (let i = 0; i < callbacks.length; i++) {
            callbacks[i].should.have.been.calledOnce;
            callbacks[i].should.have.been.calledWith('BAX');
          }
        });

        it('should call the callbacks in order', () => {
          for (let i = 1; i < callbacks.length; i++)
            callbacks[i].should.have.been.calledAfter(callbacks[i - 1]);
        });

        describe('if a new callback is attached', () => {
          let callback;
          before(() => {
            callback = sinon.stub();
            result = iterator.getProperty('bax', callback);
            callback.should.not.have.been.called;
          });

          it('should call the callback with the value', () => {
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith('BAX');
          });
        });
      });

      describe('after the property is changed', () => {
        before(() => {
          iterator.setProperty('bax', 'BAXBAX');
        });

        it('should not call any callback anymore', () => {
          for (let i = 0; i < callbacks.length; i++)
            callbacks[i].should.have.been.calledOnce;
        });

        describe('if a new callback is attached', () => {
          let callback;
          before(() => {
            callback = sinon.stub();
            result = iterator.getProperty('bax', callback);
            callback.should.not.have.been.called;
          });

          it('should call the callback with the value', () => {
            callback.should.have.been.calledOnce;
            callback.should.have.been.calledWith('BAXBAX');
          });
        });
      });
    });

    describe('when copyProperties is called', () => {
      let source;
      before(() => {
        source = new AsyncIterator();
        source.setProperties({ a: 'A', b: 'B', c: 'C' });
        iterator.copyProperties(source, ['a', 'c']);
      });

      it('should copy the given properties', () => {
        expect(iterator.getProperty('a')).to.equal('A');
        expect(iterator.getProperty('c')).to.equal('C');
      });

      it('should not copy other properties', () => {
        expect(iterator.getProperty('b')).to.be.undefined;
      });
    });
  });

  describe('The AsyncIterator#each function', () => {
    it('should be a function', () => {
      expect(AsyncIterator.prototype.each).to.be.a('function');
    });

    describe('called on an empty iterator', () => {
      let iterator, callback, result;
      before(() => {
        iterator = new AsyncIterator();
        callback = sinon.stub();
        result = iterator.each(callback);
      });

      it('should return undefined', () => {
        expect(result).to.be.undefined;
      });

      it('should not invoke the callback', () => {
        callback.should.not.have.been.called;
      });
    });

    describe('called on an iterator with two items', () => {
      let iterator, callback, result;
      before(() => {
        let i = 0;
        iterator = new AsyncIterator();
        iterator.readable = true;
        iterator.read = function () { return i++ < 2 ? i : null; };
        callback = sinon.stub();
        result = iterator.each(callback);
      });

      it('should return undefined', () => {
        expect(result).to.be.undefined;
      });

      it('should invoke the callback twice', () => {
        callback.should.have.been.calledTwice;
      });

      it('should send the first item in the first call', () => {
        callback.getCall(0).args.should.deep.equal([1]);
      });

      it('should send the second item in the first call', () => {
        callback.getCall(1).args.should.deep.equal([2]);
      });

      it('should call the callback with the iterator as `this`', () => {
        callback.alwaysCalledOn(iterator).should.be.true;
      });
    });

    describe('called on an iterator with two items and a `this` argument', () => {
      const self = {};
      let iterator, callback, result;
      before(() => {
        let i = 0;
        iterator = new AsyncIterator();
        iterator.readable = true;
        iterator.read = function () { return i++ < 2 ? i : null; };
        callback = sinon.stub();
        result = iterator.each(callback, self);
      });

      it('should return undefined', () => {
        expect(result).to.be.undefined;
      });

      it('should invoke the callback twice', () => {
        callback.should.have.been.calledTwice;
      });

      it('should send the first item in the first call', () => {
        callback.getCall(0).args.should.deep.equal([1]);
      });

      it('should send the second item in the first call', () => {
        callback.getCall(1).args.should.deep.equal([2]);
      });

      it('should call the callback with the argument as `this`', () => {
        callback.alwaysCalledOn(self).should.be.true;
      });
    });
  });

  describe('The AsyncIterator#_addSingleListener function', () => {
    let iterator, listenerA, listenerB, listenerC;
    before(() => {
      iterator = new AsyncIterator();
      listenerA = sinon.stub();
      listenerB = sinon.stub();
      listenerC = sinon.stub();
    });

    it('should be a function', () => {
      expect(AsyncIterator.prototype._addSingleListener).to.be.a('function');
    });

    describe('when called for an event that has no listeners', () => {
      before(() => {
        iterator._addSingleListener('event1', listenerA);
      });

      it('should add the listener', () => {
        iterator.listeners('event1').should.deep.equal([listenerA]);
      });
    });

    describe('when called for an event that has the same listener', () => {
      before(() => {
        iterator.addListener('event3', listenerA);
        iterator._addSingleListener('event3', listenerA);
      });

      it('should not add the listener', () => {
        iterator.listeners('event3').should.deep.equal([listenerA]);
      });
    });

    describe('when called for an event that has other listeners', () => {
      before(() => {
        iterator.addListener('event2', listenerA);
        iterator.addListener('event2', listenerB);
        iterator._addSingleListener('event2', listenerC);
      });

      it('should add the listener', () => {
        iterator.listeners('event2').should.deep.equal([listenerA, listenerB, listenerC]);
      });
    });

    describe('when called for an event that has the same and other listeners', () => {
      before(() => {
        iterator.addListener('event4', listenerA);
        iterator.addListener('event4', listenerB);
        iterator.addListener('event4', listenerC);
        iterator._addSingleListener('event4', listenerB);
      });

      it('should not add the listener', () => {
        iterator.listeners('event4').should.deep.equal([listenerA, listenerB, listenerC]);
      });
    });
  });
});
