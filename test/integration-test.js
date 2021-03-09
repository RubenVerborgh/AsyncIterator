import {
  ArrayIterator,
  TransformIterator,
  UnionIterator,
} from '../dist/asynciterator.js';

describe('Integration tests', () => {
  describe('A sequence of ArrayIterator, TransformIterator, and Unioniterator without autoStart', () => {
    let arrayIterator, transformIterator, unionIterator;

    before(() => {
      arrayIterator = new ArrayIterator([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], { autoStart: false });
      transformIterator = new TransformIterator(arrayIterator, { autoStart: false });
      unionIterator = new UnionIterator([transformIterator], { autoStart: false });
    });

    it('emits a data event', done => {
      unionIterator.once('data', () => done());
    });

    it('emits an end event after reading', done => {
      unionIterator.on('data', () => { /* drain */ });
      unionIterator.on('end', done);
    });
  });

  describe('A clone of an empty ArrayIterator without autoStart', () => {
    let arrayIterator, clonedIterator;

    before(() => {
      arrayIterator = new ArrayIterator([], { autoStart: false });
      clonedIterator = arrayIterator.clone();
    });

    it('emits an end event after attaching a data listener', done => {
      clonedIterator.on('data', () => { /* drain */ });
      clonedIterator.on('end', done);
    });
  });

  describe('A double clone of an empty ArrayIterator without autoStart', () => {
    let arrayIterator, clonedIterator;

    before(() => {
      arrayIterator = new ArrayIterator([], { autoStart: false });
      clonedIterator = arrayIterator.clone().clone();
    });

    it('emits an end event after attaching a data listener', done => {
      clonedIterator.on('data', () => { /* drain */ });
      clonedIterator.on('end', done);
    });
  });

  describe('A clone of a sequence of an empty ArrayIterator, and TransformIterator without autoStart', () => {
    let arrayIterator, transformIterator, clonedIterator;

    before(() => {
      arrayIterator = new ArrayIterator([], { autoStart: false });
      transformIterator = new TransformIterator(arrayIterator, { autoStart: false });
      clonedIterator = transformIterator.clone();
    });

    it('emits an end event after attaching a data listener', done => {
      clonedIterator.on('data', () => { /* drain */ });
      clonedIterator.on('end', done);
    });
  });

  describe('A clone of a sequence of an empty ArrayIterator, TransformIterator, and Unioniterator without autoStart', () => {
    let arrayIterator, transformIterator, unionIterator, clonedIterator;

    before(() => {
      arrayIterator = new ArrayIterator([], { autoStart: false });
      transformIterator = new TransformIterator(arrayIterator, { autoStart: false });
      unionIterator = new UnionIterator([transformIterator], { autoStart: false });
      clonedIterator = unionIterator.clone();
    });

    it('emits an end event after attaching a data listener', done => {
      clonedIterator.on('data', () => { /* drain */ });
      clonedIterator.on('end', done);
    });
  });

  describe('A clone of an ArrayIterator without autoStart', () => {
    let arrayIterator, clonedIterator;

    before(() => {
      arrayIterator = new ArrayIterator([1, 2, 3], { autoStart: false });
      clonedIterator = arrayIterator.clone();
    });

    it('emits an end event after attaching a data listener', done => {
      clonedIterator.on('data', () => { /* drain */ });
      clonedIterator.on('end', done);
    });
  });

  describe('A double clone of an ArrayIterator without autoStart', () => {
    let arrayIterator, clonedIterator;

    before(() => {
      arrayIterator = new ArrayIterator([1, 2, 3], { autoStart: false });
      clonedIterator = arrayIterator.clone().clone();
    });

    it('emits an end event after attaching a data listener', done => {
      clonedIterator.on('data', () => { /* drain */ });
      clonedIterator.on('end', done);
    });
  });

  describe('A double async clone of an ArrayIterator without autoStart', () => {
    let arrayIterator, clonedIterator;

    before(async () => {
      arrayIterator = new ArrayIterator([1, 2, 3], { autoStart: false });
      clonedIterator = arrayIterator.clone();

      // Wait a tick
      await new Promise(resolve => setImmediate(resolve));

      clonedIterator = clonedIterator.clone();
    });

    it('emits an end event after attaching a data listener', done => {
      clonedIterator.on('data', () => { /* drain */ });
      clonedIterator.on('end', done);
    });
  });
});
