import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LangProvider } from '../i18n/index.tsx';
import { UpdatePrompt } from './UpdatePrompt.tsx';

afterEach(() => { Reflect.deleteProperty(navigator, 'serviceWorker'); });
function fakeSw(waiting: { postMessage: () => void } | null) {
  const reg = { waiting, addEventListener: vi.fn(), update: vi.fn(() => Promise.resolve()) };
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { controller: {}, getRegistration: () => Promise.resolve(reg), addEventListener: vi.fn(), removeEventListener: vi.fn() } });
}
describe('UpdatePrompt', () => {
  it('stays hidden when there is no waiting worker', async () => {
    fakeSw(null);
    render(<LangProvider initialLang="en"><UpdatePrompt /></LangProvider>);
    await Promise.resolve();
    expect(screen.queryByRole('status')).toBeNull();
  });
  it('offers a calm reload for a waiting worker and asks it to take over only on click', async () => {
    const postMessage = vi.fn();
    fakeSw({ postMessage });
    render(<LangProvider initialLang="en"><UpdatePrompt /></LangProvider>);
    expect(await screen.findByText('A new version is available.')).toBeInTheDocument();
    expect(postMessage).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    await waitFor(() => expect(postMessage).toHaveBeenCalledWith({ type: 'skip-waiting' }));
  });
  it('Later hides it', async () => {
    fakeSw({ postMessage: vi.fn() });
    render(<LangProvider initialLang="he"><UpdatePrompt /></LangProvider>);
    fireEvent.click(await screen.findByRole('button', { name: 'אחר כך' }));
    expect(screen.queryByRole('status')).toBeNull();
  });
});
