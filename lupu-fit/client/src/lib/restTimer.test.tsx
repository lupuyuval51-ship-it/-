import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fmt } from '../i18n/index.tsx';
import { loadRestEnd, remainingSec, restKey, saveRestEnd, useRestTimer } from './restTimer.ts';
import { videoStore } from './videoState.ts';

function Harness({ id, onEnd }: { id: string; onEnd?: () => void }) {
  const r = useRestTimer(id, onEnd);
  return (
    <div>
      <span data-testid="left">{r.remaining === null ? 'idle' : fmt.duration(r.remaining)}</span>
      <button data-testid="start" onClick={() => r.start(90)} />
      <button data-testid="plus" onClick={() => r.adjust(15)} />
      <button data-testid="minus" onClick={() => r.adjust(-15)} />
      <button data-testid="skip" onClick={() => r.skip()} />
    </div>
  );
}
const left = () => screen.getByTestId('left').textContent;
const click = (name: string) => act(() => { screen.getByTestId(name).click(); });

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] }); vi.setSystemTime(new Date('2026-01-01T10:00:00Z')); localStorage.clear(); });
afterEach(() => { vi.useRealTimers(); });

describe('rest timer', () => {
  it('computes remaining seconds from the wall clock', () => {
    expect(remainingSec(10_000, 8_001)).toBe(2);
    expect(remainingSec(10_000, 20_000)).toBe(0);
  });
  it('persists restEndsAtEpochMs per workout and survives a remount with the correct remaining time', () => {
    const a = render(<Harness id="w1" />);
    click('start');
    expect(left()).toBe('1:30');
    expect(JSON.parse(localStorage.getItem(restKey('w1')) as string).restEndsAtEpochMs).toBe(Date.now() + 90_000);
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(left()).toBe('1:00');
    a.unmount(); // "reload": unmount while the wall clock keeps running
    vi.setSystemTime(Date.now() + 10_000);
    render(<Harness id="w1" />);
    expect(left()).toBe('0:50');
    render(<Harness id="other" />);
    expect(screen.getAllByTestId('left')[1]?.textContent).toBe('idle'); // other workouts are unaffected
  });
  it('adjusts by 15 s, skips, and ignores a rest that ended while away', () => {
    render(<Harness id="w1" />);
    click('start'); click('plus'); expect(left()).toBe('1:45');
    click('minus'); click('minus'); expect(left()).toBe('1:15');
    click('skip'); expect(left()).toBe('idle'); expect(localStorage.getItem(restKey('w1'))).toBeNull();
    saveRestEnd('w1', Date.now() + 5_000);
    expect(loadRestEnd('w1', Date.now() + 6_000)).toBeNull();
  });
  it('fires onEnd once at zero, clears storage and toggles the video rest flag', () => {
    const onEnd = vi.fn();
    render(<Harness id="w1" onEnd={onEnd} />);
    click('start');
    expect(videoStore.restActive).toBe(true);
    act(() => { vi.advanceTimersByTime(91_000); });
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(left()).toBe('idle'); expect(localStorage.getItem(restKey('w1'))).toBeNull(); expect(videoStore.restActive).toBe(false);
  });
});
