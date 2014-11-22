var BufferedIterator = require('../pullme').BufferedIterator;

var Iterator = require('../pullme').Iterator;

describe('BufferedIterator', function () {
  describe('The BufferedIterator module', function () {
    it('should make BufferedIterator objects', function () {
      BufferedIterator().should.be.an.instanceof(BufferedIterator);
    });

    it('should be an BufferedIterator constructor', function () {
      new BufferedIterator().should.be.an.instanceof(BufferedIterator);
    });

    it('should make Iterator objects', function () {
      BufferedIterator().should.be.an.instanceof(Iterator);
    });

    it('should be an EventEmitter constructor', function () {
      new BufferedIterator().should.be.an.instanceof(Iterator);
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
      iterator._read = function () { this._close(); };
      sinon.spy(iterator, '_read');
      return captureEvents(iterator, 'readable', 'end');
    }

    describe('with buffer size 0', function () {
      var iterator;
      before(function () { iterator = createIterator({ bufferSize: 0 }); });

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

        it('should have called _read with 1', function () {
          iterator._read.should.have.been.calledOnce;
          iterator._read.should.have.been.calledWith(1);
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

    describe('with the default buffer size', function () {
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

        it('should have called _read with 4', function () {
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
      iterator._read = function () { setImmediate(function (self) { self._close(); }, this); };
      sinon.spy(iterator, '_read');
      return captureEvents(iterator, 'readable', 'end');
    }

    describe('with buffer size 0', function () {
      var iterator;
      before(function () { iterator = createIterator({ bufferSize: 0 }); });

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

        it('should have called _read with 1', function () {
          iterator._read.should.have.been.calledOnce;
          iterator._read.should.have.been.calledWith(1);
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

    describe('with the default buffer size', function () {
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

        it('should have called _read with 4', function () {
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
      iterator._read = function () { this._push("a"); this._close(); };
      sinon.spy(iterator, '_read');
      return captureEvents(iterator, 'readable', 'end');
    }

    describe('with buffer size 0', function () {
      var iterator;
      before(function () { iterator = createIterator({ bufferSize: 0 }); });

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

        it('should have returned "a"', function () {
          expect(item).to.equal("a");
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

        it('should have called _read with 1', function () {
          iterator._read.should.have.been.calledOnce;
          iterator._read.should.have.been.calledWith(1);
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

    describe('with the default buffer size', function () {
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

        it('should have called _read with 4', function () {
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

        it('should nhave emitted the `end` event', function () {
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
});
