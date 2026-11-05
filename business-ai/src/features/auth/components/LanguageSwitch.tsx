import { SegmentedControl } from '@/components/ui';
import { useLocale, useT } from '@/i18n/I18nProvider';
import type { Locale } from '@/i18n/types';

/**
 * Compact he/en switch. Each language is labelled in its own script. On native a direction
 * change reloads the app (I18nManager); on web it re-renders in place.
 */
export function LanguageSwitch({ testID = 'language-switch' }: { testID?: string }) {
  const { locale, setLocale } = useLocale();
  const t = useT();
  return (
    <SegmentedControl<Locale>
      fullWidth={false}
      accessibilityLabel={t('auth.language.label')}
      value={locale}
      onChange={(next) => void setLocale(next)}
      options={[
        { value: 'he', label: t('common.language.he') },
        { value: 'en', label: t('common.language.en') },
      ]}
      testID={testID}
    />
  );
}
