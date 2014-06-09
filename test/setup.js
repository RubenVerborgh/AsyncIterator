// Set up the Chai assertion library
var chai = require('chai'),
    should = global.should = chai.should(),
    expect = global.expect = chai.expect;

// Captures the number of times an event has been emitted
global.captureEvents = function (item) {
  var counts = item._eventCounts = Object.create(null);
  for (var i = 1; i < arguments.length; i++)
    addIncrementListener(arguments[i]);
  function addIncrementListener(e) { counts[e] = 0; item.on(e, function () { counts[e]++; }); }
  return item;
};
