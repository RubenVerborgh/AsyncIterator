export interface LinkedNode<V> {
  value: V;
  next: LinkedNode<V> | null;
}

export default class LinkedList<V> {
  private _length: number = 0;
  _head: LinkedNode<V> | null = null;
  private _tail: LinkedNode<V> | null = null;

  get length() { return this._length; }
  get first()  { return this._head?.value; }
  get last()   { return this._tail?.value; }
  get empty()  { return this._head === null; }

  push(value: V) {
    const node = { value, next: null } as LinkedNode<V>;
    if (this._tail === null)
      this._head = this._tail = node;
    else
      this._tail.next = this._tail = node;
    this._length++;
  }

  _push(value: V) {
    const node = { value, next: null } as LinkedNode<V>;
    if (this._tail === null)
      this._head = this._tail = node;
    else
      this._tail.next = this._tail = node;
    this._length++;
    return node;
  }

  shift(): V | undefined {
    if (this._head === null)
      return undefined;

    const { value, next } = this._head;
    this._head = next;
    if (next === null)
      this._tail = null;
    this._length--;
    return value;
  }

  remove(node: LinkedNode<V>) {
    
  }

  mutateFilter(filter: (item: V) => boolean) {
    let last: LinkedNode<V> | null;
    let next: LinkedNode<V> | null;
    while (this._head !== null && !filter(this._head.value)) {
      this._head = this._head.next
      this._length--;
    }
    if (this._head === null) {
      this._tail = null;
      return
    }
    last = this._head;
    next = this._head.next;
    while (next !== null) {
      if (filter(next.value)) {
        last = next;
        next = next.next
      } else {
        next = next.next
        last.next = next
        this._length--;
      }
    }
    this._tail = last;
  }

  clear() {
    this._length = 0;
    this._head = this._tail = null;
  }

  // This iterator does not keep yielding items as they are pushed into the list.
  // It synchronously runs until the current end of the list and that's it.
  *[Symbol.iterator]() {
    let node = this._head;
    while (node !== null) {
      yield node.value;
      node = node.next;
    }
  }
}
