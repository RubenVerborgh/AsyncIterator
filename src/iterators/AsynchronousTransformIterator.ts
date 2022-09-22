import { AsyncIterator } from "./AsyncIterator";

/**
  An iterator that generates items based on a source iterator.
  This class serves as a base class for other iterators.
  @extends module:asynciterator.BufferedIterator
*/
export class TransformIterator<S, D = S> extends AsyncIterator<D> {
  protected _source?: InternalSource<S>;
  protected _createSource?: (() => MaybePromise<AsyncIterator<S>>) | null;
  protected _destroySource: boolean;
  protected _optional: boolean;
  protected _boundPush = (item: D) => this._push(item);

  /**
    Creates a new `TransformIterator`.
    @param {module:asynciterator.AsyncIterator|Readable} [source] The source this iterator generates items from
    @param {object} [options] Settings of the iterator
    @param {integer} [options.maxBufferSize=4] The maximum number of items to keep in the buffer
    @param {boolean} [options.autoStart=true] Whether buffering starts directly after construction
    @param {boolean} [options.optional=false] If transforming is optional, the original item is pushed when its transformation yields no items
    @param {boolean} [options.destroySource=true] Whether the source should be destroyed when this transformed iterator is closed or destroyed
    @param {module:asynciterator.AsyncIterator} [options.source] The source this iterator generates items from
  */
  constructor(source?: AsyncIterator<S>) {
    super();
  }

  /**
    The source this iterator generates items from.
    @type module:asynciterator.AsyncIterator
  */
  get source() : AsyncIterator<S> | undefined {
    if (isFunction(this._createSource))
      this._loadSourceAsync();
    return this._source;
  }

  set source(value: AsyncIterator<S> | undefined) {
    // Validate and set source
    const source = this._source = this._validateSource(value);
    source[DESTINATION] = this;

    // Do not read the source if this iterator already ended
    if (this.done) {
      if (this._destroySource)
        source.destroy();
    }
    // Close this iterator if the source already ended
    else if (source.done) {
      this.close();
    }
    // Otherwise, react to source events
    else {
      source.on('end', destinationCloseWhenDone);
      source.on('readable', destinationFillBuffer);
      source.on('error', destinationEmitError);
    }
  }

  /**
    Initializes a source that was set through a promise
    @protected
  */
  protected _loadSourceAsync() {
    if (isFunction(this._createSource)) {
      // Assign the source after resolving
      Promise.resolve(this._createSource()).then(source => {
        delete this._createSource;
        this.source = source;
        this._fillBuffer();
      }, error => this.emit('error', error));
      // Signal that source creation is pending
      this._createSource = null;
    }
  }

  /**
    Validates whether the given iterator can be used as a source.
    @protected
    @param {object} source The source to validate
    @param {boolean} allowDestination Whether the source can already have a destination
  */
  protected _validateSource(source?: AsyncIterator<S>, allowDestination = false): InternalSource<S> {
    if (this._source || typeof this._createSource !== 'undefined')
      throw new Error('The source cannot be changed after it has been set');
    return ensureSourceAvailable(source, allowDestination);
  }

  /**
    Tries to read transformed items.
  */
  protected _read(count: number, done: () => void) {
    const next = () => {
      // Continue transforming until at least `count` items have been pushed
      if (this._pushedCount < count && !this.closed)
        taskScheduler(() => this._readAndTransform(next, done));
      else
        done();
    };
    this._readAndTransform(next, done);
  }

  /**
    Reads a transforms an item
  */
  protected _readAndTransform(next: () => void, done: () => void) {
    // If the source exists and still can read items,
    // try to read and transform the next item.
    let item;
    const source = this.source as InternalSource<S>;
    if (!source || source.done || (item = source.read()) === null)
      done();
    else if (!this._optional)
      this._transform(item, next, this._boundPush);
    else
      this._optionalTransform(item, next);
  }

  /**
    Tries to transform the item;
    if the transformation yields no items, pushes the original item.
  */
  protected _optionalTransform(item: S, done: () => void) {
    const pushedCount = this._pushedCount;
    this._transform(item, () => {
      if (pushedCount === this._pushedCount)
        this._push(item as any as D);
      done();
    }, this._boundPush);
  }

  /**
    Generates items based on the item from the source.
    Implementers should add items through {@link BufferedIterator#_push}.
    The default implementation pushes the source item as-is.
    @protected
    @param {object} item The last read item from the source
    @param {function} done To be called when reading is complete
    @param {function} push A callback to push zero or more transformation results.
  */
  protected _transform(item: S, done: () => void, push: (i: D) => void) {
    push(item as any as D);
    done();
  }

  /**
    Closes the iterator when pending items are transformed.
    @protected
  */
  protected _closeWhenDone() {
    this.close();
  }

  /* Cleans up the source iterator and ends. */
  protected _end(destroy: boolean) {
    const source = this._source;
    if (source) {
      source.removeListener('end', destinationCloseWhenDone);
      source.removeListener('error', destinationEmitError);
      source.removeListener('readable', destinationFillBuffer);
      delete source[DESTINATION];
      if (this._destroySource)
        source.destroy();
    }
    super._end(destroy);
  }
}
