import type { TFunction } from '@/i18n/I18nProvider';
import { formatDate } from '@/i18n/format';
import type { Locale } from '@/i18n/types';
import { toAppError } from '@/lib/errors';
import type { MarketingAsset } from './logic';

/** Translated message for a failed AI generation, with studio-specific wording where it helps. */
export function generationErrorText(t: TFunction, error: unknown): string {
  const appError = toAppError(error);
  switch (appError.code) {
    case 'quota_exceeded':
      return t('marketing.errors.quota');
    case 'not_configured':
      return t('marketing.errors.notConfigured');
    case 'ai_refused':
      return t('marketing.errors.refused');
    default:
      return t(appError.messageKey);
  }
}

export function originLabel(t: TFunction, origin: MarketingAsset['origin']): string {
  return origin === 'ai' ? t('marketing.origin.ai') : t('marketing.origin.user');
}

/** "AI draft · Updated 5 Nov 2026" */
export function assetMeta(t: TFunction, locale: Locale, asset: Pick<MarketingAsset, 'origin' | 'updated_at'>): string {
  return `${originLabel(t, asset.origin)} · ${t('marketing.list.updated', { date: formatDate(asset.updated_at, locale) })}`;
}
