import test from 'node:test';
import assert from 'node:assert/strict';
import { applicationUrl, config, defaultDemoMode } from '../src/lib/server/config';
import { clientNetworkAddress } from '../src/lib/server/auth';

test('production defaults to real accounts while Demo requires an explicit flag', () => {
  assert.equal(defaultDemoMode({ NODE_ENV: 'production' }), false);
  assert.equal(defaultDemoMode({ NODE_ENV: 'production', DEMO_MODE: 'true' }), true);
  assert.equal(defaultDemoMode({ NODE_ENV: 'production', DEMO_MODE: 'TRUE' }), false);
  assert.equal(defaultDemoMode({ NODE_ENV: 'development' }), true);
  assert.equal(defaultDemoMode({ NODE_ENV: 'test', DEMO_MODE: 'false' }), false);
});

test('real production rejects missing, insecure or malformed public origins', () => {
  for (const APP_URL of [undefined, '', 'http://learn.example', 'not-a-url', 'https://user:password@learn.example', 'https://learn.example/path', 'https://learn.example/?token=x']) {
    assert.throws(() => applicationUrl({ NODE_ENV: 'production', APP_URL }), /APP_URL/);
  }
  assert.equal(applicationUrl({ NODE_ENV: 'production', APP_URL: 'https://learn.example/' }), 'https://learn.example');
});

test('explicit Demo supports local production QA without requiring HTTPS', () => {
  assert.equal(applicationUrl({ NODE_ENV: 'production', DEMO_MODE: 'true' }), 'http://localhost:3000');
  assert.equal(applicationUrl({ NODE_ENV: 'production', DEMO_MODE: 'true', APP_URL: 'http://127.0.0.1:3100' }), 'http://127.0.0.1:3100');
});

test('cookie security follows the normalized HTTPS origin', () => {
  const previous = process.env.APP_URL;
  try {
    process.env.APP_URL = 'HTTPS://learn.example/';
    assert.equal(config.secureCookies, true);
    process.env.APP_URL = 'http://localhost:3000';
    assert.equal(config.secureCookies, false);
  } finally {
    if (previous === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previous;
  }
});

test('network limits accept only valid addresses from an explicitly trusted proxy', () => {
  const request = new Request('https://learn.example/api/auth/login', { headers: { 'x-forwarded-for': '203.0.113.12, 10.0.0.1' } });
  assert.equal(clientNetworkAddress(request, false), null);
  assert.equal(clientNetworkAddress(request, true), '203.0.113.12');
  assert.equal(clientNetworkAddress(new Request(request.url), true), null);
  assert.equal(clientNetworkAddress(new Request(request.url, { headers: { 'x-forwarded-for': 'spoofed' } }), true), null);
  assert.equal(clientNetworkAddress(new Request(request.url, { headers: { 'x-forwarded-for': '2001:db8::1' } }), true), '2001:db8::1');
});
