import { EventEmitter } from "events";
import { removeListener, newListener, setReadable, end } from "../emitters";
import { ENDED, OPEN } from '../states';
import { AsyncIteratorBase } from '../interface';

/**
  An asynchronous iterator provides pull-based access to a stream of objects.
  @extends module:asynciterator.EventEmitter
*/
export class AsyncIterator<T> extends EventEmitter implements AsyncIteratorBase<T> {
  protected _state: number;
  protected _readable = false;
  protected _canEmitReadable = true;
  protected _emitDataPendingOrRunning = false;
  protected _flowing = false;
  protected _properties?: { [name: string]: any };
  protected _propertyCallbacks?: { [name: string]: [(value: any) => void] };

  /** Creates a new `AsyncIterator`. */
  constructor(initialState = OPEN) {
    super();
    this._state = initialState;
    this.on('removeListener', removeListener);
    this.on('newListener', newListener);
  }

  /**
    Gets or sets whether this iterator might have items available for read.
    A value of `false` means there are _definitely_ no items available;
    a value of `true` means items _might_ be available.
    @type boolean
    @emits module:asynciterator.AsyncIterator.readable
  */
  get readable() {
    return this._readable;
  }

  set readable(readable) {
    if (readable)
      setReadable.call(this);
    else
      this._readable = false;
  }

  /**
    Gets whether the iterator will not emit anymore items,
    either due to being closed or due to being destroyed.
    @type boolean
    @readonly
  */
  get done() {
    return this._state >= ENDED;
  }

  read(): T | null {
    end.call(this);
    return null;
  }
}