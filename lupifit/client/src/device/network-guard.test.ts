/** The device worker's own network policy (the page's meta CSP does not cover the worker). */
import { describe, expect, it, vi } from 'vitest';
import { BlockedRequestError, DEVICE_REMOTE_ORIGINS, installNetworkGuard, isAllowedOrigin, requestOrigin } from './network-guard';
import { DEVICE_CSP } from '../../vite.config';

const BASE = 'https://localhost/assets/device-worker-abc.js';

function fakeScope() {
  const fetch = vi.fn(async (_input: unknown, _init?: unknown) => new Response('ok'));
  const scope = {
    fetch: fetch as unknown as typeof globalThis.fetch,
    location: { href: BASE, origin: 'https://localhost' },
    XMLHttpRequest: class {},
    WebSocket: class {},
    EventSource: class {},
    importScripts: () => undefined,
  };
  installNetworkGuard(scope);
  return { scope, fetch };
}

describe('device network guard', () => {
  it('lets the worker reach its own files and Open Food Facts', async () => {
    const { scope, fetch } = fakeScope();
    await scope.fetch('/assets/pglite.wasm');
    await scope.fetch(new URL('../pg_trgm-x.gz.bin', BASE));
    await scope.fetch('https://world.openfoodfacts.org/api/v2/product/7290000000001.json');
    await scope.fetch(new Request('https://localhost/api/x'));
    await scope.fetch('data:application/octet-stream;base64,AA==');
    expect(fetch).toHaveBeenCalledTimes(5);
  });

  it('refuses every other host before a request is made', async () => {
    const { scope, fetch } = fakeScope();
    for (const url of ['https://api.anthropic.com/v1/messages', 'https://evil.example/collect', 'http://world.openfoodfacts.org/x', 'https://openfoodfacts.org.evil.example/']) {
      await expect(scope.fetch(url)).rejects.toBeInstanceOf(BlockedRequestError);
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it('removes the other ways to reach the network', () => {
    const { scope } = fakeScope();
    expect(() => new (scope.XMLHttpRequest as unknown as new () => unknown)()).toThrow(/device network policy/);
    expect(() => new (scope.WebSocket as unknown as new () => unknown)()).toThrow(/device network policy/);
    expect(() => new (scope.EventSource as unknown as new () => unknown)()).toThrow(/device network policy/);
    expect(() => (scope.importScripts as () => void)()).toThrow(/device network policy/);
  });

  it('allows exactly the hosts in the page CSP connect-src', () => {
    const connect = DEVICE_CSP.split('; ').find((d) => d.startsWith('connect-src '))!.split(' ').slice(1);
    expect(connect.filter((s) => s !== "'self'")).toEqual([...DEVICE_REMOTE_ORIGINS]);
    expect(isAllowedOrigin(requestOrigin('x', BASE), 'https://localhost')).toBe(true);
    expect(isAllowedOrigin(null, 'https://localhost')).toBe(false);
  });
});
