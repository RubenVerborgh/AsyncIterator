import { LinkedList } from '../dist/linkedlist.js';
import * as module from '../dist/asynciterator.js';

describe('LinkedList', () => {
  let list;

  beforeEach(() => {
    list = new LinkedList();
  });

  describe('a linked list with no items', () => {
    it('should have length 0', () => {
      expect(list.length).to.equal(0);
    });

    it('should have first and last undefined', () => {
      expect(list.first).to.equal(undefined);
      expect(list.last).to.equal(undefined);
    });

    it('should return undefined when upon shift', () => {
      expect(list.shift()).to.equal(undefined);
    });

    it('should set first, last and length upon push', () => {
      list.push(42);
      expect(list.length).to.equal(1);
      expect(list.first).to.equal(list.last);
      expect(list.first).to.equal(42);
    });
  });

  describe('a linked list with one item', () => {
    beforeEach(() => {
      list.push(42);
    });

    it('should have length 1', () => {
      expect(list.length).to.equal(1);
    });

    it('should have first and last set to the item', () => {
      expect(list.first).to.equal(42);
      expect(list.last).to.equal(42);
    });

    it('should return the item upon shift', () => {
      expect(list.shift()).to.equal(42);
    });

    it('should set first and last to undefined, length to 0 after shift', () => {
      list.shift();
      expect(list.first).to.equal(undefined);
      expect(list.last).to.equal(undefined);
      expect(list.length).to.equal(0);
    });
  });

  describe('a linked list with three items', () => {
    beforeEach(() => {
      list.push(1);
      list.push(2);
      list.push(3);
    });

    it('should have length 3', () => {
      expect(list.length).to.equal(3);
    });

    it('should have first and last set to the correct items', () => {
      expect(list.first).to.equal(1);
      expect(list.last).to.equal(3);
    });

    it('should set first and last to undefined, length to 0 upon clear', () => {
      list.clear();
      expect(list.first).to.equal(undefined);
      expect(list.last).to.equal(undefined);
      expect(list.length).to.equal(0);
    });

    it('should return the items upon shift', () => {
      expect(list.shift()).to.equal(1);
      expect(list.shift()).to.equal(2);
      expect(list.shift()).to.equal(3);
      expect(list.shift()).to.equal(undefined);
      expect(list.shift()).to.equal(undefined);
    });

    it('should set first, last and length upon shift', () => {
      list.shift();
      expect(list.first).to.equal(2);
      expect(list.last).to.equal(3);
      expect(list.length).to.equal(2);
    });
  });

  it('should export LinkedList from asynciterator package', () => {
    expect(module.LinkedList).to.equal(LinkedList);
  });
});
