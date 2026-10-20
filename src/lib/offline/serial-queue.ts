/**
 * Runs async tasks one after another. The native billing plugin keeps ONE billing client for all its calls and every call
 * closes the previous one, so two calls at the same time cut each other off (a cut-off purchase query comes back as an empty
 * list). A task that has not finished after its slot stops holding the line up (it keeps running and its own caller still
 * gets its result), so one lost answer from the plugin can never block everything behind it for good.
 */
export function createSerialQueue(defaultSlotMs: number) {
  let tail: Promise<void> = Promise.resolve();
  return function inLine<T>(task: () => Promise<T>, slotMs: number = defaultSlotMs): Promise<T> {
    const prev = tail;
    const result = prev.then(task);
    // `tail` never rejects: it only settles when the task has (or when its slot is over)
    tail = prev.then(() => new Promise<void>((release) => {
      const timer = setTimeout(release, slotMs);
      const done = () => { clearTimeout(timer); release(); };
      result.then(done, done);
    }));
    return result;
  };
}
