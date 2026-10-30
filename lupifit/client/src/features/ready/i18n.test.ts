import { describe, expect, it } from 'vitest';
import { READY_FOCUSES, SPORTS, TRAINING_MODES } from '@shared/constants';
import type { GenerationNote } from '@shared/types';
import { translate } from '../../i18n';
import { en } from '../../i18n/locales/en';
import { he } from '../../i18n/locales/he';
import { readyNoteText, splitNotes } from './format';

function keys(obj: unknown, prefix = ''): string[] {
  if (typeof obj === 'string') return [prefix];
  if (obj && typeof obj === 'object' && 'other' in obj) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe('ready workouts copy', () => {
  it('has the same keys in Hebrew and English, none empty', () => {
    const he_ = keys(he.ready, 'ready').sort();
    expect(he_).toEqual(keys(en.ready, 'ready').sort());
    for (const k of he_) {
      expect(translate('he', k, { count: 5 }), `he ${k}`).toBeTruthy();
      expect(translate('en', k, { count: 5 }), `en ${k}`).toBeTruthy();
    }
  });

  it('labels every muscle focus, sport and training mode in both languages', () => {
    const groups: [string, readonly string[]][] = [['readyFocus', READY_FOCUSES], ['sport', SPORTS], ['trainingMode', TRAINING_MODES]];
    for (const [group, values] of groups) {
      for (const v of values) {
        expect(translate('en', `enums.${group}.${v}`), `en ${group}.${v}`).toBeTruthy();
        expect(translate('he', `enums.${group}.${v}`), `he ${group}.${v}`).toBeTruthy();
      }
    }
    expect(Object.keys(en.enums.readyFocus)).toHaveLength(READY_FOCUSES.length);
    expect(Object.keys(en.enums.sport)).toHaveLength(SPORTS.length);
  });

  it('uses the product wording for the muscles and sports', () => {
    expect(translate('he', 'enums.readyFocus.quads')).toBe('ארבע-ראשי (קדמי ירך)');
    expect(translate('he', 'enums.readyFocus.hamstrings')).toBe('המסטרינג (ירך אחורי)');
    expect(translate('he', 'enums.sport.striking')).toBe('אגרוף / קיקבוקס / קרב מגע');
    expect(translate('he', 'enums.location.outdoor')).toBe('בחוץ / פארק כושר');
  });

  it('picks plural forms for counts in both languages', () => {
    expect(translate('en', 'ready.results.count', { count: 1 })).toBe('1 workout');
    expect(translate('en', 'ready.results.count', { count: 24 })).toBe('24 workouts');
    expect(translate('he', 'ready.results.count', { count: 1 })).toBe('אימון אחד');
    expect(translate('he', 'ready.results.count', { count: 2 })).toBe('שני אימונים');
    expect(translate('he', 'ready.results.count', { count: 24 })).toBe('24 אימונים');
    expect(translate('he', 'ready.safety.hidden', { count: 1 })).toBe('אימון אחד מוסתר בגלל הגיל או הפציעות שדווחו.');
  });
});

describe('readyNoteText', () => {
  const i18n = (locale: 'en' | 'he') => ({
    tx: (key: string, params?: Record<string, string | number | null | undefined>, fallback?: string) => translate(locale, key, params) ?? fallback ?? key,
    formatNumber: (n: number) => String(n),
  });

  it('renders every code the server can send, in both languages', () => {
    const notes: GenerationNote[] = [
      { code: 'minor' },
      { code: 'age_mature' },
      { code: 'age_senior' },
      { code: 'substituted', params: { from: 'A', to: 'B' } },
      { code: 'dropped', params: { name: 'C' } },
      { code: 'sport_gentle' },
      { code: 'sport_none_fit', params: { sport: 'soccer' } },
    ];
    for (const locale of ['en', 'he'] as const) {
      for (const n of notes) {
        const text = readyNoteText(n, i18n(locale));
        expect(text, `${locale} ${n.code}`).toBeTruthy();
        expect(text, `${locale} ${n.code}`).not.toMatch(/\{\w+\}/);
      }
    }
    expect(readyNoteText({ code: 'sport_none_fit', params: { sport: 'soccer' } }, i18n('he'))).toContain('לכדורגל');
  });

  it('skips unknown codes and splits the sport notes from the rest', () => {
    expect(readyNoteText({ code: 'something_new' }, i18n('en'))).toBeNull();
    const split = splitNotes([{ code: 'minor' }, { code: 'sport_gentle' }, { code: 'sport_none_fit' }, { code: 'dropped' }]);
    expect(split.sport.map((n) => n.code)).toEqual(['sport_gentle', 'sport_none_fit']);
    expect(split.adjusted.map((n) => n.code)).toEqual(['minor', 'dropped']);
  });
});
