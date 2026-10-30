/**
 * Node globals the server code expects, for the device-mode Web Worker: `process` (env, cwd, hrtime,
 * nextTick) and `Buffer`. Existing globals are kept (in Node tests the real ones stay in place).
 * `process.versions.node` stays undefined, so libraries that detect Node (PGlite, Emscripten) keep
 * using their browser code paths.
 *
 * The worker entry must run this before any server module is evaluated: import `./install-globals`
 * as its first import.
 */
import { DeviceBuffer } from './buffer';
import { DEVICE_ENV } from './env';

export interface DeviceProcess {
  env: Record<string, string | undefined>;
  cwd(): string;
  platform: string;
  versions: Record<string, string>;
  argv: string[];
  hrtime: ((prev?: [number, number]) => [number, number]) & { bigint(): bigint };
  nextTick(fn: (...args: unknown[]) => void, ...args: unknown[]): void;
  on(event: string, listener: unknown): DeviceProcess;
  emitWarning(warning: string | Error): void;
  exitCode: number | undefined;
}

function deviceProcess(env: Readonly<Record<string, string>>): DeviceProcess {
  const nowNs = () => BigInt(Math.round(performance.now() * 1e6));
  const hrtime = Object.assign(
    (prev?: [number, number]): [number, number] => {
      const ns = nowNs() - (prev ? BigInt(prev[0]) * 1_000_000_000n + BigInt(prev[1]) : 0n);
      return [Number(ns / 1_000_000_000n), Number(ns % 1_000_000_000n)];
    },
    { bigint: nowNs },
  );
  const proc: DeviceProcess = {
    env: { ...env },
    cwd: () => '/',
    platform: 'browser',
    versions: {},
    argv: [],
    hrtime,
    nextTick: (fn, ...args) => queueMicrotask(() => fn(...args)),
    on: () => proc,
    emitWarning: (warning) => console.warn(warning),
    exitCode: undefined,
  };
  return proc;
}

export function installDeviceGlobals(env: Readonly<Record<string, string>> = DEVICE_ENV): void {
  const g = globalThis as { process?: unknown; Buffer?: unknown };
  g.process ??= deviceProcess(env);
  g.Buffer ??= DeviceBuffer;
}
