/**
 * `node:util` for device mode: only `promisify` (lib/crypto.ts wraps `crypto.scrypt` with it).
 * Honours `util.promisify.custom` like Node, using the same registered symbol.
 */
type Callback = (err: unknown, ...values: unknown[]) => void;
type CallbackFn = (...args: [...unknown[], Callback]) => void;

const custom: unique symbol = Symbol.for('nodejs.util.promisify.custom') as never;

export function promisify<T = unknown>(fn: CallbackFn): (...args: unknown[]) => Promise<T> {
  if (typeof fn !== 'function') throw new TypeError('The "original" argument must be of type function');
  const own = (fn as unknown as Record<symbol, unknown>)[custom];
  if (typeof own === 'function') return own as (...args: unknown[]) => Promise<T>;
  return function (this: unknown, ...args: unknown[]) {
    return new Promise<T>((resolve, reject) => {
      fn.call(this, ...args, (err: unknown, value?: unknown) => (err ? reject(err) : resolve(value as T)));
    });
  };
}
promisify.custom = custom;

const util = { promisify };
export default util;
