/**
 * Server configuration and error hygiene: an unusable key is refused without
 * being echoed, and no error message we log or classify carries a credential.
 */
import Anthropic from '@anthropic-ai/sdk';
import { afterEach, describe, expect, it } from 'vitest';
import { originAllowed } from '../server/api.ts';
import { classifyError, redactSecrets, registerSecret } from '../server/backend.ts';
import { normalizeAllowedOrigin, readConfig } from '../server/config.ts';

afterEach(() => {
  delete process.env.PLOT_TWIST_RATE_LIMIT;
});

describe('readConfig', () => {
  it.each([
    ['a carriage return', 'sk-ant-qa-LEAKME\rX'],
    ['a newline', 'sk-ant-qa-LEAKME\nX'],
    ['a tab', 'sk-ant-qa-LEAKME\tX'],
    ['a space', 'sk-ant-qa LEAKME'],
    ['a non-ASCII letter', 'sk-ant-qa-LÉAKME'],
    ['a NUL', 'sk-ant-qa-LEAKME\u0000'],
  ])('refuses a key with %s, without echoing it', (_what, key) => {
    const cfg = readConfig({ ANTHROPIC_API_KEY: key });
    expect(cfg.apiKey).toBeNull();
    expect(cfg.apiKeyProblem).toMatch(/^ANTHROPIC_API_KEY contains invalid characters/);
    expect(cfg.apiKeyProblem).not.toMatch(/LEAKME|LÉAKME|sk-ant/);
  });

  it('names the variable the key came from', () => {
    expect(readConfig({ PLOT_TWIST_ANTHROPIC_API_KEY: 'bad key' }).apiKeyProblem).toMatch(/^PLOT_TWIST_ANTHROPIC_API_KEY contains invalid characters/);
  });

  it('accepts a normal key (surrounding whitespace from a .env line is trimmed)', () => {
    const cfg = readConfig({ ANTHROPIC_API_KEY: '  sk-ant-api03-Abc_123-xyz\n' });
    expect(cfg.apiKey).toBe('sk-ant-api03-Abc_123-xyz');
    expect(cfg.apiKeyProblem).toBeNull();
    expect(readConfig({}).apiKey).toBeNull();
    expect(readConfig({}).apiKeyProblem).toBeNull();
  });

  it('reads proxy settings and deadlines with safe defaults', () => {
    const d = readConfig({});
    expect(d).toMatchObject({ trustProxy: false, trustedHops: 1, allowedOrigins: [], maxStreamsPerClient: 2, timeoutMs: 120_000, deadlineMs: 150_000 });
    const c = readConfig({ PLOT_TWIST_TRUST_PROXY: '1', PLOT_TWIST_TRUSTED_HOPS: '2', PLOT_TWIST_DEADLINE_MS: '90000', PLOT_TWIST_TIMEOUT_MS: '60000' });
    expect(c).toMatchObject({ trustProxy: true, trustedHops: 2, deadlineMs: 90_000, timeoutMs: 60_000 });
    expect(readConfig({ PLOT_TWIST_TRUSTED_HOPS: '0' }).trustedHops).toBe(1);
  });

  it('reads numbers from the env it is given, not from process.env', () => {
    process.env.PLOT_TWIST_RATE_LIMIT = '99';
    expect(readConfig({}).rateLimit.max).toBe(8);
    expect(readConfig({ PLOT_TWIST_RATE_LIMIT: '3' }).rateLimit.max).toBe(3);
  });

  it('caps open streams per client and per IPv6 /48', () => {
    expect(readConfig({})).toMatchObject({ maxStreamsPerClient: 2, maxStreamsPerNetwork: 4 });
  });
});

// ── QA round 2: PLOT_TWIST_ALLOWED_ORIGINS ───────────────────────────

describe('PLOT_TWIST_ALLOWED_ORIGINS', () => {
  const origins = (value: string) => readConfig({ PLOT_TWIST_ALLOWED_ORIGINS: value });

  it('keeps usable entries, normalized and without duplicates', () => {
    const cfg = origins(' HTTPS://PlotTwist.Example:443/ , https://www.plottwist.example:8443, plottwist.example, http://[::1]:8080, [::1]:5173, localhost:5173, https://bücher.example, https://plottwist.example');
    expect(cfg.allowedOrigins).toEqual([
      'https://plottwist.example',
      'https://www.plottwist.example:8443',
      'plottwist.example',
      'http://[::1]:8080',
      '[::1]:5173',
      'localhost:5173',
      'https://xn--bcher-kva.example',
    ]);
    expect(cfg.warnings).toEqual([]);
  });

  it.each([
    ['https://*.example.com', /wildcards are not supported/],
    ['*.example.com', /wildcards are not supported/],
    ['https://a.example;https://b.example', /separate entries with commas/],
    ['https://a.example https://b.example', /separate entries with commas/],
    ['https://a_b.example', /the host may only use a-z, 0-9/],
    ['ftp://files.example', /only http:\/\/ and https:\/\//],
    ['javascript://a.example', /only http:\/\/ and https:\/\//],
    ['file:///etc', /only http:\/\/ and https:\/\//],
    ['https://', /not a valid URL/],
    ['a.example:99999', /port must be 1-65535/],
    ['a.example:0', /port must be 1-65535/],
    ['a.example/path', /expected https:\/\/host\[:port\] or host\[:port\]/],
    ['[not-ipv6]:80', /expected https:\/\/host\[:port\] or host\[:port\]/],
    ['data:text/html', /expected https:\/\/host\[:port\] or host\[:port\]/],
    ['%%%', /expected https:\/\/host\[:port\] or host\[:port\]/],
  ])('drops %j with a warning, without crashing (QA repro: f59b.mjs)', (entry, reason) => {
    const cfg = origins(`${entry},https://ok.example`);
    expect(cfg.allowedOrigins).toEqual(['https://ok.example']);
    expect(cfg.warnings).toHaveLength(1);
    expect(cfg.warnings[0]).toContain(`PLOT_TWIST_ALLOWED_ORIGINS: ignoring ${JSON.stringify(entry)}`);
    expect(cfg.warnings[0]).toMatch(reason);
  });

  it('normalizeAllowedOrigin returns null for anything unusable', () => {
    expect(normalizeAllowedOrigin('https://*.example.com')).toBeNull();
    expect(normalizeAllowedOrigin('https://a.example;https://b.example')).toBeNull();
    expect(normalizeAllowedOrigin('https://a.example/path')).toBe('https://a.example');
    expect(normalizeAllowedOrigin('')).toBeNull();
  });

  it('a non-default port matches the Origin a browser sends there', () => {
    const cfg = origins('https://plottwist.example:8443');
    expect(originAllowed({ origin: 'https://plottwist.example:8443', host: '127.0.0.1:8787' }, { trustProxy: false, allowedOrigins: cfg.allowedOrigins })).toBe(true);
    expect(originAllowed({ origin: 'https://plottwist.example', host: '127.0.0.1:8787' }, { trustProxy: false, allowedOrigins: cfg.allowedOrigins })).toBe(false);
  });

  it('behind nginx with $http_host, Host and X-Forwarded-Host carry the port the Origin has', () => {
    // README: proxy_set_header Host $http_host; proxy_set_header X-Forwarded-Host $http_host;
    const viaHttpHost = { origin: 'https://plottwist.example:8443', host: 'plottwist.example:8443', 'x-forwarded-host': 'plottwist.example:8443' };
    expect(originAllowed(viaHttpHost, { trustProxy: true, allowedOrigins: [] })).toBe(true);
    // The old example ($host) dropped the port, so every generation on :8443 was refused.
    const viaHost = { origin: 'https://plottwist.example:8443', host: 'plottwist.example', 'x-forwarded-host': 'plottwist.example' };
    expect(originAllowed(viaHost, { trustProxy: true, allowedOrigins: [] })).toBe(false);
  });
});

describe('redaction', () => {
  it('removes bearer tokens and sk-ant keys, even with control characters inside', () => {
    const msg = 'Headers.append: "Bearer sk-ant-qa-LEAKME\rX" is an invalid header value.';
    expect(redactSecrets(msg)).toBe('Headers.append: "Bearer [redacted]" is an invalid header value.');
    expect(redactSecrets('key sk-ant-api03-SECRETSECRET was used')).toBe('key [redacted] was used');
    expect(redactSecrets('x-api-key: abc123SECRET')).toBe('x-api-key: [redacted]');
  });

  it('removes the configured key wherever it appears', () => {
    registerSecret('custom-gateway-key-0123456789');
    expect(redactSecrets('gateway said no to custom-gateway-key-0123456789!')).toBe('gateway said no to [redacted]!');
  });

  it('classifyError never returns a credential', () => {
    registerSecret('custom-gateway-key-0123456789');
    const fromUndici = classifyError(new TypeError('Headers.append: "Bearer sk-ant-qa-LEAKME\rX" is an invalid header value.'));
    expect(fromUndici.kind).toBe('unknown');
    expect(fromUndici.message).not.toContain('LEAKME');
    const bad = Anthropic.APIError.generate(400, { type: 'error', error: { type: 'invalid_request_error', message: 'bad header custom-gateway-key-0123456789' } }, undefined, new Headers());
    const c = classifyError(bad);
    expect(c.kind).toBe('bad_request');
    expect(c.message).not.toContain('custom-gateway-key');
  });

  it('classifies a timeout abort reason as a timeout', () => {
    expect(classifyError(new DOMException('deadline', 'TimeoutError')).kind).toBe('timeout');
    expect(classifyError(new DOMException('gone', 'AbortError')).kind).toBe('aborted');
  });
});
