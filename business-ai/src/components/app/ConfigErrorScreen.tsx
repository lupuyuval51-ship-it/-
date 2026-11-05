import { StyleSheet, View } from 'react-native';
import { EmptyState, Screen, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { missingConfiguration } from '@/lib/supabase';
import { spacing } from '@/theme/tokens';

/** Shown instead of the app when EXPO_PUBLIC_SUPABASE_* are missing (never crashes). */
export function ConfigErrorScreen() {
  const t = useT();
  return (
    <Screen scroll={false} offlineBanner={false} testID="config-error">
      <View style={styles.center}>
        <EmptyState icon="sliders" title={t('common.config.title')} body={t('common.config.body')} />
        <View style={styles.list}>
          {missingConfiguration.map((name) => (
            <Text key={name} variant="caption" tone="secondary" align="center" selectable>
              {name}
            </Text>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  list: { gap: spacing[1] },
});
