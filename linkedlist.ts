
export interface LinkedNode<V> {
  value: V;
  next?: LinkedNode<V>;
}

export class LinkedList<V> {
  public head?: LinkedNode<V>;
  public tail?: LinkedNode<V>;
  public length: number = 0;

  push(value: V) {
    if (this.tail) {
      this.tail.next = { value };
      this.tail = this.tail.next;
    }
    else {
      this.head = { value };
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
        this.tail = undefined;
      return value;
    }
    return null;
  }

  clear() {
    this.head = undefined;
    this.tail = undefined;
    this.length = 0;
  }
}
