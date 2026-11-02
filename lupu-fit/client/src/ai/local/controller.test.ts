import { beforeEach, describe, expect, it } from 'vitest';
import { downloadBlocker, INITIAL, LocalModelController, reduce, type ModelState } from './controller.ts';
import { readModelConfig } from './modelConfig.ts';
import { baseStatus, makeMock } from './mockPlugin.ts';
import { getLocalEnabled, setLocalEnabled } from './settings.ts';
import { LocalAiError } from './types.ts';

const cfg = readModelConfig({});
beforeEach(() => { localStorage.clear(); });

describe('model state machine', () => {
  it('walks loading -> none -> downloading -> verifying -> installed', () => {
    let s: ModelState = INITIAL;
    s = reduce(s, { t: 'status', s: baseStatus() }); expect(s).toEqual({ k: 'none', partialBytes: 0 });
    s = reduce(s, { t: 'progress', p: { phase: 'downloading', receivedBytes: 10, totalBytes: 100 } }); expect(s).toEqual({ k: 'downloading', received: 10, total: 100 });
    s = reduce(s, { t: 'progress', p: { phase: 'verifying', receivedBytes: 100, totalBytes: 100 } }); expect(s.k).toBe('verifying');
    s = reduce(s, { t: 'status', s: baseStatus({ installed: true, sizeBytes: 100 }) }); expect(s).toEqual({ k: 'installed', sizeBytes: 100 });
  });
  it('errors keep resumable bytes; cancel returns to none; late progress never un-installs', () => {
    let s: ModelState = reduce(INITIAL, { t: 'status', s: baseStatus() });
    s = reduce(s, { t: 'error', code: 'network', partialBytes: 50 }); expect(s).toEqual({ k: 'error', code: 'network', partialBytes: 50 });
    s = reduce(s, { t: 'cancelled', partialBytes: 50 }); expect(s).toEqual({ k: 'none', partialBytes: 50 });
    s = reduce(s, { t: 'status', s: baseStatus({ installed: true, sizeBytes: 9 }) });
    expect(reduce(s, { t: 'progress', p: { phase: 'downloading', receivedBytes: 1, totalBytes: 2 } }).k).toBe('installed');
  });
  it('unsupported devices stay unsupported with a reason code', () => {
    const s = reduce(INITIAL, { t: 'status', s: baseStatus({ supported: false, reason: 'Not enough memory', reasonCode: 'ram' }) });
    expect(s).toEqual({ k: 'unsupported', reason: 'Not enough memory', reasonCode: 'ram' });
    expect(reduce(s, { t: 'progress', p: { phase: 'downloading', receivedBytes: 1, totalBytes: 2 } }).k).toBe('unsupported');
  });
});

describe('downloadBlocker', () => {
  it('platform / unsupported / space / ok', () => {
    expect(downloadBlocker(baseStatus({ supported: false, reasonCode: 'platform' }), cfg)).toBe('platform');
    expect(downloadBlocker(baseStatus({ supported: false, reasonCode: 'ram' }), cfg)).toBe('unsupported');
    expect(downloadBlocker(baseStatus({ freeBytes: cfg.sizeBytes }), cfg)).toBe('space'); // needs size * 1.2
    expect(downloadBlocker(baseStatus({ freeBytes: cfg.sizeBytes, partialBytes: cfg.sizeBytes * 0.3 }), cfg)).toBe(null); // resumable bytes count
    expect(downloadBlocker(baseStatus({ freeBytes: cfg.sizeBytes * 1.3 }), cfg)).toBe(null);
  });
});

describe('LocalModelController', () => {
  it('download enables local AI only after a verified install; delete clears it', async () => {
    const ai = makeMock(); const c = new LocalModelController(ai, cfg); const seen: string[] = [];
    c.subscribe((s) => seen.push(s.k)); await c.refresh();
    ai.onDownload = async () => { ai.emitProgress({ phase: 'downloading', receivedBytes: 5, totalBytes: 10 }); };
    expect(getLocalEnabled()).toBe(false);
    await c.start(true);
    expect(ai.calls.download).toBe(1); expect(getLocalEnabled()).toBe(true);
    expect(seen).toContain('downloading'); expect(c.snapshot.state.k).toBe('installed');
    await c.remove(); expect(getLocalEnabled()).toBe(false); expect(c.snapshot.state.k).toBe('none');
  });
  it('failure keeps partial bytes and does NOT enable local AI; cancel maps to none', async () => {
    const ai = makeMock(); const c = new LocalModelController(ai, cfg); await c.refresh();
    ai.download = () => { ai.st = { ...ai.st, partialBytes: 777 }; return Promise.reject(new LocalAiError('wifi_required')); };
    await c.start(true); expect(c.snapshot.state).toEqual({ k: 'error', code: 'wifi_required', partialBytes: 777 }); expect(getLocalEnabled()).toBe(false);
    ai.download = () => Promise.reject(new LocalAiError('cancelled'));
    await c.start(true); expect(c.snapshot.state).toEqual({ k: 'none', partialBytes: 777 });
  });
  it('passes url, sha256, size and the wifi flag to the plugin and clears a stale enabled flag', async () => {
    const ai = makeMock(); let got: unknown; ai.download = (o) => { got = o; return Promise.reject(new LocalAiError('network')); };
    const c = new LocalModelController(ai, cfg); setLocalEnabled(true); await c.refresh(); expect(getLocalEnabled()).toBe(false);
    await c.start(false); expect(got).toMatchObject({ url: cfg.url, sha256: cfg.sha256, sizeBytes: cfg.sizeBytes, wifiOnly: false });
  });
});

describe('readModelConfig', () => {
  it('defaults to the pinned public model and accepts only a complete https override', () => {
    expect(cfg.url).toContain('/resolve/1caa527c'); expect(cfg.sha256).toHaveLength(64);
    expect(readModelConfig({ VITE_LOCAL_MODEL_URL: 'http://x/y', VITE_LOCAL_MODEL_SHA256: 'a'.repeat(64), VITE_LOCAL_MODEL_SIZE: '5000000' })).toEqual(cfg);
    expect(readModelConfig({ VITE_LOCAL_MODEL_URL: 'https://x/y', VITE_LOCAL_MODEL_SHA256: 'bad', VITE_LOCAL_MODEL_SIZE: '5000000' })).toEqual(cfg);
    expect(readModelConfig({ VITE_LOCAL_MODEL_URL: 'https://x/y', VITE_LOCAL_MODEL_SHA256: 'A'.repeat(64), VITE_LOCAL_MODEL_SIZE: '5000000' })).toMatchObject({ url: 'https://x/y', sha256: 'a'.repeat(64), sizeBytes: 5_000_000 });
  });
});
