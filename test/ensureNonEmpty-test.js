import { expect } from 'chai';
import {
  AsyncIterator,
  fromArray,
  ensureNonEmpty,
  range,
  empty,
  scheduleTask,
} from '../dist/asynciterator.js';

class MyIterator extends AsyncIterator {
  read() {
    this.close();
    return null;
  }
}


class MyBufferingIterator extends AsyncIterator {
  constructor() {
    super();
    this.i = 10;
  }

  read() {
    if (this.i-- < 0) {
      this.close();
    }
    else {
      scheduleTask(() => {
        if (this.readable)
          this.emit('readable');
        else
          this.readable = true;
      });
    }
    return null;
  }
}


class MyItemBufferingIterator extends AsyncIterator {
  constructor() {
    super();
    this.i = 10;
  }

  read() {
    this.i--;
    if (this.i < 0) {
      this.close();
    }
    else {
      scheduleTask(() => {
        if (this.readable)
          this.emit('readable');
        else
          this.readable = true;
      });
    }
    return this.i % 2 === 0 ? this.i : null;
  }
}

describe('ensureNonEmpty', () => {
  // TODO:
  describe('Should return null on empty iterators', () => {
    it('fromArray', async () => {
      expect(await ensureNonEmpty(fromArray([]))).to.be.null;
    });
    it('range', async () => {
      expect(await ensureNonEmpty(range(0, -1))).to.be.null;
    });
    it('MyIterator', async () => {
      expect(await ensureNonEmpty(new MyIterator())).to.be.null;
    });
    it('empty', async () => {
      expect(await ensureNonEmpty(empty())).to.be.null;
    });
    it('awaited empty', async () => {
      const e = empty();
      // Add an await so that scheduleMacroTask will have run
      await Promise.resolve();

      expect(await ensureNonEmpty(e)).to.be.null;
    });
    it('MyBufferingIterator', async () => {
      expect(await ensureNonEmpty(new MyBufferingIterator())).to.be.null;
    });
  });

  describe('Should return an iterator with all elements if the iterator is not empty', () => {
    it('fromArray', async () => {
      expect(await (await ensureNonEmpty(fromArray([1, 2, 3]))).toArray()).to.deep.equal([1, 2, 3]);
    });
    it('range 1-3', async () => {
      expect(await (await ensureNonEmpty(range(1, 3))).toArray()).to.deep.equal([1, 2, 3]);
    });
    it('range 1-1', async () => {
      expect(await (await ensureNonEmpty(range(1, 1))).toArray()).to.deep.equal([1]);
    });
    it('MyItemBufferingIterator', async () => {
      expect(await (await ensureNonEmpty(new MyItemBufferingIterator())).toArray()).to.deep.equal([8, 6, 4, 2, 0]);
    });
  });

  // TODO: Add better error coverage - it is *possible* that there may be a bug
  // that occurs when errors are thrown when we are *not* in the awaitReadable
  // code section
  it('Should reject on error before first element', async () => {
    const iterator = new AsyncIterator();
    scheduleTask(() => { iterator.emit('error', new Error('myError')); });

    let error = false;

    try {
      await ensureNonEmpty(iterator);
    }
    catch (e) {
      error = true;
    }

    expect(error).to.be.true;
  });
});
