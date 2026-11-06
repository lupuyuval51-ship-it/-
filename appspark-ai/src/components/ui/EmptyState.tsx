import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

import { AppText } from './AppText';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'danger';
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export function EmptyState({ icon = 'compass', title, hint, actionLabel, onAction, tone = 'neutral', style, compact }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.base, compact && styles.compact, style]}>
      <View style={[styles.iconWrap, { backgroundColor: tone === 'danger' ? colors.dangerSoft : colors.surfaceElevated, borderColor: colors.border }]}>
        <Icon name={icon} size={22} color={tone === 'danger' ? 'danger' : 'textSecondary'} />
      </View>
      <AppText variant="heading" align="center" style={styles.title}>
        {title}
      </AppText>
      {hint ? (
        <AppText variant="body" color="textSecondary" align="center" style={styles.hint}>
          {hint}
        </AppText>
      ) : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" style={styles.action} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    paddingVertical: space.huge,
    paddingHorizontal: space.xxl,
    gap: space.sm,
  },
  compact: {
    paddingVertical: space.xxl,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: space.sm,
  },
  title: {
    maxWidth: 320,
  },
  hint: {
    maxWidth: 320,
  },
  action: {
    marginTop: space.md,
  },
});
