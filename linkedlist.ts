
export interface LinkedNode<V> {
  value: V;
  next: LinkedNode<V> | null;
}

export class LinkedList<V> {
  public head: LinkedNode<V> | null;
  public tail: LinkedNode<V> | null;
  public length: number = 0;

  constructor() {
    this.head = null;
    this.tail = null;
  }

  push(value: V) {
    if (this.tail) {
      this.tail.next = { value, next: null };
      this.tail = this.tail.next;
    }
    else {
      this.head = { value, next: null };
      this.tail = this.head;
    }
    this.length += 1;
  }

  shift(): V | null {
    if (this.head) {
      const { value } = this.head;
      this.head = this.head.next;
      this.length -= 1;
      if (!this.head)
        this.tail = null;
      return value;
    }
    return null;
  }

  clear() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }
}
