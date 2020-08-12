import {
  scheduleTask,
  getTaskScheduler,
  setTaskScheduler,
} from '../dist/asynciterator.js';

import createTaskScheduler from '../dist/taskscheduler.js';

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

  describe('a task scheduler for the browser', () => {
    const backups = {};

    before(() => {
      backups.setTimeout = global.setTimeout;
      backups.queueMicrotask = global.queueMicrotask;
      global.window = {};
      global.setTimeout = sinon.spy();
      global.queueMicrotask = sinon.spy();
    });

    after(() => {
      global.setTimeout = backups.setTimeout;
      global.queueMicrotask = backups.queueMicrotask;
      delete global.window;
    });

    it('alternates between setTimeout and queueMicrotask', () => {
      const taskScheduler = createTaskScheduler();
      const task = sinon.spy();
      for (let i = 0; i < 100; i++)
        taskScheduler(task);
      expect(global.setTimeout).to.have.callCount(1);
      expect(global.queueMicrotask).to.have.callCount(99);
      expect(global.setTimeout).to.have.been.calledWith(task, 0);
      expect(global.queueMicrotask).to.have.been.calledWith(task);
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
