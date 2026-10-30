import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n';
import { ReadinessCheck, completeReadiness, type ReadinessDraft } from './ReadinessCheck';

describe('completeReadiness', () => {
  it('sends nothing when the user did not touch the check-in', () => {
    expect(completeReadiness({})).toBeUndefined();
  });

  it('fills unanswered questions with neutral answers, which never make a session easier', () => {
    expect(completeReadiness({ energy: 'low' })).toEqual({ energy: 'low', soreness: 'none', sleep: 'ok' });
  });
});

function Harness({ suggestEasier = false, onValue }: { suggestEasier?: boolean; onValue?: (v: ReadinessDraft) => void }) {
  const [v, setV] = useState<ReadinessDraft>({});
  return (
    <I18nProvider locale="en">
      <ReadinessCheck
        value={v}
        suggestEasier={suggestEasier}
        onChange={(next) => {
          setV(next);
          onValue?.(next);
        }}
      />
    </I18nProvider>
  );
}

describe('ReadinessCheck', () => {
  it('is collapsed by default and records the taps', () => {
    let last: ReadinessDraft = {};
    const { container } = render(<Harness onValue={(v) => (last = v)} />);
    expect(container.querySelector('details')?.hasAttribute('open')).toBe(false);
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Energy' })).getByRole('radio', { name: 'Low' }));
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Muscle soreness' })).getByRole('radio', { name: 'High' }));
    expect(last).toEqual({ energy: 'low', soreness: 'high' });
  });

  it('opens with a hint when recent training suggests an easier day', () => {
    const { container } = render(<Harness suggestEasier />);
    expect(container.querySelector('details')?.hasAttribute('open')).toBe(true);
    expect(screen.getByText(/trained many days in a row/i)).toBeTruthy();
  });
});
