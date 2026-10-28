import { useCallback } from 'react';
import { kgToLb, lbToKg } from '@shared/training';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n';

/**
 * Weight display/input conversion. All weights are stored in kg; imperial users see and
 * type pounds.
 */
export function useUnits() {
  const { user } = useAuth();
  const { t, formatNumber } = useI18n();
  const imperial = user?.units === 'imperial';
  const toDisplay = useCallback((kg: number | null | undefined) => (kg == null ? null : imperial ? kgToLb(kg) : Math.round(kg * 100) / 100), [imperial]);
  const fromDisplay = useCallback((v: number | null | undefined) => (v == null || Number.isNaN(v) ? null : imperial ? lbToKg(v) : v), [imperial]);
  const weightUnit = imperial ? t('common.units.lb') : t('common.units.kg');
  const formatWeight = useCallback(
    (kg: number | null | undefined) => (kg == null ? '—' : `${formatNumber(toDisplay(kg) ?? 0)} ${weightUnit}`),
    [formatNumber, toDisplay, weightUnit],
  );
  return { imperial, toDisplay, fromDisplay, weightUnit, formatWeight };
}
