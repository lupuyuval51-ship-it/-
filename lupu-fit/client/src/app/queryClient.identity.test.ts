import { describe, expect, it } from 'vitest';
import { api, setTransport } from '../api/client.ts';
import { makeQueryClient } from './App.tsx';

const me = (id: string) => ({ status: 200, body: { user: { id, username: id, role: 'user' }, csrfToken: 'c', onboarded: true, mode: 'hosted' }, headers: {} });

describe('query cache and the person who is signed in', () => {
  it('the first /api/auth/me of a device is never cancelled by the identity hook (the app would sit on "Loading" forever)', async () => {
    localStorage.clear();
    const qc = makeQueryClient();
    setTransport({ request: async () => me('A') });
    const got = await qc.fetchQuery({ queryKey: ['me'], queryFn: () => api.get('/api/auth/me') });
    expect(got).toMatchObject({ user: { id: 'A' } });
    expect(qc.getQueryData(['me'])).toBeTruthy();
  });

  it('a different person signing in empties every cached query except `me`; the same person keeps them', async () => {
    localStorage.clear();
    const qc = makeQueryClient();
    setTransport({ request: async () => me('A') });
    await api.post('/api/auth/login', { username: 'a', password: 'x' });
    qc.setQueryData(['me'], { user: { id: 'A' } }); qc.setQueryData(['profile'], { age: 30 }); qc.setQueryData(['sessions', 'list'], { sessions: [{ id: 'a-workout' }] });
    await api.post('/api/auth/login', { username: 'a', password: 'x' });
    expect(qc.getQueryData(['profile'])).toEqual({ age: 30 });
    setTransport({ request: async () => me('B') });
    await api.post('/api/auth/login', { username: 'b', password: 'x' });
    expect(qc.getQueryData(['profile'])).toBeUndefined();
    expect(qc.getQueryData(['sessions', 'list'])).toBeUndefined();
    expect(qc.getQueryData(['me'])).toEqual({ user: { id: 'A' } }); // the sign-in screen refreshes this one itself
  });
});
