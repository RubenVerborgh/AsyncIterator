const resolved = Promise.resolve(undefined);

// Returns a function that asynchronously schedules a task
export default function createTaskScheduler() : TaskScheduler {
  // Use or create a microtask scheduler
  const scheduleMicrotask = typeof queueMicrotask === 'function' ?
    queueMicrotask : (task: Task) => resolved.then(task);

  // If not in the browser, always use the microtask scheduler
  if (typeof window === 'undefined')
    return scheduleMicrotask;

  // In the browser, alternate with setTimeout to avoid freezing
  let i = 0;
  return (task: Task) => {
    if (++i < 100)
      scheduleMicrotask(task);
    else
      setTimeout(task, i = 0);
  }
}

export type Task = () => void;
export type TaskScheduler = (task: Task) => void;
