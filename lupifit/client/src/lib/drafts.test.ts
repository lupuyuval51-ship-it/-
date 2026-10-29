import { beforeEach, describe, expect, it } from 'vitest';
import { clearAllDrafts, DRAFT_TTL_MS, readDraft, removeDraft, writeDraft } from './drafts';

beforeEach(() => window.localStorage.clear());

describe('drafts', () => {
  it('keeps a draft per user and key', () => {
    writeDraft('u1', 'coach', 'half a message');
    expect(readDraft('u1', 'coach')).toBe('half a message');
    expect(readDraft('u2', 'coach')).toBeNull();
    expect(readDraft('u1', 'other')).toBeNull();
  });

  it('expires after the retention period', () => {
    writeDraft('u1', 'k', { a: 1 }, 1_000);
    expect(readDraft('u1', 'k', 1_000 + DRAFT_TTL_MS)).toEqual({ a: 1 });
    expect(readDraft('u1', 'k', 1_000 + DRAFT_TTL_MS + 1)).toBeNull();
  });

  it('can be removed one by one or all at once, without touching other storage', () => {
    window.localStorage.setItem('fitai.locale', '"he"');
    writeDraft('u1', 'a', 1);
    writeDraft('u2', 'b', 2);
    removeDraft('u1', 'a');
    expect(readDraft('u1', 'a')).toBeNull();
    expect(readDraft('u2', 'b')).toBe(2);
    clearAllDrafts();
    expect(readDraft('u2', 'b')).toBeNull();
    expect(window.localStorage.getItem('fitai.locale')).toBe('"he"');
  });

  it('ignores damaged data', () => {
    window.localStorage.setItem('fitai.draft.u1.k', '{not json');
    expect(readDraft('u1', 'k')).toBeNull();
    window.localStorage.setItem('fitai.draft.u1.k', JSON.stringify({ v: 2, savedAt: 1, value: 'x' }));
    expect(readDraft('u1', 'k')).toBeNull();
  });
});
