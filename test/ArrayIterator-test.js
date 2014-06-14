var ArrayIterator = require('../pullme').ArrayIterator;

var Iterator = require('../pullme').Iterator;

describe('ArrayIterator', function () {
  describe('The ArrayIterator module', function () {
    it('should make ArrayIterator objects', function () {
      ArrayIterator().should.be.an.instanceof(ArrayIterator);
    });

    it('should be an ArrayIterator constructor', function () {
      new ArrayIterator().should.be.an.instanceof(ArrayIterator);
    });

    it('should make Iterator objects', function () {
      ArrayIterator().should.be.an.instanceof(Iterator);
    });

    it('should be an EventEmitter constructor', function () {
      new ArrayIterator().should.be.an.instanceof(Iterator);
    });
  });

  describe('An ArrayIterator without arguments', function () {
    var iterator;
    before(function () {
      iterator = new ArrayIterator();
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

  describe('An ArrayIterator with a non-array', function () {
    var iterator;
    before(function () {
      iterator = new ArrayIterator({ a: 1, b: 2 });
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

    it('should return undefined when read is called', function () {
      expect(iterator.read()).to.be.undefined;
    });
  });

  describe('An ArrayIterator with an empty array', function () {
    var iterator;
    before(function () {
      iterator = new ArrayIterator([]);
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

    it('should return undefined when read is called', function () {
      expect(iterator.read()).to.be.undefined;
    });
  });

  describe('An ArrayIterator with a one-item array', function () {
    var iterator, item;
    before(function () {
      iterator = new ArrayIterator([1]);
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

  describe('An ArrayIterator with a three-item array', function () {
    var iterator, item;
    before(function () {
      iterator = new ArrayIterator([1, 2, 3]);
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

      it('should not have emitted the `end` event', function () {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', function () {
        iterator.ended.should.be.false;
      });
    });

    describe('after calling read for the second time', function () {
      before(function () { item = iterator.read(); });

      it('should read the second item of the array', function () {
        item.should.equal(2);
      });

      it('should not have emitted the `end` event', function () {
        iterator._eventCounts.end.should.equal(0);
      });

      it('should not have ended', function () {
        iterator.ended.should.be.false;
      });
    });

    describe('after calling read for the third time', function () {
      before(function () { item = iterator.read(); });

      it('should read the third item of the array', function () {
        item.should.equal(3);
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

  describe('An ArrayIterator with a one-item array', function () {
    var iterator, item;
    before(function () {
      iterator = new ArrayIterator([1]);
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

  describe('An ArrayIterator with an array that is modified afterwards', function () {
    var iterator, items;
    before(function () {
      var array = [1, 2, 3];
      iterator = new ArrayIterator(array);

      // Modify the array
      array[0] = 'a';
      array.pop();
      array.pop();

      items = [iterator.read(), iterator.read(), iterator.read(), iterator.read()];
    });

    it('should return the original elements', function () {
      items.should.deep.equal([1, 2, 3, undefined]);
    });
  });
});
