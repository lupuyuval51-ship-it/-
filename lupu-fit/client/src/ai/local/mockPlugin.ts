import { LocalAiError, type DownloadProgress, type GenerateOptions, type GenerateResult, type LocalAi, type LocalStatus } from './types.ts';

/** In-memory LocalAi used by the unit tests (no device needed). */
export const baseStatus = (o: Partial<LocalStatus> = {}): LocalStatus => ({ installed: false, sizeBytes: 0, partialBytes: 0, modelId: '', backend: 'cpu', supported: true, reason: '', reasonCode: '', freeBytes: 20e9, totalRamBytes: 8e9, downloading: false, loaded: false, ...o });

export interface MockLocalAi extends LocalAi {
  st: LocalStatus;
  calls: { generate: GenerateOptions[]; abort: number; download: number; cancel: number };
  emitProgress(p: DownloadProgress): void;
  emitToken(requestId: string, text: string): void;
  /** Next generate() behaviour. */
  onGenerate: (o: GenerateOptions, ai: MockLocalAi) => Promise<GenerateResult>;
  onDownload: () => Promise<void>;
}

export function makeMock(st: Partial<LocalStatus> = {}): MockLocalAi {
  const prog = new Set<(p: DownloadProgress) => void>(); const tok = new Set<(e: { requestId: string; text: string }) => void>();
  const m: MockLocalAi = {
    native: true, st: baseStatus(st),
    calls: { generate: [], abort: 0, download: 0, cancel: 0 },
    emitProgress: (p) => prog.forEach((f) => f(p)),
    emitToken: (requestId, text) => tok.forEach((f) => f({ requestId, text })),
    onGenerate: (o, ai) => { ai.emitToken(o.requestId, 'x'); return Promise.resolve({ text: 'local answer', backend: 'cpu', firstTokenMs: 5, truncated: false }); },
    onDownload: () => Promise.resolve(),
    status: () => Promise.resolve({ ...m.st }),
    download: async () => { m.calls.download++; await m.onDownload(); m.st = { ...m.st, installed: true, sizeBytes: 2_588_147_712 }; return { ...m.st }; },
    cancelDownload: () => { m.calls.cancel++; return Promise.resolve(); },
    delete: () => { m.st = { ...m.st, installed: false, sizeBytes: 0, partialBytes: 0 }; return Promise.resolve({ ...m.st }); },
    generate: (o) => { m.calls.generate.push(o); return m.onGenerate(o, m); },
    abort: () => { m.calls.abort++; return Promise.resolve(); },
    onProgress: (cb) => { prog.add(cb); return () => { prog.delete(cb); }; },
    onToken: (cb) => { tok.add(cb); return () => { tok.delete(cb); }; },
  };
  return m;
}
export const failWith = (code: string) => (): Promise<GenerateResult> => Promise.reject(new LocalAiError(code));
