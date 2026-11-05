import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/renderWithProviders';
import { DateField } from '../components/DateField';
import { TaskRow } from '../components/TaskRow';
import { addDays, todayISO } from '../dates';
import type { TaskRow as TaskRowData } from '../types';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));

function makeTask(partial: Partial<TaskRowData> = {}): TaskRowData {
  return {
    id: 't1',
    business_id: 'b1',
    title: 'Open a business bank account',
    description: '',
    phase: 'days_30',
    milestone_id: null,
    priority: 'medium',
    status: 'todo',
    due_date: null,
    completed_at: null,
    source: 'ai',
    sort_order: 0,
    created_at: '2026-11-01T00:00:00.000Z',
    updated_at: '2026-11-01T00:00:00.000Z',
    ...partial,
  };
}

describe('TaskRow', () => {
  it('shows relative due, priority and the blocked hint; toggles and opens separately', async () => {
    const onToggle = jest.fn();
    const onPress = jest.fn();
    await renderWithProviders(
      <TaskRow
        task={makeTask({ due_date: addDays(todayISO(), -2), priority: 'high' })}
        blockedBy={['Register the business']}
        onToggle={onToggle}
        onPress={onPress}
        testID="row"
      />,
      { locale: 'en' },
    );
    expect(screen.getByText('Open a business bank account')).toBeTruthy();
    expect(screen.getByText(/Overdue by/)).toBeTruthy();
    expect(screen.getByText('High priority')).toBeTruthy();
    expect(screen.getByText(/Blocked by: .*Register the business/)).toBeTruthy();

    await fireEvent.press(screen.getByTestId('row-toggle'));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('row-open'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('marks done tasks as checked and hides the blocked hint', async () => {
    await renderWithProviders(
      <TaskRow
        task={makeTask({ status: 'done', completed_at: new Date().toISOString(), due_date: todayISO() })}
        blockedBy={['Something']}
        onToggle={() => undefined}
        onPress={() => undefined}
        testID="row"
      />,
      { locale: 'he' },
    );
    expect(screen.getByTestId('row-toggle').props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.queryByText(/תלויה ב/)).toBeNull();
    expect(screen.getByText(/הושלמה/)).toBeTruthy();
  });
});

describe('DateField', () => {
  it('picks a quick choice', async () => {
    const onChange = jest.fn();
    await renderWithProviders(<DateField label="Due date" value={null} onChange={onChange} testID="due" />, { locale: 'en' });
    expect(screen.getByText('No date')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('due-open'));
    await fireEvent.press(screen.getByRole('button', { name: /^Tomorrow,/ }));
    expect(onChange).toHaveBeenCalledWith(addDays(todayISO(), 1));
  });

  it('picks a day from the calendar and clears', async () => {
    const onChange = jest.fn();
    const today = todayISO();
    const month = today.slice(0, 7);
    await renderWithProviders(<DateField label="Due date" value={`${month}-10`} onChange={onChange} testID="due" />, { locale: 'he' });
    await fireEvent.press(screen.getByTestId('due-open'));
    await fireEvent.press(screen.getByText('15'));
    expect(onChange).toHaveBeenLastCalledWith(`${month}-15`);

    await fireEvent.press(screen.getByTestId('due-open'));
    await fireEvent.press(screen.getByRole('button', { name: 'ללא תאריך' }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('navigates months', async () => {
    await renderWithProviders(<DateField label="Due date" value="2026-11-05" onChange={() => undefined} testID="due" />, { locale: 'en' });
    await fireEvent.press(screen.getByTestId('due-open'));
    expect(screen.getByText('November 2026')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('December 2026')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Previous month' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByText('October 2026')).toBeTruthy();
  });
});
