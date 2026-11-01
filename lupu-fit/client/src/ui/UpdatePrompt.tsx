import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useT } from '../i18n/index.tsx';


/**
 * Calm "new version available" prompt. The service worker installs the new version in the background and waits;
 * nothing changes under the user (an active workout is never reloaded) until they choose to reload.
 */
export function UpdatePrompt(): ReactNode {
  const t = useT();
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const reloading = useRef(false);

  useEffect(() => {
    const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined;
    if (!sw) return undefined;
    let reg: ServiceWorkerRegistration | undefined;
    const watch = (r: ServiceWorkerRegistration): void => {
      reg = r;
      if (r.waiting && sw.controller) setWaiting(r.waiting);
      r.addEventListener('updatefound', () => {
        const nw = r.installing;
        nw?.addEventListener('statechange', () => { if (nw.state === 'installed' && sw.controller) setWaiting(nw); });
      });
    };
    void sw.getRegistration().then((r) => { if (r) watch(r); }).catch(() => undefined);
    const onChange = (): void => { if (reloading.current) location.reload(); };
    sw.addEventListener('controllerchange', onChange);
    const onVisible = (): void => { if (document.visibilityState === 'visible') void reg?.update().catch(() => undefined); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { sw.removeEventListener('controllerchange', onChange); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  if (!waiting) return null;
  return (
    <div className="update-bar" role="status">
      <span className="grow">{t('pwa.update.text')}</span>
      <button type="button" className="btn btn-ghost" onClick={() => setWaiting(null)}>{t('pwa.update.later')}</button>
      <button type="button" className="btn" onClick={() => { reloading.current = true; waiting.postMessage({ type: 'skip-waiting' }); }}>{t('pwa.update.reload')}</button>
    </div>
  );
}
