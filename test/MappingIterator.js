import {
  AsyncIterator,
  ArrayIterator,
  MappingIterator,
} from '../dist/asynciterator.js';

import { EventEmitter } from 'events';

class CustomTransformIterator extends MappingIterator {
  read() {
    return this.source.read();
  }
}

describe('CustomTransformIterator', () => {
  describe('The CustomTransformIterator function', () => {
    describe('the result when called with `new`', () => {
      let instance;

      before(() => {
        instance = new CustomTransformIterator(new ArrayIterator([]));
      });

      it('should be a CustomTransformIterator object', () => {
        instance.should.be.an.instanceof(MappingIterator);
      });

      it('should be an AsyncIterator object', () => {
        instance.should.be.an.instanceof(AsyncIterator);
      });

      it('should be an EventEmitter object', () => {
        instance.should.be.an.instanceof(EventEmitter);
      });
    });
  });

  describe('A CustomTransformIterator', () => {
    let iterator, source;

    before(() => {
      source = new ArrayIterator([0, 1, 2, 3, 4, 5, 6]);
      iterator = new CustomTransformIterator(source);
    });

    describe('when reading items', () => {
      const items = [];

      before(done => {
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', done);
      });

      it('should return all items', () => {
        items.should.deep.equal([0, 1, 2, 3, 4, 5, 6]);
      });
    });
  });

  describe('A CustomTransformIterator', () => {
    let iterator, source;

    before(() => {
      source = new ArrayIterator([1]);
      source._readable = false;
      iterator = new CustomTransformIterator(source);
    });

    it('Should emit readable when readable is set to true', done => {
      iterator.on('readable', done);
      iterator.readable = true;
    });
  });

  describe('A CustomTransformIterator with a source that emits 0 items', () => {
    it('should not return any items', done => {
      const items = [];
      const iterator = new CustomTransformIterator(new ArrayIterator([]));
      iterator.on('data', item => { items.push(item); });
      iterator.on('end', () => {
        items.should.deep.equal([]);
        done();
      });
    });
  });

  describe('A CustomTransformIterator with a source that is already ended', () => {
    it('should not return any items', done => {
      const items = [];
      const source = new ArrayIterator([]);
      source.on('end', () => {
        const iterator = new CustomTransformIterator(source);
        iterator.on('data', item => { items.push(item); });
        iterator.on('end', () => {
          items.should.deep.equal([]);
          done();
        });
      });
    });
  });


  describe('A TransformIterator with destroySource set to its default', () => {
    let iterator, source;

    before(() => {
      source = new ArrayIterator([1, 2, 3]);
      iterator = new CustomTransformIterator(source);
    });

    describe('after being closed', () => {
      before(done => {
        iterator.read();
        iterator.close();
        iterator.on('end', done);
      });

      it('should have destroyed the source', () => {
        expect(source).to.have.property('destroyed', true);
      });
    });
  });

  describe('A TransformIterator with destroySource set to false', () => {
    let iterator, source;

    before(() => {
      source = new ArrayIterator([1, 2, 3]);
      iterator = new CustomTransformIterator(source, undefined, undefined, { destroySource: false });
    });

    describe('after being closed', () => {
      before(done => {
        iterator.read();
        iterator.close();
        iterator.on('end', done);
      });

      it('should not have destroyed the source', () => {
        expect(source).to.have.property('destroyed', false);
      });
    });
  });

  describe('A TransformIterator with a source that errors', () => {
    let iterator, source, errorHandler;

    before(() => {
      source = new AsyncIterator();
      iterator = new CustomTransformIterator(source);
      iterator.on('error', errorHandler = sinon.stub());
    });

    describe('before an error occurs', () => {
      it('should not have emitted any error', () => {
        errorHandler.should.not.have.been.called;
      });
    });

    describe('after a first error occurs', () => {
      let error1;
      before(() => {
        errorHandler.reset();
        source.emit('error', error1 = new Error('error1'));
      });

      it('should re-emit the error', () => {
        errorHandler.should.have.been.calledOnce;
        errorHandler.should.have.been.calledWith(error1);
      });
    });

    describe('after a second error occurs', () => {
      let error2;

      before(() => {
        errorHandler.reset();
        source.emit('error', error2 = new Error('error2'));
      });

      it('should re-emit the error', () => {
        errorHandler.should.have.been.calledOnce;
        errorHandler.should.have.been.calledWith(error2);
      });
    });

    describe('after the source has ended and errors again', () => {
      before(done => {
        errorHandler.reset();
        source.close();
        iterator.on('end', () => {
          function noop() { /* */ }
          source.on('error', noop); // avoid triggering the default error handler
          source.emit('error', new Error('error3'));
          source.removeListener('error', noop);
          done();
        });
      });

      it('should not re-emit the error', () => {
        errorHandler.should.not.have.been.called;
      });

      it('should not leave any error handlers attached', () => {
        source.listenerCount('error').should.equal(0);
      });
    });
  });
});
