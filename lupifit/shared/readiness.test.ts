import { describe, expect, it } from 'vitest';
import { easierRpe, easierSets, readinessLevel, type ReadinessCheckin } from './readiness';

const ok: ReadinessCheckin = { energy: 'normal', soreness: 'none', sleep: 'ok' };

describe('readinessLevel', () => {
  it('is normal with no or a single negative signal', () => {
    expect(readinessLevel(ok)).toBe('normal');
    expect(readinessLevel({ ...ok, energy: 'low' })).toBe('normal');
    expect(readinessLevel({ ...ok, soreness: 'high' })).toBe('normal');
    expect(readinessLevel({ ...ok, sleep: 'poor' })).toBe('normal');
  });

  it('is easier with two or more negative signals', () => {
    expect(readinessLevel({ energy: 'low', soreness: 'high', sleep: 'ok' })).toBe('easier');
    expect(readinessLevel({ energy: 'low', soreness: 'none', sleep: 'poor' })).toBe('easier');
    expect(readinessLevel({ energy: 'low', soreness: 'high', sleep: 'poor' })).toBe('easier');
  });

  it('never goes beyond "easier", however good the signals are', () => {
    expect(readinessLevel({ energy: 'high', soreness: 'none', sleep: 'good' })).toBe('normal');
  });
});

describe('easier helpers', () => {
  it('drops a set but keeps at least two and never adds sets', () => {
    expect(easierSets(4)).toBe(3);
    expect(easierSets(3)).toBe(2);
    expect(easierSets(2)).toBe(2);
    expect(easierSets(1)).toBe(1);
  });

  it('lowers RPE by one with a floor of 5 and never raises it', () => {
    expect(easierRpe(8)).toBe(7);
    expect(easierRpe(5.5)).toBe(5);
    expect(easierRpe(5)).toBe(5);
    expect(easierRpe(4)).toBe(4);
    expect(easierRpe(null)).toBeNull();
  });
});
