import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { LangProvider } from '../i18n/index.tsx';
import { Sheet } from './kit.tsx';

const OPENER = 'opener'; const INSIDE = 'inside'; const SHEET_TITLE = 'Pick one';
const lfSheet = (): string | undefined => (window.history.state as { lfSheet?: string } | null)?.lfSheet;

function Host({ onClose }: { onClose?: () => void }): ReactNode {
  const [open, setOpen] = useState(false);
  return (
    <LangProvider initialLang="en">
      <button type="button" onClick={() => setOpen(true)}>{OPENER}</button>
      <Sheet open={open} onClose={() => { onClose?.(); setOpen(false); }} title={SHEET_TITLE}><button type="button">{INSIDE}</button></Sheet>
    </LangProvider>
  );
}

describe('Sheet history and focus', () => {
  it('the Back button closes the sheet and focus returns to the opener', async () => {
    const onClose = vi.fn();
    render(<Host onClose={onClose} />);
    const opener = screen.getByRole('button', { name: OPENER });
    opener.focus();
    fireEvent.click(opener);
    expect(screen.getByRole('dialog', { name: SHEET_TITLE })).toBeTruthy();
    expect(lfSheet()).toBeTruthy();
    window.history.back();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(opener);
  });

  it('closing with the close button removes its own history entry', async () => {
    render(<Host />);
    fireEvent.click(screen.getByRole('button', { name: OPENER }));
    expect(lfSheet()).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(lfSheet()).toBeUndefined());
  });

  it('Escape still closes', () => {
    render(<Host />);
    fireEvent.click(screen.getByRole('button', { name: OPENER }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
