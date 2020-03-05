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

var AsyncIterator = require('../asynciterator').AsyncIterator;
var MultiTransformIterator = require('../asynciterator').MultiTransformIterator;
var SingletonIterator = require('../asynciterator').SingletonIterator;

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

      var it = AsyncIterator.range(0, streamElements);
      for (var i = 0; i < streamTransformers; i++) {
        it = new MultiTransformIterator(it);
        it._createTransformer = function (element) {
          return new AsyncIterator.range(element + 1, element + 1);
        };
      }

      it.on('data', noop);
      await new Promise(resolve => it.on('end', resolve));

      var timeEnd = Date.now();
      console.log(streamElements + ':' + streamTransformers + ':' + (timeEnd - timeStart) + ':' + getSetImmediateCounter());
    }
  }
  logTrackedEvents(console);

  // Trigger end when running in Web browser
  if (typeof window !== 'undefined' && window.onEnd) {
    window.onEnd();
  }
})();

function noop() {}
