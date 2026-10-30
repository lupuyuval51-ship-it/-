import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.fn();
vi.mock('../../api/client', async (importOriginal) => ({ ...(await importOriginal<typeof import('../../api/client')>()), api: (...a: unknown[]) => api(...a) }));
vi.mock('../push/push', () => ({ releasePushOnLogout: vi.fn().mockResolvedValue(undefined) }));

import { AuthProvider, useAuth } from '../../auth/AuthProvider';
import { I18nProvider } from '../../i18n';
import { writeReadyPrefs } from './prefs';

function SignOut() {
  const { status, logout } = useAuth();
  return (
    <button type="button" disabled={status !== 'authenticated'} onClick={() => void logout()}>
      sign out
    </button>
  );
}

describe('logout', () => {
  beforeEach(() => {
    window.localStorage.clear();
    api.mockReset();
    api.mockImplementation(async (path: string) => (path === '/auth/me' ? { user: { id: 'u1', locale: 'en', theme: 'dark' }, csrfToken: 'x' } : {}));
  });

  it('drops the saved ready-workout choices of this device', async () => {
    writeReadyPrefs('u1', { location: 'home', equipment: { home: ['dumbbells'] }, mode: 'weights', sport: 'soccer' });
    window.localStorage.setItem('fitai.locale', '"en"');
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <I18nProvider locale="en">
          <AuthProvider>
            <SignOut />
          </AuthProvider>
        </I18nProvider>
      </QueryClientProvider>,
    );
    const button = await screen.findByRole('button', { name: 'sign out' });
    await waitFor(() => expect(button).toHaveProperty('disabled', false));
    expect(window.localStorage.getItem('fitai.ready.u1')).not.toBeNull();
    fireEvent.click(button);
    await waitFor(() => expect(window.localStorage.getItem('fitai.ready.u1')).toBeNull());
  });
});
