import { describe, expect, it } from 'vitest';
import type { DirectorStatus } from '../src/ai/client.ts';
import { withClientLimit } from '../src/state/store.tsx';

const NOW = Date.UTC(2026, 10, 9, 9);
const ONLINE: DirectorStatus = {
  configured: true,
  state: 'online',
  model: 'claude-opus-5-5',
  label: 'Online',
  detail: 'The AI Director is connected and writes one personalized episode per draw.',
  canGenerate: true,
  checkedAt: NOW,
};

describe('withClientLimit (this browser was asked to pause)', () => {
  it('shows Busy, with no AI envelopes, while the pause holds', () => {
    const s = withClientLimit(ONLINE, NOW + 10 * 60_000, 'rate_limited', NOW);
    expect(s.state).toBe('rate_limited');
    expect(s.label).toBe('Busy');
    expect(s.canGenerate).toBe(false);
    expect(s.detail).toContain('in about 10 minutes');
  });

  it('says why, without blaming the visitor for a full server or a shared network', () => {
    const detail = (reason: Parameters<typeof withClientLimit>[2]) => withClientLimit(ONLINE, NOW + 20_000, reason, NOW).detail;
    expect(detail('rate_limited')).toMatch(/^Lots of episodes have been asked for from your connection/);
    expect(detail('busy')).toMatch(/^The AI Director is busy writing for other people right now\./);
    expect(detail('connection')).toMatch(/^Other episodes are still being written from your connection\./);
    expect(detail('network')).toMatch(/^Too many episodes are being written from your network right now\./);
    expect(detail('tab')).toMatch(/^The AI Director is still writing an envelope in your other tab\./);
    for (const reason of ['busy', 'connection', 'network', 'tab'] as const) expect(detail(reason)).not.toMatch(/You have asked/);
  });

  it('says "in under a minute" for short pauses', () => {
    expect(withClientLimit(ONLINE, NOW + 20_000, 'busy', NOW).detail).toContain('in under a minute');
    expect(withClientLimit(ONLINE, NOW + 61_000, 'busy', NOW).detail).toContain('in about 2 minutes');
  });

  it('leaves the status alone once the pause is over, or when the Director cannot write anyway', () => {
    expect(withClientLimit(ONLINE, NOW, 'busy', NOW)).toBe(ONLINE);
    const off: DirectorStatus = { ...ONLINE, state: 'not_configured', label: 'Not configured', canGenerate: false };
    expect(withClientLimit(off, NOW + 60_000, 'busy', NOW)).toBe(off);
  });
});
