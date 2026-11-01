import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderPage } from '../../pages/test-harness.tsx';
import { BarChart } from './BarChart.tsx';
import { LineChart } from './LineChart.tsx';

describe('LineChart', () => {
  it('renders the honest empty state with fewer than two points (never draws invented points)', () => {
    const { container } = renderPage(<LineChart series={[{ id: 'a', label: 'A', points: [{ x: '2026-01-01', y: 10 }] }]} ariaLabel="x" caption="c" xHeader="d" />);
    expect(screen.getByText('אין מספיק נתונים עדיין')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeNull();
  });
  it('renders an accessible svg with a data table when there is enough data', () => {
    const { container } = renderPage(<LineChart series={[{ id: 'a', label: 'Bench', points: [{ x: '2026-01-01', y: 60 }, { x: '2026-01-08', y: 65.5 }] }]} ariaLabel="Bench 60 to 65.5" caption="Bench" xHeader="Date" />, { lang: 'en' });
    expect(screen.getByRole('img', { name: 'Bench 60 to 65.5' })).toBeInTheDocument();
    const table = screen.getByRole('table', { hidden: true });
    expect(within(table).getAllByRole('row', { hidden: true })).toHaveLength(3);
    expect(table).toHaveTextContent('65.5');
    expect(container.querySelectorAll('polyline')).toHaveLength(1);
  });
  it('dots-only series alone are not enough for a chart', () => {
    renderPage(<LineChart series={[{ id: 'raw', label: 'r', dotsOnly: true, points: [{ x: '2026-01-01', y: 1 }] }]} ariaLabel="x" caption="c" xHeader="d" />);
    expect(screen.getByText('אין מספיק נתונים עדיין')).toBeInTheDocument();
  });
});

describe('BarChart', () => {
  it('shows the empty state when there are no items or all values are zero', () => {
    const { unmount } = renderPage(<BarChart items={[]} ariaLabel="a" caption="c" labelHeader="l" valueHeader="v" />);
    expect(screen.getByText('אין מספיק נתונים עדיין')).toBeInTheDocument();
    unmount();
    renderPage(<BarChart items={[{ id: 'a', label: 'A', value: 0 }]} ariaLabel="a" caption="c" labelHeader="l" valueHeader="v" />);
    expect(screen.getByText('אין מספיק נתונים עדיין')).toBeInTheDocument();
  });
  it('renders an img with a summary and a table of exact values', () => {
    renderPage(<BarChart items={[{ id: 'chest', label: 'Chest', value: 12 }, { id: 'back', label: 'Back', value: 6 }]} ariaLabel="Sets per group" caption="Sets" labelHeader="Group" valueHeader="Sets" />, { lang: 'en' });
    expect(screen.getByRole('img', { name: 'Sets per group' })).toBeInTheDocument();
    const table = screen.getByRole('table', { hidden: true });
    expect(table).toHaveTextContent('Chest');
    expect(table).toHaveTextContent('12');
  });
});
