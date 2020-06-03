// Set up the Chai assertion library
const chai = require('chai');
global.sinon = require('sinon');
global.should = chai.should();
global.expect = chai.expect;

chai.use(require('sinon-chai'));

// Captures the number of times an event has been emitted
global.captureEvents = function (item, ...events) {
  const counts = item._eventCounts = Object.create(null);
  for (const event of events) {
    counts[event] = 0;
    item.on(event, () => { counts[event]++; });
  }
  return item;
};
