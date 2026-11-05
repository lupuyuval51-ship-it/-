import {
  addDays,
  addMonths,
  daysInMonth,
  diffDays,
  dueDateFromOffset,
  endOfMonth,
  isISODate,
  localDateOf,
  monthGrid,
  parseISODate,
  quickDate,
  todayISO,
  toDisplayDate,
  weekdayOf,
  weekdayReferenceDate,
} from '../dates';

describe('parseISODate / isISODate', () => {
  it('parses valid dates', () => {
    expect(parseISODate('2026-11-05')).toEqual({ year: 2026, month: 11, day: 5 });
    expect(parseISODate(' 2024-02-29 ')).toEqual({ year: 2024, month: 2, day: 29 });
  });

  it('rejects malformed and overflowing dates', () => {
    expect(parseISODate('2026-02-29')).toBeNull(); // not a leap year
    expect(parseISODate('2026-13-01')).toBeNull();
    expect(parseISODate('2026-00-10')).toBeNull();
    expect(parseISODate('2026-04-31')).toBeNull();
    expect(parseISODate('2026-4-1')).toBeNull();
    expect(parseISODate('2026-11-05T00:00:00Z')).toBeNull();
    expect(parseISODate(null)).toBeNull();
    expect(isISODate('2026-11-05')).toBe(true);
    expect(isISODate(20261105)).toBe(false);
  });
});

describe('day arithmetic', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-11-05', 1)).toBe('2026-11-06');
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
    expect(addDays('2026-11-05', 0)).toBe('2026-11-05');
    expect(addDays('2026-11-05', 90)).toBe('2027-02-03');
  });

  it('is unaffected by DST transitions (UTC epoch-day math)', () => {
    // Israel DST ends 2026-10-25; US DST ends 2026-11-01; EU 2026-10-25.
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25');
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
    expect(addDays('2026-10-31', 2)).toBe('2026-11-02');
    expect(addDays('2026-03-27', 1)).toBe('2026-03-28');
    expect(diffDays('2026-11-02', '2026-10-31')).toBe(2);
    expect(diffDays('2026-03-30', '2026-03-26')).toBe(4);
  });

  it('diffs whole days in both directions', () => {
    expect(diffDays('2026-11-08', '2026-11-05')).toBe(3);
    expect(diffDays('2026-11-03', '2026-11-05')).toBe(-2);
    expect(diffDays('2027-11-05', '2026-11-05')).toBe(365);
  });

  it('throws on invalid input instead of producing garbage', () => {
    expect(() => addDays('nope', 1)).toThrow(RangeError);
  });
});

describe('months', () => {
  it('knows month lengths', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 11)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });

  it('computes end of month', () => {
    expect(endOfMonth('2026-11-05')).toBe('2026-11-30');
    expect(endOfMonth('2026-02-01')).toBe('2026-02-28');
    expect(endOfMonth('2026-12-31')).toBe('2026-12-31');
  });

  it('adds months with year rollover', () => {
    expect(addMonths({ year: 2026, month: 11 }, 1)).toEqual({ year: 2026, month: 12 });
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(addMonths({ year: 2026, month: 1 }, -13)).toEqual({ year: 2024, month: 12 });
    expect(addMonths({ year: 2026, month: 6 }, 18)).toEqual({ year: 2027, month: 12 });
  });
});

describe('weekdays and month grid', () => {
  it('computes weekdays (0 = Sunday)', () => {
    expect(weekdayOf('2026-11-05')).toBe(4); // Thursday
    expect(weekdayOf('2026-11-01')).toBe(0); // Sunday
    expect(weekdayOf('2023-01-01')).toBe(0);
    expect(weekdayReferenceDate(0)).toBe('2023-01-01');
    expect(weekdayReferenceDate(6)).toBe('2023-01-07');
    expect(weekdayOf(weekdayReferenceDate(3))).toBe(3);
  });

  it('builds a Sunday-first grid padded with adjacent days', () => {
    // November 2026 starts on Sunday and has 30 days → 5 rows, no leading padding.
    const nov = monthGrid({ year: 2026, month: 11 });
    expect(nov).toHaveLength(5);
    expect(nov.every((w) => w.length === 7)).toBe(true);
    expect(nov[0]![0]).toEqual({ date: '2026-11-01', day: 1, inMonth: true });
    expect(nov[4]![1]).toEqual({ date: '2026-11-30', day: 30, inMonth: true });
    expect(nov[4]![2]).toEqual({ date: '2026-12-01', day: 1, inMonth: false });

    // February 2026 starts on Sunday, 28 days → exactly 4 rows.
    expect(monthGrid({ year: 2026, month: 2 })).toHaveLength(4);

    // October 2026 starts on Thursday → 4 leading days from September.
    const oct = monthGrid({ year: 2026, month: 10 });
    expect(oct[0]!.slice(0, 4).map((c) => c.date)).toEqual(['2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30']);
    expect(oct[0]![4]).toEqual({ date: '2026-10-01', day: 1, inMonth: true });
    const flat = oct.flat();
    expect(flat.filter((c) => c.inMonth)).toHaveLength(31);
  });

  it('supports a Monday-first grid', () => {
    const nov = monthGrid({ year: 2026, month: 11 }, 1);
    expect(nov[0]![6]).toEqual({ date: '2026-11-01', day: 1, inMonth: true });
    expect(nov[0]![0]!.date).toBe('2026-10-26');
  });
});

describe('local-time boundaries', () => {
  it('reads today from local calendar fields', () => {
    expect(todayISO(new Date(2026, 10, 5, 0, 0, 1))).toBe('2026-11-05');
    expect(todayISO(new Date(2026, 10, 5, 23, 59, 59))).toBe('2026-11-05');
    expect(todayISO(new Date(2026, 0, 1, 0, 0, 0))).toBe('2026-01-01');
  });

  it('converts timestamps to local dates', () => {
    const local = new Date(2026, 10, 5, 23, 30);
    expect(localDateOf(local.toISOString())).toBe('2026-11-05');
    expect(localDateOf('garbage')).toBeNull();
  });

  it('creates display dates at local noon on the same calendar day', () => {
    const d = toDisplayDate('2026-10-25');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 9, 25, 12]);
  });
});

describe('quick choices', () => {
  const today = '2026-11-05';
  it('resolves relative to today', () => {
    expect(quickDate('today', today)).toBe('2026-11-05');
    expect(quickDate('tomorrow', today)).toBe('2026-11-06');
    expect(quickDate('nextWeek', today)).toBe('2026-11-12');
    expect(quickDate('inTwoWeeks', today)).toBe('2026-11-19');
    expect(quickDate('endOfMonth', today)).toBe('2026-11-30');
    expect(quickDate('tomorrow', '2026-12-31')).toBe('2027-01-01');
  });

  it('turns AI day offsets into due dates', () => {
    expect(dueDateFromOffset(3, today)).toBe('2026-11-08');
    expect(dueDateFromOffset(0, today)).toBe('2026-11-05');
    expect(dueDateFromOffset(-2, today)).toBe('2026-11-05');
    expect(dueDateFromOffset(null, today)).toBeNull();
    expect(dueDateFromOffset(undefined, today)).toBeNull();
  });
});
