/**
 * Device worker entry (a module Web Worker started by the app page in device mode).
 *
 * 1. Waits for the page's `init` message (what a new device account is created with).
 * 2. Takes the Web Lock `lupufit-device-db` for its whole life, so only one copy of the database is ever
 *    open on this device. If another tab/window holds it, the page is told (`locked`) and this worker
 *    keeps waiting: when the other copy closes, it continues by itself. A reload briefly overlaps the old
 *    page's worker, so the lock is first awaited for a moment before `locked` is reported.
 * 3. Loads the server (a separate chunk, so a locked or unsupported copy never downloads it), boots it
 *    and answers requests. Requests that arrive while it boots wait.
 */
import { DEVICE_ENV } from '../env';
import { DEVICE_LOCK, type BootState, type BootStep, type EraseMessage, type InitMessage, type PageMessage, type RequestMessage, type WorkerMessage } from './protocol';
import type { DeviceRuntime } from './runtime';
import { deleteDeviceStorage, idbDataDir } from './storage';

/** The dedicated worker scope (the client tsconfig has the DOM lib, not the webworker one). */
const scope = self as unknown as {
  postMessage(message: WorkerMessage, transfer: Transferable[]): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<PageMessage>) => void): void;
};

const RELOAD_GRACE_MS = 1500;

const post = (message: WorkerMessage, transfer: Transferable[] = []) => scope.postMessage(message, transfer);
let current: BootState = { state: 'booting', step: 'database', firstLaunch: false };
const steps: Partial<Record<BootStep, number>> = {};
let stepStarted: { step: BootStep; at: number } | null = null;
const endStep = () => {
  if (stepStarted) steps[stepStarted.step] = Math.round((steps[stepStarted.step] ?? 0) + performance.now() - stepStarted.at);
  stepStarted = null;
};
const report = (boot: BootState) => {
  if (boot.state === 'booting' && stepStarted?.step !== boot.step) {
    endStep();
    stepStarted = { step: boot.step, at: performance.now() };
  } else if (boot.state !== 'booting') endStep();
  current = boot;
  post({ type: 'state', boot });
};

let init: InitMessage | null = null;
let gotInit!: (msg: InitMessage) => void;
const initReceived = new Promise<InitMessage>((resolve) => (gotInit = resolve));
let runtime: Promise<DeviceRuntime> | null = null;

async function answer(msg: RequestMessage): Promise<void> {
  try {
    if (!runtime) throw new Error('The device database is not open');
    const rt = await runtime;
    const res = await rt.handle({ method: msg.method, url: msg.url, headers: msg.headers, body: msg.body });
    post({ type: 'response', id: msg.id, status: res.status, headers: res.headers, body: res.body });
  } catch (err) {
    post({ type: 'request-failed', id: msg.id, message: err instanceof Error ? err.message : String(err) });
  }
}

const pending: RequestMessage[] = [];

const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));

/** The stored database, deleted while this worker holds the lock and nothing has it open. */
async function deleteStorage(): Promise<void> {
  const dataDir = idbDataDir(DEVICE_ENV.DATABASE_URL ?? '');
  if (dataDir) await deleteDeviceStorage(dataDir);
}

async function erase(msg: EraseMessage): Promise<void> {
  try {
    if (runtime) await (await runtime).erase();
    // Not started (another tab has it open, or the start failed): there is no open copy here to close.
    else throw new Error('The device database is not open here');
    post({ type: 'erased', id: msg.id, ok: true });
  } catch (err) {
    post({ type: 'erased', id: msg.id, ok: false, message: errorText(err) });
  }
}

scope.addEventListener('message', (event) => {
  const msg = event.data;
  if (msg?.type === 'init') {
    if (!init) {
      init = msg;
      gotInit(msg);
    }
    post({ type: 'state', boot: current });
    return;
  }
  if (msg?.type === 'request') {
    if (runtime) void answer(msg);
    else pending.push(msg);
  }
  if (msg?.type === 'erase') void erase(msg);
});

function unsupported(): string | null {
  if (typeof WebAssembly !== 'object') return 'WebAssembly is not available';
  if (typeof indexedDB === 'undefined') return 'IndexedDB is not available';
  if (!navigator.locks) return 'Web Locks are not available';
  return null;
}

async function holdLockAndRun(): Promise<void> {
  const missing = unsupported();
  if (missing) {
    report({ state: 'failed', reason: 'unsupported', detail: missing });
    return;
  }
  const run = async () => {
    const started = performance.now();
    report({ state: 'booting', step: 'database', firstLaunch: false });
    const message = await initReceived;
    if (message.erase) {
      // An erase the last session asked for but could not finish: nothing is open yet, so delete now.
      try {
        await deleteStorage();
        post({ type: 'erased', id: 0, ok: true });
      } catch (err) {
        post({ type: 'erased', id: 0, ok: false, message: errorText(err) });
        report({ state: 'failed', reason: 'storage', detail: errorText(err) });
        return;
      }
    }
    runtime = import('./runtime').then(({ bootDeviceRuntime }) =>
      bootDeviceRuntime(report, () => message.account),
    );
    for (const msg of pending.splice(0)) void answer(msg);
    try {
      await runtime;
      endStep();
      report({ state: 'ready', bootMs: Math.round(performance.now() - started), steps: { ...steps } });
    } catch (err) {
      const { classifyBootError } = await import('./runtime').catch(() => ({ classifyBootError: null }));
      const failure = classifyBootError
        ? classifyBootError(err)
        : { reason: 'unknown' as const, detail: err instanceof Error ? err.message : String(err) };
      console.error('[device] start failed', failure.detail);
      report({ state: 'failed', ...failure });
      return; // releases the lock: nothing is open
    }
    // Hold the lock (and the database) for the life of this worker.
    await new Promise<never>(() => undefined);
  };

  // A reload overlaps the old page's worker for a moment: wait briefly before telling the page.
  const quick = await navigator.locks
    .request(DEVICE_LOCK, { signal: AbortSignal.timeout(RELOAD_GRACE_MS) }, run)
    .then(() => true)
    .catch((err: unknown) => {
      if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) return false;
      throw err;
    });
  if (quick) return;
  report({ state: 'locked' });
  await navigator.locks.request(DEVICE_LOCK, run);
}

holdLockAndRun().catch((err: unknown) => {
  report({ state: 'failed', reason: 'unknown', detail: err instanceof Error ? err.message : String(err) });
});
