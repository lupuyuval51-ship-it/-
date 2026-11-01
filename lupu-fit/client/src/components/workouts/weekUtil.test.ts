import { describe, expect, it } from 'vitest';
import { groupByWeek, weekStartOf, weeksAgo } from './weekUtil.ts';

describe('weekUtil', () => {
  it('weeks start on Sunday in Hebrew and Monday in English', () => {
    // 2026-11-04 is a Wednesday
    expect(weekStartOf('2026-11-04', 'he')).toBe('2026-11-01');
    expect(weekStartOf('2026-11-04', 'en')).toBe('2026-11-02');
    expect(weekStartOf('2026-11-01', 'en')).toBe('2026-10-26');
  });
  it('groups newest week first and counts weeks ago', () => {
    const rows = [{ localDate: '2026-11-04' }, { localDate: '2026-11-02' }, { localDate: '2026-10-28' }];
    const g = groupByWeek(rows, 'he');
    expect(g.map((x) => x.rows.length)).toEqual([2, 1]);
    expect(g[0]!.start).toBe('2026-11-01');
    expect(weeksAgo(g[1]!.start, '2026-11-04', 'he')).toBe(1);
    expect(weeksAgo(g[0]!.start, '2026-11-04', 'he')).toBe(0);
  });
});
