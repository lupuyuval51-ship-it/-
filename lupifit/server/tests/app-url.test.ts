/**
 * The public app URL without typing it in: APP_URL wins, otherwise Render's RENDER_EXTERNAL_URL
 * (https://<service>.onrender.com) is used for Origin checks, reset links and production validation.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { config, productionConfigProblems, resolveAppUrl } from '../src/config';
import { db } from '../src/db/pool';
import { setMailTransport, type MailMessage } from '../src/lib/mailer';
import { TestClient, registerUser, startTestServer, uniqueEmail, type TestServer } from './helpers/server';

const RENDER = 'https://lupu-fit.onrender.com';
const VITE = ['http://localhost:5173', 'http://127.0.0.1:5173'];

describe('resolveAppUrl', () => {
  it('uses APP_URL when it is set', () => {
    expect(resolveAppUrl({ APP_URL: 'https://app.example.com' })).toEqual({ appUrl: 'https://app.example.com', source: 'APP_URL', allowedOrigins: VITE });
  });

  it('falls back to the Render address when APP_URL is unset or blank', () => {
    for (const env of [{ RENDER_EXTERNAL_URL: RENDER }, { APP_URL: '  ', RENDER_EXTERNAL_URL: RENDER }]) {
      expect(resolveAppUrl(env)).toEqual({ appUrl: RENDER, source: 'RENDER_EXTERNAL_URL', allowedOrigins: [...VITE, RENDER] });
    }
  });

  it('keeps the Render address allowed after APP_URL moves to a custom domain', () => {
    const r = resolveAppUrl({ APP_URL: 'https://app.example.com', RENDER_EXTERNAL_URL: RENDER, ALLOWED_ORIGINS: `${RENDER},https://admin.example.com` });
    expect(r.appUrl).toBe('https://app.example.com');
    expect(r.allowedOrigins).toEqual([RENDER, 'https://admin.example.com']);
  });

  it('defaults to localhost outside any platform', () => {
    expect(resolveAppUrl({})).toEqual({ appUrl: 'http://localhost:3000', source: 'default', allowedOrigins: VITE });
  });
});

describe('productionConfigProblems', () => {
  const ok = { databaseUrl: 'postgres://u:p@db.internal:5432/lupufit', session: { secret: 'B0jrphAPOY7pg92AN0c9MN4yecczLMdwnx4OkA1KFUk=' } };

  it('does not block start-up when the app URL comes from RENDER_EXTERNAL_URL', () => {
    expect(productionConfigProblems({ ...ok, appUrl: resolveAppUrl({ RENDER_EXTERNAL_URL: RENDER }).appUrl })).toEqual([]);
  });

  it('still reports a missing database, a weak secret and an unusable APP_URL', () => {
    expect(productionConfigProblems({ databaseUrl: '', session: { secret: 'short' }, appUrl: 'app.example.com' })).toEqual([
      'DATABASE_URL is required in production',
      'SESSION_SECRET must be set to a random string of at least 32 characters in production',
      'APP_URL must be an http(s) URL such as https://app.example.com',
    ]);
  });
});

describe('with the app URL taken from RENDER_EXTERNAL_URL', () => {
  let server: TestServer;
  const original = { appUrl: config.appUrl, allowedOrigins: config.allowedOrigins };
  const fromRender = resolveAppUrl({ RENDER_EXTERNAL_URL: RENDER });

  beforeAll(async () => {
    server = await startTestServer();
    Object.assign(config, { appUrl: fromRender.appUrl, allowedOrigins: fromRender.allowedOrigins });
  });
  afterEach(() => setMailTransport(null));
  afterAll(async () => {
    Object.assign(config, original);
    await server.close();
    await db.close();
  });

  const login = (origin: string) =>
    new TestClient(server.baseUrl).post('/api/auth/login', { email: uniqueEmail('origin'), password: 'Wrong1234' }, { headers: { origin } });

  it('accepts state-changing requests from the Render address and still blocks other sites', async () => {
    const res = await login(RENDER);
    expect(res.status).toBe(401); // reached the login handler: the Origin check passed
    const evil = await login('https://lupu-fit.onrender.com.evil.example');
    expect(evil.status).toBe(403);
    expect(evil.body.error.code).toBe('origin_not_allowed');
  });

  it('accepts the Render address after APP_URL moves to a custom domain', async () => {
    const custom = resolveAppUrl({ APP_URL: 'https://app.example.com', RENDER_EXTERNAL_URL: RENDER });
    Object.assign(config, { appUrl: custom.appUrl, allowedOrigins: custom.allowedOrigins });
    try {
      expect((await login(RENDER)).status).toBe(401);
      expect((await login('https://app.example.com')).status).toBe(401);
    } finally {
      Object.assign(config, { appUrl: fromRender.appUrl, allowedOrigins: fromRender.allowedOrigins });
    }
  });

  it('puts the Render address in password-reset links', async () => {
    const sent: MailMessage[] = [];
    setMailTransport(async (m) => {
      sent.push(m);
    });
    const email = uniqueEmail('render-reset');
    await registerUser(server.baseUrl, { email });
    expect((await new TestClient(server.baseUrl).post('/api/auth/password-reset/request', { email })).status).toBe(202);
    expect(sent[0]!.text).toContain(`${RENDER}/reset-password?token=`);
  });
});
