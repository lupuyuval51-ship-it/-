import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readDraft, writeDraft } from '../../lib/drafts';
import { EMPTY_MENU_STATE, useMenu, type MenuState } from './useMenu';

vi.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));
// The profile never arrives: only the stored day state matters here.
vi.mock('../nutrition/api', () => ({ fetchProfile: () => new Promise(() => {}) }));

const DAY = '2026-03-01';
const NEXT_DAY = '2026-03-02';
const loggedDay: MenuState = { swaps: { 1: 2 }, logged: { 0: 'd1', 1: 'd2', 2: 'd3' } };

let wrapper: ({ children }: { children: ReactNode }) => ReactNode;
beforeEach(() => {
  window.localStorage.clear();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  wrapper = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
});

describe('useMenu day state', () => {
  it('keeps a logged day when the date navigator moves back to it', () => {
    // The whole day was logged yesterday; today the nutrition page opens on today's (empty) menu.
    writeDraft('u1', `menu.${DAY}`, loggedDay);
    const teaser = renderHook(({ date }) => useMenu(date), { wrapper, initialProps: { date: NEXT_DAY } });
    expect(teaser.result.current.state).toEqual(EMPTY_MENU_STATE);

    teaser.rerender({ date: DAY });
    expect(teaser.result.current.state).toEqual(loggedDay);
    expect(readDraft('u1', `menu.${DAY}`)).toEqual(loggedDay);

    // Opening that day's menu still knows the dishes were logged, so "log the whole day" is not offered again.
    const page = renderHook(() => useMenu(DAY), { wrapper });
    expect(page.result.current.state).toEqual(loggedDay);
  });

  it('does not carry swaps and logged marks from one day to the next', () => {
    const { result, rerender } = renderHook(({ date }) => useMenu(date), { wrapper, initialProps: { date: DAY } });
    act(() => result.current.setState(loggedDay));
    rerender({ date: NEXT_DAY });
    expect(result.current.state).toEqual(EMPTY_MENU_STATE);
    expect(readDraft('u1', `menu.${NEXT_DAY}`)).toBeNull();
    expect(readDraft('u1', `menu.${DAY}`)).toEqual(loggedDay);
  });
});
