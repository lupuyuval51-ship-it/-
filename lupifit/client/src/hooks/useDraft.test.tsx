import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readDraft } from '../lib/drafts';
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
