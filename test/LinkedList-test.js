/* eslint-disable no-undef */
import {
  LinkedList,
} from '../dist/linkedlist.js';

describe('LinkedList', () => {
  let ll = new LinkedList();

  beforeEach(() => {
    ll = new LinkedList();
  });

  describe('On a linked list with no items', () => {
    it('head and tail should be undefined', () => {
      should.equal(ll.head, null);
      should.equal(ll.tail, null);
    });

    it('calling shift() should return null', () => {
      should.equal(ll.shift(), null);
    });

    it('calling push() should set head, tail and length', () => {
      ll.push(42);
      should.equal(ll.length, 1);
      should.equal(ll.head, ll.tail);
      should.equal(ll.head.value, 42);
    });
  });

  describe('On a linked list with one item', () => {
    beforeEach(() => {
      ll.push(42);
    });

    it('calling shift() should return the correct value', () => {
      const value = ll.shift();
      should.equal(value, 42);
    });

    it('calling shift() should set head and tail to undefined, length to 0', () => {
      ll.shift();
      should.equal(ll.head, null);
      should.equal(ll.tail, null);
      should.equal(ll.length, 0);
    });
  });

  describe('On a linked list with three items', () => {
    beforeEach(() => {
      ll.push(1);
      ll.push(2);
      ll.push(3);
    });

    it('length should be 3', () => {
      should.equal(ll.length, 3);
    });

    it('calling clear() should set head and tail to undefined, length to 0', () => {
      ll.clear();
      should.equal(ll.head, null);
      should.equal(ll.tail, null);
      should.equal(ll.length, 0);
    });

    it('calling shift() return the correct value', () => {
      const value = ll.shift();
      should.equal(value, 1);
    });

    it('calling shift() should set head, tail and length', () => {
      ll.shift();
      should.equal(ll.head.value, 2);
      should.equal(ll.tail.value, 3);
      should.equal(ll.head.next, ll.tail);
      should.equal(ll.tail.next, null);
      should.equal(ll.length, 2);
    });
  });
});
