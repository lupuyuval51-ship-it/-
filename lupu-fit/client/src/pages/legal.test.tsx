import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '../api/client.ts';
import { renderScreen } from '../components/onboarding/testing.tsx';
import { ONBOARDING_DRAFT_KEY } from '../lib/onboardingDraft.ts';

const m = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }));
vi.mock('../api/client.ts', async (orig) => ({ ...(await orig<typeof import('../api/client.ts')>()), api: m }));

const { default: Privacy } = await import('./Privacy.tsx');
const { default: Terms } = await import('./Terms.tsx');
const { default: AccountDeletion } = await import('./AccountDeletion.tsx');

const ME = { user: { id: 'u1', username: 'abc', role: 'user' }, csrfToken: 'c', onboarded: true, mode: 'hosted' };
beforeEach(() => { Object.values(m).forEach((f) => f.mockReset()); delete process.env['VITE_SUPPORT_EMAIL']; localStorage.clear(); });

describe('legal pages', () => {
  it('renders the privacy policy in English with the required disclosures', () => {
    renderScreen(<Privacy />, { route: '/privacy' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Privacy policy');
    for (const re of [/age bracket instead of your exact age/, /Gemini/, /Claude/, /only the barcode number/, /minimum age to use the app is 13/, /no precise location/, /JSON/, /no third-party analytics/]) expect(screen.getAllByText(re).length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/legal\.privacy/);
  });
  it('renders the privacy policy and terms in Hebrew', () => {
    const a = renderScreen(<Privacy />, { route: '/privacy', lang: 'he' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('מדיניות פרטיות');
    expect(screen.getAllByText(/Open Food Facts/).length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/legal\.privacy/);
    a.unmount();
    renderScreen(<Terms />, { route: '/terms', lang: 'he' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('תנאי שימוש');
    expect(document.body.textContent).not.toMatch(/legal\.terms/);
  });
  it('renders the terms in English', () => {
    renderScreen(<Terms />, { route: '/terms' });
    expect(screen.getByText('Not medical advice')).toBeInTheDocument();
    expect(screen.getByText('Assumption of risk')).toBeInTheDocument();
  });
  it('never invents a contact e-mail: a sentence when unset, a mailto link when configured', () => {
    const a = renderScreen(<Privacy />);
    expect(screen.getByText(/Their contact details are shown by the deployment/)).toBeInTheDocument();
    expect(document.querySelector('a[href^="mailto:"]')).toBeNull();
    a.unmount();
    process.env['VITE_SUPPORT_EMAIL'] = 'help@example.test';
    renderScreen(<Privacy />);
    expect(screen.getByRole('link', { name: 'help@example.test' })).toHaveAttribute('href', 'mailto:help@example.test');
  });
});

describe('account deletion', () => {
  it('explains the path and links to login when signed out', async () => {
    m.get.mockRejectedValue(new ApiRequestError(401, 'unauthorized', {}));
    renderScreen(<AccountDeletion />, { route: '/account-deletion' });
    expect(await screen.findByText(/You are not signed in/)).toBeInTheDocument();
    expect(screen.getByText(/Profile, then Delete account/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button', { name: 'Delete my account' })).toBeNull();
  });
  it('requires typing DELETE, then deletes, clears cache and draft and goes to /login', async () => {
    m.get.mockResolvedValue(ME); m.delete.mockResolvedValueOnce({ ok: true });
    localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), step: 1, data: {} }));
    const { qc } = renderScreen(<AccountDeletion />, { route: '/account-deletion' });
    qc.setQueryData(['profile'], { stale: true });
    fireEvent.click(await screen.findByRole('button', { name: 'Delete my account' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = screen.getByRole('button', { name: 'Delete everything' });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Type DELETE/), { target: { value: 'delete' } });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Type DELETE/), { target: { value: 'DELETE' } });
    expect(confirm).toBeEnabled();
    expect(dialog).toBeInTheDocument();
    fireEvent.click(confirm);
    await waitFor(() => expect(screen.getByTestId('path').textContent).toBe('/login'));
    expect(m.delete).toHaveBeenCalledWith('/api/account', { confirm: 'DELETE' });
    expect(qc.getQueryData(['profile'])).toBeUndefined();
    expect(localStorage.getItem(ONBOARDING_DRAFT_KEY)).toBeNull();
  });
  it('keeps the sheet open and shows the error if deletion fails', async () => {
    m.get.mockResolvedValue(ME); m.delete.mockRejectedValueOnce(new ApiRequestError(500, 'internal_error', {}));
    renderScreen(<AccountDeletion />, { route: '/account-deletion' });
    fireEvent.click(await screen.findByRole('button', { name: 'Delete my account' }));
    fireEvent.change(await screen.findByLabelText(/Type DELETE/), { target: { value: 'DELETE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Delete everything' }));
    expect(await screen.findByText('Server error. Try again.')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
  it('renders in Hebrew', async () => {
    m.get.mockResolvedValue(ME);
    renderScreen(<AccountDeletion />, { route: '/account-deletion', lang: 'he' });
    expect(await screen.findByRole('button', { name: 'מחיקת החשבון שלי' })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/legal\.deletion/);
  });
});
