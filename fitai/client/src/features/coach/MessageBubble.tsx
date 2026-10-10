import type { CoachMessageDTO } from '@shared/types';
import { Badge, Icon } from '../../components/ui';
import { useI18n } from '../../i18n';
import { formatWhen } from './format';
import { MarkdownLite } from './markdown';

export function MessageBubble({ message }: { message: CoachMessageDTO }) {
  const i18n = useI18n();
  const { t } = i18n;
  const isUser = message.role === 'user';
  const classes = ['coach-msg', isUser ? 'coach-msg-user' : 'coach-msg-assistant', message.status !== 'ok' ? `coach-msg-${message.status}` : ''];
  return (
    <article className={classes.filter(Boolean).join(' ')} aria-label={isUser ? t('coach.you') : t('coach.coachName')}>
      {!isUser && (
        <span className="coach-avatar" aria-hidden="true">
          <Icon name="sparkles" size={16} />
        </span>
      )}
      <header className="coach-msg-meta">
        <span className="coach-msg-author">{isUser ? t('coach.you') : t('coach.coachName')}</span>
        {!isUser && message.source && (
          <span title={message.source === 'llm' ? t('coach.sourceLlmHint') : t('coach.sourceBuiltinHint')}>
            <Badge tone={message.source === 'llm' ? 'primary' : 'info'} icon={message.source === 'llm' ? 'sparkles' : 'dumbbell'}>
              {message.source === 'llm' ? t('common.ai.llmBadge') : t('common.ai.builtinBadge')}
            </Badge>
            <span className="visually-hidden">{message.source === 'llm' ? t('coach.sourceLlmHint') : t('coach.sourceBuiltinHint')}</span>
          </span>
        )}
        <time dateTime={message.createdAt}>{formatWhen(message.createdAt, i18n)}</time>
      </header>
      {message.status === 'refused' && <p className="coach-msg-status">{t('coach.refused')}</p>}
      {message.status === 'error' && <p className="coach-msg-status">{t('coach.failed')}</p>}
      <div className="coach-bubble" dir="auto">
        {isUser ? <p className="coach-plain">{message.content}</p> : <MarkdownLite text={message.content} />}
      </div>
    </article>
  );
}
