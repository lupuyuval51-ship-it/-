import { act, render } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from '../../components/ui';
import { I18nProvider } from '../../i18n';
import { backAction, closeDialog, topDialog } from './back';

describe('backAction', () => {
  it('closes an open dialog before anything else', () => {
    expect(backAction({ pathname: '/', dialogOpen: true, canGoBack: false })).toBe('close-dialog');
    expect(backAction({ pathname: '/nutrition/log', dialogOpen: true, canGoBack: true })).toBe('close-dialog');
  });

  it('leaves the app at its start pages', () => {
    expect(backAction({ pathname: '/', dialogOpen: false, canGoBack: true })).toBe('leave');
    expect(backAction({ pathname: '/onboarding', dialogOpen: false, canGoBack: false })).toBe('leave');
  });

  it('goes back inside the app, or to the start page when there is no history', () => {
    expect(backAction({ pathname: '/workouts/plans/abc', dialogOpen: false, canGoBack: true })).toBe('back');
    expect(backAction({ pathname: '/nutrition/log', dialogOpen: false, canGoBack: false })).toBe('home');
  });
});

describe('closing dialogs', () => {
  it('finds the top-most open dialog', () => {
    document.body.innerHTML = '<dialog id="a" open></dialog><dialog id="b"></dialog><dialog id="c" open></dialog>';
    expect(topDialog()?.id).toBe('c');
    document.body.innerHTML = '<dialog id="a"></dialog>';
    expect(topDialog()).toBeNull();
    document.body.innerHTML = '';
  });

  it('closes a plain dialog itself', () => {
    document.body.innerHTML = '<dialog id="a" open></dialog>';
    const dialog = topDialog()!;
    dialog.close = vi.fn(() => dialog.removeAttribute('open'));
    closeDialog(dialog);
    expect(dialog.close).toHaveBeenCalled();
    expect(topDialog()).toBeNull();
    document.body.innerHTML = '';
  });

  it('lets the app’s Modal close itself (like Esc), so its state stays right', () => {
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <Modal open={open} onClose={() => setOpen(false)} title="Title">
          <p>{open ? 'open' : 'closed'}</p>
        </Modal>
      );
    }
    render(
      <I18nProvider locale="en">
        <Harness />
      </I18nProvider>,
    );
    const dialog = topDialog();
    expect(dialog).not.toBeNull();
    const nativeClose = vi.fn();
    dialog!.close = nativeClose;
    act(() => closeDialog(dialog!));
    // onCancel prevented the default and called onClose; the Modal then closes the dialog through its effect.
    expect(nativeClose).toHaveBeenCalledTimes(1);
    expect(dialog!.querySelector('.modal-content')).toBeNull();
  });
});
