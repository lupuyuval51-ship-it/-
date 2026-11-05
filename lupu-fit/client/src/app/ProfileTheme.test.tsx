import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { setTransport } from '../api/client.ts';
import { ProfileTheme } from './ProfileTheme.tsx';

const ok = (body: unknown) => ({ status: 200, body, headers: {} });
function serve(theme: string): void {
  setTransport({
    request: async (r) => r.path === '/api/auth/me'
      ? ok({ user: { id: 'u1', username: 'u1', role: 'user' }, csrfToken: 'c', onboarded: true, mode: 'hosted' })
      : ok({ profile: { theme, language: 'en' }, targets: {} }),
  });
}
const view = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ProfileTheme /></QueryClientProvider>);

beforeEach(() => { localStorage.clear(); document.documentElement.setAttribute('data-theme', 'dark'); });

describe('ProfileTheme', () => {
  it('applies the profile theme on a device where no theme was chosen yet, without storing it', async () => {
    serve('light');
    view();
    await waitFor(() => expect(document.documentElement.getAttribute('data-theme')).toBe('light'));
    expect(localStorage.getItem('lf_theme')).toBeNull();
  });
  it('"system" follows the OS (no fixed theme attribute)', async () => {
    serve('system');
    view();
    await waitFor(() => expect(document.documentElement.hasAttribute('data-theme')).toBe(false));
  });
  it('never overrides a theme chosen on this device', async () => {
    localStorage.setItem('lf_theme', 'dark');
    serve('light');
    view();
    await new Promise((r) => setTimeout(r, 50));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
