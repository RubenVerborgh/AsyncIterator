import { addDestination } from "../addDestination";
import { emitError, end } from "../emitters";
import { destinationSetError } from "../emitters/destinationSetError";
import { LinkedList } from "../linkedlist";
import { taskScheduler } from "../taskScheduler";
import { AsyncIterator } from "./AsyncIterator";

/**
  An iterator that generates items based on a source iterator.
  This class serves as a base class for other iterators.
  @extends module:asynciterator.BufferedIterator
*/
export class TransformIterator<S, D = S> extends AsyncIterator<D> {
  private buffer: LinkedList<D> = new LinkedList<D>();
  private canTransform = true;
  private transformScheduled = false;
  private boundPush = (e: D) => this.buffer.push(e);
  private next = () => {
    // TODO: Check this
    // console.log('next', this.buffer.length)

    this.canTransform = true;
    this.readable = this.buffer.length > 0;

    if (!this.transformScheduled &&
        this.buffer.length < this.maxBufferSize &&
        this.pendingError === null &&
        this.source.readable
        ) {
          this.transformScheduled = true;
          taskScheduler(() => {
            this.transformScheduled = false;
            this.loadItems()
          });
        }
  };
  private pendingError: any = null;

  constructor(
    private source: AsyncIterator<S>,
    private transform: (item: S, done: () => void, push: (i: D) => void) => void,
    private maxBufferSize = 4,
    private preBuffer = true,
  ) {
    super();
    // Add this as a destination of the source iterator
    addDestination.call(this, source);

    // Set pendingError on an error event
    source.on('error', destinationSetError);

    if (this.preBuffer)
      this.loadItems();
  }

  onParentReadable() {
    // console.log('readable')
    if (this.source.done) {
      this.readable = true;
    } else {
      this.loadItems();
    }
  }

  private loadItems() {
    let item;
    while (
      this.canTransform &&
      this.buffer.length < this.maxBufferSize &&
      this.pendingError === null &&
      this.source.readable && 
      (item = this.source.read()) !== null
    ) {
      // console.log('source', item)
      this.canTransform = false;
      this.transform(item, this.next, this.boundPush);
      this.readable = this.buffer.length > 0;
    }
  }

  read(): D | null {
    const { buffer } = this;
    let item: D | null = null;

    if (!buffer.empty) {
      item = buffer.shift() as D;
      this.loadItems();
      // console.log('returning', item)
      return item;
    } else if (this.source) {
      this.readable = false
      this.loadItems();
    }

    if (this.pendingError !== null) {
      emitError.call(this, this.pendingError);
      this.pendingError = null;
    }

    if (buffer.empty && this.source.done) {
      // console.log('emit end called')
      // TODO: Cleanup
      end.call(this);
    }
    // console.log('returning null')
    return null;
  }
}
