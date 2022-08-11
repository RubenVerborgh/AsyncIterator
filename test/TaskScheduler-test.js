import {
  scheduleTask,
  getTaskScheduler,
  setTaskScheduler,
} from '../dist/asynciterator.js';

import { createTaskScheduler } from '../dist/taskscheduler.js';

describe('TaskScheduler', () => {
  describe('scheduleTask', () => {
    it('is a function', () => {
      expect(scheduleTask).to.be.an.instanceof(Function);
    });

    it('schedules a task', done => {
      scheduleTask(done);
    });
  });

  describe('getTaskScheduler', () => {
    it('is a function', () => {
      expect(getTaskScheduler).to.be.an.instanceof(Function);
    });

    it('returns a task scheduler', done => {
      const scheduler = getTaskScheduler();
      scheduler(done);
    });
  });

  describe('setTaskScheduler', () => {
    it('is a function', () => {
      expect(setTaskScheduler).to.be.an.instanceof(Function);
    });

    it('allows setting the task scheduler', () => {
      const scheduler = getTaskScheduler();
      expect(getTaskScheduler()).to.equal(scheduler);

      const newScheduler = sinon.spy();
      setTaskScheduler(newScheduler);
      expect(getTaskScheduler()).to.equal(newScheduler);
      expect(newScheduler).to.not.have.been.called;

      const task = sinon.spy();
      scheduleTask(task);
      expect(newScheduler).to.have.been.calledOnce;
      expect(newScheduler).to.have.been.calledWith(task);

      setTaskScheduler(scheduler);
    });
  });

  describe('a task scheduler when setImmediate exists', () => {
    const backups = {};

    beforeEach(() => {
      backups.setTimeout = global.setTimeout;
      backups.queueMicrotask = global.queueMicrotask;
      backups.setImmediate = global.setImmediate;
      global.setImmediate = sinon.spy();
      global.setTimeout = sinon.spy();
      global.queueMicrotask = sinon.spy();
    });

    after(() => {
      global.setTimeout = backups.setTimeout;
      global.queueMicrotask = backups.queueMicrotask;
      global.setImmediate = backups.setImmediate;
      delete global.window;
    });

    it('alternates between setImmediate and queueMicrotask', () => {
      // Perform 100 calls
      const taskScheduler = createTaskScheduler();
      const tasks = [];
      for (let i = 0; i < 100; i++) {
        tasks[i] = sinon.spy();
        taskScheduler(tasks[i]);
      }

      // Ensure that setTimeout was not used
      expect(global.setTimeout).to.have.callCount(0);

      // 99 calls should have gone to queueMicrotask, 1 to setImmediate
      expect(global.setImmediate).to.have.callCount(1);
      expect(global.queueMicrotask).to.have.callCount(99);

      // When the setImmediate callback is invoked, the final call should to through
      global.setImmediate.getCall(0).callback();
      expect(global.queueMicrotask).to.have.callCount(100);

      // Verify all microtasks were scheduled
      for (let i = 0; i < 100; i++)
        expect(global.queueMicrotask).to.have.been.calledWith(tasks[i]);
    });

    it('waits for setImmediate to finish before calling queueMicrotask', () => {
      // Perform 150 calls
      const taskScheduler = createTaskScheduler();
      const tasks = [];
      for (let i = 0; i < 150; i++) {
        tasks[i] = sinon.spy();
        taskScheduler(tasks[i]);
      }

      // Ensure that setTimeout was not used
      expect(global.setTimeout).to.have.callCount(0);

      // 99 calls should have gone to queueMicrotask, 1 to setImmediate
      expect(global.setImmediate).to.have.callCount(1);
      expect(global.queueMicrotask).to.have.callCount(99);

      // When the setImmediate callback is invoked, the final call should to through
      global.setImmediate.getCall(0).callback();
      expect(global.queueMicrotask).to.have.callCount(150);

      // Verify all microtasks were scheduled
      for (let i = 0; i < 150; i++)
        expect(global.queueMicrotask).to.have.been.calledWith(tasks[i]);
    });
  });

  describe('a task scheduler when setImmediate does not exist', () => {
    const backups = {};

    before(() => {
      backups.setTimeout = global.setTimeout;
      backups.queueMicrotask = global.queueMicrotask;
      backups.setImmediate = global.setImmediate;
      global.setImmediate = undefined;
      global.setTimeout = sinon.spy();
      global.queueMicrotask = sinon.spy();
    });

    after(() => {
      global.setTimeout = backups.setTimeout;
      global.queueMicrotask = backups.queueMicrotask;
      global.setImmediate = backups.setImmediate;
      delete global.window;
    });

    it('alternates between setTimeout and queueMicrotask', () => {
      // Perform 100 calls
      const taskScheduler = createTaskScheduler();
      const tasks = [];
      for (let i = 0; i < 100; i++) {
        tasks[i] = sinon.spy();
        taskScheduler(tasks[i]);
      }

      // 99 calls should have gone to queueMicrotask, 1 to setTimeout
      expect(global.setTimeout).to.have.callCount(1);
      expect(global.queueMicrotask).to.have.callCount(99);

      // When the setTimeout callback is invoked, the final call should to through
      global.setTimeout.getCall(0).args[0]();
      expect(global.queueMicrotask).to.have.callCount(100);

      // Verify all microtasks were scheduled
      for (let i = 0; i < 100; i++)
        expect(global.queueMicrotask).to.have.been.calledWith(tasks[i]);
    });
  });

  describe('a task scheduler when queueMicrotask is unavailable', () => {
    const backups = {};

    before(() => {
      backups.queueMicrotask = global.queueMicrotask;
      delete global.queueMicrotask;
    });

    after(() => {
      global.queueMicrotask = backups.queueMicrotask;
    });

    it('can schedule a task', done => {
      const taskScheduler = createTaskScheduler();
      taskScheduler(done);
    });
  });
});
