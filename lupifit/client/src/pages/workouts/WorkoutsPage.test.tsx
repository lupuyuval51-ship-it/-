import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../features/ready/ReadyTab', () => ({ ReadyTab: () => <p>ready tab content</p> }));
vi.mock('../../features/workouts/GeneratorForm', () => ({ GeneratorForm: () => <p>generator content</p> }));
vi.mock('../../features/workouts/PlanList', () => ({ PlanList: () => <p>plans content</p> }));

import { I18nProvider } from '../../i18n';
import WorkoutsPage from './WorkoutsPage';

function Where() {
  const loc = useLocation();
  return <output data-testid="where">{`${loc.pathname}${loc.search}`}</output>;
}

const open = (route: string, locale: 'en' | 'he' = 'en') =>
  render(
    <I18nProvider locale={locale}>
      <MemoryRouter initialEntries={[route]}>
        <WorkoutsPage />
        <Where />
      </MemoryRouter>
    </I18nProvider>,
  );

beforeEach(() => {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

describe('/workouts tabs', () => {
  it('has the ready workouts as the third tab, after my plans and the generator', () => {
    open('/workouts');
    const tabs = screen.getAllByRole('tab').map((t) => t.textContent);
    expect(tabs).toEqual(['My plans', 'Smart workout generator', 'Ready workouts']);
    expect(screen.getByText('plans content')).toBeTruthy();
  });

  it('opens the ready workouts from ?tab=ready and switches between all three', () => {
    open('/workouts?tab=ready');
    expect(screen.getByRole('tab', { name: 'Ready workouts' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('ready tab content')).toBeTruthy();
    expect(screen.getByRole('tabpanel', { name: 'Ready workouts' })).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Smart workout generator' }));
    expect(screen.getByTestId('where').textContent).toBe('/workouts?tab=generate');
    expect(screen.getByText('generator content')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Ready workouts' }));
    expect(screen.getByTestId('where').textContent).toBe('/workouts?tab=ready');

    fireEvent.click(screen.getByRole('tab', { name: 'My plans' }));
    expect(screen.getByTestId('where').textContent).toBe('/workouts');
    expect(screen.getByText('plans content')).toBeTruthy();
  });

  it('names the tab in Hebrew', () => {
    open('/workouts?tab=ready', 'he');
    expect(screen.getByRole('tab', { name: 'אימונים מוכנים' }).getAttribute('aria-selected')).toBe('true');
  });
});
