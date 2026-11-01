import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError, NetworkError } from '../api/client.ts';
import { renderScreen } from '../components/onboarding/testing.tsx';

const m = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }));
vi.mock('../api/client.ts', async (orig) => ({ ...(await orig<typeof import('../api/client.ts')>()), api: m }));

const { default: Login } = await import('./Login.tsx');
const { default: Register } = await import('./Register.tsx');
const { default: ForgotPassword } = await import('./ForgotPassword.tsx');
const { default: ResetPassword } = await import('./ResetPassword.tsx');

const type = (label: RegExp | string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const path = () => screen.getByTestId('path').textContent;
const GOOD_PW = 'correct horse battery';

beforeEach(() => { Object.values(m).forEach((f) => f.mockReset()); });
afterEach(() => { vi.useRealTimers(); });

describe('Login', () => {
  it('shows field-level validation and never calls the API for invalid input', async () => {
    renderScreen(<Login />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect((await screen.findAllByText('Required')).length).toBe(2);
    type('E-mail', 'nope'); fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter a valid e-mail address.')).toBeInTheDocument();
    expect(m.post).not.toHaveBeenCalled();
  });
  it('uses correct autocomplete attributes and a show/hide password toggle', () => {
    renderScreen(<Login />);
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('autocomplete', 'username');
    const pw = screen.getByLabelText('Password');
    expect(pw).toHaveAttribute('autocomplete', 'current-password'); expect(pw).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(pw).toHaveAttribute('type', 'text');
  });
  it('signs in, refreshes me/profile and goes to the from route', async () => {
    m.post.mockResolvedValueOnce({ ok: true });
    const { qc } = renderScreen(<Login />, { state: { from: '/nutrition' } });
    const spy = vi.spyOn(qc, 'invalidateQueries');
    type('E-mail', 'A@B.com'); type('Password', 'x'); fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(path()).toBe('/nutrition'));
    expect(m.post).toHaveBeenCalledWith('/api/auth/login', { email: 'a@b.com', password: 'x' });
    const keys = spy.mock.calls.map((c) => JSON.stringify(c[0]?.queryKey));
    expect(keys).toContain(JSON.stringify(['me'])); expect(keys).toContain(JSON.stringify(['profile']));
  });
  it('goes to / when there is no from state', async () => {
    m.post.mockResolvedValueOnce({ ok: true });
    renderScreen(<Login />, { route: '/login' });
    type('E-mail', 'a@b.com'); type('Password', 'x'); fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(path()).toBe('/'));
  });
  it('maps invalid_credentials and network errors to friendly messages', async () => {
    m.post.mockRejectedValueOnce(new ApiRequestError(401, 'invalid_credentials', {}));
    renderScreen(<Login />);
    type('E-mail', 'a@b.com'); type('Password', 'x'); fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Wrong e-mail or password.')).toBeInTheDocument();
    m.post.mockRejectedValueOnce(new NetworkError());
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText(/No connection/)).toBeInTheDocument();
  });
  it('shows a live countdown from Retry-After on 429 and disables the button', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    m.post.mockRejectedValueOnce(new ApiRequestError(429, 'too_many_attempts', {}, { 'retry-after': '3' }));
    renderScreen(<Login />);
    type('E-mail', 'a@b.com'); type('Password', 'x'); fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    const banner = await screen.findByText(/Too many attempts/);
    expect(banner.textContent).toContain('3');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText(/Too many attempts/).textContent).toContain('2');
    await act(async () => { vi.advanceTimersByTime(1000); });
    await act(async () => { vi.advanceTimersByTime(1000); });
    await waitFor(() => expect(screen.queryByText(/Too many attempts/)).toBeNull());
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });
  it('renders in Hebrew with RTL-friendly copy', () => {
    renderScreen(<Login />, { lang: 'he' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('כניסה');
    expect(screen.getByLabelText('אימייל')).toBeInTheDocument();
  });
});

describe('Register', () => {
  it('requires a 10 character password with a friendly message', async () => {
    renderScreen(<Register />);
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password');
    type('E-mail', 'a@b.com'); type('Password', 'short'); fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('The password must be at least 10 characters.')).toBeInTheDocument();
    expect(m.post).not.toHaveBeenCalled();
  });
  it('registers and navigates to /welcome', async () => {
    m.post.mockResolvedValueOnce({ ok: true });
    renderScreen(<Register />, { route: '/register' });
    type('E-mail', 'New@Example.com'); type('Password', GOOD_PW); fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(path()).toBe('/welcome'));
    expect(m.post).toHaveBeenCalledWith('/api/auth/register', { email: 'new@example.com', password: GOOD_PW });
  });
  it('maps email_taken onto the e-mail field', async () => {
    m.post.mockRejectedValueOnce(new ApiRequestError(409, 'email_taken', {}));
    renderScreen(<Register />);
    type('E-mail', 'a@b.com'); type('Password', GOOD_PW); fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('This e-mail is already registered.')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
  });
  it('maps validation_error and links to the legal pages', async () => {
    m.post.mockRejectedValueOnce(new ApiRequestError(400, 'validation_error', {}));
    renderScreen(<Register />);
    expect(screen.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute('href', '/privacy');
    type('E-mail', 'a@b.com'); type('Password', GOOD_PW); fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Some fields are not valid.')).toBeInTheDocument();
  });
});

describe('ForgotPassword', () => {
  const CONFIRM = /If an account exists for this e-mail/;
  it('shows the identical confirmation whether the request succeeds or the server rejects it', async () => {
    m.post.mockResolvedValueOnce({ ok: true });
    const a = renderScreen(<ForgotPassword />);
    type('E-mail', 'known@b.com'); fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    const first = (await screen.findByText(CONFIRM)).textContent;
    a.unmount();
    m.post.mockRejectedValueOnce(new ApiRequestError(404, 'not_found', {}));
    renderScreen(<ForgotPassword />);
    type('E-mail', 'unknown@b.com'); fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect((await screen.findByText(CONFIRM)).textContent).toBe(first);
  });
  it('validates the e-mail format and surfaces rate limiting with a countdown', async () => {
    renderScreen(<ForgotPassword />);
    type('E-mail', 'bad'); fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByText('Enter a valid e-mail address.')).toBeInTheDocument();
    m.post.mockRejectedValueOnce(new ApiRequestError(429, 'too_many_attempts', {}, { 'retry-after': '45' }));
    type('E-mail', 'a@b.com'); fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect((await screen.findByText(/Too many attempts/)).textContent).toContain('45');
  });
});

describe('ResetPassword', () => {
  const TOKEN = 'a'.repeat(32);
  it('shows the invalid-link state when the token is missing', () => {
    renderScreen(<ResetPassword />, { route: '/reset-password' });
    expect(screen.getByText(/invalid or has expired/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request a new link' })).toHaveAttribute('href', '/forgot-password');
  });
  it('sends the token from the URL and confirms', async () => {
    m.post.mockResolvedValueOnce({ ok: true });
    renderScreen(<ResetPassword />, { route: `/reset-password?token=${TOKEN}` });
    type('New password', 'short'); fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(await screen.findByText('The password must be at least 10 characters.')).toBeInTheDocument();
    type('New password', GOOD_PW); fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(await screen.findByText(/Your password was updated/)).toBeInTheDocument();
    expect(m.post).toHaveBeenCalledWith('/api/auth/reset-password', { token: TOKEN, password: GOOD_PW });
  });
  it('handles an expired token from the server', async () => {
    m.post.mockRejectedValueOnce(new ApiRequestError(400, 'invalid_or_expired_token', {}));
    renderScreen(<ResetPassword />, { route: `/reset-password?token=${TOKEN}` });
    type('New password', GOOD_PW); fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(await screen.findByText(/invalid or has expired/)).toBeInTheDocument();
  });
});
