import { useMemo } from 'react';
import { useActiveBusiness } from '@/features/business/api';
import { formatMoney, formatNumber, formatPercent, MINOR_PER_MAJOR, type MoneyFormatOptions } from '@/i18n/format';
import { useLocale } from '@/i18n/I18nProvider';
import { useFinanceInputs, type FinanceInputsResult } from './api';

export interface ActiveFinance extends FinanceInputsResult {
  businessId: string | null;
  /** The active business list is still resolving. */
  businessLoading: boolean;
}

/** Finance data of the active business. */
export function useActiveFinance(): ActiveFinance {
  const active = useActiveBusiness();
  const finance = useFinanceInputs(active.businessId);
  return { ...finance, businessId: active.businessId, businessLoading: active.isLoading && !active.businessId };
}

export interface FinanceFormat {
  money: (minor: number, opts?: MoneyFormatOptions) => string;
  /** Percent value (12.5 → "12.5%"); null → null so callers render "not applicable". */
  pct: (value: number | null) => string | null;
  /** Quantities (up to 2 decimals). */
  qty: (value: number) => string;
  int: (value: number) => string;
  /**
   * Dense table cell: whole currency units without symbol ("12,345"), compact from a million
   * ("1.2M"). The table caption names the currency. Screen readers get `money()` instead.
   */
  cell: (minor: number) => string;
}

/** Locale + currency bound formatters (all output is bidi-isolated). */
export function useFinanceFormat(currency: string): FinanceFormat {
  const { locale } = useLocale();
  return useMemo(
    () => ({
      money: (minor, opts) => formatMoney(minor, currency, locale, opts),
      pct: (value) => (value === null ? null : formatPercent(value, locale)),
      qty: (value) => formatNumber(value, locale, { maximumFractionDigits: 2 }),
      int: (value) => formatNumber(value, locale, { maximumFractionDigits: 0 }),
      cell: (minor) => {
        const major = Math.round(minor / MINOR_PER_MAJOR);
        return Math.abs(major) >= 1_000_000
          ? formatNumber(major, locale, { notation: 'compact', maximumFractionDigits: 1 })
          : formatNumber(major, locale, { maximumFractionDigits: 0 });
      },
    }),
    [currency, locale],
  );
}
