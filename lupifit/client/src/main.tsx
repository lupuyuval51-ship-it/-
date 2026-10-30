// Styles first: the design system (fonts, tokens, primitives) must precede every feature/page stylesheet.
import './styles/fonts.css';
import './styles/global.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { createQueryClient } from './api/queryClient';
import { App, router } from './App';
import { AuthProvider } from './auth/AuthProvider';
import { ConfirmProvider, ToastProvider } from './components/ui';
import { PhoneReminderSync } from './features/gamification/PhoneReminderSync';
import { listenForPushNavigation } from './features/push/hooks';
import { I18nProvider } from './i18n';
import { isDeviceMode, isNativeApp } from './platform';

const queryClient = createQueryClient();
const root = createRoot(document.getElementById('root')!);

const app = (
  <QueryClientProvider client={queryClient}>
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <App />
          {/* Android app: keeps the phone's scheduled reminders in step (no-op elsewhere). Outside the
              router's signed-in shell so a fresh account (after deleting one) also clears them. */}
          <PhoneReminderSync />
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  </QueryClientProvider>
);

const render = (content: ReactNode) =>
  root.render(
    <StrictMode>
      <I18nProvider>{content}</I18nProvider>
    </StrictMode>,
  );

if (isDeviceMode) {
  // Device mode (a build-time constant): the server runs inside the app, in a worker. The app renders once
  // it is ready; until then the gate shows what it is doing. Server-mode builds drop this branch.
  void import('./features/device/start').then(async ({ startDevice, DeviceGate, installNative }) => {
    const device = startDevice();
    // The Android app's native parts (no-op in a browser), installed before the first render uses them.
    await installNative({ navigate: (path, opts) => void router.navigate(path, opts) });
    render(<DeviceGate source={device}>{app}</DeviceGate>);
  });
} else {
  render(app);
}

// Offline app shell for the gym (production only: the dev server serves unbundled modules). The Android
// app loads its files from the app package, so it needs no service worker.
if (import.meta.env.PROD && 'serviceWorker' in navigator && !isNativeApp()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* the app works without it, just not offline */
    });
  });
}

// A tapped phone notification routes an already open window in place (see public/sw.js).
listenForPushNavigation((path) => void router.navigate(path));
