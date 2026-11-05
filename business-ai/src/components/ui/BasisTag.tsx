import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Basis } from '@domain/plan';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { DENSE_MAX_FONT_SCALE, radii, spacing } from '@/theme/tokens';
import { Icon } from './Icon';
import { Text } from './Text';

export interface BasisTagProps {
  basis: Basis;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Provenance label for a statement or number: from the user, an assumption, an AI estimate,
 * or verified against a source. Small and quiet; only `verified` uses the accent.
 */
export function BasisTag({ basis, style, testID }: BasisTagProps) {
  const { colors } = useTheme();
  const t = useT();
  const label = t(`common.basis.${basis}`);
  const dot = basis === 'assumption' ? colors.warning : basis === 'user_provided' ? colors.text : colors.textSecondary;
  const verified = basis === 'verified';
  return (
    <View
      accessible
      accessibilityLabel={t('common.basisA11y', { basis: label })}
      testID={testID}
      style={[
        styles.tag,
        verified ? { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft } : { borderColor: colors.border },
        style,
      ]}
    >
      {verified ? (
        <Icon name="check" size={12} tone="accent" />
      ) : (
        <View style={[styles.dot, basis === 'ai_estimate' ? { borderColor: dot, borderWidth: 1 } : { backgroundColor: dot }]} />
      )}
      <Text variant="caption" weight={500} tone={verified ? 'accent' : 'secondary'} maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing[1] + 2,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.control,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 12, lineHeight: 16 },
});
