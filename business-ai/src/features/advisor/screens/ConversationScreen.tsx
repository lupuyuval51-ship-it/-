/**
 * Route `/advisor/[conversationId]` — the advisor chat. `conversationId = 'new'` starts a
 * conversation (the id from the stream's `meta` event replaces it in place, without losing
 * state); search param `prompt` pre-fills the composer (never auto-sent).
 */
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { HeaderHeightContext } from 'expo-router/react-navigation';
import { use, useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View, type ListRenderItem, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AdvisorAction } from '@domain/ai-api';
import { EmptyState, ErrorState, InlineNotice, LoadingState, OfflineBanner, Screen, Text, useNotice } from '@/components/ui';
import { useActiveBusiness } from '@/features/business/api';
import { useT } from '@/i18n/I18nProvider';
import { useReducedMotion } from '@/lib/a11y';
import { toAppError } from '@/lib/errors';
import { useIsOnline } from '@/lib/net';
import { useTheme } from '@/theme/ThemeProvider';
import { layout, spacing } from '@/theme/tokens';
import { isWriteAction, previewAction, type ActionPreview, type WriteAction } from '../actions';
import {
  isConversationId,
  useAdvisorAllowance,
  useApplyAction,
  useConversation,
  useMessages,
  useOpenPlanSection,
  useSendMessage,
} from '../api';
import { AssistantMessage } from '../components/AssistantMessage';
import { ActionConfirmSheet } from '../components/ActionConfirmSheet';
import { Composer } from '../components/Composer';
import { UserMessage } from '../components/UserMessage';
import { followUpTargetIndex, MESSAGE_MAX_LENGTH, mergeMessages, type DisplayItem } from '../conversation';

/** Distance from the bottom (pt) within which new content keeps the list pinned to the end. */
const STICK_THRESHOLD = 120;

const SUCCESS_KEYS = {
  task: 'advisor.actions.success.task',
  milestone: 'advisor.actions.success.milestone',
  recurring_expense: 'advisor.actions.success.recurringExpense',
  startup_cost: 'advisor.actions.success.startupCost',
} as const;

interface ConfirmState {
  action: WriteAction;
  messageId: string;
  preview: ActionPreview;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function ConversationScreen() {
  const params = useLocalSearchParams<{ conversationId: string; prompt?: string }>();
  const routeId = firstParam(params.conversationId) ?? '';
  const isNew = routeId === 'new';
  const validId = isConversationId(routeId);
  const router = useRouter();
  const t = useT();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = use(HeaderHeightContext) ?? 0;
  const online = useIsOnline();
  const reduceMotion = useReducedMotion();
  const notice = useNotice();
  const { business, businessId, isLoading: businessLoading } = useActiveBusiness();
  const allowance = useAdvisorAllowance();

  const conversationQuery = useConversation(businessId, validId ? routeId : null);
  const messagesQuery = useMessages(businessId, validId ? routeId : null);

  const [draft, setDraft] = useState(() => (firstParam(params.prompt) ?? '').slice(0, MESSAGE_MAX_LENGTH));

  const onConversationId = useCallback(
    (id: string) => {
      if (id !== routeId) router.setParams({ conversationId: id });
    },
    [router, routeId],
  );
  const sender = useSendMessage(businessId, { onConversationId });
  const { pending, isStreaming } = sender;

  const items = useMemo(() => mergeMessages(messagesQuery.data ?? [], pending), [messagesQuery.data, pending]);
  const followUpIndex = followUpTargetIndex(items);
  const currentConversationId = validId ? routeId : (pending?.conversationId ?? null);

  // Applied action ids recorded in this session (the server copy may still be refetching).
  const [sessionApplied, setSessionApplied] = useState<Record<string, string[]>>({});
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const applyAction = useApplyAction(businessId);
  const openPlanSection = useOpenPlanSection();

  const listRef = useRef<FlatList<DisplayItem>>(null);
  const stickToEnd = useRef(true);
  const scrolledOnce = useRef(false);

  const quotaReached = allowance.known && allowance.remaining <= 0;
  const canSend = online && !!businessId && !isStreaming && !quotaReached;

  const send = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      stickToEnd.current = true;
      sender.send(text, currentConversationId);
    },
    [sender, currentConversationId],
  );

  const onComposerSend = () => {
    if (!canSend || !draft.trim()) return;
    send(draft);
    setDraft('');
  };

  const onAction = useCallback(
    (action: AdvisorAction, messageId: string) => {
      if (!isWriteAction(action)) {
        openPlanSection(action);
        return;
      }
      if (!messageId) return;
      applyAction.reset();
      setConfirm({ action, messageId, preview: previewAction(action) });
    },
    [applyAction, openPlanSection],
  );

  const onConfirmAction = () => {
    if (!confirm || !currentConversationId) return;
    const { action, messageId, preview } = confirm;
    applyAction.mutate(
      { conversationId: currentConversationId, messageId, action, preview },
      {
        onSuccess: (result) => {
          setSessionApplied((prev) => ({ ...prev, [result.messageId]: result.appliedActionIds }));
          setConfirm(null);
          notice.show({ message: t(SUCCESS_KEYS[preview.kind]) });
        },
      },
    );
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    stickToEnd.current = contentSize.height - (contentOffset.y + layoutMeasurement.height) < STICK_THRESHOLD;
  };

  const scrollToEndIfPinned = () => {
    if (!stickToEnd.current || items.length === 0) return;
    listRef.current?.scrollToEnd({ animated: scrolledOnce.current && !reduceMotion });
    scrolledOnce.current = true;
  };

  const renderItem: ListRenderItem<DisplayItem> = ({ item, index }) => {
    if (item.kind === 'user') return <UserMessage text={item.text} pending={item.pending} />;
    const applied = new Set([...item.appliedActionIds, ...(item.messageId ? (sessionApplied[item.messageId] ?? []) : [])]);
    return (
      <AssistantMessage
        item={item}
        appliedIds={applied}
        showFollowUps={index === followUpIndex}
        online={online}
        canSend={canSend}
        onAction={onAction}
        onFollowUp={send}
        onRetry={send}
      />
    );
  };

  const firstUserText = items.find((i) => i.kind === 'user')?.text.trim();
  const title =
    conversationQuery.data?.title.trim() ||
    (firstUserText ? (firstUserText.length > 48 ? `${firstUserText.slice(0, 47).trimEnd()}…` : firstUserText) : '') ||
    (isNew ? t('advisor.chat.titleNew') : t('advisor.chat.titleFallback'));
  const header = <Stack.Screen options={{ title }} />;

  /* ---------------- non-chat states ---------------- */

  const notFound = (
    <Screen edges={['bottom']}>
      {header}
      <EmptyState
        icon="message-square"
        title={t('advisor.chat.notFoundTitle')}
        body={t('advisor.chat.notFoundBody')}
        action={{
          label: t('advisor.chat.backToList'),
          onPress: () => (router.canGoBack() ? router.back() : router.replace('/advisor')),
        }}
      />
    </Screen>
  );

  if (!isNew && !validId) return notFound;

  if (!businessId) {
    return (
      <Screen edges={['bottom']}>
        {header}
        {businessLoading ? (
          <LoadingState variant="text" count={3} />
        ) : (
          <EmptyState icon="briefcase" title={t('advisor.home.noBusinessTitle')} body={t('advisor.home.noBusinessBody')} />
        )}
      </Screen>
    );
  }

  const ownPending = pending !== null && pending.conversationId === routeId;
  if (validId && conversationQuery.data === null && !ownPending) return notFound;

  const loadingHistory = validId && messagesQuery.isLoading && !pending;
  const historyError = validId && messagesQuery.error && !messagesQuery.data && !pending ? messagesQuery.error : null;

  const listHeader = (
    <View style={styles.listHeader}>
      {items.length === 0 && !loadingHistory && !historyError ? (
        <View style={styles.intro}>
          <Text variant="title">{t('advisor.chat.introTitle')}</Text>
          <Text variant="callout" tone="secondary">
            {t('advisor.chat.introBody', { business: business?.name ?? '' })}
          </Text>
        </View>
      ) : null}
      <Text variant="caption" tone="secondary">
        {t('advisor.chat.aiNotice')}
      </Text>
      {loadingHistory ? <LoadingState variant="text" count={3} accessibilityLabel={t('common.states.loading')} /> : null}
      {historyError ? (
        <ErrorState error={historyError} onRetry={() => void messagesQuery.refetch()} retrying={messagesQuery.isFetching} />
      ) : null}
    </View>
  );

  const quotaNotice =
    quotaReached && !isStreaming ? (
      <InlineNotice tone="warning" title={t('advisor.chat.quotaTitle')} message={t('advisor.chat.quotaBody')} />
    ) : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} testID="advisor-conversation">
      {header}
      <OfflineBanner />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
      >
        <FlatList
          ref={listRef}
          style={styles.flex}
          data={items}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          extraData={renderItem}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={Separator}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onScroll={onScroll}
          scrollEventThrottle={32}
          onContentSizeChange={scrollToEndIfPinned}
          onLayout={scrollToEndIfPinned}
          removeClippedSubviews={false}
        />
        <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, spacing[4]) }]}>
          <View style={styles.footerInner}>
            {quotaNotice}
            <Composer
              value={draft}
              onChangeText={setDraft}
              onSend={onComposerSend}
              onStop={sender.stop}
              streaming={isStreaming}
              online={online}
              disabled={quotaReached}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
      <ActionConfirmSheet
        preview={confirm?.preview ?? null}
        currency={business?.currency ?? 'ILS'}
        submitting={applyAction.isPending}
        error={applyAction.error ? toAppError(applyAction.error) : null}
        online={online}
        onConfirm={onConfirmAction}
        onClose={() => {
          if (!applyAction.isPending) setConfirm(null);
        }}
      />
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  listContent: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.gutter,
    paddingTop: spacing[6],
    paddingBottom: spacing[6],
  },
  listHeader: { gap: spacing[4], marginBottom: spacing[6] },
  intro: { gap: spacing[2] },
  separator: { height: spacing[8] },
  footer: { paddingHorizontal: layout.gutter, paddingTop: spacing[3], borderTopWidth: StyleSheet.hairlineWidth },
  footerInner: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', gap: spacing[3] },
});
