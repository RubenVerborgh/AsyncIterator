import { TaskScheduler, createTaskScheduler, Task } from "./createTaskScheduler";

export let taskScheduler: TaskScheduler = createTaskScheduler();

/** Schedules the given task for asynchronous execution. */
export function scheduleTask(task: Task): void {
  taskScheduler(task);
}

/** Returns the asynchronous task scheduler. */
export function getTaskScheduler(): TaskScheduler {
  return taskScheduler;
}

// TODO: Fix the fact that this doesn't override the exported taskScheduler
/** Sets the asynchronous task scheduler. */
export function setTaskScheduler(scheduler: TaskScheduler): void {
  taskScheduler = scheduler;
}
