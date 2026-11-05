import { QueryClient } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PROFILE, renderWith } from '../components/nutrition/testHarness.tsx';

const h = vi.hoisted(() => ({ schedule: vi.fn(async (_o: unknown) => ({ notifications: [] })), cancel: vi.fn(async (_o: unknown) => undefined), pending: [{ id: 101 }, { id: 306 }] }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    checkPermissions: async () => ({ display: 'granted' }), requestPermissions: vi.fn(), schedule: h.schedule, cancel: h.cancel, getPending: async () => ({ notifications: h.pending }),
    createChannel: vi.fn(async () => undefined), addListener: async () => ({ remove: async () => undefined }),
  },
}));
const { api, setTransport } = await import('../api/client.ts');
const { AutomationRuntime } = await import('./runtime.tsx');
const { saveSettings, DEFAULT_SETTINGS } = await import('./settings.ts');

const me = (id: string) => ({ user: { id, username: id, role: 'user' }, csrfToken: 'c', onboarded: true, mode: 'hosted' });
let signedAs = 'A';
beforeEach(() => {
  localStorage.clear(); vi.clearAllMocks(); signedAs = 'A';
  setTransport({ request: async (r) => {
    if (r.path === '/api/auth/logout') return { status: 200, body: { ok: true }, headers: {} };
    if (r.path === '/api/auth/login') return { status: 200, body: me(signedAs), headers: {} };
    if (r.path === '/api/auth/me') return { status: 200, body: me(signedAs), headers: {} };
    if (r.path === '/api/profile') return { status: 200, body: { profile: { ...PROFILE, daysPerWeek: 3 }, targets: {} }, headers: {} };
    if (r.path === '/api/sessions') return { status: 200, body: { sessions: [] }, headers: {} };
    return { status: 200, body: { session: null }, headers: {} };
  } });
});

describe('AutomationRuntime and the API layer', () => {
  it('a logout cancels the pending reminders at once, without waiting for any query to refresh', async () => {
    saveSettings('A', { ...DEFAULT_SETTINGS, workout: { on: true, time: '18:00', days: [1] } });
    renderWith(<><AutomationRuntime /><Routes><Route path="*" element={<div>{'screen'}</div>} /></Routes></>, { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) });
    await waitFor(() => expect(h.schedule).toHaveBeenCalled());
    h.cancel.mockClear();
    await api.post('/api/auth/logout');
    await waitFor(() => expect(h.cancel).toHaveBeenCalledWith({ notifications: [{ id: 101 }, { id: 306 }] }));
  });

  it("another person signing in cancels the previous person's reminders", async () => {
    saveSettings('A', { ...DEFAULT_SETTINGS, workout: { on: true, time: '18:00', days: [1] } });
    renderWith(<><AutomationRuntime /><Routes><Route path="*" element={<div>{'screen'}</div>} /></Routes></>, { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) });
    await waitFor(() => expect(h.schedule).toHaveBeenCalled());
    h.cancel.mockClear(); signedAs = 'B';
    await api.post('/api/auth/login', { username: 'b', password: 'x' });
    await waitFor(() => expect(h.cancel).toHaveBeenCalled());
  });
});
