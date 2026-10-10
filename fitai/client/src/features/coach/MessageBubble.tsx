import type { CoachMessageDTO } from '@shared/types';
import { Badge, IconButton, useToast } from '../../components/ui';
import { useI18n } from '../../i18n';
import '../../styles/ux-coach.css';
import { copyText } from './clipboard';
import { formatWhen } from './format';
import { MarkdownLite } from './markdown';

export function MessageBubble({ message }: { message: CoachMessageDTO }) {
  const i18n = useI18n();
  const { t } = i18n;
  const toast = useToast();
  const isUser = message.role === 'user';
  const isSafety = !isUser && message.safety != null;
  const classes = ['coach-msg', isUser ? 'coach-msg-user' : 'coach-msg-assistant', message.status !== 'ok' ? `coach-msg-${message.status}` : '', isSafety ? 'coach-msg-safety' : ''];

  const copy = async () => {
    if (await copyText(message.content)) toast.success(t('coach.copied'));
    else toast.error(t('coach.copyFailed'));
  };

  return (
    <article className={classes.filter(Boolean).join(' ')} aria-label={isUser ? t('coach.you') : t('coach.coachName')}>
      <header className="coach-msg-meta">
        <span className="coach-msg-author">{isUser ? t('coach.you') : t('coach.coachName')}</span>
        {isSafety && (
          <Badge tone="warning" icon="warning">
            {t('coach.safetyBadge')}
          </Badge>
        )}
        {!isUser && message.source && (
          <span title={message.source === 'llm' ? t('coach.sourceLlmHint') : t('coach.sourceBuiltinHint')}>
            <Badge tone={message.source === 'llm' ? 'primary' : 'info'} icon={message.source === 'llm' ? 'sparkles' : 'dumbbell'}>
              {message.source === 'llm' ? t('common.ai.llmBadge') : t('common.ai.builtinBadge')}
            </Badge>
            <span className="visually-hidden">{message.source === 'llm' ? t('coach.sourceLlmHint') : t('coach.sourceBuiltinHint')}</span>
          </span>
        )}
        <time dateTime={message.createdAt}>{formatWhen(message.createdAt, i18n)}</time>
        {!isUser && message.status === 'ok' && <IconButton icon="copy" size="sm" className="coach-copy" label={t('coach.copy')} onClick={() => void copy()} />}
      </header>
      {message.status === 'refused' && <p className="coach-msg-status">{t('coach.refused')}</p>}
      {message.status === 'error' && <p className="coach-msg-status">{t('coach.failed')}</p>}
      <div className="coach-bubble" dir="auto">
        {isUser ? <p className="coach-plain">{message.content}</p> : <MarkdownLite text={message.content} />}
      </div>
      {message.safety && <p className="coach-safety-note small">{t(`coach.safetyNote.${message.safety}`)}</p>}
    </article>
  );
}
