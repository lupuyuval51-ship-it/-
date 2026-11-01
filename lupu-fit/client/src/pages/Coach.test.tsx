import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '../api/client.ts';
import { renderWith } from '../components/nutrition/testHarness.tsx';

const h = vi.hoisted(() => ({ handler: (_m: string, _p: string, _b?: unknown, _q?: unknown): unknown => ({}), calls: [] as { m: string; p: string; b?: unknown; q?: unknown }[] }));
vi.mock('../api/client.ts', async (orig) => {
  const real = await orig<typeof import('../api/client.ts')>();
  const run = async (m: string, p: string, b?: unknown, q?: unknown) => { h.calls.push({ m, p, b, q }); const r = h.handler(m, p, b, q); if (r instanceof Error) throw r; return r; };
  return { ...real, api: { get: (p: string, q?: unknown) => run('GET', p, undefined, q), post: (p: string, b?: unknown) => run('POST', p, b), put: (p: string, b?: unknown) => run('PUT', p, b), patch: (p: string, b?: unknown) => run('PATCH', p, b), delete: (p: string, b?: unknown) => run('DELETE', p, b) } };
});
const { default: Coach } = await import('./Coach.tsx');

let status = { provider: 'rules', freeTierNotice: false, limits: { perMinute: 6, perDay: 50 } };
let threads = [{ id: 't1', title: 'Protein chat', updatedAt: '2026-05-01T10:00:00Z' }];
let messages: Record<string, unknown>[] = [];
let onMessage: (b: { text: string; lang: string }) => unknown = () => ({});
beforeEach(() => {
  h.calls.length = 0;
  status = { provider: 'rules', freeTierNotice: false, limits: { perMinute: 6, perDay: 50 } };
  threads = [{ id: 't1', title: 'Protein chat', updatedAt: '2026-05-01T10:00:00Z' }];
  messages = [];
  onMessage = () => ({ user: {}, assistant: {} });
  h.handler = (m, p, b) => {
    if (p === '/api/coach/status') return status;
    if (p === '/api/coach/threads' && m === 'GET') return { threads };
    if (p === '/api/coach/threads' && m === 'POST') { threads = [{ id: 'new1', title: (b as { title: string }).title, updatedAt: '2026-05-01T11:00:00Z' }, ...threads]; return { id: 'new1' }; }
    if (/^\/api\/coach\/threads\/[^/]+$/.test(p) && m === 'GET') return { thread: { id: p.split('/').pop(), title: 'x' }, messages };
    if (p.endsWith('/messages')) { const r = onMessage(b as { text: string; lang: string }); return r; }
    if (m === 'PATCH' || m === 'DELETE') return { ok: true };
    return {};
  };
});
const msg = (id: string, role: 'user' | 'assistant', content: string, extra: Record<string, unknown> = {}) => ({ id, role, content, provider: role === 'assistant' ? 'rules' : null, safetyCategory: null, createdAt: '2026-05-01T10:00:00Z', ...extra });
const sends = () => h.calls.filter((c) => c.p.endsWith('/messages')).map((c) => ({ p: c.p, b: c.b as { text: string; lang: string } }));

describe('Coach', () => {
  it('shows the rules provider label, honest empty state and suggested prompts (no invented answers)', async () => {
    renderWith(<Coach />, { route: '/coach' });
    expect(await screen.findByTestId('provider-label')).toHaveTextContent('Rules-based coach');
    expect(screen.getByText('Ask your coach')).toBeInTheDocument();
    for (const k of ['What should I train today?', 'Is my protein target on track?', 'How is my weight trend?', 'Any recovery tips?']) expect(screen.getByRole('button', { name: k })).toBeInTheDocument();
    expect(screen.queryByTestId('message-assistant')).toBeNull();
    expect(screen.queryByText(/Google/)).toBeNull();
  });
  it('shows the AI label and the free-tier notice when the server says so', async () => {
    status = { provider: 'gemini', freeTierNotice: true, limits: { perMinute: 6, perDay: 50 } };
    renderWith(<Coach />, { route: '/coach' });
    expect(await screen.findByText(/Google may use your prompts to improve its products/)).toBeInTheDocument();
    expect(screen.getByTestId('provider-label')).toHaveTextContent('AI coach (gemini)');
  });
  it('a suggested prompt creates a thread and sends the message with the UI language', async () => {
    renderWith(<Coach />, { route: '/coach' });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Is my protein target on track?' }));
    await waitFor(() => expect(sends()).toHaveLength(1));
    expect(sends()[0]).toEqual({ p: '/api/coach/threads/new1/messages', b: { text: 'Is my protein target on track?', lang: 'en' } });
    expect(h.calls.find((c) => c.m === 'POST' && c.p === '/api/coach/threads')?.b).toMatchObject({ title: 'Is my protein target on track?' });
  });
  it('Enter sends, Shift+Enter inserts a newline', async () => {
    messages = [msg('m1', 'assistant', 'Hello')];
    renderWith(<Coach />, { route: '/coach?thread=t1' });
    const user = userEvent.setup();
    const box = await screen.findByRole('textbox', { name: 'Your message' });
    await screen.findByText('Hello');
    await user.type(box, 'line one{Shift>}{Enter}{/Shift}line two');
    expect(box).toHaveValue('line one\nline two');
    expect(sends()).toHaveLength(0);
    await user.keyboard('{Enter}');
    await waitFor(() => expect(sends()).toHaveLength(1));
    expect(sends()[0]!.b.text).toBe('line one\nline two');
    await waitFor(() => expect(box).toHaveValue(''));
  });
  it('renders safe markdown in replies (script stays text)', async () => {
    messages = [msg('m1', 'user', 'hi'), msg('m2', 'assistant', '**Plan**\n- eat <script>alert(1)</script>')];
    const { container } = renderWith(<Coach />, { route: '/coach?thread=t1' });
    await screen.findByText('Plan');
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('<script>alert(1)</script>');
  });
  it('renders safety replies distinctly with role=alert and the helpline text as returned', async () => {
    const helpline = 'You are not alone. Call ERAN 1201 (Israel) or your local emergency number.';
    messages = [msg('m1', 'user', 'I want to hurt myself', { safetyCategory: 'self_harm' }), msg('m2', 'assistant', helpline, { provider: 'safety', safetyCategory: 'self_harm' })];
    renderWith(<Coach />, { route: '/coach?thread=t1' });
    const alert = await screen.findByTestId('safety-message');
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveTextContent(helpline);
    expect(within(alert).getByText('Safety response')).toBeInTheDocument();
    expect(screen.getByTestId('message-user')).not.toHaveAttribute('role', 'alert');
  });
  it('handles 429 with a friendly per-window message and keeps the draft', async () => {
    messages = [msg('m1', 'assistant', 'Hello')];
    onMessage = () => new ApiRequestError(429, 'quota_exceeded', { error: 'quota_exceeded', window: 'minute' }, { 'retry-after': '30' });
    renderWith(<Coach />, { route: '/coach?thread=t1' });
    const user = userEvent.setup();
    const box = await screen.findByRole('textbox', { name: 'Your message' });
    await user.type(box, 'Another question');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText(/Too many messages in a short time\. Try again in about 30 seconds/)).toBeInTheDocument();
    expect(box).toHaveValue('Another question');
    onMessage = () => new ApiRequestError(429, 'quota_exceeded', { window: 'day' });
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText(/today’s message limit/)).toBeInTheDocument();
  });
  it('shows a pending state while waiting', async () => {
    messages = [msg('m1', 'assistant', 'Hello')];
    let release: (v: unknown) => void = () => undefined;
    h.handler = ((orig) => (m: string, p: string, b?: unknown, q?: unknown) => (p.endsWith('/messages') ? new Promise((r) => { release = r; }) as unknown : orig(m, p, b, q)))(h.handler);
    renderWith(<Coach />, { route: '/coach?thread=t1' });
    const user = userEvent.setup();
    await user.type(await screen.findByRole('textbox', { name: 'Your message' }), 'Hi coach{Enter}');
    expect(await screen.findByTestId('message-pending')).toHaveTextContent('Hi coach');
    expect(screen.getByRole('status', { name: 'The coach is answering…' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    release({});
  });
  it('renames and deletes (with confirm) threads', async () => {
    renderWith(<Coach />, { route: '/coach' });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Chats' }));
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    const field = screen.getByLabelText('Chat name');
    await user.clear(field); await user.type(field, 'Renamed');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(h.calls.find((c) => c.m === 'PATCH')).toMatchObject({ p: '/api/coach/threads/t1', b: { title: 'Renamed' } }));
    await user.click(screen.getByRole('button', { name: 'Chats' }));
    await user.click(screen.getByRole('button', { name: 'Delete chat Protein chat' }));
    expect(h.calls.some((c) => c.m === 'DELETE')).toBe(false);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(h.calls.find((c) => c.m === 'DELETE')?.p).toBe('/api/coach/threads/t1'));
  });
  it('copies a message as markdown source', async () => {
    messages = [msg('m1', 'assistant', '**Bold** tip')];
    renderWith(<Coach />, { route: '/coach?thread=t1' });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Copy message' }));
    await waitFor(async () => expect(await navigator.clipboard.readText()).toBe('**Bold** tip'));
  });
  it('works in Hebrew and sends lang=he', async () => {
    renderWith(<Coach />, { route: '/coach', lang: 'he' });
    const user = userEvent.setup();
    expect(await screen.findByTestId('provider-label')).toHaveTextContent('מאמן מבוסס כללים');
    await user.click(screen.getByRole('button', { name: 'מה כדאי להתאמן היום?' }));
    await waitFor(() => expect(sends()[0]?.b).toEqual({ text: 'מה כדאי להתאמן היום?', lang: 'he' }));
  });
});
