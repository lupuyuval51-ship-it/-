import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { hit, space } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { ScalePressable } from './Pressable';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  onPress?: () => void;
  right?: ReactNode;
  chevron?: boolean;
  danger?: boolean;
  last?: boolean;
  testID?: string;
}

/** Settings-style row with optional icon, subtitle, trailing content and chevron. */
export function ListRow({ title, subtitle, icon, onPress, right, chevron, danger, last, testID }: ListRowProps) {
  const { colors } = useTheme();
  return (
    <ScalePressable
      onPress={onPress}
      disabled={!onPress}
      pressedScale={0.995}
      accessibilityRole={onPress ? 'button' : undefined}
      testID={testID}
      style={[styles.row, !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      {icon ? <Icon name={icon} size={18} color={danger ? 'danger' : 'textSecondary'} /> : null}
      <View style={styles.texts}>
        <AppText variant="body" weight="medium" color={danger ? 'danger' : 'text'}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="bodySmall" color="textSecondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
      {chevron ? <Icon name="chevron-right" size={16} color="textTertiary" /> : null}
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: hit + 8,
    paddingVertical: space.md,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
});
