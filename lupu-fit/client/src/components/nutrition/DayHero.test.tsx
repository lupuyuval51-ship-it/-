import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DayHero } from './DayHero.tsx';
import { renderWith } from './testHarness.tsx';

const targets = { kcal: 3043, proteinG: 160, carbsG: 380, fatG: 90 };
const totals = (kcal: number) => ({ kcal, proteinG: 150, carbsG: 370, fatG: 85 });

describe('DayHero', () => {
  it('within 10% above the target is neutral "on target" (+N), never the over warning next to a green bar', () => {
    renderWith(<DayHero totals={totals(3101)} targets={targets} />);
    const num = screen.getByTestId('remaining-kcal');
    expect(num).toHaveTextContent('+58');
    expect(num).not.toHaveClass('warning');
    expect(screen.getByText('Within the daily target range')).toBeInTheDocument();
    expect(screen.queryByText('Over today’s target by')).toBeNull();
    expect(document.querySelector('.bar')).toHaveClass('ok');
  });
  it('more than 10% above the target shows the over warning with the same tone as the bar', () => {
    renderWith(<DayHero totals={totals(3400)} targets={targets} />, { lang: 'he' });
    const num = screen.getByTestId('remaining-kcal');
    expect(num).toHaveTextContent('357');
    expect(num).toHaveClass('warning');
    expect(screen.getByText('חריגה מהיעד היומי')).toBeInTheDocument();
    expect(document.querySelector('.bar')).toHaveClass('over');
  });
  it('below the target shows what is left', () => {
    renderWith(<DayHero totals={totals(2000)} targets={targets} />);
    expect(screen.getByTestId('remaining-kcal')).toHaveTextContent('1,043');
    expect(screen.getByText('Left for today')).toBeInTheDocument();
  });
});
