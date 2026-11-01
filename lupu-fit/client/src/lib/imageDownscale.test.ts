import { afterEach, describe, expect, it, vi } from 'vitest';
import { downscaleToJpegBase64, fitWithin, MAX_SIDE, stripDataUrl } from './imageDownscale.ts';

describe('fitWithin', () => {
  it('scales the longest side to 1280 and keeps the aspect ratio', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1280, height: 960 });
    expect(fitWithin(3000, 4000)).toEqual({ width: 960, height: 1280 });
    expect(fitWithin(2560, 2560)).toEqual({ width: 1280, height: 1280 });
  });
  it('never upscales', () => { expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 }); expect(fitWithin(1280, 1280)).toEqual({ width: 1280, height: 1280 }); });
  it('never produces a zero side for extreme ratios and rejects empty sizes', () => {
    expect(fitWithin(20000, 3).height).toBeGreaterThanOrEqual(1);
    expect(fitWithin(0, 100)).toEqual({ width: 0, height: 0 });
  });
  it('strips the data URL prefix', () => { expect(stripDataUrl('data:image/jpeg;base64,QUJD')).toBe('QUJD'); });
});

describe('downscaleToJpegBase64', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
  it('draws at the fitted size and returns bare base64 JPEG', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 4000, height: 2000, close })));
    const drawImage = vi.fn();
    const canvas = { width: 0, height: 0, getContext: () => ({ drawImage }), toDataURL: vi.fn(() => 'data:image/jpeg;base64,AAAA') };
    vi.spyOn(document, 'createElement').mockReturnValue(canvas as unknown as HTMLElement);
    const out = await downscaleToJpegBase64(new Blob(['x'], { type: 'image/png' }));
    expect(out).toBe('AAAA');
    expect(canvas.width).toBe(MAX_SIDE); expect(canvas.height).toBe(640);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1280, 640);
    expect(canvas.toDataURL).toHaveBeenCalledWith('image/jpeg', expect.any(Number));
    expect(close).toHaveBeenCalled();
  });
});
