
const resolved = Promise.resolve(undefined);

// Returns a function that asynchronously schedules a task
export function createTaskScheduler(scheduleMacrotask: TaskScheduler) : TaskScheduler {
  // Use or create a microtask scheduler
  const scheduleMicrotask = typeof queueMicrotask === 'function' ?
    queueMicrotask : (task: Task) => resolved.then(task);

  // Interrupt with a macrotask every once in a while to avoid freezing
  let i = 0;
  let queue: Task[] | null = null;
  return (task: Task) => {
    // Tasks are currently being queued to avoid freezing
    if (queue !== null)
      queue.push(task);
    // Tasks are being scheduled normally as microtasks
    else if (++i < 100)
      scheduleMicrotask(task);
    // A macrotask interruption is needed
    else {
      // Hold all tasks in a queue, and reschedule them after a macrotask
      queue = [ task ];
      scheduleMacrotask(() => {
        // Work through the queue
        for (const queued of queue!)
          scheduleMicrotask(queued);
        queue = null;
        // Reset the interruption schedule
        i = 0;
      });
    }
  }
}

export type Task = () => void;
export type TaskScheduler = (task: Task) => void;
