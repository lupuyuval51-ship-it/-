import { act, fireEvent, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { Button, ConfirmDialog, Sheet, Text, useConfirm, useNotice } from '..';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));

function ConfirmHarness({ onResult }: { onResult: (v: boolean) => void }) {
  const confirm = useConfirm();
  return (
    <Button
      label="Delete"
      onPress={async () => {
        onResult(await confirm({ title: 'Delete task?', message: 'This cannot be undone.', confirmLabel: 'Delete', destructive: true }));
      }}
    />
  );
}

describe('useConfirm', () => {
  it('resolves true when confirmed', async () => {
    const onResult = jest.fn();
    await renderWithProviders(<ConfirmHarness onResult={onResult} />, { locale: 'en' });
    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Delete task?')).toBeTruthy();
    expect(screen.getByText('This cannot be undone.')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('confirm-accept'));
    expect(onResult).toHaveBeenCalledWith(true);
    expect(screen.queryByText('Delete task?')).toBeNull();
  });

  it('resolves false when cancelled', async () => {
    const onResult = jest.fn();
    await renderWithProviders(<ConfirmHarness onResult={onResult} />, { locale: 'en' });
    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
    await screen.findByText('Delete task?');
    await fireEvent.press(screen.getByTestId('confirm-cancel'));
    expect(onResult).toHaveBeenCalledWith(false);
  });

  it('a second request cancels the first', async () => {
    const results: boolean[] = [];
    function Double() {
      const confirm = useConfirm();
      return (
        <Button
          label="Twice"
          onPress={() => {
            void confirm({ title: 'First' }).then((v) => results.push(v));
            void confirm({ title: 'Second' }).then((v) => results.push(v));
          }}
        />
      );
    }
    await renderWithProviders(<Double />, { locale: 'en' });
    await fireEvent.press(screen.getByRole('button', { name: 'Twice' }));
    expect(await screen.findByText('Second')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('confirm-accept'));
    expect(results).toEqual([false, true]);
  });
});

describe('ConfirmDialog', () => {
  it('uses translated default labels', async () => {
    await renderWithProviders(<ConfirmDialog visible title="Sure?" onConfirm={() => undefined} onCancel={() => undefined} />, { locale: 'he' });
    expect(screen.getByText('אישור')).toBeTruthy();
    expect(screen.getByText('ביטול')).toBeTruthy();
  });
});

describe('useNotice', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('shows a quiet notice and hides it after ~3 s', async () => {
    function Harness() {
      const notice = useNotice();
      return <Button label="Save" onPress={() => notice.show({ message: 'Saved' })} />;
    }
    await renderWithProviders(<Harness />, { locale: 'en' });
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Saved')).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(3500);
    });
    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('can be dismissed', async () => {
    function Harness() {
      const notice = useNotice();
      return <Button label="Show" onPress={() => notice.show({ tone: 'error', message: 'Failed' })} />;
    }
    await renderWithProviders(<Harness />, { locale: 'en' });
    await fireEvent.press(screen.getByRole('button', { name: 'Show' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Dismiss notice' }));
    expect(screen.queryByText('Failed')).toBeNull();
  });
});

describe('Sheet', () => {
  it('renders its title and content and closes from the close button', async () => {
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <Sheet visible={open} onClose={() => setOpen(false)} title="Filters">
          <Text>Body</Text>
        </Sheet>
      );
    }
    await renderWithProviders(<Harness />, { locale: 'en' });
    expect(screen.getByText('Filters')).toBeTruthy();
    expect(screen.getByText('Body')).toBeTruthy();
    await fireEvent.press(screen.getAllByRole('button', { name: 'Close' })[1]!);
    expect(screen.queryByText('Body')).toBeNull();
  });
});
