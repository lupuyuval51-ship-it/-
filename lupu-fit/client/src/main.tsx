import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createDeviceTransport } from './api/client.ts';
import { App } from './app/App.tsx';
import { IS_DEVICE } from './env.ts';
import { LangProvider, useT } from './i18n/index.tsx';
import { isNativeShell, setupServiceWorker } from './lib/serviceWorker.ts';
import { applyTheme, getTheme } from './lib/theme.ts';
import './styles/tokens.css';
import './styles/base.css';
import './styles/polish.css';
import './styles/update.css';

applyTheme(getTheme());
const root = createRoot(document.getElementById('root') as HTMLElement);

function OneTab() {
  const t = useT();
  return <main className="main center-screen"><div className="card stack center"><h2>{t('device.oneTabTitle')}</h2><p className="muted">{t('device.oneTabBody')}</p></div></main>;
}
function Fatal({ message }: { message: string }) {
  const t = useT();
  return <main className="main center-screen"><div className="card stack center"><h2>{t('device.bootFailed')}</h2><p className="muted small num">{message}</p><button type="button" className="btn btn-primary" onClick={() => location.reload()}>{t('app.retry')}</button></div></main>;
}

function start(): void {
  if (IS_DEVICE) {
    const worker = new Worker(new URL('./device/deviceWorker.ts', import.meta.url), { type: 'module' });
    const tr = createDeviceTransport(worker);
    tr.onFatal((e) => root.render(<LangProvider><Fatal message={e.message} /></LangProvider>));
  }
  root.render(<StrictMode><App /></StrictMode>);
}

if (IS_DEVICE && typeof navigator !== 'undefined' && 'locks' in navigator) {
  // Single-writer guard: PGlite in IndexedDB must only ever be open in ONE tab.
  void navigator.locks.request('lupu-fit-db-writer', { ifAvailable: true }, async (lock) => {
    if (!lock) { root.render(<LangProvider><OneTab /></LangProvider>); return; }
    start();
    await new Promise<never>(() => undefined); // hold the lock for the lifetime of the page
  });
} else start();

window.addEventListener('load', () => { void setupServiceWorker({ prod: import.meta.env.PROD, device: IS_DEVICE, native: IS_DEVICE && isNativeShell() }); });
