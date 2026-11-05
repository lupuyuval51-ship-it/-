import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Divider, Icon, Text, TextField } from '@/components/ui';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { searchCountries } from '../logic';

export interface CountryPickerProps {
  /** Selected ISO-2 code ('' / null for none). */
  value: string | null;
  onChange: (code: string) => void;
  error?: string;
  autoFocus?: boolean;
  testID?: string;
}

/**
 * Searchable single-select country list. Matches Hebrew and English names, aliases and ISO codes,
 * diacritics-insensitive (see `searchCountries`). Rows are radio buttons separated by hairlines.
 */
export function CountryPicker({ value, onChange, error, autoFocus, testID }: CountryPickerProps) {
  const t = useT();
  const { locale } = useLocale();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchCountries(query, locale), [query, locale]);
  const other = locale === 'he' ? 'en' : 'he';

  return (
    <View style={styles.container} testID={testID}>
      <TextField
        label={t('onboarding.country.searchLabel')}
        placeholder={t('onboarding.country.searchPlaceholder')}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        autoCapitalize="none"
        autoComplete="off"
        returnKeyType="search"
        autoFocus={autoFocus}
        error={error}
        testID={testID ? `${testID}-search` : undefined}
      />
      {results.length === 0 ? (
        <Text variant="callout" tone="secondary" accessibilityLiveRegion="polite">
          {t('onboarding.country.noResults')}
        </Text>
      ) : (
        <View accessibilityRole="radiogroup" accessibilityLabel={t('onboarding.country.label')}>
          {results.map((country, index) => {
            const selected = country.code === value;
            return (
              <View key={country.code}>
                {index > 0 ? <Divider /> : null}
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={country[locale]}
                  onPress={() => onChange(country.code)}
                  testID={testID ? `${testID}-${country.code}` : undefined}
                  style={({ pressed }) => [styles.row, pressed ? { backgroundColor: colors.backgroundAlt } : null]}
                >
                  <View style={styles.rowText}>
                    <Text variant="body" weight={selected ? 500 : 400}>
                      {country[locale]}
                    </Text>
                    <Text variant="caption" tone="secondary">
                      {country[other]}
                    </Text>
                  </View>
                  <View style={styles.indicator}>{selected ? <Icon name="check" size={18} tone="accent" /> : null}</View>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[4], alignSelf: 'stretch' },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[2] },
  rowText: { flex: 1, gap: 2 },
  indicator: { width: 24, alignItems: 'center' },
});
