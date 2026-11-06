import { StyleSheet, View } from 'react-native';

import { space } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { ScalePressable } from './Pressable';

export interface SectionHeaderProps {
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Editorial section title with an optional "see all" affordance. */
export function SectionHeader({ title, hint, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titles}>
        <AppText variant="heading">{title}</AppText>
        {hint ? (
          <AppText variant="bodySmall" color="textSecondary">
            {hint}
          </AppText>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <ScalePressable onPress={onAction} accessibilityRole="button" style={styles.action} hitSlop={8}>
          <AppText variant="bodySmall" weight="medium" color="textSecondary">
            {actionLabel}
          </AppText>
          <Icon name="chevron-right" size={14} color="textSecondary" />
        </ScalePressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: space.md,
    marginBottom: space.md,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: space.xs,
  },
});
