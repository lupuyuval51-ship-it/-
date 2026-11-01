import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { handlers, renderPage, resetApi, withProfile } from './test-harness.tsx';

vi.mock('../api/client.ts', async (orig) => ({ ...(await orig<typeof import('../api/client.ts')>()), api: (await import('./test-harness.tsx')).apiStub }));
const { default: Exercises } = await import('./Exercises.tsx');

beforeEach(() => { resetApi(); handlers['GET /api/profile'] = () => withProfile({ injuries: ['wrist'], equipment: [] }); });

describe('Exercises page', () => {
  it('searches instantly in Hebrew (final letters, niqqud) and keeps the query in the URL-driven state', async () => {
    renderPage(<Exercises />);
    const box = screen.getByRole('searchbox', { name: 'חיפוש תרגילים' });
    fireEvent.change(box, { target: { value: 'שְׁכִיבוֹת סמיכה' } });
    await waitFor(() => expect(screen.getAllByRole('link').some((a) => a.getAttribute('href') === '/exercises/push_up')).toBe(true));
    expect(screen.getAllByRole('link').every((a) => (a.textContent ?? '').length > 0)).toBe(true);
  });
  it('searches English and shows an honest empty state with a clear-filters action', async () => {
    renderPage(<Exercises />, { lang: 'en' });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzzqq' } });
    expect(await screen.findByText('No exercises match')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Clear filters' }).at(-1)!);
    await waitFor(() => expect(screen.queryByText('No exercises match')).toBeNull());
  });
  it('filters by muscle', async () => {
    renderPage(<Exercises />, { lang: 'en' });
    fireEvent.change(screen.getByLabelText('Muscle'), { target: { value: 'calves' } });
    await waitFor(() => expect(screen.getByText(/^\d+ exercises$/)).toBeInTheDocument());
    const n = Number(/(\d+)/.exec(screen.getByText(/^\d+ exercises$/).textContent ?? '')?.[1]);
    expect(n).toBeGreaterThan(0); expect(n).toBeLessThan(244);
  });
  it('injury-safe toggle hides contraindicated exercises for the profile', async () => {
    renderPage(<Exercises />, { lang: 'en' });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'push-up' } });
    await waitFor(() => expect(screen.getAllByRole('link').some((a) => a.getAttribute('href') === '/exercises/push_up')).toBe(true));
    const toggle = await screen.findByRole('switch', { name: /Safe for me/ });
    fireEvent.click(toggle);
    await waitFor(() => expect(screen.getAllByRole('link').some((a) => a.getAttribute('href') === '/exercises/push_up')).toBe(false));
    expect(screen.getByText(/hidden because of your injuries/)).toBeInTheDocument();
  });
  it('renders only the first 60 results then offers more', async () => {
    renderPage(<Exercises />, { lang: 'en' });
    await waitFor(() => expect(screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/exercises/'))).toHaveLength(60));
    fireEvent.click(screen.getByRole('button', { name: /Show more/ }));
    await waitFor(() => expect(screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/exercises/')).length).toBe(120));
  });
});
