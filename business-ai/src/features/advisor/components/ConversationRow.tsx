import { Pressable, StyleSheet, View } from 'react-native';
import { IconButton, Text } from '@/components/ui';
import { isolate } from '@/i18n/format';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';
import type { Conversation } from '../conversation';
import { relativeTimeLabel } from '../labels';
import { markdownPreview } from '../markdownParse';

export interface ConversationRowProps {
  conversation: Conversation;
  onPress: () => void;
  onOptions: () => void;
}

/** Title + relative time on the first line, a quiet one-line preview of the last message below. */
export function ConversationRow({ conversation, onPress, onOptions }: ConversationRowProps) {
  const t = useT();
  const { locale } = useLocale();
  const { colors } = useTheme();
  const title = conversation.title.trim() || t('advisor.home.untitled');
  const preview = conversation.lastMessage ? markdownPreview(conversation.lastMessage.content, 120) : '';
  const time = relativeTimeLabel(t, locale, conversation.lastMessageAt);
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={[title, time, preview].filter(Boolean).join(', ')}
        accessibilityHint={t('advisor.home.rowHint')}
        onPress={onPress}
        style={({ pressed }) => [styles.main, { backgroundColor: pressed ? colors.backgroundAlt : 'transparent' }]}
        testID={`advisor-conversation-${conversation.id}`}
      >
        <View style={styles.titleLine}>
          <Text variant="body" weight={500} numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          <Text variant="caption" tone="secondary" numeric>
            {time}
          </Text>
        </View>
        <Text variant="callout" tone="secondary" numberOfLines={1}>
          {preview ? isolate(preview) : t('advisor.home.noMessages')}
        </Text>
      </Pressable>
      <IconButton icon="more-horizontal" tone="secondary" accessibilityLabel={t('advisor.home.manage.open', { title })} onPress={onOptions} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  main: {
    flex: 1,
    gap: 2,
    paddingVertical: spacing[3],
    marginStart: -spacing[2],
    paddingHorizontal: spacing[2],
    borderRadius: radii.control,
    minHeight: 64,
    justifyContent: 'center',
  },
  titleLine: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[3] },
  title: { flex: 1 },
});
