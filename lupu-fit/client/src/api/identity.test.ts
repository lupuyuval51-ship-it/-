import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiRequestError, getCurrentUserId, NetworkError, onUserChange, setTransport, type UserChange } from './client.ts';
import { wipeUserLocalState } from '../lib/userState.ts';
import { SPORT_STORE } from '../lib/workoutCompose.ts';
import type { Transport, TransportRequest, TransportResponse } from './transport.ts';

type Reply = (r: TransportRequest) => TransportResponse | Error;
const ok = (body: unknown, status = 200): TransportResponse => ({ status, body, headers: {} });
let reply: Reply = () => ok({});
const transport: Transport = { request: async (r) => { const out = reply(r); if (out instanceof Error) throw out; return out; } };
const events: UserChange[] = [];
let unsub: () => void;

const PER_PERSON = ['lf_live_session', 'lf_live_age_bucket', 'lf_auto_checkin_seen', 'lf_auto_backup', 'lf_onboarding_draft', 'lf_shop_checked_v1', 'lf_menu_mealcount', 'lf_rest_s1', 'lf_menu_v1_2026-11-02', SPORT_STORE];
const DEVICE_LEVEL = ['lf_lang', 'lf_theme', 'lf_username', 'lf_video_wifi_only', 'lf_ready_filter', 'lf_automation_v1:A'];
const fill = (): void => { for (const k of [...PER_PERSON, ...DEVICE_LEVEL]) localStorage.setItem(k, 'x'); };
const left = (keys: string[]): string[] => keys.filter((k) => localStorage.getItem(k) !== null);
const asUser = (id: string) => ok({ user: { id, username: id, role: 'user' }, csrfToken: 'c', onboarded: true, mode: 'hosted' });

beforeEach(async () => {
  localStorage.clear(); events.length = 0; unsub?.(); unsub = onUserChange((e) => events.push(e)); setTransport(transport);
  reply = (r) => (r.path === '/api/auth/logout' ? ok({ ok: true }) : r.path === '/api/auth/me' ? ok({ error: 'unauthorized' }, 401) : ok({}));
  await api.get('/api/auth/me').catch(() => undefined); // known state: nobody signed in
  events.length = 0; localStorage.clear();
});

describe('per-person local data', () => {
  it('the wipe list covers exactly the per-person keys (and the sport key matches the real constant)', () => {
    fill(); wipeUserLocalState();
    expect(left(PER_PERSON)).toEqual([]);
    expect(left(DEVICE_LEVEL).sort()).toEqual([...DEVICE_LEVEL].sort());
    expect(SPORT_STORE).toBe('lf_sport');
  });

  it("a different person signing in finds none of the previous person's data", async () => {
    reply = () => asUser('A'); await api.post('/api/auth/login', { username: 'a', password: 'x' });
    fill();
    reply = () => asUser('B'); await api.post('/api/auth/login', { username: 'b', password: 'x' });
    expect(left(PER_PERSON)).toEqual([]);
    expect(left(DEVICE_LEVEL).length).toBe(DEVICE_LEVEL.length);
    expect(getCurrentUserId()).toBe('B');
    expect(events.at(-1)).toMatchObject({ from: 'A', to: 'B', reason: 'switch' });
  });

  it('the same person signing in again keeps their data', async () => {
    reply = () => asUser('A'); await api.post('/api/auth/login', { username: 'a', password: 'x' });
    fill(); await api.post('/api/auth/login', { username: 'a', password: 'x' });
    expect(left(PER_PERSON).length).toBe(PER_PERSON.length);
  });

  it('a /me answer for a different person than the one last seen on this device wipes too (session expired, then someone else opens the app)', async () => {
    reply = () => asUser('A'); await api.get('/api/auth/me');
    reply = () => ok({ error: 'unauthorized' }, 401); await api.get('/api/auth/me').catch(() => undefined);
    fill();
    reply = () => asUser('B'); await api.get('/api/auth/me');
    expect(left(PER_PERSON)).toEqual([]);
  });

  it('logout wipes, and a failed logout request (offline) does not', async () => {
    reply = () => asUser('A'); await api.get('/api/auth/me'); fill();
    reply = () => new NetworkError(); await expect(api.post('/api/auth/logout')).rejects.toBeInstanceOf(NetworkError);
    expect(left(PER_PERSON).length).toBe(PER_PERSON.length); expect(getCurrentUserId()).toBe('A');
    reply = () => ok({ ok: true }); await api.post('/api/auth/logout');
    expect(left(PER_PERSON)).toEqual([]); expect(getCurrentUserId()).toBeNull();
    expect(events.at(-1)).toMatchObject({ from: 'A', to: null, reason: 'signout' });
  });

  it('an expired session (401) stops the current user but wipes nothing', async () => {
    reply = () => asUser('A'); await api.get('/api/auth/me'); fill();
    reply = () => ok({ error: 'unauthorized' }, 401);
    await expect(api.get('/api/auth/me')).rejects.toBeInstanceOf(ApiRequestError);
    expect(getCurrentUserId()).toBeNull(); expect(left(PER_PERSON).length).toBe(PER_PERSON.length);
  });

  it('account deletion wipes and forgets the person', async () => {
    reply = () => asUser('A'); await api.get('/api/auth/me'); fill();
    reply = () => ok({ ok: true }); await api.delete('/api/account', { confirm: 'DELETE' });
    expect(left(PER_PERSON)).toEqual([]); expect(localStorage.getItem('lf_last_uid')).toBeNull();
    expect(events.at(-1)).toMatchObject({ from: 'A', to: null, reason: 'deleted' });
  });

  it('a listener that throws does not break the request', async () => {
    const bad = vi.fn(() => { throw new Error('boom'); }); const off = onUserChange(bad);
    reply = () => asUser('A'); await expect(api.get('/api/auth/me')).resolves.toBeTruthy(); expect(bad).toHaveBeenCalled(); off();
  });
});
