import { QueryClient } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let units: 'metric' | 'imperial' = 'metric';
vi.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'user-1', units } }) }));

import { I18nProvider } from '../../i18n';
import { OutboxIndicator } from './OutboxIndicator';
import { outboxSync } from './sync';

let release: () => void;

beforeEach(() => {
  // Fake timers keep the engine from sending: the entry stays in the outbox for the list.
  vi.useFakeTimers();
  window.localStorage.clear();
  outboxSync.reset();
  release = outboxSync.retain(new QueryClient(), 'user-1');
  outboxSync.enqueue({ type: 'weight', input: { date: '2026-10-28', weightKg: 80, note: '' } }, 'key-weight-ui01');
});
afterEach(() => {
  release();
  outboxSync.reset();
  vi.useRealTimers();
});

function openList() {
  render(
    <I18nProvider locale="en">
      <OutboxIndicator />
    </I18nProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: /not synced yet/i }));
}

describe('OutboxIndicator', () => {
  it('shows a waiting weigh-in in pounds for imperial users', () => {
    units = 'imperial';
    openList();
    expect(screen.getByText(/176\.4 lb/)).toBeTruthy();
    expect(screen.queryByText(/^80 /)).toBeNull();
  });

  it('shows a waiting weigh-in in kilograms with its unit for metric users', () => {
    units = 'metric';
    openList();
    expect(screen.getByText(/80 kg/)).toBeTruthy();
  });
});
