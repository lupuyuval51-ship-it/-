/** `installNative`: the Android parts load only inside the app, and a failure never stops the app. */
import { afterEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ loaded: vi.fn(), install: vi.fn(async (_o: unknown) => undefined) }));
vi.mock('../../platform/native', () => {
  h.loaded();
  return { installNativePlatform: h.install };
});

const { installNative } = await import('./start');
const navigate = vi.fn();

afterEach(() => {
  delete (globalThis as { Capacitor?: unknown }).Capacitor;
  vi.restoreAllMocks();
});

describe('installNative', () => {
  it('in a browser: loads no Capacitor code and does nothing', async () => {
    await expect(installNative({ navigate })).resolves.toBeUndefined();
    expect(h.loaded).not.toHaveBeenCalled();
    expect(h.install).not.toHaveBeenCalled();
  });

  it('in the Android app: installs the native platform with the router’s navigate', async () => {
    (globalThis as { Capacitor?: unknown }).Capacitor = { isNativePlatform: () => true };
    await installNative({ navigate });
    expect(h.loaded).toHaveBeenCalled();
    expect(h.install).toHaveBeenCalledWith({ navigate });
  });

  it('keeps the app running (web implementations) when the native part fails', async () => {
    (globalThis as { Capacitor?: unknown }).Capacitor = { isNativePlatform: () => true };
    h.install.mockRejectedValueOnce(new Error('plugin not implemented'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(installNative({ navigate })).resolves.toBeUndefined();
    expect(error).toHaveBeenCalled();
  });
});
