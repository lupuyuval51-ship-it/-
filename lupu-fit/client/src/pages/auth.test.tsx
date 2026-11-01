import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError, NetworkError } from '../api/client.ts';
import { renderScreen } from '../components/onboarding/testing.tsx';

const m = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }));
vi.mock('../api/client.ts', async (orig) => ({ ...(await orig<typeof import('../api/client.ts')>()), api: m }));

const { default: Login } = await import('./Login.tsx');
const { default: Register } = await import('./Register.tsx');

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
    type('USERNAME', 'a b'); fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Use only letters a-z, digits, _ . - and start with a letter or digit.')).toBeInTheDocument();
    expect(m.post).not.toHaveBeenCalled();
  });
  it('shows the no-recovery note instead of a forgot-password link', () => {
    renderScreen(<Login />);
    expect(screen.getByText('There is no password recovery, so keep your password safe.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /forgot/i })).toBeNull();
  });
  it('uses correct autocomplete attributes and a show/hide password toggle', () => {
    renderScreen(<Login />);
    const u = screen.getByLabelText('USERNAME');
    expect(u).toHaveAttribute('autocomplete', 'username'); expect(u).toHaveAttribute('inputmode', 'text');
    expect(u).toHaveAttribute('autocapitalize', 'off'); expect(u).toHaveAttribute('autocorrect', 'off'); expect(u).toHaveAttribute('spellcheck', 'false');
    const pw = screen.getByLabelText('Password');
    expect(pw).toHaveAttribute('autocomplete', 'current-password'); expect(pw).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(pw).toHaveAttribute('type', 'text');
  });
  it('signs in, refreshes me/profile and goes to the from route', async () => {
    m.post.mockResolvedValueOnce({ ok: true });
    const { qc } = renderScreen(<Login />, { state: { from: '/nutrition' } });
    const spy = vi.spyOn(qc, 'invalidateQueries');
    type('USERNAME', 'Yuval_L'); type('Password', 'x'); fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(path()).toBe('/nutrition'));
    expect(m.post).toHaveBeenCalledWith('/api/auth/login', { username: 'yuval_l', password: 'x' });
    const keys = spy.mock.calls.map((c) => JSON.stringify(c[0]?.queryKey));
    expect(keys).toContain(JSON.stringify(['me'])); expect(keys).toContain(JSON.stringify(['profile']));
  });
  it('goes to / when there is no from state', async () => {
    m.post.mockResolvedValueOnce({ ok: true });
    renderScreen(<Login />, { route: '/login' });
    type('USERNAME', 'abc'); type('Password', 'x'); fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(path()).toBe('/'));
  });
  it('maps invalid_credentials and network errors to friendly messages', async () => {
    m.post.mockRejectedValueOnce(new ApiRequestError(401, 'invalid_credentials', {}));
    renderScreen(<Login />);
    type('USERNAME', 'abc'); type('Password', 'x'); fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Wrong username or password.')).toBeInTheDocument();
    m.post.mockRejectedValueOnce(new NetworkError());
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText(/No connection/)).toBeInTheDocument();
  });
  it('shows a live countdown from Retry-After on 429 and disables the button', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    m.post.mockRejectedValueOnce(new ApiRequestError(429, 'too_many_attempts', {}, { 'retry-after': '3' }));
    renderScreen(<Login />);
    type('USERNAME', 'abc'); type('Password', 'x'); fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
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
    expect(screen.getByLabelText('שם משתמש')).toBeInTheDocument();
  });
});

describe('Register', () => {
  it('validates the username inline (too short, bad characters) and explains the allowed characters', async () => {
    renderScreen(<Register />);
    expect(screen.getByText(/3-24 characters: letters a-z, digits/)).toBeInTheDocument();
    expect(screen.getByLabelText('Choose a password')).toHaveAttribute('autocomplete', 'new-password');
    type('USERNAME', 'ab'); type('Choose a password', GOOD_PW); fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('The username must be 3 to 24 characters.')).toBeInTheDocument();
    type('USERNAME', 'bad name!'); fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Use only letters a-z, digits, _ . - and start with a letter or digit.')).toBeInTheDocument();
    expect(m.post).not.toHaveBeenCalled();
  });
  it('requires a 10 character password with a friendly message', async () => {
    renderScreen(<Register />);
    expect(screen.getByLabelText('Choose a password')).toHaveAttribute('autocomplete', 'new-password');
    type('USERNAME', 'abc'); type('Choose a password', 'short'); fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('The password must be at least 10 characters.')).toBeInTheDocument();
    expect(m.post).not.toHaveBeenCalled();
  });
  it('registers and navigates to /welcome', async () => {
    m.post.mockResolvedValueOnce({ ok: true });
    renderScreen(<Register />, { route: '/register' });
    type('USERNAME', 'New_User'); type('Choose a password', GOOD_PW); fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(path()).toBe('/welcome'));
    expect(m.post).toHaveBeenCalledWith('/api/auth/register', { username: 'new_user', password: GOOD_PW });
  });
  it('maps username_taken onto the username field', async () => {
    m.post.mockRejectedValueOnce(new ApiRequestError(409, 'username_taken', {}));
    renderScreen(<Register />);
    type('USERNAME', 'abc'); type('Choose a password', GOOD_PW); fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('This username is already taken. Try another one.')).toBeInTheDocument();
    expect(screen.getByLabelText('USERNAME')).toHaveAttribute('aria-invalid', 'true');
  });
  it('maps validation_error and links to the legal pages', async () => {
    m.post.mockRejectedValueOnce(new ApiRequestError(400, 'validation_error', {}));
    renderScreen(<Register />);
    expect(screen.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute('href', '/privacy');
    type('USERNAME', 'abc'); type('Choose a password', GOOD_PW); fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Some fields are not valid.')).toBeInTheDocument();
  });
});
