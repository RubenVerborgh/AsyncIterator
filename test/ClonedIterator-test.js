import {
  AsyncIterator,
  ClonedIterator,
  TransformIterator,
  BufferedIterator,
  EmptyIterator,
  ArrayIterator,
} from '../dist/asynciterator.js';

import { EventEmitter } from 'events';

describe('ClonedIterator', () => {
  describe('The ClonedIterator function', () => {
    describe('the result when called with `new`', () => {
      let instance;
      before(() => { instance = new ClonedIterator(); });

      it('should be a ClonedIterator object', () => {
        instance.should.be.an.instanceof(ClonedIterator);
      });

      it('should be a TransformIterator object', () => {
        instance.should.be.an.instanceof(TransformIterator);
      });

      it('should be a BufferedIterator object', () => {
        instance.should.be.an.instanceof(BufferedIterator);
      });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });
  });

  describe('A ClonedIterator without source', () => {
    let clone;
    before(() => {
      clone = new ClonedIterator();
      captureEvents(clone, 'readable', 'end');
    });

    describe('before closing', () => {
      it('should have undefined as `source` property', () => {
        expect(clone.source).to.be.undefined;
      });

      it('should provide a readable `toString` representation', () => {
        clone.toString().should.equal('[ClonedIterator {source: none}]');
      });

      it('should not have emitted the `readable` event', () => {
        clone._eventCounts.readable.should.equal(0);
      });

      it('should not have emitted the `end` event', () => {
        clone._eventCounts.end.should.equal(0);
      });

      it('should not have ended', () => {
        clone.ended.should.be.false;
      });

      it('should not be readable', () => {
        clone.readable.should.be.false;
      });

      it('should return null when `read` is called', () => {
        expect(clone.read()).to.be.null;
      });

      it('should return an empty property set', () => {
        clone.getProperties().should.deep.equal({});
      });
    });

    describe('after closing', () => {
      before(() => {
        clone.close();
      });

      it('should have undefined as `source` property', () => {
        expect(clone.source).to.be.undefined;
      });

      it('should have emitted the `readable` event', () => {
        clone._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', () => {
        clone._eventCounts.end.should.equal(0);
      });

      it('emit end once data is subscribed', done => {
        clone.on('end', done);
        clone.on('data', () => { throw new Error('should not emit data'); });
      });

      it('should have emitted the `end` event', () => {
        clone._eventCounts.end.should.equal(1);
      });

      it('should have ended', () => {
        clone.ended.should.be.true;
      });

      it('should not be readable', () => {
        clone.readable.should.be.false;
      });

      it('should return null when `read` is called', () => {
        expect(clone.read()).to.be.null;
      });

      it('should return an empty property set', () => {
        clone.getProperties().should.deep.equal({});
      });
    });
  });

  describe('Cloning an iterator that already has a destination', () => {
    it('should throw an exception', () => {
      const source = new AsyncIterator(), destination = new TransformIterator(source);
      source.should.have.property('_destination', destination);
      (() => source.clone()).should.throw('The source already has a destination');
    });
  });

  describe('Cloning an empty iterator', () => {
    const clones = createClones(() => new EmptyIterator());

    describeClones(clones, (getClone, getIterator) => {
      it('should have the original iterator as source', () => {
        getClone().source.should.equal(getIterator());
      });

      it('should provide a readable `toString` representation', () => {
        getClone().toString().should.equal('[ClonedIterator {source: [EmptyIterator]}]');
      });

      it('should have emitted the `readable` event', () => {
        getClone()._eventCounts.readable.should.equal(1);
      });

      it('should not have emitted the `end` event', () => {
        getClone()._eventCounts.end.should.equal(0);
      });

      it('emit end once data is subscribed', done => {
        getClone().on('end', done);
        getClone().on('data', () => { throw new Error('should not emit data'); });
      });

      it('should have emitted the `end` event', () => {
        getClone()._eventCounts.end.should.equal(1);
      });

      it('should have ended', () => {
        getClone().ended.should.be.true;
      });

      it('should not have been destroyed', () => {
        getClone().destroyed.should.be.false;
      });

      it('should be done', () => {
        getClone().done.should.be.true;
      });

      it('should not be readable', () => {
        getClone().readable.should.be.false;
      });

      it('should return null when read is called', () => {
        expect(getClone().read()).to.be.null;
      });
    });
  });

  describe('Cloning an iterator that asynchronously closes', () => {
    function createIterator() { return new BufferedIterator(); }

    function beforeClosing(getClone, getIterator, index) {
      describe('before closing', () => {
        it('should have the original iterator as source', () => {
          getClone().source.should.equal(getIterator());
        });

        if (index === 0) {
          it('should not have emitted the `readable` event', () => {
            getClone()._eventCounts.readable.should.equal(0);
          });
        }

        it('should not have emitted the `end` event', () => {
          getClone()._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          getClone().ended.should.be.false;
        });

        if (index === 0) {
          it('should not be readable', () => {
            getClone().readable.should.be.false;
          });

          it('should return null on read', () => {
            expect(getClone().read()).to.be.null;
          });
        }
      });
    }

    function afterItem(getClone, getIterator, index) {
      describe('after emitting an item', () => {
        if (index === 0)
          before(() => { getIterator()._push('a'); });

        it('should have emitted the `readable` event', () => {
          getClone()._eventCounts.readable.should.equal(1);
        });

        it('should not have emitted the `end` event', () => {
          getClone()._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          getClone().ended.should.be.false;
        });

        it('should be readable', () => {
          getClone().readable.should.be.true;
        });

        it('should read the item', () => {
          expect(getClone().read()).to.equal('a');
        });
      });
    }

    function afterClosing(getClone, getIterator, index) {
      describe('after closing', () => {
        if (index === 0)
          before(() => { getIterator().close(); });

        it('should not have emitted anymore `readable` events', () => {
          getClone()._eventCounts.readable.should.equal(1);
        });


        it('should not have emitted the `end` event', () => {
          getClone()._eventCounts.end.should.equal(0);
        });

        it('emit end once data is subscribed', done => {
          getClone().on('end', done);
          getClone().on('data', () => { throw new Error('should not emit data'); });
        });

        it('should have emitted the `end` event', () => {
          getClone()._eventCounts.end.should.equal(1);
        });

        it('should have ended', () => {
          getClone().ended.should.be.true;
        });

        it('should not have been destroyed', () => {
          getClone().destroyed.should.be.false;
        });

        it('should be done', () => {
          getClone().done.should.be.true;
        });

        it('should not be readable', () => {
          getClone().readable.should.be.false;
        });

        it('should return null when read is called', () => {
          expect(getClone().read()).to.be.null;
        });
      });
    }

    describe('reading sequentially', () => {
      const clones = createClones(createIterator);
      describeClones(clones, (getClone, getIterator, index) => {
        beforeClosing(getClone, getIterator, index);
        afterItem(getClone, getIterator, index);
        afterClosing(getClone, getIterator, index);
      });
    });

    describe('reading in parallel', () => {
      const clones = createClones(createIterator);
      describeClones(clones, beforeClosing);
      describeClones(clones, afterItem);
      describeClones(clones, afterClosing);
    });
  });

  describe('Cloning a one-item iterator', () => {
    function createIterator() { return new ArrayIterator(['a']); }

    function beforeReading(getClone, getIterator) {
      describe('before reading an item', () => {
        it('should have the original iterator as source', () => {
          getClone().source.should.equal(getIterator());
        });

        it('should have emitted the `readable` event', () => {
          getClone()._eventCounts.readable.should.equal(1);
        });

        it('should not have emitted the `end` event', () => {
          getClone()._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          getClone().ended.should.be.false;
        });

        it('should be readable', () => {
          getClone().readable.should.be.true;
        });
      });
    }

    function afterReading(getClone) {
      describe('after reading an item', () => {
        let item;
        before(() => { item = getClone().read(); });

        it('should have read the item', () => {
          expect(item).to.equal('a');
        });

        it('should not have emitted the `readable` event anymore', () => {
          getClone()._eventCounts.readable.should.equal(1);
        });


        it('should not have emitted the `end` event', () => {
          getClone()._eventCounts.end.should.equal(0);
        });

        it('emit end once data is subscribed', done => {
          getClone().on('end', done);
          getClone().on('data', () => { throw new Error('should not emit data'); });
        });

        it('should have emitted the `end` event', () => {
          getClone()._eventCounts.end.should.equal(1);
        });

        it('should have ended', () => {
          getClone().ended.should.be.true;
        });

        it('should not have been destroyed', () => {
          getClone().destroyed.should.be.false;
        });

        it('should be done', () => {
          getClone().done.should.be.true;
        });

        it('should not be readable', () => {
          getClone().readable.should.be.false;
        });

        it('should return null when read is called', () => {
          expect(getClone().read()).to.be.null;
        });
      });
    }

    describe('reading sequentially', () => {
      const clones = createClones(createIterator);
      describeClones(clones, (getClone, getIterator, index) => {
        beforeReading(getClone, getIterator, index);
        afterReading(getClone, getIterator, index);
      });
    });

    describe('reading in parallel', () => {
      const clones = createClones(createIterator);
      describeClones(clones, beforeReading);
      describeClones(clones, afterReading);
    });
  });

  describe('Cloning a two-item iterator', () => {
    function createIterator() { return new ArrayIterator(['a', 'b']); }

    function beforeReading(getClone, getIterator) {
      describe('before reading an item', () => {
        it('should have the original iterator as source', () => {
          getClone().source.should.equal(getIterator());
        });

        it('should have emitted the `readable` event', () => {
          getClone()._eventCounts.readable.should.equal(1);
        });

        it('should not have emitted the `end` event', () => {
          getClone()._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          getClone().ended.should.be.false;
        });

        it('should be readable', () => {
          getClone().readable.should.be.true;
        });
      });
    }

    function afterReadingFirst(getClone) {
      describe('after reading the first item', () => {
        let item;
        before(() => { item = getClone().read(); });

        it('should have read the item', () => {
          expect(item).to.equal('a');
        });

        it('should not have emitted the `readable` event anymore', () => {
          getClone()._eventCounts.readable.should.equal(1);
        });

        it('should not have emitted the `end` event', () => {
          getClone()._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          getClone().ended.should.be.false;
        });

        it('should be readable', () => {
          getClone().readable.should.be.true;
        });
      });
    }

    function afterReadingSecond(getClone) {
      describe('after reading the second item', () => {
        let item;
        before(() => { item = getClone().read(); });

        it('should have read the item', () => {
          if (!getClone().closedBeforeReadingItem2)
            expect(item).to.equal('b');
        });

        it('should not have emitted the `readable` event anymore', () => {
          getClone()._eventCounts.readable.should.equal(1);
        });


        it('should not have emitted the `end` event', () => {
          getClone()._eventCounts.end.should.equal(0);
        });

        it('emit end once data is subscribed', done => {
          getClone().on('end', done);
          getClone().on('data', () => { throw new Error('should not emit data'); });
        });

        it('should have emitted the `end` event', () => {
          getClone()._eventCounts.end.should.equal(1);
        });

        it('should have ended', () => {
          getClone().ended.should.be.true;
        });

        it('should not have been destroyed', () => {
          getClone().destroyed.should.be.false;
        });

        it('should be done', () => {
          getClone().done.should.be.true;
        });

        it('should not be readable', () => {
          getClone().readable.should.be.false;
        });

        it('should return null when read is called', () => {
          expect(getClone().read()).to.be.null;
        });
      });
    }

    describe('reading sequentially', () => {
      const clones = createClones(createIterator);
      describeClones(clones, (getClone, getIterator, index) => {
        beforeReading(getClone, getIterator, index);
        afterReadingFirst(getClone, getIterator, index);
        afterReadingSecond(getClone, getIterator, index);
      });
    });

    describe('reading in parallel', () => {
      const clones = createClones(createIterator);
      describeClones(clones, beforeReading);
      describeClones(clones, afterReadingFirst);
      describeClones(clones, afterReadingSecond);
    });

    describe('reading when one clone is closed', () => {
      const clones = createClones(createIterator);
      describeClones(clones, beforeReading);
      describeClones(clones, afterReadingFirst);
      describe('after clone 2 is closed', () => {
        before(() => {
          clones['clone 2']().close();
          clones['clone 2']().closedBeforeReadingItem2 = true;
        });
        describeClones(clones, afterReadingSecond);
      });
    });
  });

  describe('Cloning an iterator with properties', () => {
    let iterator, clone;
    before(() => {
      iterator = new AsyncIterator();
      iterator.setProperty('foo', 'FOO');
      iterator.setProperty('bar', 'BAR');
      clone = iterator.clone();
    });

    describe('before a property is set on the clone', () => {
      let callback;
      before(() => {
        callback = sinon.stub();
        clone.getProperty('foo', callback);
      });

      it('should return all properties from the original', () => {
        clone.getProperties().should.deep.equal({ foo: 'FOO', bar: 'BAR' });
      });

      it('should return the property from the original without callback', () => {
        expect(clone.getProperty('foo')).to.equal('FOO');
      });

      it('should return the property from the original with callback', () => {
        callback.should.have.been.calledOnce;
        callback.should.have.been.calledWith('FOO');
      });
    });

    describe('after a property is changed on the original', () => {
      let callback;
      before(() => {
        iterator.setProperty('foo', 'FOO2');
        callback = sinon.stub();
        clone.getProperty('foo', callback);
      });

      it('should return all properties from the original', () => {
        clone.getProperties().should.deep.equal({ foo: 'FOO2', bar: 'BAR' });
      });

      it('should return the property from the original without callback', () => {
        expect(clone.getProperty('foo')).to.equal('FOO2');
      });

      it('should return the property from the original with callback', () => {
        callback.should.have.been.calledOnce;
        callback.should.have.been.calledWith('FOO2');
      });
    });

    describe('after a property is set on the clone', () => {
      let callback;
      before(() => {
        clone.setProperty('bar', 'NEWBAR');
        callback = sinon.stub();
        clone.getProperty('bar', callback);
      });

      it('should not have changed the original', () => {
        expect(iterator.getProperty('bar')).to.equal('BAR');
      });

      it('should return all properties', () => {
        clone.getProperties().should.deep.equal({ foo: 'FOO2', bar: 'NEWBAR' });
      });

      it('should return the new property without callback', () => {
        expect(clone.getProperty('bar')).to.equal('NEWBAR');
      });

      it('should return the new property with callback', () => {
        callback.should.have.been.calledOnce;
        callback.should.have.been.calledWith('NEWBAR');
      });
    });

    describe('a property callback for a property first set on the clone', () => {
      let callback;
      before(() => {
        callback = sinon.stub();
        clone.getProperty('cloneFirst', callback);
      });

      describe('before the property is set', () => {
        it('should not call the callback', () => {
          callback.should.not.have.been.called;
        });
      });

      describe('after the property is set on the clone', () => {
        before(() => {
          clone.setProperty('cloneFirst', 'CLONE');
          callback.should.not.have.been.called;
        });

        it('should call the callback with the value', () => {
          callback.should.have.been.calledOnce;
          callback.should.have.been.calledWith('CLONE');
        });

        it("should return the clone's property value", () => {
          expect(clone.getProperty('cloneFirst')).to.equal('CLONE');
        });
      });

      describe('after the property is set on the original', () => {
        before(() => {
          iterator.setProperty('cloneFirst', 'ORIGINAL');
        });

        it('should not call the callback anymore', () => {
          callback.should.have.been.calledOnce;
        });

        it("should return the clone's property value", () => {
          expect(clone.getProperty('cloneFirst')).to.equal('CLONE');
        });
      });
    });

    describe('a property callback for a property first set on the original', () => {
      let callback;
      before(() => {
        callback = sinon.stub();
        clone.getProperty('originalFirst', callback);
      });

      describe('before the property is set', () => {
        it('should not call the callback', () => {
          callback.should.not.have.been.called;
        });
      });

      describe('after the property is set on the original', () => {
        before(() => {
          iterator.setProperty('originalFirst', 'ORIGINAL');
          callback.should.not.have.been.called;
        });

        it('should call the callback with the value', () => {
          callback.should.have.been.calledOnce;
          callback.should.have.been.calledWith('ORIGINAL');
        });

        it('should return the original property value', () => {
          expect(clone.getProperty('originalFirst')).to.equal('ORIGINAL');
        });
      });

      describe('after the property is set on the clone', () => {
        before(() => {
          iterator.setProperty('originalFirst', 'CLONE');
        });

        it('should not call the callback anymore', () => {
          callback.should.have.been.calledOnce;
        });

        it("should return the clone's property value", () => {
          expect(clone.getProperty('originalFirst')).to.equal('CLONE');
        });
      });
    });
  });

  describe('Cloning an iterator that becomes readable later on', () => {
    const clones = createClones(() => new BufferedIterator());
    let iterator;
    before(() => {
      iterator = clones.iterator();
      iterator._push(1);
    });

    describe('before the first item is read', () => {
      describeClones(clones, getClone => {
        it('should be readable', () => {
          getClone().readable.should.be.true;
        });

        it('should have emitted the `readable` event', () => {
          getClone()._eventCounts.readable.should.equal(1);
        });
      });
    });

    describe('after the first item is read', () => {
      describeClones(clones, getClone => {
        let item;
        before(() => { item = getClone().read(); });

        it('should have read the item correctly', () => {
          item.should.equal(1);
        });

        it('should be readable', () => {
          getClone().readable.should.be.true;
        });

        it('should not have emitted another `readable` event', () => {
          getClone()._eventCounts.readable.should.equal(1);
        });
      });
    });

    describe('after trying to read the second item', () => {
      describeClones(clones, getClone => {
        let item;
        before(() => { item = getClone().read(); });

        it('should not have read an item', () => {
          expect(item).to.be.null;
        });

        it('should not be readable', () => {
          getClone().readable.should.be.false;
        });

        it('should not have emitted another `readable` event', () => {
          getClone()._eventCounts.readable.should.equal(1);
        });
      });
    });

    describe('after the second item is pushed', () => {
      before(() => { iterator._push(2); });

      describeClones(clones, getClone => {
        it('should be readable', () => {
          getClone().readable.should.be.true;
        });

        it('should have emitted another `readable` event', () => {
          getClone()._eventCounts.readable.should.equal(2);
        });
      });
    });

    describe('after reading the second item', () => {
      describeClones(clones, getClone => {
        let item;
        before(() => { item = getClone().read(); });

        it('should have read the item correctly', () => {
          item.should.equal(2);
        });

        it('should be readable', () => {
          getClone().readable.should.be.true;
        });
      });
    });
  });

  describe('Cloning an iterator that errors', () => {
    const clones = createClones(() => new AsyncIterator());
    let iterator;
    before(() => {
      iterator = clones.iterator();
    });

    describe('before an error occurs', () => {
      describeClones(clones, getClone => {
        before(() => {
          getClone().errorHandler = sinon.stub();
          getClone().on('error', getClone().errorHandler);
        });

        it('should not have emitted an error', () => {
          getClone().errorHandler.should.not.have.been.called;
        });
      });
    });

    describe('after a first error occurs', () => {
      let error;
      before(() => {
        iterator.emit('error', error = new Error('error1'));
      });

      describeClones(clones, getClone => {
        it('should re-emit the error', () => {
          getClone().errorHandler.should.have.been.calledOnce;
          getClone().errorHandler.should.have.been.calledWith(error);
        });
      });
    });

    describe('after a second error occurs', () => {
      let error;
      before(() => {
        iterator.emit('error', error = new Error('error2'));
      });

      describeClones(clones, getClone => {
        it('should re-emit the error', () => {
          getClone().errorHandler.should.have.been.calledTwice;
          getClone().errorHandler.should.have.been.calledWith(error);
        });
      });
    });

    describe('after the iterator has ended and errors again', () => {
      before(done => {
        iterator.close();
        iterator.on('end', () => {
          function noop() { /* */ }
          iterator.on('error', noop); //
          iterator.emit('error', new Error('error3'));
          iterator.removeListener('error', noop);
          done();
        });
        iterator.on('data', () => { throw new Error('should not emit data'); });
      });

      it('should not leave any error handlers attached', () => {
        iterator.listenerCount('error').should.equal(0);
      });

      describeClones(clones, getClone => {
        it('should not re-emit the error', () => {
          getClone().errorHandler.should.have.been.calledTwice;
        });
      });
    });
  });

  describe('Cloning an iterator without source', () => {
    const clones = createClones(() => { /* */ });
    let iterator;

    describe('before a source is set', () => {
      describeClones(clones, getClone => {
        before(() => {
          getClone().getProperty('a', getClone().callbackA = sinon.stub());
          getClone().getProperty('b', getClone().callbackB = sinon.stub());
          getClone().getProperty('c', getClone().callbackC = sinon.stub());
        });

        it('should not have emitted the `readable` event', () => {
          getClone()._eventCounts.readable.should.equal(0);
        });

        it('should not have emitted the `end` event', () => {
          getClone()._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          getClone().ended.should.be.false;
        });

        it('should not be readable', () => {
          getClone().readable.should.be.false;
        });

        it('should return null on read', () => {
          expect(getClone().read()).to.be.null;
        });

        it('should not have called a property callback for a non-set property', () => {
          getClone().callbackA.should.not.have.been.called;
          getClone().callbackB.should.not.have.been.called;
          getClone().callbackC.should.not.have.been.called;
        });
      });
    });

    describe('after a source is set', () => {
      before(() => {
        iterator = new AsyncIterator();
        iterator.setProperty('a', 'A');
        iterator.setProperty('b', 'B');

        clones['clone 1']().source = iterator;
        clones['clone 2']().source = iterator;

        clones['clone 1']().setProperty('a', 'AAA');
        clones['clone 2']().setProperty('a', 'AAA');

        forEachClone(clones, getClone => {
          getClone().callbackA.should.not.have.been.called;
          getClone().callbackB.should.not.have.been.called;
        });
      });

      describeClones(clones, getClone => {
        it('should not have emitted the `readable` event', () => {
          getClone()._eventCounts.readable.should.equal(0);
        });

        it('should not have emitted the `end` event', () => {
          getClone()._eventCounts.end.should.equal(0);
        });

        it('should not have ended', () => {
          getClone().ended.should.be.false;
        });

        it('should not be readable', () => {
          getClone().readable.should.be.false;
        });

        it('should return null on read', () => {
          expect(getClone().read()).to.be.null;
        });

        it('should have called a property callback for a property in the source', () => {
          getClone().callbackA.should.have.been.calledOnce;
          getClone().callbackA.should.have.been.calledWith('AAA');
        });

        it('should have called a property callback for a property in the clone', () => {
          getClone().callbackB.should.have.been.calledOnce;
          getClone().callbackB.should.have.been.calledWith('B');
        });
      });
    });

    describe('after a property is set on the source', () => {
      before(() => {
        iterator.setProperty('c', 'C');
        forEachClone(clones, getClone => {
          getClone().callbackC.should.not.have.been.called;
        });
      });

      describeClones(clones, getClone => {
        it('should have called the property callback for that property', () => {
          getClone().callbackC.should.have.been.calledOnce;
          getClone().callbackC.should.have.been.calledWith('C');
        });
      });
    });
  });
});

// Returns a wrapper function that remembers its return value for subsequent calls
function memoize(func, arg) {
  let result;
  return () => (result || (result = func(arg)));
}

// Creates a single clone
function createClone(getSource) {
  const clone = getSource() ? getSource().clone() : new ClonedIterator();
  captureEvents(clone, 'readable', 'end');
  return clone;
}

// Returns a hash of functions that create clones
function createClones(createIterator) {
  const clones = { iterator: memoize(createIterator) };
  ['clone 1', 'clone 2'].forEach(id => {
    clones[id] = memoize(createClone, clones.iterator);
  });
  return clones;
}

// Returns a `describe` environment for each of the clones
function describeClones(clones, describeClone) {
  forEachClone(clones, (getClone, id, index) => {
    describe(id, () => {
      // Pre-load the clone so events can fire
      before(() => { getClone(); });
      describeClone(getClone, clones.iterator, index);
    });
  });
}

function forEachClone(clones, f) {
  Object.keys(clones).forEach((id, index) => {
    // The item at index 0 is the iterator creation function
    if (index > 0)
      f(clones[id], id, index - 1);
  });
}
