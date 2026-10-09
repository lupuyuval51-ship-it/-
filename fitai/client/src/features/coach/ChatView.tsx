import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ApiError } from '../../api/client';
import { Button, EmptyState, ErrorState, Icon, LoadingState } from '../../components/ui';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import { MessageBubble } from './MessageBubble';
import { SuggestedPrompts } from './SuggestedPrompts';
import { flattenMessages, useThreadMessages } from './useThreadMessages';

export interface PendingMessage {
  content: string;
  /** Set when sending failed (the message was not stored). */
  error: unknown;
}

const NEAR_BOTTOM_PX = 80;

/**
 * The scrollable conversation: history (with "load earlier"), the optimistic bubble of
 * a message being sent, a typing indicator and inline send errors. It sticks to the
 * newest message unless the user has scrolled up to read.
 */
export function ChatView({
  threadId,
  pending,
  onRetry,
  onDiscard,
  onPick,
  onNew,
  sendDisabled,
}: {
  threadId: string | null;
  pending: PendingMessage | null;
  onRetry(): void;
  onDiscard(): void;
  onPick(text: string): void;
  onNew(): void;
  sendDisabled: boolean;
}) {
  const i18n = useI18n();
  const { t } = i18n;
  const query = useThreadMessages(threadId);
  const messages = flattenMessages(query.data);
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const prepend = useRef<{ height: number; top: number } | null>(null);
  const [showJump, setShowJump] = useState(false);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    stick.current = true;
    setShowJump(false);
  }, []);

  // A different conversation always opens at its latest message.
  useEffect(() => {
    stick.current = true;
    setShowJump(false);
  }, [threadId]);

  // Sending is the user's own action: follow it even if they had scrolled up.
  const pendingContent = pending?.content ?? null;
  useEffect(() => {
    if (pendingContent != null) stick.current = true;
  }, [pendingContent]);

  const lastId = messages.at(-1)?.id ?? null;
  const firstId = messages[0]?.id ?? null;
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (prepend.current) {
      // Older messages were added above: keep the visible message in place.
      el.scrollTop = el.scrollHeight - prepend.current.height + prepend.current.top;
      prepend.current = null;
      return;
    }
    // The welcome screen (no messages yet) starts at the top.
    if (messages.length === 0 && pendingContent == null) el.scrollTop = 0;
    else if (stick.current) el.scrollTop = el.scrollHeight;
    else if (lastId) setShowJump(true);
  }, [lastId, firstId, messages.length, pendingContent, pending?.error, query.isPending]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    stick.current = nearBottom;
    if (nearBottom) setShowJump(false);
  };

  const loadEarlier = () => {
    const el = scroller.current;
    if (el) prepend.current = { height: el.scrollHeight, top: el.scrollTop };
    void query.fetchNextPage();
  };

  // Hide the optimistic bubble once the stored copy is in the list (e.g. after a refetch).
  const last = messages.at(-1);
  const pendingStored = pending != null && last?.role === 'user' && last.content === pending.content;
  const showPending = pending != null && !pendingStored;
  const sending = pending != null && pending.error == null;

  let body: ReactNode;
  if (threadId && query.isPending) {
    body = <LoadingState />;
  } else if (threadId && query.isError) {
    body =
      query.error instanceof ApiError && query.error.status === 404 ? (
        <EmptyState
          icon="chat"
          title={t('coach.threadNotFound')}
          action={
            <Button variant="primary" icon="plus" onClick={onNew}>
              {t('coach.newConversation')}
            </Button>
          }
        />
      ) : (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      );
  } else if (messages.length === 0 && !showPending) {
    body = (
      <div className="coach-welcome">
        <EmptyState icon="sparkles" title={t('coach.emptyTitle')} body={t('coach.emptyBody')} />
        <SuggestedPrompts onPick={onPick} disabled={sendDisabled} />
      </div>
    );
  } else {
    body = (
      <>
        {query.hasNextPage && (
          <div className="coach-load-earlier">
            <Button size="sm" variant="ghost" icon="chevronUp" loading={query.isFetchingNextPage} onClick={loadEarlier}>
              {t('coach.loadEarlier')}
            </Button>
          </div>
        )}
        {query.isFetchNextPageError && (
          <p className="field-error" role="alert">
            {errorMessage(query.error, i18n, 'coach')}
          </p>
        )}
        <ol className="coach-message-list">
          {messages.map((m) => (
            <li key={m.id}>
              <MessageBubble message={m} />
            </li>
          ))}
          {showPending && (
            <li>
              <article className={`coach-msg coach-msg-user ${pending.error ? 'coach-msg-failed' : 'coach-msg-pending'}`} aria-label={t('coach.you')}>
                <header className="coach-msg-meta">
                  <span className="coach-msg-author">{t('coach.you')}</span>
                </header>
                <div className="coach-bubble" dir="auto">
                  <p className="coach-plain">{pending.content}</p>
                </div>
              </article>
            </li>
          )}
        </ol>
        {sending && (
          <div className="coach-typing" role="status">
            <span className="coach-typing-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span>{t('coach.typing')}</span>
          </div>
        )}
        {pending?.error != null && (
          <div className="coach-send-error" role="alert">
            <Icon name="warning" size={18} />
            <div className="coach-send-error-text">
              <strong>{t('coach.sendFailed')}</strong>
              <span>{errorMessage(pending.error, i18n, 'coach')}</span>
            </div>
            <div className="row">
              <Button size="sm" variant="primary" icon="refresh" onClick={onRetry}>
                {t('common.actions.retry')}
              </Button>
              <Button size="sm" variant="ghost" onClick={onDiscard}>
                {t('coach.discard')}
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="coach-messages-wrap">
      <div ref={scroller} className="coach-messages" onScroll={onScroll} tabIndex={0} role="region" aria-label={t('coach.messagesLabel')}>
        {body}
      </div>
      {showJump && (
        <Button size="sm" variant="secondary" icon="arrowDown" className="coach-jump" onClick={() => scrollToBottom(true)}>
          {t('coach.jumpToLatest')}
        </Button>
      )}
    </div>
  );
}
