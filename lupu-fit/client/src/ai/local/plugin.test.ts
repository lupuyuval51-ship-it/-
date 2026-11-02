import { describe, expect, it } from 'vitest';
import { makeCapacitorLocalAi, reasonCodeOf, webStub } from './plugin.ts';
import { baseStatus } from './mockPlugin.ts';

describe('web stub', () => {
  it('is unsupported with the "Android app only" reason and never throws on status/abort', async () => {
    const s = await webStub.status();
    expect(s).toMatchObject({ supported: false, installed: false, reason: 'Android app only', reasonCode: 'platform' });
    await expect(webStub.abort()).resolves.toBeUndefined();
    await expect(webStub.generate({ system: '', messages: [], maxTokens: 1, json: false, stream: false, requestId: 'x' })).rejects.toMatchObject({ code: 'unsupported' });
    await expect(webStub.download({ url: '', sha256: '', sizeBytes: 0, wifiOnly: true })).rejects.toMatchObject({ code: 'unsupported' });
    expect(webStub.onProgress(() => undefined)()).toBeUndefined();
  });
});

describe('capacitor wrapper', () => {
  const { reasonCode: _r, ...raw } = baseStatus({ supported: false, reason: 'Not enough memory: 3.7 GB found, about 6 GB needed.' });
  it('maps native reasons to codes and native rejections to LocalAiError codes', async () => {
    const native = {
      status: () => Promise.resolve(raw), download: () => Promise.reject({ code: 'sha_mismatch', message: 'bad' }), cancelDownload: () => Promise.resolve(), delete: () => Promise.resolve(raw),
      generate: () => Promise.reject({ code: 'timeout' }), abort: () => Promise.resolve(),
      addListener: () => Promise.resolve({ remove: () => Promise.resolve() }),
    };
    const ai = makeCapacitorLocalAi(native as never);
    expect((await ai.status()).reasonCode).toBe('ram');
    await expect(ai.download({ url: 'https://x', sha256: 'a', sizeBytes: 1, wifiOnly: true })).rejects.toMatchObject({ code: 'sha_mismatch' });
    await expect(ai.generate({ system: '', messages: [], maxTokens: 1, json: false, stream: false, requestId: 'x' })).rejects.toMatchObject({ code: 'timeout' });
    const off = ai.onProgress(() => undefined); off();
  });
  it('reasonCodeOf', () => { expect(reasonCodeOf('')).toBe(''); expect(reasonCodeOf('This phone is not a 64-bit ARM device')).toBe('abi'); expect(reasonCodeOf('The runtime cannot load')).toBe('runtime'); });
});
