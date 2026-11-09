/**
 * Server configuration and error hygiene: an unusable key is refused without
 * being echoed, and no error message we log or classify carries a credential.
 */
import Anthropic from '@anthropic-ai/sdk';
import { afterEach, describe, expect, it } from 'vitest';
import { classifyError, redactSecrets, registerSecret } from '../server/backend.ts';
import { readConfig } from '../server/config.ts';

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
