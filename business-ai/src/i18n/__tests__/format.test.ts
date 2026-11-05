/**
 * Formatting tests. Intl output differs slightly between engines (Node ICU vs Hermes): spaces may
 * be NBSP/narrow NBSP and Hebrew output may carry RLM marks. Assertions normalize those.
 */
import {
  currencySymbol,
  formatDate,
  formatMoney,
  formatNumber,
  formatPercent,
  formatRelativeDue,
  FSI,
  isolate,
  minorToInputText,
  parseDateInput,
  parseMoneyInput,
  PDI,
  stripBidi,
  toISODate,
} from '../format';

/** Removes isolates/bidi marks and collapses every kind of space to a plain space. */
function norm(text: string): string {
  return stripBidi(text)
    .replace(/[    ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Same, but also drops spaces entirely (symbol placement spacing varies by engine). */
function compact(text: string): string {
  return norm(text).replace(/\s/g, '');
}

function isIsolated(text: string): boolean {
  return text.startsWith(FSI) && text.endsWith(PDI);
}

describe('isolate / stripBidi', () => {
  it('wraps once and strips', () => {
    expect(isolate('abc')).toBe(`${FSI}abc${PDI}`);
    expect(isolate(isolate('abc'))).toBe(`${FSI}abc${PDI}`);
    expect(stripBidi(`‏${FSI}abc${PDI}‎`)).toBe('abc');
  });
});

describe('formatMoney', () => {
  it('formats ILS in Hebrew and USD in English, isolated', () => {
    const he = formatMoney(123450, 'ILS', 'he');
    expect(isIsolated(he)).toBe(true);
    expect(compact(he)).toMatch(/^(₪1,234\.50|1,234\.50₪)$/);

    const en = formatMoney(123450, 'USD', 'en');
    expect(isIsolated(en)).toBe(true);
    expect(compact(en)).toBe('$1,234.50');
  });

  it('drops decimals for whole amounts by default and keeps them when asked', () => {
    expect(compact(formatMoney(120000, 'USD', 'en'))).toBe('$1,200');
    expect(compact(formatMoney(120000, 'USD', 'en', { fractionDigits: 2 }))).toBe('$1,200.00');
    expect(compact(formatMoney(120050, 'USD', 'en', { fractionDigits: 0 }))).toBe('$1,201');
  });

  it('handles negatives, zero, signs and junk input', () => {
    expect(compact(formatMoney(-5000, 'USD', 'en'))).toBe('-$50');
    expect(compact(formatMoney(-0, 'USD', 'en'))).toBe('$0');
    expect(compact(formatMoney(5000, 'USD', 'en', { signed: true }))).toBe('+$50');
    expect(compact(formatMoney(Number.NaN, 'USD', 'en'))).toBe('$0');
  });

  it('formats large values exactly (DB max 1e13 minor)', () => {
    expect(compact(formatMoney(10_000_000_000_000, 'ILS', 'en'))).toBe('₪100,000,000,000');
  });

  it('supports compact notation', () => {
    expect(compact(formatMoney(1_250_000, 'USD', 'en', { compact: true }))).toBe('$12.5K');
  });

  it('falls back for unknown currency codes', () => {
    expect(norm(formatMoney(1000, 'ZZZ', 'en'))).toMatch(/ZZZ ?10/);
  });
});

describe('formatNumber / formatPercent', () => {
  it('groups numbers', () => {
    expect(norm(formatNumber(1234567.5, 'en'))).toBe('1,234,567.5');
    expect(norm(formatNumber(1234567, 'he'))).toBe('1,234,567');
    expect(isIsolated(formatNumber(1, 'he'))).toBe(true);
    expect(norm(formatNumber(Number.NaN, 'en'))).toBe('—');
  });

  it('formats percentages from percent or ratio input', () => {
    expect(compact(formatPercent(12.5, 'en'))).toBe('12.5%');
    expect(compact(formatPercent(40, 'en'))).toBe('40%');
    expect(compact(formatPercent(0.125, 'en', { input: 'ratio' }))).toBe('12.5%');
    expect(compact(formatPercent(12.345, 'en', { fractionDigits: 2 }))).toBe('12.35%');
    expect(compact(formatPercent(5, 'en', { signed: true }))).toBe('+5%');
    expect(compact(formatPercent(40, 'he'))).toBe('40%');
  });
});

describe('dates', () => {
  it('parses ISO dates as local calendar dates (no time-zone shift)', () => {
    const d = parseDateInput('2026-11-05');
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(10);
    expect(d?.getDate()).toBe(5);
    expect(parseDateInput('2026-02-31')).toBeNull();
    expect(parseDateInput('not a date')).toBeNull();
    expect(toISODate(new Date(2026, 0, 9))).toBe('2026-01-09');
  });

  it('formats dates per locale, isolated', () => {
    const en = formatDate('2026-11-05', 'en');
    expect(isIsolated(en)).toBe(true);
    expect(norm(en)).toBe('Nov 5, 2026');
    expect(norm(formatDate('2026-11-05', 'en', { style: 'short' }))).toBe('Nov 5');
    expect(norm(formatDate('2026-11-05', 'en', { style: 'long' }))).toBe('Thursday, November 5, 2026');

    const he = norm(formatDate('2026-11-05', 'he'));
    expect(he).toContain('2026');
    expect(he).toContain('5');
    expect(he).toMatch(/נוב/);
    expect(formatDate('garbage', 'he')).toBe('');
  });

  it('accepts Date objects and timestamps', () => {
    expect(norm(formatDate(new Date(2026, 0, 2), 'en'))).toBe('Jan 2, 2026');
    expect(norm(formatDate('2026-03-04T10:00:00', 'en'))).toBe('Mar 4, 2026');
  });
});

describe('formatRelativeDue', () => {
  const now = new Date(2026, 10, 5, 15, 30); // Thu 5 Nov 2026, 15:30 local

  it('classifies overdue / today / tomorrow / upcoming by calendar day', () => {
    expect(formatRelativeDue('2026-11-03', now)).toEqual({ status: 'overdue', days: -2, key: 'common.due.overdue', vars: { count: 2 } });
    expect(formatRelativeDue('2026-11-05', now)).toEqual({ status: 'today', days: 0, key: 'common.due.today' });
    expect(formatRelativeDue('2026-11-06', now)).toEqual({ status: 'tomorrow', days: 1, key: 'common.due.tomorrow' });
    expect(formatRelativeDue('2026-11-12', now)).toEqual({ status: 'upcoming', days: 7, key: 'common.due.inDays', vars: { count: 7 } });
  });

  it('is DST-safe across month boundaries', () => {
    expect(formatRelativeDue('2027-04-05', new Date(2027, 2, 20))?.days).toBe(16);
    expect(formatRelativeDue('2026-10-26', new Date(2026, 9, 24, 23, 59))?.days).toBe(2);
  });

  it('returns null for invalid input', () => {
    expect(formatRelativeDue('x', now)).toBeNull();
  });
});

describe('parseMoneyInput', () => {
  const cases: [string, number | null][] = [
    ['1,234.50', 123450],
    ['1234.5', 123450],
    ['1234', 123400],
    ['₪ 1,200', 120000],
    ['1,200 ₪', 120000],
    ['1200₪', 120000],
    ['$12', 1200],
    ['USD 12.30', 1230],
    ['1,200 ש״ח', 120000],
    ['1,200 ש"ח', 120000],
    ['850 שקלים', 85000],
    ['‏1,200.50‎', 120050],
    ['⁨1,200⁩', 120000],
    ['1 234,50', 123450],
    ['12,5', 1250],
    ['12,50', 1250],
    ['1.234.567', 123456700],
    ['1.234,56', 123456],
    ['0.05', 5],
    ['.5', 50],
    ['12.', 1200],
    ['٣٠٠', 30000],
    ['0', 0],
    ['007', 700],
    ['', null],
    ['   ', null],
    ['abc', null],
    ['12abc34', null],
    ['1.234', 123400],
    ['1.2345', null],
    ['12.345', 1234500],
    ['1,23,4', null],
    ['1..2', null],
    ['12.3.4', null],
    ['-5', null],
    ['₪', null],
  ];

  it.each(cases)('parses %p → %p', (input, expected) => {
    expect(parseMoneyInput(input, 'ILS')).toBe(expected);
  });

  it('supports negatives when allowed', () => {
    expect(parseMoneyInput('-5', 'USD', { allowNegative: true })).toBe(-500);
    expect(parseMoneyInput('−₪5.25', 'ILS', { allowNegative: true })).toBe(-525);
    expect(parseMoneyInput('5-', 'USD', { allowNegative: true })).toBe(-500);
  });

  it('enforces the DB maximum (1e13 minor units) and a custom max', () => {
    expect(parseMoneyInput('100,000,000,000', 'ILS')).toBe(10_000_000_000_000);
    expect(parseMoneyInput('100,000,000,000.01', 'ILS')).toBeNull();
    expect(parseMoneyInput('100', 'ILS', { maxMinor: 5000 })).toBeNull();
  });

  it('round-trips with minorToInputText', () => {
    for (const minor of [0, 5, 50, 1200, 123450, 10_000_000_000_000]) {
      expect(parseMoneyInput(minorToInputText(minor), 'ILS')).toBe(minor);
    }
    expect(minorToInputText(null)).toBe('');
    expect(minorToInputText(-1250)).toBe('-12.50');
  });
});

describe('currencySymbol', () => {
  it('returns narrow symbols', () => {
    expect(currencySymbol('ILS', 'he')).toBe('₪');
    expect(currencySymbol('USD', 'en')).toBe('$');
    expect(currencySymbol('EUR', 'en')).toBe('€');
    expect(currencySymbol('ZZZ', 'en')).toBe('ZZZ');
  });
});
