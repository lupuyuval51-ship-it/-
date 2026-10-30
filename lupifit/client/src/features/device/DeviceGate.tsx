/**
 * Device mode start-up: until the server inside the app is ready, this shows what it is doing (or why it
 * cannot start) instead of the app. Once ready it renders the app; nobody signs in (the worker owns the
 * hidden device account), so there is no login screen.
 */
import { useSyncExternalStore, type ReactNode } from 'react';
import { Button, LogoMark, Spinner } from '../../components/ui';
import { useI18n, type TKey } from '../../i18n';
import type { BootFailure, BootState } from '../../device/worker/protocol';
import '../../styles/device.css';

export interface BootSource {
  getState(): BootState;
  subscribe(listener: () => void): () => void;
}

const STEP_TEXT: Record<Extract<BootState, { state: 'booting' }>['step'], TKey> = {
  database: 'device.boot.database',
  migrating: 'device.boot.migrating',
  content: 'device.boot.content',
  account: 'device.boot.account',
};

const FAILURE_TEXT: Record<BootFailure, TKey> = {
  unsupported: 'device.failed.unsupported',
  storage_full: 'device.failed.storage_full',
  storage: 'device.failed.storage',
  migration: 'device.failed.migration',
  account: 'device.failed.account',
  unknown: 'device.failed.unknown',
};

export function DeviceStartScreen({ boot, onRetry }: { boot: Exclude<BootState, { state: 'ready' }>; onRetry(): void }) {
  const { t } = useI18n();
  return (
    <main id="main" className="device-start" data-boot={boot.state}>
      <div className="device-start-brand">
        <LogoMark size={32} />
        <span className="brand-name">{t('common.appName')}</span>
      </div>
      {boot.state === 'booting' && (
        <section className="device-start-body" role="status" aria-live="polite">
          <h1 className="device-start-title">{t('device.boot.title')}</h1>
          <p className="device-start-step">
            <Spinner size={18} />
            <span>{t(boot.step === 'migrating' && boot.firstLaunch ? 'device.boot.firstLaunch' : STEP_TEXT[boot.step])}</span>
          </p>
          <p className="muted">{t('device.boot.local')}</p>
        </section>
      )}
      {boot.state === 'locked' && (
        <section className="device-start-body" role="alert">
          <h1 className="device-start-title">{t('device.locked.title')}</h1>
          <p>{t('device.locked.body')}</p>
        </section>
      )}
      {boot.state === 'failed' && (
        <section className="device-start-body" role="alert">
          <h1 className="device-start-title">{t('device.failed.title')}</h1>
          <p>{t(FAILURE_TEXT[boot.reason])}</p>
          <Button variant="primary" icon="refresh" onClick={onRetry}>
            {t('device.failed.retry')}
          </Button>
          {boot.detail && (
            <details className="device-start-details">
              <summary>{t('device.failed.details')}</summary>
              <code dir="ltr">{boot.detail}</code>
            </details>
          )}
        </section>
      )}
    </main>
  );
}

export function DeviceGate({ source, children }: { source: BootSource; children: ReactNode }) {
  const boot = useSyncExternalStore(source.subscribe, source.getState);
  if (boot.state === 'ready') return <>{children}</>;
  return <DeviceStartScreen boot={boot} onRetry={() => window.location.reload()} />;
}
