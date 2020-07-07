// Set up the Chai assertion library
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

global.sinon = sinon;
global.should = chai.should();
global.expect = chai.expect;

// Captures the number of times an event has been emitted
global.captureEvents = (item, ...events) => {
  const counts = item._eventCounts = Object.create(null);
  for (const event of events) {
    counts[event] = 0;
    item.on(event, () => { counts[event]++; });
  }
  return item;
};
