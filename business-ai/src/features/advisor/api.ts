/**
 * Advisor data layer (TanStack Query + the SSE stream).
 *
 * Query keys (business-scoped, ARCHITECTURE §6):
 *   ['b', businessId, 'advisor', 'conversations']
 *   ['b', businessId, 'advisor', 'conversation', conversationId]
 *   ['b', businessId, 'advisor', 'messages', conversationId]
 *
 * Reads go through RLS (owner only). The advisor function writes messages; the app only updates
 * `ai_messages.applied_action_ids` (column grant) and performs proposed actions through normal
 * RLS writes after the user confirms them.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AdvisorAction } from '@domain/ai-api';
import type { RoadmapPhase } from '@domain/plan';
import { useLocale } from '@/i18n/I18nProvider';
import { AppErrorException, makeAppError, toAppError } from '@/lib/errors';
import { qk } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { unwrap, unwrapMaybe } from '@/lib/supabaseResult';
import { useAiUsage, useEntitlement } from '@/features/settings/api';
import { buildActionInsert, invalidationKeysFor, mergeAppliedIds, type ActionPreview, type WriteAction } from './actions';
import { MESSAGE_MAX_LENGTH, parseMessage, TITLE_MAX_LENGTH, type AdvisorMessage, type Conversation, type PendingExchange } from './conversation';
import { sanitizeActions } from './events';
import { streamAdvisor } from './sse';

export const advisorKeys = {
  all: (businessId: string) => qk.b(businessId, 'advisor'),
  conversations: (businessId: string) => qk.b(businessId, 'advisor', 'conversations'),
  conversation: (businessId: string, conversationId: string) => qk.b(businessId, 'advisor', 'conversation', conversationId),
  messages: (businessId: string, conversationId: string) => qk.b(businessId, 'advisor', 'messages', conversationId),
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True for a real conversation id (not 'new', not a malformed deep link). */
export function isConversationId(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID.test(value);
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

const CONVERSATION_LIST_LIMIT = 100;
const MESSAGE_LIMIT = 300;

interface ConversationRow {
  id: string;
  business_id: string;
  title: string;
  last_message_at: string;
  created_at: string;
  ai_messages?: { role: string; content: string }[] | null;
}

function parseConversation(row: ConversationRow): Conversation {
  const last = row.ai_messages?.[0];
  return {
    id: row.id,
    businessId: row.business_id,
    title: row.title,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    lastMessage: last ? { role: last.role === 'user' ? 'user' : 'assistant', content: last.content } : null,
  };
}

/** Conversations of one business, most recently active first, with the last message for a preview. */
export function useConversations(businessId: string | null | undefined) {
  return useQuery({
    queryKey: advisorKeys.conversations(businessId ?? ''),
    enabled: !!businessId,
    queryFn: async () => {
      const rows = unwrap(
        await supabase
          .from('ai_conversations')
          .select('id, business_id, title, last_message_at, created_at, ai_messages(role, content)')
          .eq('business_id', businessId!)
          .order('last_message_at', { ascending: false })
          .order('created_at', { referencedTable: 'ai_messages', ascending: false })
          .limit(1, { referencedTable: 'ai_messages' })
          .limit(CONVERSATION_LIST_LIMIT),
      );
      return (rows as ConversationRow[]).map(parseConversation);
    },
  });
}

/** One conversation (title, business). `null` when it doesn't exist or isn't this business's. */
export function useConversation(businessId: string | null | undefined, conversationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: advisorKeys.conversation(businessId ?? '', conversationId ?? ''),
    enabled: !!businessId && isConversationId(conversationId),
    initialData: () =>
      queryClient.getQueryData<Conversation[]>(advisorKeys.conversations(businessId ?? ''))?.find((c) => c.id === conversationId),
    initialDataUpdatedAt: () => queryClient.getQueryState(advisorKeys.conversations(businessId ?? ''))?.dataUpdatedAt,
    queryFn: async (): Promise<Conversation | null> => {
      const row = unwrapMaybe(
        await supabase
          .from('ai_conversations')
          .select('id, business_id, title, last_message_at, created_at')
          .eq('id', conversationId!)
          .eq('business_id', businessId!)
          .maybeSingle(),
      );
      return row ? parseConversation(row) : null;
    },
  });
}

/** Messages of a conversation, oldest first (the most recent MESSAGE_LIMIT). */
export function useMessages(businessId: string | null | undefined, conversationId: string | null | undefined) {
  return useQuery({
    queryKey: advisorKeys.messages(businessId ?? '', conversationId ?? ''),
    enabled: !!businessId && isConversationId(conversationId),
    queryFn: async (): Promise<AdvisorMessage[]> => {
      const rows = unwrap(
        await supabase
          .from('ai_messages')
          .select('id, role, content, actions, follow_ups, applied_action_ids, status, created_at')
          .eq('conversation_id', conversationId!)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(MESSAGE_LIMIT),
      );
      return rows.map(parseMessage).reverse();
    },
  });
}

export interface AdvisorAllowance {
  /** Monthly advisor messages in the current plan. */
  limit: number;
  used: number;
  remaining: number;
  /** False until both the entitlement and the usage are known. */
  known: boolean;
}

/** Remaining advisor messages this calendar month (display only; the server enforces). */
export function useAdvisorAllowance(): AdvisorAllowance {
  const entitlement = useEntitlement();
  const usage = useAiUsage();
  const limit = entitlement.limits.monthlyAiCalls.advisor_message;
  const used = usage.data?.advisor_message ?? 0;
  return {
    limit,
    used,
    remaining: Math.max(0, limit - used),
    known: !entitlement.isLoading && !entitlement.error && usage.data !== undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Conversation mutations                                              */
/* ------------------------------------------------------------------ */

export function useDeleteConversation(businessId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!businessId) throw new AppErrorException(makeAppError('not_found', 'No active business'));
      unwrap(await supabase.from('ai_conversations').delete().eq('id', conversationId).eq('business_id', businessId).select('id'));
      return conversationId;
    },
    onSuccess: (conversationId) => {
      if (!businessId) return;
      queryClient.setQueryData<Conversation[]>(advisorKeys.conversations(businessId), (list) => list?.filter((c) => c.id !== conversationId));
      queryClient.removeQueries({ queryKey: advisorKeys.messages(businessId, conversationId) });
      queryClient.removeQueries({ queryKey: advisorKeys.conversation(businessId, conversationId) });
      void queryClient.invalidateQueries({ queryKey: advisorKeys.conversations(businessId) });
    },
  });
}

export function useRenameConversation(businessId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const clean = title.trim().slice(0, TITLE_MAX_LENGTH);
      const row = unwrap(
        await supabase
          .from('ai_conversations')
          .update({ title: clean })
          .eq('id', id)
          .select('id, business_id, title, last_message_at, created_at')
          .single(),
      );
      return parseConversation(row);
    },
    onSuccess: (conversation) => {
      if (!businessId) return;
      queryClient.setQueryData<Conversation[]>(advisorKeys.conversations(businessId), (list) =>
        list?.map((c) => (c.id === conversation.id ? { ...c, title: conversation.title } : c)),
      );
      queryClient.setQueryData<Conversation | null>(advisorKeys.conversation(businessId, conversation.id), (c) =>
        c ? { ...c, title: conversation.title } : c,
      );
      void queryClient.invalidateQueries({ queryKey: advisorKeys.conversations(businessId) });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Sending (SSE)                                                       */
/* ------------------------------------------------------------------ */

export interface UseSendMessageOptions {
  /** The server created (or confirmed) the conversation; called once per send, on `meta`. */
  onConversationId?: (conversationId: string) => void;
}

export interface SendMessageApi {
  pending: PendingExchange | null;
  isStreaming: boolean;
  /** Sends `text` to `conversationId` (null = start a new conversation). Ignored while streaming. */
  send: (text: string, conversationId: string | null) => void;
  /** Stops the reply being streamed (keeps what arrived so far). */
  stop: () => void;
}

/** Deltas are coalesced so a fast stream re-renders at most this often (ms). */
const DELTA_FLUSH_MS = 40;

let localCounter = 0;

/**
 * Streams one exchange into local state: the user's message appears immediately (optimistic),
 * the reply grows as deltas arrive, then the conversation caches are invalidated so the persisted
 * copy takes over (see mergeMessages). Aborts on unmount.
 */
export function useSendMessage(businessId: string | null | undefined, options: UseSendMessageOptions = {}): SendMessageApi {
  const queryClient = useQueryClient();
  const { locale } = useLocale();
  const [pending, setPending] = useState<PendingExchange | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const onConversationIdRef = useRef(options.onConversationId);
  useEffect(() => {
    onConversationIdRef.current = options.onConversationId;
  }, [options.onConversationId]);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    },
    [],
  );

  const send = useCallback(
    (rawText: string, conversationId: string | null) => {
      const text = rawText.trim();
      if (!businessId || !text || controllerRef.current) return;
      const message = text.slice(0, MESSAGE_MAX_LENGTH);
      const controller = new AbortController();
      controllerRef.current = controller;
      localCounter += 1;
      const localId = `local-${Date.now()}-${localCounter}`;
      setPending({
        localId,
        text: message,
        conversationId,
        userMessageId: null,
        assistantMessageId: null,
        reply: '',
        actions: [],
        followUps: [],
        status: 'streaming',
        error: null,
      });

      const update = (patch: Partial<PendingExchange>) =>
        setPending((current) => (current && current.localId === localId ? { ...current, ...patch } : current));

      let reply = '';
      let flushTimer: ReturnType<typeof setTimeout> | null = null;
      const flush = () => {
        if (flushTimer) clearTimeout(flushTimer);
        flushTimer = null;
        update({ reply });
      };
      let currentConversationId = isConversationId(conversationId) ? conversationId : null;

      void (async () => {
        let patch: Partial<PendingExchange>;
        try {
          const outcome = await streamAdvisor(
            { businessId, conversationId: currentConversationId ?? undefined, message, locale },
            {
              signal: controller.signal,
              onEvent: (event) => {
                switch (event.event) {
                  case 'meta':
                    currentConversationId = event.data.conversationId;
                    update({ conversationId: event.data.conversationId, userMessageId: event.data.userMessageId || null });
                    onConversationIdRef.current?.(event.data.conversationId);
                    void queryClient.invalidateQueries({ queryKey: advisorKeys.conversations(businessId) });
                    break;
                  case 'delta':
                    reply += event.data.text;
                    if (!flushTimer) flushTimer = setTimeout(flush, DELTA_FLUSH_MS);
                    break;
                  case 'actions':
                    flush();
                    update({ actions: event.data.actions, followUps: event.data.followUps });
                    break;
                  case 'done':
                    flush();
                    update({ assistantMessageId: event.data.assistantMessageId || null });
                    break;
                }
              },
            },
          );
          patch = { status: outcome.status === 'done' ? 'done' : 'stopped' };
        } catch (error) {
          patch = { status: 'error', error: toAppError(error) };
        }
        flush();
        update(patch);
        if (controllerRef.current === controller) controllerRef.current = null;

        void queryClient.invalidateQueries({ queryKey: qk.me.aiUsage() });
        void queryClient.invalidateQueries({ queryKey: advisorKeys.conversations(businessId) });
        if (currentConversationId) {
          void queryClient.invalidateQueries({ queryKey: advisorKeys.messages(businessId, currentConversationId) });
          void queryClient.invalidateQueries({ queryKey: advisorKeys.conversation(businessId, currentConversationId) });
        }
      })();
    },
    [businessId, locale, queryClient],
  );

  const stop = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  return { pending, isStreaming: pending?.status === 'streaming', send, stop };
}

/* ------------------------------------------------------------------ */
/* Applying proposed actions                                           */
/* ------------------------------------------------------------------ */

export interface ApplyActionInput {
  conversationId: string;
  messageId: string;
  action: WriteAction;
  /** What the confirm sheet showed — exactly this is written. */
  preview: ActionPreview;
}

export interface ApplyActionResult {
  messageId: string;
  actionId: string;
  appliedActionIds: string[];
  /** The item was already added earlier (another device or a double tap); nothing new was written. */
  alreadyApplied: boolean;
}

async function nextSortOrder(table: 'tasks' | 'milestones' | 'recurring_expenses' | 'startup_costs', businessId: string, phase?: RoadmapPhase): Promise<number> {
  try {
    let result: { data: { sort_order: number }[] | null };
    switch (table) {
      case 'tasks':
        result = await supabase.from('tasks').select('sort_order').eq('business_id', businessId).eq('phase', phase ?? '').order('sort_order', { ascending: false }).limit(1);
        break;
      case 'milestones':
        result = await supabase.from('milestones').select('sort_order').eq('business_id', businessId).eq('phase', phase ?? '').order('sort_order', { ascending: false }).limit(1);
        break;
      case 'recurring_expenses':
        result = await supabase.from('recurring_expenses').select('sort_order').eq('business_id', businessId).order('sort_order', { ascending: false }).limit(1);
        break;
      case 'startup_costs':
        result = await supabase.from('startup_costs').select('sort_order').eq('business_id', businessId).order('sort_order', { ascending: false }).limit(1);
        break;
    }
    const max = result.data?.[0]?.sort_order;
    return typeof max === 'number' ? max + 1 : 0;
  } catch {
    return 0; // ordering is cosmetic; never block the write on it
  }
}

async function insertPreview(businessId: string, preview: ActionPreview): Promise<void> {
  const insert = buildActionInsert(businessId, preview);
  switch (insert.table) {
    case 'tasks': {
      const sort_order = await nextSortOrder('tasks', businessId, preview.kind === 'task' ? preview.phase : undefined);
      unwrap(await supabase.from('tasks').insert({ ...insert.row, sort_order }).select('id').single());
      return;
    }
    case 'milestones': {
      const sort_order = await nextSortOrder('milestones', businessId, preview.kind === 'milestone' ? preview.phase : undefined);
      unwrap(await supabase.from('milestones').insert({ ...insert.row, sort_order }).select('id').single());
      return;
    }
    case 'recurring_expenses': {
      const sort_order = await nextSortOrder('recurring_expenses', businessId);
      unwrap(await supabase.from('recurring_expenses').insert({ ...insert.row, sort_order }).select('id').single());
      return;
    }
    case 'startup_costs': {
      const sort_order = await nextSortOrder('startup_costs', businessId);
      unwrap(await supabase.from('startup_costs').insert({ ...insert.row, sort_order }).select('id').single());
      return;
    }
  }
}

/**
 * Performs a proposed action after the user confirmed it: verifies the action belongs to the
 * persisted message and wasn't applied yet, inserts the row through RLS (source 'advisor' /
 * basis 'ai_estimate'), records the id in `ai_messages.applied_action_ids`, and invalidates the
 * affected feature (['b', id, 'roadmap'] or ['b', id, 'finance']).
 */
export function useApplyAction(businessId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId, action, preview }: ApplyActionInput): Promise<ApplyActionResult> => {
      if (!businessId) throw new AppErrorException(makeAppError('not_found', 'No active business'));
      const message = unwrap(await supabase.from('ai_messages').select('id, actions, applied_action_ids').eq('id', messageId).single());
      const actions = sanitizeActions(message.actions);
      if (!actions.some((a) => a.id === action.id && a.type === action.type)) {
        throw new AppErrorException(makeAppError('not_found', 'Action is not part of this message'));
      }
      const applied = message.applied_action_ids ?? [];
      if (applied.includes(action.id)) {
        return { messageId, actionId: action.id, appliedActionIds: applied, alreadyApplied: true };
      }

      await insertPreview(businessId, preview);

      const next = mergeAppliedIds(applied, action.id, actions);
      // The row is written; recording "applied" is retried once and never reported as a failure
      // of the action itself (the cache below still marks it, so it can't be added twice here).
      for (let attempt = 0; attempt < 2; attempt++) {
        const { error } = await supabase.from('ai_messages').update({ applied_action_ids: next }).eq('id', messageId).select('id').single();
        if (!error) break;
      }
      return { messageId, actionId: action.id, appliedActionIds: next, alreadyApplied: false };
    },
    onSuccess: (result, input) => {
      if (!businessId) return;
      queryClient.setQueryData<AdvisorMessage[]>(advisorKeys.messages(businessId, input.conversationId), (list) =>
        list?.map((m) => (m.id === result.messageId ? { ...m, appliedActionIds: result.appliedActionIds } : m)),
      );
      for (const key of invalidationKeysFor(businessId, input.action)) void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

/** Opens the plan section an `open_plan_section` proposal points to (navigation only, no write). */
export function useOpenPlanSection() {
  const router = useRouter();
  return useCallback(
    (action: Extract<AdvisorAction, { type: 'open_plan_section' }>) => {
      router.push(`/plan/${action.sectionKey}`);
    },
    [router],
  );
}

