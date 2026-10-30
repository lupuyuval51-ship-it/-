import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { LIMITS } from '@shared/constants';
import type { CoachThreadDTO, CoachThreadListResponse, SendCoachMessageResponse } from '@shared/types';
import { ApiError } from '../../api/client';
import { qk } from '../../api/queryClient';
import { Badge, IconButton, LoadingState, Modal, Notice, PageHeader, useConfirm, useToast } from '../../components/ui';
import { ChatView, type PendingMessage } from '../../features/coach/ChatView';
import { Composer, type ComposerHandle } from '../../features/coach/Composer';
import { coachApi } from '../../features/coach/api';
import { plainText } from '../../features/coach/format';
import { RenameThreadModal } from '../../features/coach/RenameThreadModal';
import { ThreadList } from '../../features/coach/ThreadList';
import { appendMessages, emptyMessages } from '../../features/coach/useThreadMessages';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useDraft } from '../../hooks/useDraft';
import { useIdempotentMutation } from '../../hooks/useIdempotentMutation';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import '../../styles/coach.css';
import '../../styles/ux-coach.css';

interface SendVars {
  /** null = start a new conversation with this message. */
  threadId: string | null;
  content: string;
}

interface SendResult {
  threadId: string;
  res: SendCoachMessageResponse;
}

export default function CoachPage() {
  const i18n = useI18n();
  const { t } = i18n;
  useDocumentTitle(t('coach.title'));
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const threadParam = params.get('thread');
  // `/coach?q=…` (e.g. from an exercise page) pre-fills a new conversation; it is never sent automatically.
  // An unsent message survives a reload (a link with ?q= prefills it instead and is not stored).
  const [draft, setDraft] = useDraft('coach.message', (params.get('q') ?? '').slice(0, LIMITS.coachMessageMaxChars), { enabled: !params.has('q') });
  const [newMode, setNewMode] = useState(() => params.has('q'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [renaming, setRenaming] = useState<CoachThreadDTO | null>(null);
  const [announcement, setAnnouncement] = useState('');
  /** Conversation the current/failed send belongs to (null = a new conversation). */
  const [sendThread, setSendThread] = useState<string | null>(null);
  const composer = useRef<ComposerHandle>(null);

  useEffect(() => {
    if (!params.has('q')) return;
    const next = new URLSearchParams(params);
    next.delete('q');
    setParams(next, { replace: true });
    composer.current?.focus();
    // Runs once on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status = useQuery({ queryKey: qk.coachStatus, queryFn: coachApi.status });
  const threads = useQuery({ queryKey: qk.coachThreads, queryFn: coachApi.threads });

  // A conversation without messages is an unsent draft (e.g. the first send failed): never default to it.
  const latestId = threads.data?.threads.find((x) => x.messageCount > 0)?.id ?? null;
  const selectedId = threadParam ?? (newMode ? null : latestId);
  const selectedThread = threads.data?.threads.find((x) => x.id === selectedId) ?? null;
  const waitingForThreads = threadParam == null && !newMode && threads.isPending;

  /** Thread created by a first send that has not stored a message yet. */
  const orphan = useRef<string | null>(null);

  /** Removes the empty conversation left behind by a failed first send, and forgets the failed message. */
  const cleanupOrphan = () => {
    const id = orphan.current;
    if (!id) return;
    orphan.current = null;
    void coachApi
      .deleteThread(id)
      .catch(() => undefined)
      .finally(() => {
        queryClient.removeQueries({ queryKey: qk.coachMessages(id) });
        void queryClient.invalidateQueries({ queryKey: qk.coachThreads });
      });
  };

  const selectThread = (id: string | null) => {
    if (send.isError && id !== orphan.current) {
      cleanupOrphan();
      send.reset();
    }
    setNewMode(id == null);
    setParams(id ? { thread: id } : {});
    setDrawerOpen(false);
  };

  const send = useIdempotentMutation<SendResult, SendVars, unknown>(
    async (vars, key) => {
      let threadId = vars.threadId;
      if (!threadId) {
        // Same idempotency key family: a retry re-uses the conversation created by the first attempt.
        const created = await coachApi.createThread('', `${key}-new`);
        threadId = created.thread.id;
        orphan.current = threadId;
        queryClient.setQueryData(qk.coachMessages(threadId), emptyMessages());
        setSendThread(threadId);
        setNewMode(false);
        setParams({ thread: threadId }, { replace: true });
        void queryClient.invalidateQueries({ queryKey: qk.coachThreads });
      }
      const res = await coachApi.send(threadId, vars.content, key);
      return { threadId, res };
    },
    {
      onSuccess: ({ threadId, res }) => {
        orphan.current = null;
        appendMessages(queryClient, threadId, [res.userMessage, res.reply]);
        queryClient.setQueryData(qk.coachStatus, res.status);
        for (const key of [qk.coachThreads, qk.dashboard, qk.gamification, qk.notifications]) void queryClient.invalidateQueries({ queryKey: key });
        setAnnouncement(t('coach.replyAnnouncement', { text: plainText(res.reply.content) }));
      },
      onError: (err) => {
        if (err instanceof ApiError && (err.status === 429 || err.status === 404)) {
          void queryClient.invalidateQueries({ queryKey: qk.coachStatus });
          void queryClient.invalidateQueries({ queryKey: qk.coachThreads });
        }
      },
    },
  );

  const sendVars = send.variables?.vars;
  const sendTarget = sendThread ?? sendVars?.threadId ?? null;
  const pending: PendingMessage | null =
    (send.isPending || send.isError) && sendVars && sendTarget === selectedId ? { content: sendVars.content, error: send.isError ? send.error : null } : null;

  const startSend = (content: string) => {
    if (send.isPending) return;
    setSendThread(selectedId);
    setAnnouncement('');
    send.mutate({ threadId: selectedId, content });
    setDraft('');
  };

  const discardFailed = () => {
    const content = sendVars?.content ?? '';
    const hadOrphan = orphan.current != null;
    // A failed FIRST message must not leave an empty conversation behind.
    cleanupOrphan();
    send.reset();
    if (hadOrphan) selectThread(null);
    setDraft((d) => d || content);
    composer.current?.focus();
  };

  const remove = useMutation({
    mutationFn: (id: string) => coachApi.deleteThread(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: qk.coachMessages(id) });
      queryClient.setQueryData<CoachThreadListResponse>(qk.coachThreads, (old) => (old ? { threads: old.threads.filter((x) => x.id !== id) } : old));
      void queryClient.invalidateQueries({ queryKey: qk.coachThreads });
      toast.success(t('coach.deleted'));
      if (id === selectedId) {
        setNewMode(false);
        setParams({});
      }
    },
    onError: (err) => toast.error(errorMessage(err, i18n, 'coach')),
  });

  const onDelete = async () => {
    if (!selectedThread || remove.isPending) return;
    const ok = await confirm({
      title: t('coach.deleteConfirmTitle'),
      body: t('coach.deleteConfirmBody', { title: selectedThread.title || t('coach.untitled') }),
      confirmLabel: t('common.actions.delete'),
      danger: true,
    });
    if (ok) remove.mutate(selectedThread.id);
  };

  const quotaReached = status.data != null && status.data.remainingToday <= 0;
  const subtitle = status.isPending ? (
    t('coach.subtitle')
  ) : status.isError ? (
    <>
      {errorMessage(status.error, i18n, 'coach')}{' '}
      <button type="button" className="link coach-link-btn" onClick={() => void status.refetch()}>
        {t('common.actions.retry')}
      </button>
    </>
  ) : (
    t('coach.remaining', { count: status.data.remainingToday, limit: status.data.dailyLimit })
  );

  const threadList = (
    <ThreadList query={threads} selectedId={selectedId} newActive={selectedId == null} onSelect={(thread) => selectThread(thread.id)} onNew={() => selectThread(null)} />
  );

  return (
    <div className="coach-page">
      <PageHeader title={t('coach.title')} subtitle={<span className="coach-remaining">{subtitle}</span>} />
      {status.data && !status.data.llmConfigured && (
        <Notice tone="info" icon="info">
          {t('coach.builtinMode')}
        </Notice>
      )}
      {status.data && (
        <p className="coach-mode small muted" data-mode={status.data.llmConfigured ? 'ai' : 'builtin'}>
          <Badge tone={status.data.llmConfigured ? 'primary' : 'info'} icon={status.data.llmConfigured ? 'sparkles' : 'dumbbell'}>
            {status.data.llmConfigured ? t('coach.modeAi') : t('coach.modeBuiltin')}
          </Badge>
          <span>{status.data.llmConfigured ? t('coach.modeAiHint') : t('coach.modeBuiltinHint')}</span>
        </p>
      )}
      {status.data?.provider === 'gemini' && (
        <Notice tone="warning" icon="info">
          {t('coach.geminiNotice')}
        </Notice>
      )}
      <div className="coach-layout">
        <aside className="coach-sidebar">{threadList}</aside>
        <section className="coach-chat" aria-labelledby="coach-chat-title">
          <header className="coach-chat-header">
            <IconButton icon="menu" label={t('coach.conversations')} className="coach-drawer-btn" onClick={() => setDrawerOpen(true)} />
            <h2 id="coach-chat-title" className="coach-chat-title" dir="auto">
              {selectedThread?.title || t('coach.untitled')}
            </h2>
            {selectedThread && (
              <>
                <IconButton icon="edit" label={t('coach.rename')} onClick={() => setRenaming(selectedThread)} />
                <IconButton icon="trash" label={t('coach.delete')} loading={remove.isPending} onClick={() => void onDelete()} />
              </>
            )}
            <IconButton icon="plus" label={t('coach.newConversation')} className="coach-new-compact" onClick={() => selectThread(null)} />
          </header>
          {waitingForThreads ? (
            <div className="coach-messages-wrap">
              <LoadingState />
            </div>
          ) : (
            <ChatView
              key={selectedId ?? 'new'}
              threadId={selectedId}
              pending={pending}
              onRetry={() => send.retryLast()}
              onDiscard={discardFailed}
              onPick={startSend}
              onNew={() => selectThread(null)}
              sendDisabled={send.isPending || quotaReached}
            />
          )}
          {quotaReached && status.data && (
            <div className="coach-quota">
              <Notice tone="warning">{t('coach.limitReached', { limit: status.data.dailyLimit, time: i18n.formatTime(status.data.resetsAt) })}</Notice>
            </div>
          )}
          <Composer ref={composer} value={draft} onChange={setDraft} onSend={startSend} pending={send.isPending} disabled={quotaReached || waitingForThreads} />
          <p className="coach-disclaimer">{t('common.disclaimer')}</p>
        </section>
      </div>
      <Modal open={drawerOpen} onClose={() => setDrawerOpen(false)} title={t('coach.conversations')}>
        {threadList}
      </Modal>
      <RenameThreadModal thread={renaming} onClose={() => setRenaming(null)} />
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </div>
  );
}
