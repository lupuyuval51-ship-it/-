import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import type { BootState } from '../../device/worker/protocol';
import { DeviceGate, DeviceStartScreen, type BootSource } from './DeviceGate';

function source(initial: BootState) {
  let state = initial;
  const listeners = new Set<() => void>();
  const src: BootSource & { set(s: BootState): void } = {
    getState: () => state,
    subscribe: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    set(s) {
      state = s;
      for (const l of listeners) l();
    },
  };
  return src;
}

describe('DeviceGate', () => {
  it('shows the start-up steps, then the app (no login in between)', () => {
    const src = source({ state: 'booting', step: 'database', firstLaunch: false });
    render(
      <I18nProvider locale="en">
        <DeviceGate source={src}>
          <p>the app</p>
        </DeviceGate>
      </I18nProvider>,
    );
    expect(screen.getByRole('heading', { name: 'Getting LUPU-FIT ready' })).toBeTruthy();
    expect(screen.getByText('Opening your data on this phone…')).toBeTruthy();
    expect(screen.getByText('Your data stays on this phone. No account and no server are needed.')).toBeTruthy();
    act(() => src.set({ state: 'booting', step: 'migrating', firstLaunch: true }));
    expect(screen.getByText('Setting up LUPU-FIT on this phone. The first launch takes a little longer.')).toBeTruthy();
    act(() => src.set({ state: 'booting', step: 'migrating', firstLaunch: false }));
    expect(screen.getByText('Updating your data for the new version…')).toBeTruthy();
    expect(screen.queryByText('the app')).toBeNull();
    act(() => src.set({ state: 'ready', bootMs: 10, steps: {} }));
    expect(screen.getByText('the app')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Getting LUPU-FIT ready' })).toBeNull();
  });

  it('explains a copy that is open in another tab', () => {
    render(
      <I18nProvider locale="he">
        <DeviceStartScreen boot={{ state: 'locked' }} onRetry={() => undefined} />
      </I18nProvider>,
    );
    expect(screen.getByRole('alert').textContent).toContain('LUPU-FIT כבר פתוח בכרטיסייה אחרת');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('says why it failed, offers a retry and keeps the technical detail out of the way', () => {
    const onRetry = vi.fn();
    render(
      <I18nProvider locale="en">
        <DeviceStartScreen boot={{ state: 'failed', reason: 'storage_full', detail: 'QuotaExceededError: x' }} onRetry={onRetry} />
      </I18nProvider>,
    );
    expect(screen.getByText("The phone's storage is full. Free up some space and try again. Your data has not been deleted.")).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Technical details').closest('details')?.open).toBe(false);
    expect(screen.getByText('QuotaExceededError: x').getAttribute('dir')).toBe('ltr');
  });
});
