import { end } from "../emitters";
import { AsyncIterator } from "./AsyncIterator";

/**
  An iterator that doesn't emit any items.
  @extends module:asynciterator.AsyncIterator
*/
export class EmptyIterator<T> extends AsyncIterator<T> {
  /** Creates a new `EmptyIterator`. */
  constructor() {
    super();
    this.readable = true;
  }

  read() {
    end.call(this);
    return null;
  }
}
