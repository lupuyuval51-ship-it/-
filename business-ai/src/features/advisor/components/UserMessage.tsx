import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';

export interface UserMessageProps {
  text: string;
  /** Not yet confirmed by the server. */
  pending?: boolean;
}

/** The user's message: a subtle block at the logical end (left in Hebrew, right in English). */
export function UserMessage({ text, pending = false }: UserMessageProps) {
  const { colors } = useTheme();
  const t = useT();
  return (
    <View
      accessible
      accessibilityLabel={t('advisor.chat.yourMessageA11y', { text })}
      style={[styles.block, { backgroundColor: colors.backgroundAlt, opacity: pending ? 0.72 : 1 }]}
    >
      <Text variant="body" selectable>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    alignSelf: 'flex-end',
    maxWidth: '86%',
    borderRadius: radii.surface,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
});
