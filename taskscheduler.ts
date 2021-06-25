const resolved = Promise.resolve(undefined);

// Returns a function that asynchronously schedules a task
export default function createTaskScheduler() : TaskScheduler {
  // Use or create a microtask scheduler
  const scheduleMicrotask = typeof queueMicrotask === 'function' ?
    queueMicrotask : (task: Task) => resolved.then(task);

  // Use or create a macrotask scheduler
  const scheduleMacrotask = typeof setImmediate === 'function' ?
    setImmediate : (task: Task) => setTimeout(task, 0);

  // Alternate with macrotask scheduler to avoid freezing
  let i = 0;
  return (task: Task) => {
    if (++i < 100)
      scheduleMicrotask(task);
    else {
      i = 0;
      scheduleMacrotask(task);
    }
  }
}

export type Task = () => void;
export type TaskScheduler = (task: Task) => void;
