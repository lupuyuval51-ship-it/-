import { stripBidi } from '../format';
import { hasTranslation, interpolate, pluralCategory, selectPlural, translate } from '../translate';
import { isPluralForms } from '../types';

const plain = (s: string) => stripBidi(s);

describe('pluralCategory', () => {
  it('English: one / other', () => {
    expect(pluralCategory('en', 1)).toBe('one');
    expect(pluralCategory('en', 0)).toBe('other');
    expect(pluralCategory('en', 2)).toBe('other');
    expect(pluralCategory('en', 1.5)).toBe('other');
  });

  it('Hebrew: one / two / other', () => {
    expect(pluralCategory('he', 1)).toBe('one');
    expect(pluralCategory('he', 2)).toBe('two');
    expect(pluralCategory('he', 3)).toBe('other');
    expect(pluralCategory('he', 10)).toBe('other');
    expect(pluralCategory('he', 2.5)).toBe('other');
    expect(pluralCategory('he', -2)).toBe('two');
  });

  it('non-finite counts are other', () => {
    expect(pluralCategory('he', NaN)).toBe('other');
    expect(pluralCategory('en', Infinity)).toBe('other');
  });
});

describe('selectPlural', () => {
  const forms = { one: 'יום', two: 'יומיים', other: '{count} ימים' };
  it('falls back to other when a form is missing', () => {
    expect(selectPlural('en', 2, { one: 'a', other: 'b' })).toBe('b');
    expect(selectPlural('he', 2, { one: 'a', other: 'b' })).toBe('b');
    expect(selectPlural('he', 2, forms)).toBe('יומיים');
  });
  it('uses zero when provided', () => {
    expect(selectPlural('en', 0, { zero: 'none', one: 'one', other: 'many' })).toBe('none');
  });
});

describe('isPluralForms', () => {
  it('detects plural leaves strictly', () => {
    expect(isPluralForms({ one: 'a', other: 'b' })).toBe(true);
    expect(isPluralForms({ one: 'a', two: 'b', other: 'c' })).toBe(true);
    // A group that happens to have an `other` key is not a plural.
    expect(isPluralForms({ registration: 'a', other: 'b' })).toBe(false);
    expect(isPluralForms({ other: 'b' })).toBe(false);
    expect(isPluralForms('x')).toBe(false);
  });
});

describe('interpolate', () => {
  it('replaces placeholders and isolates values', () => {
    const out = interpolate('Hi {name}!', { name: 'דנה' }, 'en');
    expect(out).toBe('Hi ⁨דנה⁩!');
    expect(plain(out)).toBe('Hi דנה!');
  });

  it('formats numbers for the locale', () => {
    expect(plain(interpolate('{n} items', { n: 1234 }, 'en'))).toBe('1,234 items');
  });

  it('keeps unknown placeholders and does not double-isolate', () => {
    expect(interpolate('{a} {b}', { a: '⁨x⁩' }, 'en')).toBe('⁨x⁩ {b}');
  });
});

describe('translate', () => {
  it('returns Hebrew and English strings', () => {
    expect(translate('he', 'common.actions.save')).toBe('שמירה');
    expect(translate('en', 'common.actions.save')).toBe('Save');
  });

  it('selects plural forms from vars.count', () => {
    expect(plain(translate('he', 'common.due.inDays', { count: 1 }))).toBe('בעוד יום');
    expect(plain(translate('he', 'common.due.inDays', { count: 2 }))).toBe('בעוד יומיים');
    expect(plain(translate('he', 'common.due.inDays', { count: 5 }))).toBe('בעוד 5 ימים');
    expect(plain(translate('en', 'common.due.inDays', { count: 1 }))).toBe('In 1 day');
    expect(plain(translate('en', 'common.due.inDays', { count: 12 }))).toBe('In 12 days');
  });

  it('interpolates named vars', () => {
    expect(plain(translate('en', 'auth.confirmEmail.body', { email: 'a@b.co' }))).toContain('a@b.co');
  });

  it('missing keys fall back to the key (and warn in dev)', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    // @ts-expect-error — deliberately invalid key
    expect(translate('en', 'nope.missing')).toBe('nope.missing');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('hasTranslation checks computed keys', () => {
    expect(hasTranslation('errors.network')).toBe(true);
    expect(hasTranslation('errors.field')).toBe(false); // a group, not a leaf
    expect(hasTranslation('errors.nope')).toBe(false);
  });
});
