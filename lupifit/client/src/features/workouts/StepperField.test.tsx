import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n';
import { StepperField } from './StepperField';

function Harness({ start, min = 1, max = 10, step = 1, fallback = 3 }: { start: number | null; min?: number; max?: number; step?: number; fallback?: number }) {
  const [v, setV] = useState<number | null>(start);
  return (
    <I18nProvider locale="en">
      <StepperField label="Sets" value={v} min={min} max={max} step={step} fallback={fallback} onChange={setV} />
    </I18nProvider>
  );
}

describe('StepperField', () => {
  it('steps by one tap and stops at the limits', () => {
    render(<Harness start={9} />);
    const input = screen.getByRole('textbox', { name: 'Sets' }) as HTMLInputElement;
    fireEvent.click(screen.getByRole('button', { name: 'Increase Sets' }));
    expect(input.value).toBe('10');
    expect((screen.getByRole('button', { name: 'Increase Sets' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease Sets' }));
    expect(input.value).toBe('9');
  });

  it('starts from the fallback when empty and honours the step', () => {
    render(<Harness start={null} min={5} max={600} step={5} fallback={30} />);
    const input = screen.getByRole('textbox', { name: 'Sets' }) as HTMLInputElement;
    fireEvent.click(screen.getByRole('button', { name: 'Increase Sets' }));
    expect(input.value).toBe('35');
  });
});
