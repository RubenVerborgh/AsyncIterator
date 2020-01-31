Error.stackTraceLimit = 50;

// Wrap setImmediate to count the number of calls
// This will only work in Node.js
var setImmediateCounter = 0;
var setImmediateOld = setImmediate;
setImmediate = function() {
  setImmediateCounter++;
  return setImmediateOld.apply(null, arguments);
};
function getSetImmediateCounter() {
  var value = setImmediateCounter;
  setImmediateCounter = 0;
  return value;
}

var BufferedIterator = require('../asynciterator').BufferedIterator;

/*
This file measures the performance of transform iterators in two dimensions.
The first dimension is the number of elements that are pushed through the stream.
The second dimension is the number of transformations that are applied over the stream.
 */

var STREAM_ELEMENTS = [1000, 10000, 100000];
var STREAM_TRANSFORMERS = [1, 10, 100];

(async function() {
  console.log('elements:transformers:time(ms):setImmediates');
  for (var x = 0; x < STREAM_ELEMENTS.length; x++) {
    for (var y = 0; y < STREAM_TRANSFORMERS.length; y++) {
      var streamElements = STREAM_ELEMENTS[x];
      var streamTransformers = STREAM_TRANSFORMERS[y];

      var timeStart = Date.now();

      // Make a buffered iterator that simulates lazy paging
      var it = new BufferedIterator({});
      it.DEBUG = true;
      var bufferCounter = 0;
      var self = it;
      it._read = function(count, done, setImmediateDepth) {
        while (bufferCounter < streamElements && count-- > 0)
          self._push(bufferCounter++, setImmediateDepth);
        if (bufferCounter === streamElements)
          self.close();
        done();
      };

      for (var i = 0; i < streamTransformers; i++)
        it = it.map(function (element) {
          return element + 1;
        });

      it.on('data', noop);
      await new Promise(resolve => it.on('end', resolve));

      var timeEnd = Date.now();
      console.log(streamElements + ':' + streamTransformers + ':' + (timeEnd - timeStart) + ':' + getSetImmediateCounter());
    }
  }

  // Trigger end when running in Web browser
  if (typeof window !== 'undefined' && window.onEnd) {
    window.onEnd();
  }
})();

function noop() {}
