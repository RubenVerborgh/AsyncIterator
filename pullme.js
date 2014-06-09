var EventEmitter = require('events').EventEmitter,
    util = require('util');

/**
   Creates an iterator that allows pull-based access to a stream of objects.
   It emits the following events:
   - `readable` when one or more items can be read
   - `end` when there are no more items
   - `error` when a non-recoverable error occurs
*/
function Iterator(options) {
  if (!(this instanceof Iterator))
    return new Iterator(options);
  EventEmitter.call(this);
}
util.inherits(Iterator, EventEmitter);

/** Tries to read an item from the iterator; returns the item, or `null` if none is available. **/
Iterator.prototype.read = function () {
  throw new Error('The read method has not been implemented.');
};

/** Indicates whether reading more items from this iterator is not possible. **/
Iterator.prototype.ended = false;

// Export all submodules
module.exports = {
  Iterator: Iterator,
};
