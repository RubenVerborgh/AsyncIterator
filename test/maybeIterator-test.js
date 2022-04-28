import {
  AsyncIterator,
  ArrayIterator,
  fromArray,
  maybeIterator,
  range,
  empty,
  scheduleTask
} from '../dist/asynciterator.js';

class MyIterator extends AsyncIterator {
  read() {
    this.close();
    return null;
  }
}


class MyBufferingIterator extends AsyncIterator {
  i = 3;
  
  read() {
    if (this.i-- < 0) {
      this.close();
    } else {
      scheduleTask(() => {
        if (this.readable)
          this.emit('readable')
        else
          this.readable = true
      })
    }
    return null;
  }
}


class MyItemBufferingIterator extends AsyncIterator {
  i = 10;
  
  read() {
    this.i--;
    if (this.i < 0) {
      this.close();
    } else {
      scheduleTask(() => {
        if (this.readable)
          this.emit('readable')
        else
          this.readable = true
      })
    }
    return this.i % 2 === 0 ? this.i : null;
  }
}

describe('maybeIterator', () => {
  // TODO: 
  describe('Should return null on empty iterators', () => {
    it('fromArray', async () => {
      expect(await maybeIterator(fromArray([]))).to.be.null;
    });
    it('range', async () => {
      expect(await maybeIterator(range(0, -1))).to.be.null;
    });
    it('MyIterator', async () => {
      expect(await maybeIterator(new MyIterator())).to.be.null;
    });
    it('empty', async () => {
      expect(await maybeIterator(empty())).to.be.null;
    });
    it('awaited empty', async () => {
      const e = empty();
      // Add an await so that scheduleMacroTask will have run
      await Promise.resolve();

      expect(await maybeIterator(e)).to.be.null;
    });
    it('MyBufferingIterator', async () => {
      expect(await maybeIterator(new MyBufferingIterator())).to.be.null;
    });
  });

  describe('Should return an iterator with all elements if the iterator is not empty', () => {
    it('fromArray', async () => {
      expect(await (await maybeIterator(fromArray([1, 2, 3]))).toArray()).to.deep.equal([1, 2, 3]);
    });
    it('range', async () => {
      expect(await (await maybeIterator(range(1, 3))).toArray()).to.deep.equal([1, 2, 3]);
    });
    it('range', async () => {
      expect(await (await maybeIterator(new MyItemBufferingIterator())).toArray()).to.deep.equal([8, 6, 4, 2, 0]);
    });
  });
});
