import { StyleSheet, View } from 'react-native';
import { useT } from '@/i18n/I18nProvider';
import { useIsOnline } from '@/lib/net';
import { useTheme } from '@/theme/ThemeProvider';
import { DENSE_MAX_FONT_SCALE, layout, spacing } from '@/theme/tokens';
import { Icon } from './Icon';
import { Text } from './Text';

/** Thin strip shown while offline. Renders nothing when online. `Screen` includes it. */
export function OfflineBanner() {
  const online = useIsOnline();
  const { colors } = useTheme();
  const t = useT();
  if (online) return null;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: colors.backgroundAlt, borderBottomColor: colors.border }]}
      testID="offline-banner"
    >
      <View style={styles.inner}>
        <Icon name="wifi-off" size={14} tone="secondary" />
        <Text variant="caption" tone="secondary" maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.text}>
          {t('common.states.offlineBanner')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: spacing[2], paddingHorizontal: layout.gutter },
  inner: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  text: { flex: 1 },
});
