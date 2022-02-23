import {
  ArrayIterator,
  TransformIterator,
  UnionIterator,
  scheduleTask,
} from '../dist/asynciterator.js';

describe('Integration tests', () => {
  describe('A sequence of ArrayIterator, TransformIterator, and Unioniterator without preBuffer', () => {
    let arrayIterator, transformIterator, unionIterator;

    before(() => {
      arrayIterator = new ArrayIterator([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], { preBuffer: false });
      transformIterator = new TransformIterator(arrayIterator, { preBuffer: false });
      unionIterator = new UnionIterator([transformIterator], { preBuffer: false });
    });

    it('emits a data event', done => {
      unionIterator.once('data', () => {
        // Since the stream does not automatically pause
        // when data listeners are detached, we need to pause it
        // manually
        unionIterator.pause();
        done();
      });
    });

    it('emits an end event after reading', done => {
      unionIterator.on('data', () => { /* drain */ });
      unionIterator.on('end', done);
    });
  });

  describe('Cloning iterators', () => {
    describe('A clone of an empty ArrayIterator without preBuffer', () => {
      let arrayIterator, clonedIterator;

      before(() => {
        arrayIterator = new ArrayIterator([], { preBuffer: false });
        clonedIterator = arrayIterator.clone();
      });

      it('emits an end event after attaching a data listener', done => {
        clonedIterator.on('data', () => { /* drain */ });
        clonedIterator.on('end', done);
      });
    });

    describe('An async clone of an empty ArrayIterator without preBuffer', () => {
      let arrayIterator, clonedIterator;

      before(async () => {
        arrayIterator = new ArrayIterator([], { preBuffer: false });
        await new Promise(scheduleTask);

        clonedIterator = arrayIterator.clone();
      });

      it('emits an end event after attaching a data listener', done => {
        clonedIterator.on('data', () => { /* drain */ });
        clonedIterator.on('end', done);
      });
    });

    describe('A multi-clone of an empty ArrayIterator without preBuffer', () => {
      let arrayIterator, clonedIterator1, clonedIterator2;

      before(() => {
        arrayIterator = new ArrayIterator([], { preBuffer: false });
        clonedIterator1 = arrayIterator.clone();
        clonedIterator2 = arrayIterator.clone();
      });

      it('emits an end event on clone 1 after attaching a data listener', done => {
        clonedIterator1.on('data', () => { /* drain */ });
        clonedIterator1.on('end', done);
      });

      it('emits an end event on clone 2 after attaching a data listener', done => {
        clonedIterator2.on('data', () => { /* drain */ });
        clonedIterator2.on('end', done);
      });
    });

    describe('An async multi-clone of an empty ArrayIterator without preBuffer', () => {
      let arrayIterator, clonedIterator1, clonedIterator2;

      before(async () => {
        arrayIterator = new ArrayIterator([], { preBuffer: false });
        await new Promise(resolve => scheduleTask(resolve));

        clonedIterator1 = arrayIterator.clone();
        clonedIterator2 = arrayIterator.clone();
      });

      it('emits an end event on clone 1 after attaching a data listener', done => {
        clonedIterator1.on('data', () => { /* drain */ });
        clonedIterator1.on('end', done);
      });

      it('emits an end event on clone 2 after attaching a data listener', done => {
        clonedIterator2.on('data', () => { /* drain */ });
        clonedIterator2.on('end', done);
      });
    });

    describe('A double clone of an empty ArrayIterator without preBuffer', () => {
      let arrayIterator, clonedIterator;

      before(() => {
        arrayIterator = new ArrayIterator([], { preBuffer: false });
        clonedIterator = arrayIterator.clone().clone();
      });

      it('emits an end event after attaching a data listener', done => {
        clonedIterator.on('data', () => { /* drain */ });
        clonedIterator.on('end', done);
      });
    });

    describe('A clone of a sequence of an empty ArrayIterator, and TransformIterator without preBuffer', () => {
      let arrayIterator, transformIterator, clonedIterator;

      before(() => {
        arrayIterator = new ArrayIterator([], { preBuffer: false });
        transformIterator = new TransformIterator(arrayIterator, { preBuffer: false });
        clonedIterator = transformIterator.clone();
      });

      it('emits an end event after attaching a data listener', done => {
        clonedIterator.on('data', () => { /* drain */ });
        clonedIterator.on('end', done);
      });
    });

    describe('A clone of a sequence of an empty ArrayIterator, TransformIterator, and Unioniterator without preBuffer', () => {
      let arrayIterator, transformIterator, unionIterator, clonedIterator;

      before(() => {
        arrayIterator = new ArrayIterator([], { preBuffer: false });
        transformIterator = new TransformIterator(arrayIterator, { preBuffer: false });
        unionIterator = new UnionIterator([transformIterator], { preBuffer: false });
        clonedIterator = unionIterator.clone();
      });

      it('emits an end event after attaching a data listener', done => {
        clonedIterator.on('data', () => { /* drain */ });
        clonedIterator.on('end', done);
      });
    });

    describe('A clone of an ArrayIterator without preBuffer', () => {
      let arrayIterator, clonedIterator;

      before(() => {
        arrayIterator = new ArrayIterator([1, 2, 3], { preBuffer: false });
        clonedIterator = arrayIterator.clone();
      });

      it('emits an end event after attaching a data listener', done => {
        clonedIterator.on('data', () => { /* drain */ });
        clonedIterator.on('end', done);
      });
    });

    describe('An async clone of an ArrayIterator without preBuffer', () => {
      let arrayIterator, clonedIterator;

      before(async () => {
        arrayIterator = new ArrayIterator([1, 2, 3], { preBuffer: false });
        await new Promise(scheduleTask);

        clonedIterator = arrayIterator.clone();
      });

      it('emits an end event after attaching a data listener', done => {
        clonedIterator.on('data', () => { /* drain */ });
        clonedIterator.on('end', done);
      });
    });

    describe('A double clone of an ArrayIterator without preBuffer', () => {
      let arrayIterator, clonedIterator;

      before(() => {
        arrayIterator = new ArrayIterator([1, 2, 3], { preBuffer: false });
        clonedIterator = arrayIterator.clone().clone();
      });

      it('emits an end event after attaching a data listener', done => {
        clonedIterator.on('data', () => { /* drain */ });
        clonedIterator.on('end', done);
      });
    });

    describe('A double async clone of an ArrayIterator without preBuffer', () => {
      let arrayIterator, clonedIterator;

      before(async () => {
        arrayIterator = new ArrayIterator([1, 2, 3], { preBuffer: false });
        clonedIterator = arrayIterator.clone();
        await new Promise(scheduleTask);

        clonedIterator = clonedIterator.clone();
      });

      it('emits an end event after attaching a data listener', done => {
        clonedIterator.on('data', () => { /* drain */ });
        clonedIterator.on('end', done);
      });
    });
  });
});
