import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Difficulty } from '@shared/constants';
import { I18nProvider } from '../../i18n';
import { ChoiceChips } from './ChoiceChips';
import { SEARCH_DEBOUNCE_MS, SearchBox } from './SearchBox';

describe('SearchBox', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const setup = (value = '') => {
    const onCommit = vi.fn();
    const utils = render(
      <I18nProvider locale="en">
        <SearchBox value={value} onCommit={onCommit} />
      </I18nProvider>,
    );
    return { onCommit, input: screen.getByRole('searchbox', { name: 'Search exercises' }), ...utils };
  };

  it('commits the cleaned text once typing pauses', () => {
    const { onCommit, input } = setup();
    fireEvent.change(input, { target: { value: 'squ' } });
    fireEvent.change(input, { target: { value: '  squat ' } });
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1));
    expect(onCommit).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('squat');
  });

  it('commits immediately on Enter and does not repeat the same value', () => {
    const { onCommit, input } = setup();
    fireEvent.change(input, { target: { value: 'plank' } });
    fireEvent.submit(input.closest('form')!);
    expect(onCommit).toHaveBeenCalledWith('plank');
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it('clears with the clear button and with Escape', () => {
    const { onCommit, input } = setup('squat');
    expect(input).toHaveProperty('value', 'squat');
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input).toHaveProperty('value', '');
    expect(onCommit).toHaveBeenLastCalledWith('');
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();

    fireEvent.change(input, { target: { value: 'row' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveProperty('value', '');
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    // "row" was never committed, and "" equals the last committed value.
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it('follows external value changes (back/forward) without echoing them', () => {
    const { onCommit, rerender } = setup('squat');
    rerender(
      <I18nProvider locale="en">
        <SearchBox value="deadlift" onCommit={onCommit} />
      </I18nProvider>,
    );
    expect(screen.getByRole('searchbox')).toHaveProperty('value', 'deadlift');
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('drops text still waiting to be committed when the value changes from outside', () => {
    const { onCommit, input, rerender } = setup('squat');
    fireEvent.change(input, { target: { value: 'squat jump' } });
    // Back is pressed before the debounce fires.
    rerender(
      <I18nProvider locale="en">
        <SearchBox value="" onCommit={onCommit} />
      </I18nProvider>,
    );
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS * 2));
    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveProperty('value', '');
  });
});

describe('ChoiceChips', () => {
  function Harness({ locale = 'en' as 'en' | 'he', initial = null as Difficulty | null, onChange = (_: Difficulty | null) => {} }) {
    const [value, setValue] = useState<Difficulty | null>(initial);
    return (
      <I18nProvider locale={locale}>
        <ChoiceChips<Difficulty>
          label="Difficulty"
          value={value}
          onChange={(v) => {
            setValue(v);
            onChange(v);
          }}
          options={[
            { value: null, label: 'All' },
            { value: 'beginner', label: 'Beginner', count: 5 },
            { value: 'intermediate', label: 'Intermediate', count: 0 },
            { value: 'advanced', label: 'Advanced', count: 2 },
          ]}
        />
      </I18nProvider>
    );
  }

  it('exposes a labelled radio group with counts and one tab stop', () => {
    render(<Harness />);
    expect(screen.getByRole('radiogroup', { name: 'Difficulty' })).toBeTruthy();
    const radios = screen.getAllByRole('radio');
    expect(radios.map((r) => r.textContent)).toEqual(['All', 'Beginner 5', 'Intermediate 0', 'Advanced 2']);
    expect(radios.map((r) => r.getAttribute('tabindex'))).toEqual(['0', '-1', '-1', '-1']);
    expect(radios[0]!.getAttribute('aria-checked')).toBe('true');
    // No results → disabled (unless selected).
    expect((radios[2] as HTMLButtonElement).disabled).toBe(true);
  });

  it('selects on click and with arrow keys, skipping disabled choices', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Beginner 5' }));
    expect(onChange).toHaveBeenLastCalledWith('beginner');
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Beginner 5' }), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith('advanced');
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Advanced 2' }));
    fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('follows the visual direction in RTL', () => {
    const onChange = vi.fn();
    render(<Harness locale="he" initial="beginner" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Beginner 5' }), { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith('advanced');
  });
});
