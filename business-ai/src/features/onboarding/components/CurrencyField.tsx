import { useState } from 'react';
import { ChoiceList, ListRow, Sheet } from '@/components/ui';
import { currencySymbol, isolate } from '@/i18n/format';
import { useLocale, useT, type TFunction } from '@/i18n/I18nProvider';
import { BUDGET_CURRENCIES } from '../logic';

type KnownCurrency = (typeof BUDGET_CURRENCIES)[number];

function isKnownCurrency(code: string): code is KnownCurrency {
  return (BUDGET_CURRENCIES as readonly string[]).includes(code);
}

/** Localized currency name for the common currencies, otherwise the ISO code. */
export function currencyName(code: string, t: TFunction): string {
  return isKnownCurrency(code) ? t(`onboarding.currencies.${code}`) : code;
}

export interface CurrencyFieldProps {
  label: string;
  sheetTitle: string;
  value: string;
  options: readonly string[];
  onChange: (code: string) => void;
  hint?: string;
  disabled?: boolean;
  testID?: string;
}

/** A list row showing the selected currency; opens a sheet with the choices. */
export function CurrencyField({ label, sheetTitle, value, options, onChange, hint, disabled, testID }: CurrencyFieldProps) {
  const t = useT();
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const describe = (code: string) => {
    const symbol = currencySymbol(code, locale);
    return symbol === code ? code : `${isolate(symbol)} · ${code}`;
  };

  return (
    <>
      <ListRow
        title={label}
        subtitle={hint}
        value={isolate(value)}
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityHint={currencyName(value, t)}
        testID={testID}
      />
      <Sheet visible={open} onClose={() => setOpen(false)} title={sheetTitle} testID={testID ? `${testID}-sheet` : undefined}>
        <ChoiceList
          accessibilityLabel={sheetTitle}
          value={value}
          onChange={(code) => {
            onChange(code);
            setOpen(false);
          }}
          options={options.map((code) => ({ value: code, label: currencyName(code, t), description: describe(code) }))}
          testID={testID ? `${testID}-options` : undefined}
        />
      </Sheet>
    </>
  );
}
