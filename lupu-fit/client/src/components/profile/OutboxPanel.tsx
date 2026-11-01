import { type ReactNode } from 'react';
import { fmt, useLang, useT } from '../../i18n/index.tsx';
import { outbox, useOutbox } from '../../lib/outbox.ts';
import { Button, Tag } from '../../ui/kit.tsx';
import { Disclosure } from '../../ui/patterns.tsx';

export function OutboxPanel(): ReactNode {
  const t = useT(); const { lang } = useLang();
  const items = useOutbox();
  const pending = items.filter((i) => i.status === 'pending').length;
  return (
    <Disclosure summary={`${t('outbox.title')}${items.length > 0 ? ` (${items.length})` : ''}`} open={items.length > 0}>
      {items.length === 0 ? <span className="small muted">{t('outbox.empty')}</span> : (
        <ul className="list">
          {items.map((i) => (
            <li key={i.id}>
              <div className="grow">
                <strong>{i.label}</strong><br />
                <span className="small muted">{fmt.date(new Date(i.createdAt).toISOString(), lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                {i.status === 'rejected' ? <><br /><span className="small">{t('outbox.rejectedHint')}{i.error ? ` (${i.error})` : ''}</span></> : null}
              </div>
              <Tag tone={i.status === 'rejected' ? 'danger' : 'warning'}>{i.status === 'rejected' ? t('outbox.rejected') : t('outbox.pending')}</Tag>
              {i.status === 'rejected' ? <Button size="sm" onClick={() => void outbox.retryRejected(i.id).then(() => outbox.flush())}>{t('outbox.retry')}</Button> : null}
              <Button size="sm" variant="ghost" onClick={() => void outbox.remove(i.id)}>{t('outbox.discard')}</Button>
            </li>
          ))}
        </ul>
      )}
      <Button onClick={() => void outbox.flush()} disabled={pending === 0}>{t('outbox.syncNow')}</Button>
    </Disclosure>
  );
}
