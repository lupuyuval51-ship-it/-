import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { config } from '../src/config';
import { db } from '../src/db/pool';
import { setMailTransport, type MailMessage } from '../src/lib/mailer';
import { resetRateLimits } from '../src/middleware/rateLimit';
import { TestClient, registerUser, startTestServer, uniqueEmail, type TestServer } from './helpers/server';

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});
afterAll(async () => {
  await server.close();
  await db.close();
});

describe('registration', () => {
  it('creates an account, sets an HttpOnly session cookie and returns a CSRF token', async () => {
    const client = new TestClient(server.baseUrl);
    const email = uniqueEmail('Reg');
    const res = await client.post('/api/auth/register', { email, password: 'Secret123', displayName: 'Dana', locale: 'he', timezone: 'Asia/Jerusalem' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email.toLowerCase());
    expect(res.body.user.locale).toBe('he');
    expect(res.body.user.onboardingCompleted).toBe(false);
    expect(typeof res.body.csrfToken).toBe('string');
    const cookie = res.headers.getSetCookie().find((c) => c.includes('fitai_session'))!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    const me = await client.get('/api/auth/me');
    expect(me.body.user.id).toBe(res.body.user.id);
    const stored = await db.one<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = $1', [res.body.user.id]);
    expect(stored.password_hash.startsWith('scrypt$')).toBe(true);
    expect(stored.password_hash).not.toContain('Secret123');
  });

  it('rejects duplicate emails case-insensitively', async () => {
    const email = uniqueEmail('dup');
    await registerUser(server.baseUrl, { email });
    const again = await new TestClient(server.baseUrl).post('/api/auth/register', { email: email.toUpperCase(), password: 'Secret123', displayName: 'X' });
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('email_taken');
  });

  it('validates input', async () => {
    const c = new TestClient(server.baseUrl);
    const weak = await c.post('/api/auth/register', { email: uniqueEmail(), password: 'short', displayName: 'X' });
    expect(weak.status).toBe(400);
    expect(weak.body.error.code).toBe('validation_error');
    const noDigit = await c.post('/api/auth/register', { email: uniqueEmail(), password: 'onlyletters', displayName: 'X' });
    expect(noDigit.status).toBe(400);
    const badEmail = await c.post('/api/auth/register', { email: 'not-an-email', password: 'Secret123', displayName: 'X' });
    expect(badEmail.status).toBe(400);
    const badJson = await c.request('POST', '/api/auth/register', undefined, { rawBody: '{bad json' });
    expect(badJson.status).toBe(400);
    expect(badJson.body.error.code).toBe('invalid_json');
  });
});

describe('week start', () => {
  it('is fixed at registration from the language and not moved by a later language change', async () => {
    const he = await registerUser(server.baseUrl, { locale: 'he' });
    const en = await registerUser(server.baseUrl, { locale: 'en' });
    const weekStart = async (id: string) => (await db.one<{ week_start: number }>('SELECT week_start FROM users WHERE id = $1', [id])).week_start;
    expect(await weekStart(he.userId!)).toBe(0);
    expect(await weekStart(en.userId!)).toBe(1);
    const res = await he.patch('/api/settings', { locale: 'en' });
    expect(res.status).toBe(200);
    expect(await weekStart(he.userId!)).toBe(0);
  });
});

describe('login / logout', () => {
  it('logs in with correct credentials and rejects wrong ones generically', async () => {
    const email = uniqueEmail('login');
    await registerUser(server.baseUrl, { email, password: 'Correct123' });
    const c = new TestClient(server.baseUrl);
    const wrong = await c.post('/api/auth/login', { email, password: 'Wrong1234' });
    expect(wrong.status).toBe(401);
    expect(wrong.body.error.code).toBe('invalid_credentials');
    const unknown = await c.post('/api/auth/login', { email: uniqueEmail('nobody'), password: 'Wrong1234' });
    expect(unknown.status).toBe(401);
    expect(unknown.body.error.code).toBe('invalid_credentials');
    const ok = await c.post('/api/auth/login', { email: email.toUpperCase(), password: 'Correct123' });
    expect(ok.status).toBe(200);
    expect((await c.get('/api/auth/me')).body.user.email).toBe(email);
  });

  it('locks the account after repeated failures', async () => {
    const email = uniqueEmail('lock');
    await registerUser(server.baseUrl, { email, password: 'Correct123' });
    const c = new TestClient(server.baseUrl);
    for (let i = 0; i < config.password.maxFailedLogins; i++) {
      expect((await c.post('/api/auth/login', { email, password: 'Wrong1234' })).status).toBe(401);
    }
    const locked = await c.post('/api/auth/login', { email, password: 'Correct123' });
    expect(locked.status).toBe(423);
    expect(locked.body.error.code).toBe('account_locked');
    expect(locked.headers.get('retry-after')).toBeTruthy();
  });

  it('logout invalidates the session server-side', async () => {
    const c = await registerUser(server.baseUrl);
    const cookie = c.cookie;
    const out = await c.post('/api/auth/logout');
    expect(out.status).toBe(200);
    const replay = new TestClient(server.baseUrl);
    replay.cookie = cookie;
    expect((await replay.get('/api/auth/me')).body.user).toBeNull();
    expect((await replay.get('/api/profile')).status).toBe(401);
  });

  it('logout-all signs out every device', async () => {
    const email = uniqueEmail('multi');
    const a = await registerUser(server.baseUrl, { email, password: 'Correct123' });
    const b = new TestClient(server.baseUrl);
    await b.post('/api/auth/login', { email, password: 'Correct123' });
    expect((await a.post('/api/auth/logout-all')).status).toBe(200);
    expect((await b.get('/api/auth/me')).body.user).toBeNull();
  });
});

describe('CSRF and request guards', () => {
  it('rejects authenticated mutations without the CSRF header', async () => {
    const c = await registerUser(server.baseUrl);
    const res = await c.post('/api/auth/logout', {}, { csrf: false });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('csrf_invalid');
    const wrong = await c.post('/api/auth/logout', {}, { headers: { 'x-csrf-token': 'nope' } });
    expect(wrong.status).toBe(403);
  });

  it('blocks cross-origin mutations and non-JSON bodies', async () => {
    const c = new TestClient(server.baseUrl);
    const cross = await c.post('/api/auth/login', { email: 'a@b.co', password: 'x' }, { headers: { origin: 'https://evil.example' } });
    expect(cross.status).toBe(403);
    expect(cross.body.error.code).toBe('origin_not_allowed');
    const form = await c.request('POST', '/api/auth/login', undefined, {
      rawBody: 'email=a@b.co&password=x',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    expect(form.status).toBe(415);
  });

  it('requires authentication for private APIs', async () => {
    const c = new TestClient(server.baseUrl);
    for (const path of ['/api/profile', '/api/plans', '/api/sessions/active', '/api/nutrition/day', '/api/coach/threads', '/api/dashboard']) {
      expect((await c.get(path)).status).toBe(401);
    }
  });

  it('sends security headers and no-store on API responses', async () => {
    const res = await new TestClient(server.baseUrl).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-security-policy')).toContain("default-src 'self'");
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-powered-by')).toBeNull();
  });
});

describe('password management', () => {
  it('changes password and signs out other sessions', async () => {
    const email = uniqueEmail('pw');
    const a = await registerUser(server.baseUrl, { email, password: 'Original123' });
    const b = new TestClient(server.baseUrl);
    await b.post('/api/auth/login', { email, password: 'Original123' });
    const bad = await a.post('/api/auth/password', { currentPassword: 'Nope12345', newPassword: 'Changed123' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('invalid_current_password');
    const ok = await a.post('/api/auth/password', { currentPassword: 'Original123', newPassword: 'Changed123' });
    expect(ok.status).toBe(200);
    expect((await a.get('/api/auth/me')).body.user).not.toBeNull();
    expect((await b.get('/api/auth/me')).body.user).toBeNull();
    const fresh = new TestClient(server.baseUrl);
    expect((await fresh.post('/api/auth/login', { email, password: 'Changed123' })).status).toBe(200);
  });

  it('resets a password with a single-use emailed token', async () => {
    const sent: MailMessage[] = [];
    setMailTransport(async (m) => {
      sent.push(m);
    });
    try {
      const email = uniqueEmail('reset');
      await registerUser(server.baseUrl, { email, password: 'Before123' });
      const c = new TestClient(server.baseUrl);
      const unknown = await c.post('/api/auth/password-reset/request', { email: uniqueEmail('ghost') });
      expect(unknown.status).toBe(202);
      expect(sent).toHaveLength(0);
      const req = await c.post('/api/auth/password-reset/request', { email });
      expect(req.status).toBe(202);
      expect(sent).toHaveLength(1);
      const token = decodeURIComponent(/token=([^\s]+)/.exec(sent[0]!.text)![1]!);
      const done = await c.post('/api/auth/password-reset/confirm', { token, newPassword: 'After1234' });
      expect(done.status).toBe(200);
      const reuse = await c.post('/api/auth/password-reset/confirm', { token, newPassword: 'Again1234' });
      expect(reuse.status).toBe(400);
      expect(reuse.body.error.code).toBe('invalid_reset_token');
      expect((await c.post('/api/auth/login', { email, password: 'After1234' })).status).toBe(200);
    } finally {
      setMailTransport(null);
    }
  });
});

describe('rate limiting', () => {
  it('returns 429 with Retry-After once the login limit is exceeded', async () => {
    const original = config.rateLimit.multiplier;
    config.rateLimit.multiplier = 1;
    resetRateLimits();
    try {
      const c = new TestClient(server.baseUrl);
      const email = uniqueEmail('rl');
      let last = 0;
      for (let i = 0; i < 12; i++) last = (await c.post('/api/auth/login', { email, password: 'Whatever1' })).status;
      expect(last).toBe(429);
    } finally {
      config.rateLimit.multiplier = original;
      resetRateLimits();
    }
  });
});
