/**
 * Advisor tab: what the advisor knows and that it only proposes, the active business's
 * conversations, one primary "New conversation", suggested starters when empty, and the
 * remaining monthly advisor messages.
 */
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Divider, EmptyState, ErrorState, InlineNotice, ListRow, LoadingState, Screen, Section, Text, useNotice } from '@/components/ui';
import { useActiveBusiness } from '@/features/business/api';
import { useT } from '@/i18n/I18nProvider';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { useAdvisorAllowance, useConversations, useDeleteConversation, useRenameConversation } from '../api';
import { ConversationOptionsSheet } from '../components/ConversationOptionsSheet';
import { ConversationRow } from '../components/ConversationRow';
import type { Conversation } from '../conversation';

const STARTERS = ['pricing', 'thisWeek', 'firstCustomers', 'budget'] as const;

export default function AdvisorHomeScreen() {
  const t = useT();
  const router = useRouter();
  const online = useIsOnline();
  const notice = useNotice();
  const { business, businessId, isLoading: businessLoading, error: businessError, refetch: refetchBusiness } = useActiveBusiness();
  const conversations = useConversations(businessId);
  const allowance = useAdvisorAllowance();
  const deleteConversation = useDeleteConversation(businessId);
  const renameConversation = useRenameConversation(businessId);

  const [optionsFor, setOptionsFor] = useState<Conversation | null>(null);

  const openConversation = (id: string) => router.push({ pathname: '/advisor/[conversationId]', params: { conversationId: id } });
  const startConversation = (prompt?: string) =>
    router.push({ pathname: '/advisor/[conversationId]', params: prompt ? { conversationId: 'new', prompt } : { conversationId: 'new' } });

  const onDelete = async () => {
    if (!optionsFor) return;
    await deleteConversation.mutateAsync(optionsFor.id);
    setOptionsFor(null);
    notice.show({ message: t('advisor.home.manage.deleted') });
  };

  const onRename = async (title: string) => {
    if (!optionsFor) return;
    await renameConversation.mutateAsync({ id: optionsFor.id, title });
    setOptionsFor(null);
    notice.show({ message: t('advisor.home.manage.renamed') });
  };

  /* ---------------- states ---------------- */

  if (!businessId) {
    return (
      <Screen title={t('advisor.title')} edges={['top']}>
        {businessLoading ? (
          <LoadingState variant="list" count={3} />
        ) : businessError ? (
          <ErrorState error={businessError} onRetry={refetchBusiness} />
        ) : (
          <EmptyState
            icon="briefcase"
            title={t('advisor.home.noBusinessTitle')}
            body={t('advisor.home.noBusinessBody')}
            action={{ label: t('advisor.home.noBusinessAction'), onPress: () => router.push('/onboarding'), variant: 'primary' }}
          />
        )}
      </Screen>
    );
  }

  const list = conversations.data ?? [];
  const hasList = list.length > 0;
  const businessName = business?.name ?? '';

  const usageLine = allowance.known ? (
    allowance.remaining > 0 ? (
      <Text variant="caption" tone="secondary" numeric testID="advisor-usage">
        {t('advisor.home.usage.remaining', { count: allowance.remaining })}
      </Text>
    ) : (
      <InlineNotice tone="warning" message={t('advisor.home.usage.exhausted')} testID="advisor-usage" />
    )
  ) : null;

  const starters = (
    <Section title={t('advisor.home.startersHeading')} titleVariant="overline">
      <View>
        {STARTERS.map((key, i) => {
          const text = t(`advisor.home.starters.${key}`);
          return (
            <View key={key}>
              {i > 0 ? <Divider /> : null}
              <ListRow title={text} onPress={() => startConversation(text)} accessibilityHint={t('advisor.home.starterHint')} testID={`advisor-starter-${key}`} />
            </View>
          );
        })}
      </View>
    </Section>
  );

  let body: ReactNode;
  if (conversations.isLoading) {
    body = <LoadingState variant="list" count={4} accessibilityLabel={t('common.states.loading')} />;
  } else if (conversations.error && !conversations.data) {
    body = <ErrorState error={conversations.error} onRetry={() => void conversations.refetch()} retrying={conversations.isFetching} />;
  } else if (!hasList) {
    body = (
      <View style={styles.empty}>
        <View style={styles.emptyText}>
          <Text variant="heading">{t('advisor.home.emptyTitle')}</Text>
          <Text variant="callout" tone="secondary">
            {t('advisor.home.emptyBody')}
          </Text>
        </View>
        {starters}
      </View>
    );
  } else {
    body = (
      <Section title={t('advisor.home.conversationsHeading')} titleVariant="overline">
        <View>
          {list.map((conversation, i) => (
            <View key={conversation.id}>
              {i > 0 ? <Divider /> : null}
              <ConversationRow conversation={conversation} onPress={() => openConversation(conversation.id)} onOptions={() => setOptionsFor(conversation)} />
            </View>
          ))}
        </View>
      </Section>
    );
  }

  return (
    <Screen
      title={t('advisor.title')}
      edges={['top']}
      refreshing={conversations.isRefetching}
      onRefresh={() => {
        void conversations.refetch();
      }}
      testID="advisor-home"
    >
      <View style={styles.intro}>
        <Text variant="body">{t('advisor.home.intro', { business: businessName })}</Text>
        <Text variant="callout" tone="secondary">
          {t('advisor.home.proposesOnly')}
        </Text>
      </View>

      <View style={styles.primary}>
        <Button label={t('advisor.home.newConversation')} icon="plus" onPress={() => startConversation()} testID="advisor-new" />
        {usageLine}
      </View>

      {body}

      <ConversationOptionsSheet conversation={optionsFor} online={online} onClose={() => setOptionsFor(null)} onRename={onRename} onDelete={onDelete} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing[2] },
  primary: { gap: spacing[3], alignItems: 'flex-start' },
  empty: { gap: spacing[6] },
  emptyText: { gap: spacing[2] },
});
