/**
 * Translation helpers for the plan feature: turn pure-logic results into user-facing strings.
 * Pure (take `t` and `locale`), so screens stay declarative.
 */
import type { Basis } from '@domain/plan';
import { formatDate } from '@/i18n/format';
import type { TFunction } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/translate';
import type { Locale } from '@/i18n/types';
import { makeAppError, toAppError, type AppErrorCode } from '@/lib/errors';
import { provenanceMix, relativeTime, STALE_ERROR_CODE, type BasisCounts } from './logic';
import type { UsageInfo } from './api';

const BASIS_COUNT_KEYS: Record<Basis, TranslationKey> = {
  user_provided: 'plan.basisCount.user_provided',
  assumption: 'plan.basisCount.assumption',
  ai_estimate: 'plan.basisCount.ai_estimate',
  verified: 'plan.basisCount.verified',
};

/** "3 estimates · 2 assumptions · 1 from you" (empty string when there is nothing). */
export function provenanceMixText(t: TFunction, counts: BasisCounts): string {
  return provenanceMix(counts)
    .map(({ basis, count }) => t(BASIS_COUNT_KEYS[basis], { count }))
    .join(' · ');
}

/** "5 minutes ago", "yesterday", or a date beyond a week. */
export function relativeLabel(t: TFunction, locale: Locale, iso: string, now: number = Date.now()): string {
  const rel = relativeTime(iso, now);
  if (!rel) return formatDate(iso, locale, { style: 'medium' });
  if (rel.key === 'justNow') return t('plan.relative.justNow');
  return t(`plan.relative.${rel.key}`, { count: rel.count });
}

/** Message for a failed plan generation (version error_code, stale marker or a thrown error). */
export function generationErrorText(t: TFunction, codeOrError: string | unknown): string {
  const code: string =
    typeof codeOrError === 'string' ? codeOrError : toAppError(codeOrError).code;
  switch (code) {
    case STALE_ERROR_CODE:
      return t('plan.failed.stale');
    case 'not_configured':
      return t('plan.failed.notConfigured');
    case 'quota_exceeded':
      return t('plan.failed.quotaExceeded');
    case 'cost_cap_reached':
      return t('plan.failed.costCapReached');
    case 'ai_refused':
      return t('plan.failed.aiRefused');
    case 'precondition_failed':
      return t('plan.failed.preconditionFailed');
    case 'network':
    case 'offline':
    case 'rate_limited':
    case 'ai_unavailable':
      return t(makeAppError(code as AppErrorCode).messageKey);
    default:
      return t('plan.failed.generic');
  }
}

/** True when trying again right away cannot succeed (monthly limits). */
export function isLimitError(code: string | null | undefined): boolean {
  return code === 'quota_exceeded' || code === 'cost_cap_reached';
}

/** Message for a failed AI section rewrite or save. */
export function actionErrorText(t: TFunction, error: unknown, context: 'regenerate' | 'save' | 'restore'): string {
  const appError = toAppError(error);
  if (appError.code === 'not_configured') return t('plan.errors.aiNotConfigured');
  if (appError.code === 'quota_exceeded' && context === 'regenerate') return t('plan.errors.sectionQuota');
  if (appError.code === 'invalid_request' && context === 'save') return t('plan.edit.errors.invalid');
  return t(appError.messageKey);
}

/** "1 of 2 plan generations left this month" / "You've used all 2 …". */
export function usageText(t: TFunction, usage: UsageInfo | null, kind: 'plan' | 'section'): string | null {
  if (!usage) return null;
  if (usage.left <= 0) {
    return t(kind === 'plan' ? 'plan.usage.planGenerationsNone' : 'plan.usage.sectionRegenerationsNone', { limit: usage.limit });
  }
  return t(kind === 'plan' ? 'plan.usage.planGenerations' : 'plan.usage.sectionRegenerations', { left: usage.left, limit: usage.limit });
}
