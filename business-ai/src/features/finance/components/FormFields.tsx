import { useController, type Control, type FieldPathByValue, type FieldValues } from 'react-hook-form';
import { BASIS_VALUES, type Basis } from '@domain/plan';
import { ChoiceList, Text, TextField } from '@/components/ui';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { useFieldError } from '@/lib/forms';
import { View } from 'react-native';
import { spacing } from '@/theme/tokens';
import { reformatMoneyText } from '../mapping';

interface BaseFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPathByValue<T, string>;
  label: string;
  hint?: string;
  disabled?: boolean;
  /** Error from outside the schema (e.g. whole-model validation), already translated. */
  externalError?: string;
  testID?: string;
}

export function TextFormField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  disabled,
  externalError,
  testID,
  maxLength,
}: BaseFieldProps<T> & { maxLength?: number }) {
  const { field, fieldState } = useController({ control, name });
  const fieldError = useFieldError();
  return (
    <TextField
      label={label}
      hint={hint}
      value={field.value as string}
      onChangeText={field.onChange}
      onBlur={field.onBlur}
      ref={field.ref}
      error={fieldError(fieldState.error) ?? externalError}
      disabled={disabled}
      maxLength={maxLength}
      testID={testID}
    />
  );
}

/** Money input: decimal keyboard, currency adornment, re-formatted ("1,234.50") on blur. */
export function MoneyFormField<T extends FieldValues>({ control, name, label, hint, disabled, externalError, testID, currency }: BaseFieldProps<T> & { currency: string }) {
  const { field, fieldState } = useController({ control, name });
  const fieldError = useFieldError();
  const { locale } = useLocale();
  return (
    <TextField
      mode="money"
      currency={currency}
      label={label}
      hint={hint}
      value={field.value as string}
      onChangeText={field.onChange}
      onBlur={() => {
        const text = field.value as string;
        const formatted = reformatMoneyText(text, currency, locale);
        if (text.trim() !== '' && formatted !== text) field.onChange(formatted);
        field.onBlur();
      }}
      ref={field.ref}
      error={fieldError(fieldState.error) ?? externalError}
      disabled={disabled}
      testID={testID}
    />
  );
}

/** Quantities and percentages (decimal keyboard). */
export function NumberFormField<T extends FieldValues>({ control, name, label, hint, disabled, externalError, testID }: BaseFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });
  const fieldError = useFieldError();
  return (
    <TextField
      mode="number"
      label={label}
      hint={hint}
      value={field.value as string}
      onChangeText={field.onChange}
      onBlur={field.onBlur}
      ref={field.ref}
      error={fieldError(fieldState.error) ?? externalError}
      disabled={disabled}
      testID={testID}
    />
  );
}

/** Provenance selector for a finance line. */
export function BasisPicker({ value, onChange }: { value: Basis; onChange: (b: Basis) => void }) {
  const t = useT();
  return (
    <View style={{ gap: spacing[2] }}>
      <Text variant="callout" weight={500}>
        {t('finance.line.basis')}
      </Text>
      <ChoiceList
        accessibilityLabel={t('finance.line.basis')}
        options={BASIS_VALUES.map((b) => ({ value: b, label: t(`common.basis.${b}`), description: t(`finance.line.basisDescription.${b}`) }))}
        value={value}
        onChange={onChange}
      />
    </View>
  );
}
