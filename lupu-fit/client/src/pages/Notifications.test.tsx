import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { calls, handlers, renderPage, resetApi } from './test-harness.tsx';

vi.mock('../api/client.ts', async (orig) => ({ ...(await orig<typeof import('../api/client.ts')>()), api: (await import('./test-harness.tsx')).apiStub }));
const { default: Notifications } = await import('./Notifications.tsx');

beforeEach(resetApi);

describe('Notifications', () => {
  it('shows translated achievement titles, an unread marker and marks all read', async () => {
    let read = false;
    handlers['GET /api/notifications'] = () => ({ notifications: [{ id: 'n1', kind: 'achievement', payload: { id: 'first_workout' }, read, createdAt: '2026-10-05T10:00:00Z' }] });
    handlers['POST /api/notifications/read'] = () => { read = true; return { ok: true }; };
    renderPage(<Notifications />, { lang: 'he' });
    expect(await screen.findByText('אימון ראשון')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'לא נקרא' })).toBeInTheDocument();
    expect(screen.getByText(/התזכורות לאימון|תזכורות לאימון ולארוחות הן מקומיות/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'סימון הכול כנקרא' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/api/notifications/read')).toBe(true));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'סימון הכול כנקרא' })).toBeNull());
  });
  it('honest empty state in English', async () => {
    handlers['GET /api/notifications'] = () => ({ notifications: [] });
    renderPage(<Notifications />, { lang: 'en' });
    expect(await screen.findByText('No notifications yet')).toBeInTheDocument();
    expect(screen.getByText(/reminders are local/)).toBeInTheDocument();
  });
});
