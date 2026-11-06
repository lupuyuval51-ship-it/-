import { en } from '@/i18n/en';
import { he } from '@/i18n/he';
import { interpolate, translate } from '@/i18n';

function leaves(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => (typeof value === 'string' ? [`${prefix}${key}`] : leaves(value as Record<string, unknown>, `${prefix}${key}.`)));
}

describe('i18n', () => {
  it('english mirrors every hebrew key', () => {
    expect(leaves(en as unknown as Record<string, unknown>).sort()).toEqual(leaves(he as unknown as Record<string, unknown>).sort());
  });

  it('every hebrew leaf contains hebrew letters unless it is a brand or symbol', () => {
    const exceptions = new Set(['common.appName', 'common.english', 'auth.emailPlaceholder', 'enums.scope.mvp', 'enums.businessModel.b2b', 'enums.aiTarget.claude', 'enums.aiTarget.codex', 'enums.aiTarget.gemini', 'enums.platform.ios', 'enums.platform.android', 'enums.platform.web', 'enums.framework.expo', 'enums.framework.react-native', 'enums.framework.nextjs', 'enums.framework.flutter', 'enums.backend.supabase', 'enums.backend.firebase', 'common.mvpEffort', 'generator.sourceAi']);
    const missing = leaves(he as unknown as Record<string, unknown>).filter((key) => !exceptions.has(key) && !/[֐-׿]/.test(translate('he', key as never)));
    expect(missing).toEqual([]);
  });

  it('interpolates placeholders and falls back to the key', () => {
    expect(interpolate('{min}–{max} weeks', { min: 2, max: 4 })).toBe('2–4 weeks');
    expect(translate('en', 'discover.results', { count: 7 })).toBe('7 ideas');
    expect(translate('he', 'nope.missing' as never)).toBe('nope.missing');
  });
});
