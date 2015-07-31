var BufferedIterator = require('../asynciterator').BufferedIterator;

var AsyncIterator = require('../asynciterator').AsyncIterator,
    EventEmitter = require('events').EventEmitter;

describe('BufferedIterator', function () {
  describe('The BufferedIterator function', function () {
    describe('the result when called without `new`', function () {
      var instance;
      before(function () { instance = BufferedIterator(); });

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
      before(function () { instance = new BufferedIterator(); });

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

  describe('A BufferedIterator without arguments', function () {
    var iterator;
    before(function () {
      iterator = new BufferedIterator();
      captureEvents(iterator, 'readable', 'end');
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

    it('should return undefined when read is called', function () {
      expect(iterator.read()).to.be.undefined;
    });
  });

  describe('A BufferedIterator that is closed synchronously', function () {
    function createIterator(options) {
      var iterator = new BufferedIterator(options);
      iterator._read = function (count, done) { this.close(); done(); };
      sinon.spy(iterator, '_read');
      return captureEvents(iterator, 'readable', 'end');
    }

    describe('without autoStart', function () {
      var iterator;
      before(function () { iterator = createIterator({ autoStart: false }); });

      describe('before read has been called', function () {
        it('should not have emitted the `readable` event', function () {
          iterator._eventCounts.readable.should.equal(0);
        });

        it('should not have emitted the `end` event', function () {
          iterator._eventCounts.end.should.equal(0);
        });

        it('should not have ended', function () {
          iterator.ended.should.be.false;
        });

        it('should not have called _read', function () {
          iterator._read.should.not.have.been.called;
        });
      });

      describe('after read has been called the first time', function () {
        var item;
        before(function () { item = iterator.read(); });

        it('should have returned undefined', function () {
          expect(item).to.be.undefined;
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

        it('should have called _read with 4 (the default buffer size)', function () {
          iterator._read.should.have.been.calledOnce;
          iterator._read.should.have.been.calledWith(4);
        });
      });

      describe('after read has been called the second time', function () {
        var item;
        before(function () { item = iterator.read(); });

        it('should have returned undefined', function () {
          expect(item).to.be.undefined;
        });

        it('should not have emitted the `readable` event', function () {
          iterator._eventCounts.readable.should.equal(0);
        });

        it('should not have emitted another `end` event', function () {
          iterator._eventCounts.end.should.equal(1);
        });

        it('should have ended', function () {
          iterator.ended.should.be.true;
        });

        it('should not have called _read anymore', function () {
          iterator._read.should.have.been.calledOnce;
        });
      });
    });

    describe('with autoStart', function () {
      var iterator;
      before(function () { iterator = createIterator(); });

      describe('before read has been called', function () {
        it('should not have emitted the `readable` event', function () {
          iterator._eventCounts.readable.should.equal(0);
        });

        it('should have emitted the `end` event', function () {
          iterator._eventCounts.end.should.equal(1);
        });

        it('should have ended', function () {
          iterator.ended.should.be.true;
        });

        it('should have called _read with 4 (the default buffer size)', function () {
          iterator._read.should.have.been.calledOnce;
          iterator._read.should.have.been.calledWith(4);
        });
      });

      describe('after read has been called', function () {
        var item;
        before(function () { item = iterator.read(); });

        it('should have returned undefined', function () {
          expect(item).to.be.undefined;
        });

        it('should not have emitted the `readable` event', function () {
          iterator._eventCounts.readable.should.equal(0);
        });

        it('should not have emitted another `end` event', function () {
          iterator._eventCounts.end.should.equal(1);
        });

        it('should have ended', function () {
          iterator.ended.should.be.true;
        });

        it('should not have called _read anymore', function () {
          iterator._read.should.have.been.calledOnce;
        });
      });
    });
  });

  describe('A BufferedIterator that is closed asynchronously', function () {
    function createIterator(options) {
      var iterator = new BufferedIterator(options);
      iterator._read = function (count, done) {
        setImmediate(function (self) { self.close(); done(); }, this);
      };
      sinon.spy(iterator, '_read');
      return captureEvents(iterator, 'readable', 'end');
    }

    describe('without autoStart', function () {
      var iterator;
      before(function () { iterator = createIterator({ autoStart: false }); });

      describe('before read has been called', function () {
        it('should not have emitted the `readable` event', function () {
          iterator._eventCounts.readable.should.equal(0);
        });

        it('should not have emitted the `end` event', function () {
          iterator._eventCounts.end.should.equal(0);
        });

        it('should not have ended', function () {
          iterator.ended.should.be.false;
        });

        it('should not have called _read', function () {
          iterator._read.should.not.have.been.called;
        });
      });

      describe('after read has been called the first time', function () {
        var item;
        before(function () { item = iterator.read(); });

        it('should have returned undefined', function () {
          expect(item).to.be.undefined;
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

        it('should have called _read with 4 (the default buffer size)', function () {
          iterator._read.should.have.been.calledOnce;
          iterator._read.should.have.been.calledWith(4);
        });
      });

      describe('after read has been called the second time', function () {
        var item;
        before(function () { item = iterator.read(); });

        it('should have returned undefined', function () {
          expect(item).to.be.undefined;
        });

        it('should not have emitted the `readable` event', function () {
          iterator._eventCounts.readable.should.equal(0);
        });

        it('should not have emitted another `end` event', function () {
          iterator._eventCounts.end.should.equal(1);
        });

        it('should have ended', function () {
          iterator.ended.should.be.true;
        });

        it('should not have called _read anymore', function () {
          iterator._read.should.have.been.calledOnce;
        });
      });
    });

    describe('with autoStart', function () {
      var iterator;
      before(function () { iterator = createIterator(); });

      describe('before read has been called', function () {
        it('should not have emitted the `readable` event', function () {
          iterator._eventCounts.readable.should.equal(0);
        });

        it('should have emitted the `end` event', function () {
          iterator._eventCounts.end.should.equal(1);
        });

        it('should have ended', function () {
          iterator.ended.should.be.true;
        });

        it('should have called _read with 4 (the default buffer size)', function () {
          iterator._read.should.have.been.calledOnce;
          iterator._read.should.have.been.calledWith(4);
        });
      });

      describe('after read has been called', function () {
        var item;
        before(function () { item = iterator.read(); });

        it('should have returned undefined', function () {
          expect(item).to.be.undefined;
        });

        it('should not have emitted the `readable` event', function () {
          iterator._eventCounts.readable.should.equal(0);
        });

        it('should not have emitted another `end` event', function () {
          iterator._eventCounts.end.should.equal(1);
        });

        it('should have ended', function () {
          iterator.ended.should.be.true;
        });

        it('should not have called _read anymore', function () {
          iterator._read.should.have.been.calledOnce;
        });
      });
    });
  });

  describe('A BufferedIterator that synchronously pushes "a" and ends', function () {
    function createIterator(options) {
      var iterator = new BufferedIterator(options);
      iterator._read = function (count, done) { this._push("a"); this.close(); done(); };
      sinon.spy(iterator, '_read');
      return captureEvents(iterator, 'readable', 'end');
    }

    describe('without autoStart', function () {
      var iterator;
      before(function () { iterator = createIterator({ autoStart: false }); });

      describe('before read has been called', function () {
        it('should not have emitted the `readable` event', function () {
          iterator._eventCounts.readable.should.equal(0);
        });

        it('should not have emitted the `end` event', function () {
          iterator._eventCounts.end.should.equal(0);
        });

        it('should not have ended', function () {
          iterator.ended.should.be.false;
        });

        it('should not have called _read', function () {
          iterator._read.should.not.have.been.called;
        });
      });

      describe('after read has been called the first time', function () {
        var item;
        before(function () { item = iterator.read(); });

        it('should have returned undefined', function () {
          expect(item).to.be.undefined;
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

        it('should have called _read with 4 (the default buffer size)', function () {
          iterator._read.should.have.been.calledOnce;
          iterator._read.should.have.been.calledWith(4);
        });
      });

      describe('after read has been called the second time', function () {
        var item;
        before(function () { item = iterator.read(); });

        it('should have returned "a"', function () {
          expect(item).to.equal("a");
        });

        it('should have emitted the `readable` event', function () {
          iterator._eventCounts.readable.should.equal(1);
        });

        it('should have emitted the `end` event', function () {
          iterator._eventCounts.end.should.equal(1);
        });

        it('should have ended', function () {
          iterator.ended.should.be.true;
        });

        it('should have called _read with 4 (the default buffer size)', function () {
          iterator._read.should.have.been.calledOnce;
          iterator._read.should.have.been.calledWith(4);
        });
      });

      describe('after read has been called the second time', function () {
        var item;
        before(function () { item = iterator.read(); });

        it('should have returned undefined', function () {
          expect(item).to.be.undefined;
        });

        it('should not have emitted another `readable` event', function () {
          iterator._eventCounts.readable.should.equal(1);
        });

        it('should not have emitted another `end` event', function () {
          iterator._eventCounts.end.should.equal(1);
        });

        it('should have ended', function () {
          iterator.ended.should.be.true;
        });

        it('should not have called _read anymore', function () {
          iterator._read.should.have.been.calledOnce;
        });
      });
    });

    describe('with autoStart', function () {
      var iterator;
      before(function () { iterator = createIterator(); });

      describe('before read has been called', function () {
        it('should have emitted the `readable` event', function () {
          iterator._eventCounts.readable.should.equal(1);
        });

        it('should not have emitted the `end` event', function () {
          iterator._eventCounts.end.should.equal(0);
        });

        it('should not have ended', function () {
          iterator.ended.should.be.false;
        });

        it('should have called _read with 4 (the default buffer size)', function () {
          iterator._read.should.have.been.calledOnce;
          iterator._read.should.have.been.calledWith(4);
        });
      });

      describe('after read has been called', function () {
        var item;
        before(function () { item = iterator.read(); });

        it('should have returned "a"', function () {
          expect(item).to.equal("a");
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

        it('should not have called _read anymore', function () {
          iterator._read.should.have.been.calledOnce;
        });
      });
    });
  });

  describe('A BufferedIterator that pushes "a" (sync) and "b" and "c" (async) on every read', function () {
    function createIterator(options) {
      var iterator = new BufferedIterator(options);
      iterator._read = function (count, done) {
        this._push("a");
        setImmediate(function (self) {
          self._push("b");
          self._push("c");
          done();
        }, this);
      };
      sinon.spy(iterator, '_read');
      return captureEvents(iterator, 'readable', 'end');
    }

    describe('with autoStart enabled', function () {
      var iterator;
      before(function () { iterator = createIterator(); });

      describe('before read has been called', function () {
        it('should have emitted the `readable` event', function () {
          iterator._eventCounts.readable.should.equal(1);
        });

        it('should not have emitted the `end` event', function () {
          iterator._eventCounts.end.should.equal(0);
        });

        it('should not have ended', function () {
          iterator.ended.should.be.false;
        });

        it('should have called _read with 4 (the buffer size)', function () {
          iterator._read.should.have.been.calledOnce;
          iterator._read.getCall(0).args[0].should.equal(4);
        });
      });

      describe('after read has been called the first time', function () {
        var item;
        before(function () {
          item = iterator.read();
          iterator._read.should.have.been.calledOnce; // ensure _read is not called synchronously
        });

        it('should have returned "a"', function () {
          expect(item).to.equal("a");
        });

        it('should not have emitted another `readable` event yet', function () {
          iterator._eventCounts.readable.should.equal(1);
        });

        it('should have called _read with 2 (number of free places in buffer)', function () {
          iterator._read.should.have.been.calledTwice;
          iterator._read.getCall(1).args[0].should.equal(2);
        });
      });

      describe('after read has been called the second time', function () {
        var item;
        before(function () { item = iterator.read(); });

        it('should have returned "b"', function () {
          expect(item).to.equal("b");
        });

        it('should not have emitted another `readable` event yet', function () {
          iterator._eventCounts.readable.should.equal(1);
        });

        it('should not have called _read anymore (because buffer is full)', function () {
          iterator._read.should.have.been.calledTwice;
        });
      });

      describe('after read is called six more times', function () {
        var items = [];
        before(function () {
          for (var i = 0; i < 6; i++)
            items.push(iterator.read());
        });

        it('should have returned all remaining items in the buffer', function () {
          // plus `undefined` for two reads past the end of the buffer
          expect(items).to.deep.equal(["c", "a", "b", "c", undefined, undefined]);
        });

        it('should have emitted another `readable` event', function () {
          iterator._eventCounts.readable.should.equal(2);
        });

        it('should have called _read then with 4 (to fill the entire buffer)', function () {
          iterator._read.should.have.callCount(3);
          iterator._read.getCall(2).args[0].should.equal(4);
        });
      });
    });
  });

  describe('A BufferedIterator that calls `done` multiple times', function () {
    var iterator, afterRead;
    before(function () {
      iterator = new BufferedIterator({ autoStart: false });
      iterator._read = function (count, done) {
        count.should.equal(4);
        done.should.not.throw();
        done.should.throw('done callback called multiple times');
        done.should.throw('done callback called multiple times');
        afterRead();
      };
    });

    it('should cause an exception on read', function (done) {
      afterRead = done;
      iterator.read();
    });
  });

  describe('A BufferedIterator that does not call `done`', function () {
    var iterator;
    before(function () {
      iterator = new BufferedIterator();
      iterator._read = function (count, done) { this._push("a"); };
    });

    it('should return the first element on read', function () {
      expect(iterator.read()).to.equal("a");
    });

    it('should return undefined on subsequent reads', function () {
      expect(iterator.read()).to.be.undefined;
    });
  });

  describe('A BufferedIterator that calls `read`', function () {
    var iterator;
    before(function () {
      var counter = 0;
      iterator = new BufferedIterator();
      iterator._read = function (count, done) { this.read(); this._push(counter++); };
    });

    it('should return the first element on read', function () {
      expect(iterator.read()).to.equal(0);
    });

    it('should return undefined on subsequent reads', function () {
      expect(iterator.read()).to.be.undefined;
    });
  });
});
