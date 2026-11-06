import { useSyncExternalStore, type ReactNode } from 'react';
import { IS_DEVICE } from '../../env.ts';
import { outbox, useOutbox } from '../../lib/outbox.ts';
import { useT } from '../../i18n/index.tsx';
import { Banner, Button } from '../../ui/kit.tsx';

const subscribe = (f: () => void): (() => void) => { window.addEventListener('online', f); window.addEventListener('offline', f); return () => { window.removeEventListener('online', f); window.removeEventListener('offline', f); }; };
/** Raw browser connectivity (`navigator.onLine`). Only features that really use the internet (barcode lookup, optional AI proxy) care about this. */
export function useNetworkOnline(): boolean { return useSyncExternalStore(subscribe, () => navigator.onLine !== false, () => true); }
/**
 * "Can the app do its work right now?" The hosted build needs its server, so this is the connectivity. Device Mode has no server:
 * the API is the database worker on the phone, so airplane mode must change nothing (no offline strip, no "sync later", workouts finish).
 */
export function useOnline(): boolean { const net = useNetworkOnline(); return IS_DEVICE || net; }

/** Slim, persistent connection strip (only while offline or while sets wait to sync) plus a banner for items the server rejected. */
export function OfflineBanner(): ReactNode {
  const t = useT(); const online = useOnline(); const items = useOutbox();
  const pending = items.filter((i) => i.status === 'pending');
  const rejected = items.filter((i) => i.status === 'rejected');
  if (online && pending.length === 0 && rejected.length === 0) return null;
  return (
    <div className="stack-sm" data-testid="offline-banner">
      {!online || pending.length > 0 ? (
        <div className={`lv-sync ${online ? 'syncing' : 'offline'}`} role="status">
          <i className="lv-sync-dot" aria-hidden="true" />
          <span className="lv-sync-text">
            {!online ? <span>{t('live.offline.banner')}</span> : null}
            {pending.length > 0 ? <span className="lv-sync-n">{t('live.offline.pending', { n: pending.length })}</span> : null}
          </span>
          {online && pending.length > 0 ? <Button size="sm" onClick={() => { void outbox.flush(); }}>{t('outbox.syncNow')}</Button> : null}
        </div>
      ) : null}
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
