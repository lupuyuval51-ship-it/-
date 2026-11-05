import 'fake-indexeddb/auto';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mode = vi.hoisted(() => ({ device: false }));
vi.mock('../env.ts', async (orig) => { const real = await orig<typeof import('../env.ts')>(); return { ...real, get IS_DEVICE() { return mode.device; } }; });
const { useApiReachable } = await import('./reachable.ts');

afterEach(() => { vi.restoreAllMocks(); mode.device = false; });

describe('useApiReachable', () => {
  it('hosted: follows the browser connection', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(renderHook(() => useApiReachable()).result.current).toBe(false);
  });
  it('Device Mode: the API is on the phone, so it is reachable offline too (no "will sync" strip)', () => {
    mode.device = true;
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(renderHook(() => useApiReachable()).result.current).toBe(true);
  });
});
