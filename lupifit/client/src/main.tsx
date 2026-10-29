// Styles first: the design system (fonts, tokens, primitives) must precede every feature/page stylesheet.
import './styles/fonts.css';
import './styles/global.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createQueryClient } from './api/queryClient';
import { App, router } from './App';
import { AuthProvider } from './auth/AuthProvider';
import { ConfirmProvider, ToastProvider } from './components/ui';
import { listenForPushNavigation } from './features/push/hooks';
import { I18nProvider } from './i18n';

const queryClient = createQueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <ConfirmProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ConfirmProvider>
        </ToastProvider>
      </QueryClientProvider>
    </I18nProvider>
  </StrictMode>,
);

// Offline app shell for the gym (production only: the dev server serves unbundled modules).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* the app works without it, just not offline */
    });
  });
}

// A tapped phone notification routes an already open window in place (see public/sw.js).
listenForPushNavigation((path) => void router.navigate(path));
