import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { LangProvider } from '../../i18n/index.tsx';
import { ToastProvider } from '../../ui/toast.tsx';

function Probe(): ReactNode { const l = useLocation(); return <output data-testid="path">{l.pathname}</output>; }

export function renderScreen(ui: ReactElement, opts: { route?: string; lang?: 'he' | 'en'; state?: unknown } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const entry = { pathname: opts.route?.split('?')[0] ?? '/', search: opts.route?.includes('?') ? `?${opts.route.split('?')[1]}` : '', state: opts.state };
  const result = render(
    <QueryClientProvider client={qc}><LangProvider initialLang={opts.lang ?? 'en'}><ToastProvider>
      <MemoryRouter initialEntries={[entry]}><Routes><Route path="*" element={<>{ui}<Probe /></>} /></Routes></MemoryRouter>
    </ToastProvider></LangProvider></QueryClientProvider>,
  );
  return { qc, ...result };
}
