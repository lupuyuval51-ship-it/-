/**
 * Device mode start-up: until the server inside the app is ready, this shows what it is doing (or why it
 * cannot start, and what to do) instead of the app. Once ready it renders the app; nobody signs in (the
 * worker owns the hidden device account), so there is no login screen.
 */
import { useSyncExternalStore, type ReactNode } from 'react';
import { Button, Icon, LogoMark, Spinner, Tally } from '../../components/ui';
import { useI18n, type TKey } from '../../i18n';
import type { BootFailure, BootState, BootStep } from '../../device/worker/protocol';
import '../../styles/device.css';

export interface BootSource {
  getState(): BootState;
  subscribe(listener: () => void): () => void;
  /** After storing failed while the app ran (`failed` with `unsaved`): store again instead of reloading. */
  retrySave?(): void;
}

/** Start-up steps in order (each one a tick of the progress tally). */
const STEPS: BootStep[] = ['database', 'migrating', 'content', 'account'];

const STEP_TEXT: Record<BootStep, TKey> = {
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
  const index = boot.state === 'booting' ? STEPS.indexOf(boot.step) : 0;
  return (
    <main id="main" className="device-start" data-boot={boot.state}>
      <div className="device-start-brand">
        <LogoMark size={32} />
        <span className="brand-name">{t('common.appName')}</span>
      </div>
      {boot.state === 'booting' && (
        <section className="device-start-body" role="status" aria-live="polite">
          <h1 className="device-start-title">{t('device.boot.title')}</h1>
          <Tally total={STEPS.length} done={index} size="md" label={t('device.boot.progress', { current: index + 1, total: STEPS.length })} />
          <p className="device-start-step">
            <Spinner size={18} />
            <span>{t(boot.step === 'migrating' && boot.firstLaunch ? 'device.boot.firstLaunch' : STEP_TEXT[boot.step])}</span>
          </p>
          {boot.step === 'migrating' && !boot.firstLaunch && <p className="muted small">{t('device.boot.migratingNote')}</p>}
        </section>
      )}
      {boot.state === 'locked' && (
        <section className="device-start-body" role="alert">
          <h1 className="device-start-title">{t('device.locked.title')}</h1>
          <p>{t('device.locked.body')}</p>
          <p className="device-start-step muted">
            <Spinner size={18} />
            <span>{t('device.locked.waiting')}</span>
          </p>
        </section>
      )}
      {boot.state === 'failed' && (
        <section className="device-start-body" role="alert">
          <h1 className="device-start-title">{t(boot.unsaved ? 'device.unsaved.title' : 'device.failed.title')}</h1>
          <p>{t(boot.unsaved ? (boot.reason === 'storage_full' ? 'device.unsaved.storage_full' : 'device.unsaved.storage') : FAILURE_TEXT[boot.reason])}</p>
          <p className="muted small">{t(boot.unsaved ? 'device.unsaved.keepOpen' : 'device.failed.keepTrying')}</p>
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
      {boot.state !== 'failed' && (
        <p className="device-start-local small muted">
          <Icon name="info" size={16} />
          <span>{t('device.boot.local')}</span>
        </p>
      )}
    </main>
  );
}

export function DeviceGate({ source, children }: { source: BootSource; children: ReactNode }) {
  const boot = useSyncExternalStore(source.subscribe, source.getState);
  if (boot.state === 'ready') return <>{children}</>;
  // Changes that are only in memory would be lost by a reload: store them again instead.
  const retry = boot.state === 'failed' && boot.unsaved && source.retrySave ? () => source.retrySave?.() : () => window.location.reload();
  return <DeviceStartScreen boot={boot} onRetry={retry} />;
}
