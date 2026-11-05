import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { AdvisorAction } from '@domain/ai-api';
import { Icon, InlineNotice, ListRow, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { layout, radii, spacing } from '@/theme/tokens';
import { isActionComplete, isWriteAction } from '../actions';
import type { DisplayItem } from '../conversation';
import { actionLabel } from '../labels';
import { Markdown } from '../markdown';

type AssistantItem = Extract<DisplayItem, { kind: 'assistant' }>;

export interface AssistantMessageProps {
  item: AssistantItem;
  /** Applied action ids (server + this session). */
  appliedIds: ReadonlySet<string>;
  showFollowUps: boolean;
  online: boolean;
  /** Another reply is streaming: follow-ups can't be sent yet. */
  busy: boolean;
  onAction: (action: AdvisorAction, messageId: string) => void;
  onFollowUp: (text: string) => void;
  onRetry: (text: string) => void;
}

function ErrorNotice({ item, onRetry }: { item: AssistantItem; onRetry: (text: string) => void }) {
  const t = useT();
  const error = item.error;
  if (!error) return null;
  if (error.code === 'quota_exceeded') {
    return <InlineNotice tone="warning" title={t('advisor.chat.quotaTitle')} message={t('advisor.chat.quotaBody')} />;
  }
  if (error.code === 'cost_cap_reached') {
    return <InlineNotice tone="warning" title={t('advisor.chat.costCapTitle')} message={t('errors.costCapReached')} />;
  }
  const retryText = item.retryText;
  return (
    <InlineNotice
      tone="error"
      title={t('advisor.chat.sendFailedTitle')}
      message={t(error.messageKey)}
      action={retryText && error.retryable ? { label: t('advisor.chat.retry'), onPress: () => onRetry(retryText) } : undefined}
    />
  );
}

function ActionList({
  item,
  appliedIds,
  online,
  onAction,
}: Pick<AssistantMessageProps, 'item' | 'appliedIds' | 'online' | 'onAction'>) {
  const t = useT();
  const streaming = item.state === 'streaming';
  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <Text variant="overline" tone="secondary">
          {t('advisor.actions.heading')}
        </Text>
        <Text variant="caption" tone="secondary">
          {t('advisor.actions.note')}
        </Text>
      </View>
      <View>
        {item.actions.map((action) => {
          const label = actionLabel(t, action);
          const write = isWriteAction(action);
          if (write && appliedIds.has(action.id)) {
            return <ListRow key={action.id} icon="check" title={label} value={t('advisor.actions.added')} testID={`advisor-action-${action.id}`} />;
          }
          const complete = isActionComplete(action);
          const reason = !complete
            ? t('advisor.actions.incomplete')
            : streaming || (write && !item.messageId)
              ? t('advisor.actions.waitForReply')
              : write && !online
                ? t('advisor.actions.offline')
                : undefined;
          const messageId = item.messageId;
          return (
            <ListRow
              key={action.id}
              icon={write ? 'plus' : 'file-text'}
              title={label}
              subtitle={reason}
              chevron={!write}
              disabled={reason !== undefined}
              onPress={() => {
                if (messageId || !write) onAction(action, messageId ?? '');
              }}
              testID={`advisor-action-${action.id}`}
            />
          );
        })}
      </View>
    </View>
  );
}

function FollowUps({ followUps, disabled, onFollowUp }: { followUps: string[]; disabled: boolean; onFollowUp: (text: string) => void }) {
  const t = useT();
  const { colors } = useTheme();
  return (
    <View style={styles.group}>
      <Text variant="overline" tone="secondary">
        {t('advisor.chat.followUpsHeading')}
      </Text>
      <View>
        {followUps.map((text) => (
          <Pressable
            key={text}
            accessibilityRole="button"
            accessibilityLabel={text}
            accessibilityHint={t('advisor.chat.followUpHint')}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={() => onFollowUp(text)}
            style={({ pressed }) => [styles.followUp, { backgroundColor: pressed ? colors.backgroundAlt : 'transparent', opacity: disabled ? 0.4 : 1 }]}
          >
            <Text variant="callout" style={styles.followUpText}>
              {text}
            </Text>
            <Icon name="arrow-up" size={16} tone="secondary" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** An advisor reply: full-width editorial text (no bubble) with a small label. */
function AssistantMessageImpl({ item, appliedIds, showFollowUps, online, busy, onAction, onFollowUp, onRetry }: AssistantMessageProps) {
  const t = useT();
  const streaming = item.state === 'streaming';
  const hasText = item.text.trim().length > 0;
  return (
    <View style={styles.root}>
      <Text variant="caption" tone="secondary" weight={500} accessibilityLabel={t('advisor.chat.advisorMessageA11y')}>
        {t('advisor.chat.advisorLabel')}
      </Text>
      {hasText ? <Markdown source={item.text} streaming={streaming} /> : null}
      {streaming && !hasText ? (
        <Text variant="callout" tone="secondary" accessibilityLiveRegion="polite">
          {t('advisor.chat.writing')}
        </Text>
      ) : null}
      {item.state === 'stopped' ? (
        <Text variant="caption" tone="secondary">
          {t('advisor.chat.stopped')}
        </Text>
      ) : null}
      {item.state === 'incomplete' ? (
        <Text variant="caption" tone="secondary">
          {t('advisor.chat.incomplete')}
        </Text>
      ) : null}
      {item.state === 'error' ? <ErrorNotice item={item} onRetry={onRetry} /> : null}
      {item.actions.length > 0 && item.state !== 'error' ? <ActionList item={item} appliedIds={appliedIds} online={online} onAction={onAction} /> : null}
      {showFollowUps && item.followUps.length > 0 ? <FollowUps followUps={item.followUps} disabled={busy || !online} onFollowUp={onFollowUp} /> : null}
    </View>
  );
}

export const AssistantMessage = memo(AssistantMessageImpl);

const styles = StyleSheet.create({
  root: { gap: spacing[3], alignSelf: 'stretch' },
  group: { gap: spacing[1], marginTop: spacing[2] },
  groupHeader: { gap: 2 },
  followUp: {
    minHeight: layout.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2],
    marginHorizontal: -spacing[2],
    paddingHorizontal: spacing[2],
    borderRadius: radii.control,
  },
  followUpText: { flex: 1 },
});
