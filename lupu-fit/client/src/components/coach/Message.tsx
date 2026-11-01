import type { ReactNode } from 'react';
import { fmt, useLang, useT } from '../../i18n/index.tsx';
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

/** Emergency / helpline numbers mentioned in a safety reply (deduplicated, in order). */
export function helplineNumbers(text: string): string[] {
  const found = text.match(/\b(?:101|100|1201|988|911|112)\b/g) ?? [];
  return [...new Set(found)];
}

const SOS_CATEGORIES = new Set(['self_harm', 'medical_emergency', 'eating_disorder']);

/** One chat bubble. Safety replies get a calm alert card with tap-to-call helplines; text is rendered as safe markdown. */
export function Message({ m, onCopy }: { m: CoachMsg; onCopy: (text: string) => void }): ReactNode {
  const t = useT(); const { lang } = useLang();
  const safety = m.role === 'assistant' && !!m.safetyCategory;
  const pk = m.role === 'assistant' ? providerLabelKey(m.provider) : null;
  const time = m.createdAt ? fmt.date(m.createdAt, lang, { hour: '2-digit', minute: '2-digit' }) : null;
  if (safety) {
    const nums = SOS_CATEGORIES.has(m.safetyCategory ?? '') ? helplineNumbers(m.content) : [];
    return (
      <div className="msg msg-assistant msg-safety" role="alert" data-testid="safety-message">
        <div className="msg-head"><IconShield aria-hidden="true" /><strong>{t('coach.safety.title')}</strong><span className="tiny muted">{t('coach.provider.safety')}</span></div>
        {nums.length > 0 ? (
          <div className="helplines" aria-label={t('coach.safety.helplines')}>
            {nums.map((n) => <a key={n} className="helpline" href={`tel:${n}`}><span className="tiny muted">{t('coach.safety.call')}</span><span className="num">{n}</span></a>)}
          </div>
        ) : null}
        <div className="md">{renderMarkdown(m.content)}</div>
        <div className="msg-foot"><span className="small muted">{t('coach.safety.note')}</span><IconButton label={t('coach.copyMessage')} onClick={() => onCopy(m.content)}><IconCopy /></IconButton></div>
      </div>
    );
  }
  const user = m.role === 'user';
  return (
    <div className={`msg ${user ? 'msg-user' : 'msg-assistant'}`} data-testid={`message-${m.role}`}>
      {!user ? <div className="msg-who tiny muted">{t('coach.who')}{pk ? ` · ${t(pk)}` : ''}</div> : null}
      <div className="md">{renderMarkdown(m.content)}</div>
      <div className="msg-foot">
        {time ? <span className="tiny muted num">{time}</span> : <span />}
        {!user ? <IconButton label={t('coach.copyMessage')} onClick={() => onCopy(m.content)}><IconCopy /></IconButton> : null}
      </div>
    </div>
  );
}
