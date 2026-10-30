import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tally } from './Tally';

const marks = (c: HTMLElement) => [...c.querySelectorAll('.tally-mark')];

describe('Tally', () => {
  it('marks done sets and the current one, grouped in fives', () => {
    const { container } = render(<Tally total={12} done={6} />);
    const m = marks(container);
    expect(m).toHaveLength(12);
    expect(m.filter((x) => x.classList.contains('tally-done'))).toHaveLength(6);
    expect(m.findIndex((x) => x.classList.contains('tally-now'))).toBe(6);
    expect(m.map((x, i) => (x.classList.contains('tally-gap') ? i : -1)).filter((i) => i >= 0)).toEqual([4, 9]);
  });

  it('is hidden from assistive tech unless labelled', () => {
    const { container, rerender, getByRole } = render(<Tally total={4} done={1} />);
    expect(container.querySelector('.tally')?.getAttribute('aria-hidden')).toBe('true');
    rerender(<Tally total={4} done={1} label="1 of 4 workouts" />);
    expect(getByRole('img', { name: '1 of 4 workouts' })).toBeTruthy();
  });

  it('has no current mark when complete or when current is null', () => {
    const { container, rerender } = render(<Tally total={3} done={3} />);
    expect(container.querySelector('.tally-now')).toBeNull();
    rerender(<Tally total={3} done={1} current={null} />);
    expect(container.querySelector('.tally-now')).toBeNull();
  });

  it('clamps bad input and falls back to a meter for long series', () => {
    const { container, rerender } = render(<Tally total={5} done={9} />);
    expect(marks(container).filter((x) => x.classList.contains('tally-done'))).toHaveLength(5);
    rerender(<Tally total={90} done={45} />);
    expect(marks(container)).toHaveLength(0);
    expect((container.querySelector('.tally-meter-fill') as HTMLElement).style.inlineSize).toBe('50%');
  });
});
