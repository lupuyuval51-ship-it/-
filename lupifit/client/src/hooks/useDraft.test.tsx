import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readDraft, writeDraft } from '../lib/drafts';
import { useDraft } from './useDraft';

let userId: string | undefined = 'u1';
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ user: userId ? { id: userId } : null }) }));
const wrapper = ({ children }: { children: ReactNode }) => <>{children}</>;

beforeEach(() => {
  window.localStorage.clear();
  userId = 'u1';
});

describe('useDraft', () => {
  it('stores what differs from the initial value and restores it next time', () => {
    const first = renderHook(() => useDraft('weight', ''), { wrapper });
    act(() => first.result.current[1]('81.2'));
    expect(readDraft('u1', 'weight')).toBe('81.2');
    first.unmount();
    const second = renderHook(() => useDraft('weight', ''), { wrapper });
    expect(second.result.current[0]).toBe('81.2');
  });

  it('drops the draft when the value is back to the initial one, and on clear()', () => {
    const { result } = renderHook(() => useDraft('note', ''), { wrapper });
    act(() => result.current[1]('abc'));
    act(() => result.current[1](''));
    expect(readDraft('u1', 'note')).toBeNull();
    act(() => result.current[1]('xyz'));
    act(() => result.current[2]());
    expect(result.current[0]).toBe('');
    expect(readDraft('u1', 'note')).toBeNull();
  });

  it('loads the stored draft of the new key when the key changes, without overwriting or deleting either key', () => {
    writeDraft('u1', 'menu.2026-03-01', { logged: { 0: 'shakshuka' } });
    const { result, rerender } = renderHook(({ k }) => useDraft(k, { logged: {} }), { wrapper, initialProps: { k: 'menu.2026-03-02' } });
    expect(result.current[0]).toEqual({ logged: {} });

    // e.g. "previous day": the old day's stored state must be shown, not deleted because today's was empty.
    rerender({ k: 'menu.2026-03-01' });
    expect(result.current[0]).toEqual({ logged: { 0: 'shakshuka' } });
    expect(readDraft('u1', 'menu.2026-03-01')).toEqual({ logged: { 0: 'shakshuka' } });
    expect(readDraft('u1', 'menu.2026-03-02')).toBeNull();

    // And back: the old day's state is never carried over and written under the new key.
    rerender({ k: 'menu.2026-03-02' });
    expect(result.current[0]).toEqual({ logged: {} });
    expect(readDraft('u1', 'menu.2026-03-02')).toBeNull();
    expect(readDraft('u1', 'menu.2026-03-01')).toEqual({ logged: { 0: 'shakshuka' } });
  });

  it('keeps edits made under each key apart', () => {
    const { result, rerender } = renderHook(({ k }) => useDraft(k, ''), { wrapper, initialProps: { k: 'a' } });
    act(() => result.current[1]('for a'));
    rerender({ k: 'b' });
    expect(result.current[0]).toBe('');
    act(() => result.current[1]((prev) => `${prev}for b`));
    expect(readDraft('u1', 'b')).toBe('for b');
    expect(readDraft('u1', 'a')).toBe('for a');
    rerender({ k: 'a' });
    expect(result.current[0]).toBe('for a');
    act(() => result.current[2]());
    expect(result.current[0]).toBe('');
    expect(readDraft('u1', 'a')).toBeNull();
    expect(readDraft('u1', 'b')).toBe('for b');
  });

  it('is a plain state when disabled, and never shares a draft between users', () => {
    const plain = renderHook(() => useDraft('k', 'start', { enabled: false }), { wrapper });
    act(() => plain.result.current[1]('typed'));
    expect(readDraft('u1', 'k')).toBeNull();
    const a = renderHook(() => useDraft('k', ''), { wrapper });
    act(() => a.result.current[1]('mine'));
    a.unmount();
    userId = 'u2';
    expect(renderHook(() => useDraft('k', ''), { wrapper }).result.current[0]).toBe('');
  });
});
