import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { LocalAiError, type DownloadOptions, type DownloadProgress, type GenerateOptions, type GenerateResult, type LocalAi, type LocalStatus } from './types.ts';

interface NativeLocalAi {
  status(): Promise<Omit<LocalStatus, 'reasonCode'>>;
  download(o: DownloadOptions): Promise<Omit<LocalStatus, 'reasonCode'>>;
  cancelDownload(): Promise<void>;
  delete(): Promise<Omit<LocalStatus, 'reasonCode'>>;
  generate(o: GenerateOptions): Promise<GenerateResult>;
  abort(): Promise<void>;
  addListener(event: 'downloadProgress', cb: (p: DownloadProgress) => void): Promise<PluginListenerHandle>;
  addListener(event: 'token', cb: (e: { requestId: string; text: string }) => void): Promise<PluginListenerHandle>;
}

const EMPTY: LocalStatus = { installed: false, sizeBytes: 0, partialBytes: 0, modelId: '', backend: '', supported: false, reason: 'Android app only', reasonCode: 'platform', freeBytes: 0, totalRamBytes: 0, downloading: false, loaded: false };

/** Derives a stable reason code from the native text so the UI can show a localized message. */
export function reasonCodeOf(reason: string): LocalStatus['reasonCode'] {
  if (!reason) return '';
  if (/arm64|64-bit/i.test(reason)) return 'abi';
  if (/memory/i.test(reason)) return 'ram';
  return 'runtime';
}
const asStatus = (s: Omit<LocalStatus, 'reasonCode'>): LocalStatus => ({ ...s, reasonCode: reasonCodeOf(s.reason) });
const wrap = async <T,>(p: Promise<T>): Promise<T> => {
  try { return await p; } catch (e) {
    const o = e as { code?: string; message?: string };
    throw new LocalAiError(typeof o.code === 'string' && o.code ? o.code : 'generation_failed', o.message);
  }
};

/** Web / non-Android stub: always unsupported, never throws on status(). */
export const webStub: LocalAi = {
  native: false,
  status: () => Promise.resolve(EMPTY),
  download: () => Promise.reject(new LocalAiError('unsupported', 'Android app only')),
  cancelDownload: () => Promise.resolve(),
  delete: () => Promise.resolve(EMPTY),
  generate: () => Promise.reject(new LocalAiError('unsupported', 'Android app only')),
  abort: () => Promise.resolve(),
  onProgress: () => () => undefined,
  onToken: () => () => undefined,
};

export function makeCapacitorLocalAi(native: NativeLocalAi): LocalAi {
  const listen = <E,>(event: 'downloadProgress' | 'token', cb: (e: E) => void): (() => void) => {
    let handle: PluginListenerHandle | null = null; let dead = false;
    const add = event === 'token' ? native.addListener('token', cb as never) : native.addListener('downloadProgress', cb as never);
    void add.then((h) => { if (dead) void h.remove(); else handle = h; }).catch(() => undefined);
    return () => { dead = true; if (handle) void handle.remove(); };
  };
  return {
    native: true,
    status: async () => asStatus(await wrap(native.status())),
    download: async (o) => asStatus(await wrap(native.download(o))),
    cancelDownload: () => wrap(native.cancelDownload()),
    delete: async () => asStatus(await wrap(native.delete())),
    generate: (o) => wrap(native.generate(o)),
    abort: () => wrap(native.abort()),
    onProgress: (cb) => listen('downloadProgress', cb),
    onToken: (cb) => listen('token', cb),
  };
}

let instance: LocalAi | null = null;
/** The real plugin only inside the Android app; everywhere else the stub (supported=false, "Android app only"). */
export function getLocalAi(): LocalAi {
  if (instance) return instance;
  let native = false;
  try { native = Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalAi'); } catch { native = false; }
  instance = native ? makeCapacitorLocalAi(registerPlugin<NativeLocalAi>('LocalAi')) : webStub;
  return instance;
}
/** Test hook. */
export function setLocalAiForTests(x: LocalAi | null): void { instance = x; }
