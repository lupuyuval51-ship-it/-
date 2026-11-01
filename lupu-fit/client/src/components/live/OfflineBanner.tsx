import { useSyncExternalStore, type ReactNode } from 'react';
import { outbox, useOutbox } from '../../lib/outbox.ts';
import { useT } from '../../i18n/index.tsx';
import { Banner, Button } from '../../ui/kit.tsx';

const subscribe = (f: () => void): (() => void) => { window.addEventListener('online', f); window.addEventListener('offline', f); return () => { window.removeEventListener('online', f); window.removeEventListener('offline', f); }; };
export function useOnline(): boolean { return useSyncExternalStore(subscribe, () => navigator.onLine !== false, () => true); }

export function OfflineBanner(): ReactNode {
  const t = useT(); const online = useOnline(); const items = useOutbox();
  const pending = items.filter((i) => i.status === 'pending');
  const rejected = items.filter((i) => i.status === 'rejected');
  if (online && pending.length === 0 && rejected.length === 0) return null;
  return (
    <div className="stack-sm" data-testid="offline-banner">
      <Banner tone="warn">
        <div className="stack-sm">
          {!online ? <span>{t('live.offline.banner')}</span> : null}
          {pending.length > 0 ? <span>{t('live.offline.pending', { n: pending.length })}</span> : null}
          {online && pending.length > 0 ? <Button size="sm" onClick={() => { void outbox.flush(); }}>{t('outbox.syncNow')}</Button> : null}
        </div>
      </Banner>
      {rejected.length > 0 ? (
        <Banner tone="danger">
          <div className="stack-sm">
            <strong>{t('live.offline.rejectedTitle')}</strong>
            <span className="small">{t('outbox.rejectedHint')}</span>
            <ul className="list stack-sm">
              {rejected.map((r) => (
                <li key={r.id} className="row-between">
                  <span>{r.label}{r.error ? <span className="muted small"> ({r.error})</span> : null}</span>
                  <span className="row">
                    <Button size="sm" onClick={() => { void outbox.retryRejected(r.id).then(() => outbox.flush()); }}>{t('outbox.retry')}</Button>
                    <Button size="sm" variant="ghost" onClick={() => { void outbox.remove(r.id); }}>{t('outbox.discard')}</Button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Banner>
      ) : null}
    </div>
  );
}
