import {
  scheduleTask,
  getTaskScheduler,
  setTaskScheduler,
} from '../asynciterator.mjs';

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
});
