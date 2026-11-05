import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { LangProvider } from '../i18n/index.tsx';
import { LiveStepper } from '../components/live/LiveStepper.tsx';
import { NumberStepper } from './kit.tsx';

const css = (f: string): string => readFileSync(resolve(__dirname, '../styles', f), 'utf8');
const base = css('base.css'); const live = css('live.css');
const rule = (css: string, selector: string): string => new RegExp(`(^|\\n)${selector.replace('.', '\\.')} \\{([^}]*)\\}`).exec(css)?.[2] ?? '';

describe('NumberStepper order', () => {
  it('is minus, value, plus in the DOM in RTL too', () => {
    render(<LangProvider initialLang="he"><div dir="rtl"><NumberStepper label="ימים" value={3} onChange={() => undefined} /></div></LangProvider>);
    const group = screen.getByRole('group', { name: 'ימים' });
    expect([...group.children].map((c) => c.getAttribute('aria-label'))).toEqual(['ימים −', 'ימים', 'ימים +']);
  });
  it('lays out physically like the live-session stepper (minus left, plus right) in every direction', () => {
    expect(rule(live, '.lv-step')).toMatch(/direction: ltr/);
    expect(rule(base, '.stepper')).toMatch(/direction: ltr/);
  });
});

type StepperProps = { label: string; value: number | null; onChange: (v: number | null) => void; step?: number; min?: number; max?: number; decimals?: number };
function Controlled({ C, initial, spy, ...p }: Omit<StepperProps, 'value' | 'onChange'> & { C: (p: StepperProps) => ReactNode; initial: number | null; spy: (v: number | null) => void }): ReactNode {
  const [v, setV] = useState<number | null>(initial);
  return <C {...p} value={v} onChange={(n) => { spy(n); setV(n); }} />;
}

describe.each([['NumberStepper', NumberStepper], ['LiveStepper', LiveStepper]] as const)('%s typing', (_name, C) => {
  it('keeps the decimal point while typing 80.5 key by key (weigh-in: step 0.1, min 30, max 300)', async () => {
    const spy = vi.fn();
    render(<LangProvider initialLang="en"><Controlled C={C} label="Weight" initial={null} spy={spy} step={0.1} decimals={1} min={30} max={300} /></LangProvider>);
    const input = screen.getByRole('textbox', { name: 'Weight' }) as HTMLInputElement;
    await userEvent.click(input);
    await userEvent.keyboard('80.5');
    expect(input.value).toBe('80.5');
    expect(spy).toHaveBeenLastCalledWith(80.5);
    fireEvent.blur(input);
    expect(input.value).toBe('80.5');
    expect(spy).toHaveBeenLastCalledWith(80.5);
  });
  it('accepts a comma as the decimal separator and rejects letters', async () => {
    const spy = vi.fn();
    render(<LangProvider initialLang="en"><Controlled C={C} label="Load" initial={null} spy={spy} step={2.5} decimals={1} max={1000} /></LangProvider>);
    const input = screen.getByRole('textbox', { name: 'Load' }) as HTMLInputElement;
    await userEvent.click(input);
    await userEvent.keyboard('62,5x');
    expect(input.value).toBe('62.5');
    expect(spy).toHaveBeenLastCalledWith(62.5);
  });
  it('rounds to the allowed decimals and clamps on blur, and the buttons step from the typed value', async () => {
    const spy = vi.fn();
    render(<LangProvider initialLang="en"><Controlled C={C} label="Kg" initial={null} spy={spy} step={0.5} decimals={1} max={300} /></LangProvider>);
    const input = screen.getByRole('textbox', { name: 'Kg' }) as HTMLInputElement;
    await userEvent.click(input);
    await userEvent.keyboard('80.55');
    fireEvent.blur(input);
    expect(input.value).toBe('80.6');
    await userEvent.click(screen.getByRole('button', { name: 'Kg +' }));
    expect(input.value).toBe('81.1');
    expect(spy).toHaveBeenLastCalledWith(81.1);
  });
});
