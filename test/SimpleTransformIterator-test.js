var SimpleTransformIterator = require('../asynciterator').SimpleTransformIterator;

var TransformIterator = require('../asynciterator').TransformIterator,
    AsyncIterator = require('../asynciterator').AsyncIterator,
    BufferedIterator = require('../asynciterator').BufferedIterator,
    EmptyIterator = require('../asynciterator').EmptyIterator,
    ArrayIterator = require('../asynciterator').ArrayIterator,
    EventEmitter = require('events').EventEmitter;

describe('SimpleTransformIterator', function () {
  describe('The SimpleTransformIterator function', function () {
    describe('the result when called without `new`', function () {
      var instance;
      before(function () { instance = SimpleTransformIterator(); });

      it('should be a SimpleTransformIterator object', function () {
        instance.should.be.an.instanceof(SimpleTransformIterator);
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
      before(function () { instance = new SimpleTransformIterator(); });

      it('should be a SimpleTransformIterator object', function () {
        instance.should.be.an.instanceof(SimpleTransformIterator);
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

  describe('A SimpleTransformIterator without options', function () {
    var instance, source;
    before(function () {
      source = new ArrayIterator(['a', 'b', 'c']);
      instance = new SimpleTransformIterator(source);
    });

    describe('when reading items', function () {
      var items = [];
      before(function (done) {
        instance.on('data', function (item) { items.push(item); });
        instance.on('end', done);
      });

      it('should return items as they are', function () {
        items.should.deep.equal(['a', 'b', 'c']);
      });
    });
  });

  describe('A SimpleTransformIterator with a map function', function () {
    var instance, source, map;
    before(function () {
      var i = 0;
      source = new ArrayIterator(['a', 'b', 'c']);
      map = sinon.spy(function (item) { return item + (++i); });
      instance = new SimpleTransformIterator(source, { map: map });
    });

    describe('when reading items', function () {
      var items = [];
      before(function (done) {
        instance.on('data', function (item) { items.push(item); });
        instance.on('end', done);
      });

      it('should execute the map function on all items in order', function () {
        items.should.deep.equal(['a1', 'b2', 'c3']);
      });

      it('should have called the map function once for each item', function () {
        map.should.have.been.calledThrice;
      });
    });
  });

  describe('A SimpleTransformIterator with a prepend array', function () {
    var instance, source, prepend;
    before(function () {
      source = new ArrayIterator(['a', 'b', 'c']);
      prepend = ['i', 'ii', 'iii'];
      instance = new SimpleTransformIterator(source, { prepend: prepend });
      prepend.push(['iiii']); // modify array to verify it is copied
    });

    describe('when reading items', function () {
      var items = [];
      before(function (done) {
        instance.on('data', function (item) { items.push(item); });
        instance.on('end', done);
      });

      it('should prepend the items to the regular items', function () {
        items.should.deep.equal(['i', 'ii', 'iii', 'a', 'b', 'c']);
      });
    });
  });

  describe('A SimpleTransformIterator with a prepend iterator', function () {
    var instance, source, prepend;
    before(function () {
      source = new ArrayIterator(['a', 'b', 'c']);
      prepend = new ArrayIterator(['i', 'ii', 'iii']);
      instance = new SimpleTransformIterator(source, { prepend: prepend });
    });

    describe('when reading items', function () {
      var items = [];
      before(function (done) {
        instance.on('data', function (item) { items.push(item); });
        instance.on('end', done);
      });

      it('should prepend the items to the regular items', function () {
        items.should.deep.equal(['i', 'ii', 'iii', 'a', 'b', 'c']);
      });
    });
  });

  describe('A SimpleTransformIterator with a prepend iterator that ended', function () {
    var instance, source, prepend;
    before(function () {
      source = new ArrayIterator(['a', 'b', 'c']);
      prepend = new EmptyIterator();
      instance = new SimpleTransformIterator(source, { prepend: prepend });
    });

    describe('when reading items', function () {
      var items = [];
      before(function (done) {
        instance.on('data', function (item) { items.push(item); });
        instance.on('end', done);
      });

      it('should return items as they are', function () {
        items.should.deep.equal(['a', 'b', 'c']);
      });
    });
  });

  describe('A SimpleTransformIterator with an append array', function () {
    var instance, source, append;
    before(function () {
      source = new ArrayIterator(['a', 'b', 'c']);
      append = ['I', 'II', 'III'];
      instance = new SimpleTransformIterator(source, { append: append });
      append.push(['IIII']); // modify array to verify it is copied
    });

    describe('when reading items', function () {
      var items = [];
      before(function (done) {
        instance.on('data', function (item) { items.push(item); });
        instance.on('end', done);
      });

      it('should append the items to the regular items', function () {
        items.should.deep.equal(['a', 'b', 'c', 'I', 'II', 'III']);
      });
    });
  });

  describe('A SimpleTransformIterator with an append iterator', function () {
    var instance, source, append;
    before(function () {
      source = new ArrayIterator(['a', 'b', 'c']);
      append = new ArrayIterator(['I', 'II', 'III']);
      instance = new SimpleTransformIterator(source, { append: append });
    });

    describe('when reading items', function () {
      var items = [];
      before(function (done) {
        instance.on('data', function (item) { items.push(item); });
        instance.on('end', done);
      });

      it('should append the items to the regular items', function () {
        items.should.deep.equal(['a', 'b', 'c', 'I', 'II', 'III']);
      });
    });
  });

  describe('A SimpleTransformIterator with an append iterator that ended', function () {
    var instance, source, append;
    before(function () {
      source = new ArrayIterator(['a', 'b', 'c']);
      append = new EmptyIterator();
      instance = new SimpleTransformIterator(source, { append: append });
    });

    describe('when reading items', function () {
      var items = [];
      before(function (done) {
        instance.on('data', function (item) { items.push(item); });
        instance.on('end', done);
      });

      it('should return items as they are', function () {
        items.should.deep.equal(['a', 'b', 'c']);
      });
    });
  });

  describe('A SimpleTransformIterator with a map function, prepender, and appender', function () {
    var instance, source, map, prepend, append;
    before(function () {
      var i = 0;
      source = new ArrayIterator(['a', 'b', 'c']);
      map = sinon.spy(function (item) { return item + (++i); });
      prepend = new ArrayIterator(['i', 'ii', 'iii']);
      append  = new ArrayIterator(['I', 'II', 'III']);
      instance = new SimpleTransformIterator(source, { map: map, prepend: prepend, append: append });
    });

    describe('when reading items', function () {
      var items = [];
      before(function (done) {
        instance.on('data', function (item) { items.push(item); });
        instance.on('end', done);
      });

      it('should return prepended, mapped, and appended items', function () {
        items.should.deep.equal(['i', 'ii', 'iii', 'a1', 'b2', 'c3', 'I', 'II', 'III']);
      });

      it('should have called the map function once for each original item', function () {
        map.should.have.been.calledThrice;
      });
    });
  });

  describe('The AsyncIterator#map function', function () {
    it('should be a function', function () {
      expect(AsyncIterator.prototype.map).to.be.a('function');
    });

    describe('when called on an iterator', function () {
      var iterator, map, result;
      before(function () {
        var i = 0;
        iterator = new ArrayIterator(['a', 'b', 'c']);
        map = sinon.spy(function (item) { return item + (++i); });
        result = iterator.map(map);
      });

      describe('the return value', function () {
        var items = [];
        before(function (done) {
          result.on('data', function (item) { items.push(item); });
          result.on('end', done);
        });

        it('should be a SimpleTransformIterator', function () {
          result.should.be.an.instanceof(SimpleTransformIterator);
        });

        it('should execute the map function on all items in order', function () {
          items.should.deep.equal(['a1', 'b2', 'c3']);
        });

        it('should have called the map function once for each item', function () {
          map.should.have.been.calledThrice;
        });
      });
    });
  });

  describe('The AsyncIterator#prepend function', function () {
    it('should be a function', function () {
      expect(AsyncIterator.prototype.prepend).to.be.a('function');
    });

    describe('when called on an iterator', function () {
      var iterator, result;
      before(function () {
        iterator = new ArrayIterator(['a', 'b', 'c']);
        result = iterator.prepend(['i', 'ii', 'iii']);
      });

      describe('the return value', function () {
        var items = [];
        before(function (done) {
          result.on('data', function (item) { items.push(item); });
          result.on('end', done);
        });

        it('should be a SimpleTransformIterator', function () {
          result.should.be.an.instanceof(SimpleTransformIterator);
        });

        it('should prepend the items', function () {
          items.should.deep.equal(['i', 'ii', 'iii', 'a', 'b', 'c']);
        });
      });
    });
  });

  describe('The AsyncIterator#append function', function () {
    it('should be a function', function () {
      expect(AsyncIterator.prototype.append).to.be.a('function');
    });

    describe('when called on an iterator', function () {
      var iterator, result;
      before(function () {
        iterator = new ArrayIterator(['a', 'b', 'c']);
        result = iterator.append(['I', 'II', 'III']);
      });

      describe('the return value', function () {
        var items = [];
        before(function (done) {
          result.on('data', function (item) { items.push(item); });
          result.on('end', done);
        });

        it('should be a SimpleTransformIterator', function () {
          result.should.be.an.instanceof(SimpleTransformIterator);
        });

        it('should append the items', function () {
          items.should.deep.equal(['a', 'b', 'c', 'I', 'II', 'III']);
        });
      });
    });
  });

  describe('The AsyncIterator#surround function', function () {
    it('should be a function', function () {
      expect(AsyncIterator.prototype.surround).to.be.a('function');
    });

    describe('when called on an iterator', function () {
      var iterator, result;
      before(function () {
        iterator = new ArrayIterator(['a', 'b', 'c']);
        result = iterator.surround(['i', 'ii', 'iii'], ['I', 'II', 'III']);
      });

      describe('the return value', function () {
        var items = [];
        before(function (done) {
          result.on('data', function (item) { items.push(item); });
          result.on('end', done);
        });

        it('should be a SimpleTransformIterator', function () {
          result.should.be.an.instanceof(SimpleTransformIterator);
        });

        it('should surround the items', function () {
          items.should.deep.equal(['i', 'ii', 'iii', 'a', 'b', 'c', 'I', 'II', 'III']);
        });
      });
    });
  });
});
