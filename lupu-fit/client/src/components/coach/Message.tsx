import type { ReactNode } from 'react';
import { useT } from '../../i18n/index.tsx';
import { renderMarkdown } from '../../lib/markdown.ts';
import { IconButton } from '../../ui/kit.tsx';
import { IconCopy, IconShield } from '../../ui/icons.tsx';
import type { CoachMsg } from './types.ts';

export function providerLabelKey(p: string | null): string | null {
  if (!p) return null;
  if (p === 'safety') return 'coach.provider.safety';
  if (p === 'rules') return 'coach.provider.rules';
  return 'coach.provider.ai';
}

/** One chat bubble. Safety replies (safetyCategory on an assistant message) get alert styling; text is rendered as safe markdown. */
export function Message({ m, onCopy }: { m: CoachMsg; onCopy: (text: string) => void }): ReactNode {
  const t = useT();
  const safety = m.role === 'assistant' && !!m.safetyCategory;
  const pk = m.role === 'assistant' ? providerLabelKey(m.provider) : null;
  const body = (
    <>
      {safety ? <div className="msg-head"><IconShield aria-label={t('coach.safety.title')} /><strong>{t('coach.safety.title')}</strong></div> : null}
      <div className="md">{renderMarkdown(m.content)}</div>
      {m.role === 'assistant' ? (
        <div className="msg-foot">
          {pk ? <span className="small muted">{t(pk)}</span> : <span />}
          <IconButton label={t('coach.copyMessage')} onClick={() => onCopy(m.content)}><IconCopy /></IconButton>
        </div>
      ) : null}
    </>
  );
  return safety
    ? <div className="msg msg-assistant msg-safety" role="alert" data-testid="safety-message">{body}</div>
    : <div className={`msg ${m.role === 'user' ? 'msg-user' : 'msg-assistant'}`} data-testid={`message-${m.role}`}>{body}</div>;
}
