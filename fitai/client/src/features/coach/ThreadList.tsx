import type { UseQueryResult } from '@tanstack/react-query';
import type { CoachThreadListResponse, CoachThreadDTO } from '@shared/types';
import { Button, EmptyState, ErrorState, Icon, LoadingState } from '../../components/ui';
import { useI18n } from '../../i18n';
import { formatWhen } from './format';

export function ThreadList({
  query,
  selectedId,
  onSelect,
  onNew,
  newActive,
}: {
  query: UseQueryResult<CoachThreadListResponse>;
  selectedId: string | null;
  onSelect(thread: CoachThreadDTO): void;
  onNew(): void;
  /** True while an unsent new conversation is open. */
  newActive: boolean;
}) {
  const i18n = useI18n();
  const { t } = i18n;
  // Empty conversations are unsent drafts (not worth listing) unless the user is looking at one.
  const visible = (query.data?.threads ?? []).filter((x) => x.messageCount > 0 || x.id === selectedId);
  return (
    <nav className="coach-threads" aria-label={t('coach.conversations')}>
      <Button variant="primary" icon="plus" block onClick={onNew} disabled={newActive}>
        {t('coach.newConversation')}
      </Button>
      <div className="coach-thread-scroll">
        {query.isPending ? (
          <LoadingState compact />
        ) : query.isError ? (
          <ErrorState compact error={query.error} onRetry={() => void query.refetch()} />
        ) : visible.length === 0 ? (
          <EmptyState compact icon="chat" title={t('coach.noConversations')} body={t('coach.noConversationsBody')} />
        ) : (
          <ul className="coach-thread-items">
            {visible.map((thread) => {
              const active = thread.id === selectedId;
              return (
                <li key={thread.id}>
                  <button
                    type="button"
                    className={`coach-thread${active ? ' coach-thread-active' : ''}`}
                    aria-current={active ? 'true' : undefined}
                    onClick={() => onSelect(thread)}
                  >
                    <Icon name="chat" size={16} />
                    <span className="coach-thread-body">
                      <span className="coach-thread-title" dir="auto">{thread.title || t('coach.untitled')}</span>
                      <span className="coach-thread-meta">
                        <time dateTime={thread.updatedAt}>{formatWhen(thread.updatedAt, i18n)}</time>
                        <span aria-hidden="true"> · </span>
                        {t('coach.messageCount', { count: thread.messageCount })}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </nav>
  );
}
