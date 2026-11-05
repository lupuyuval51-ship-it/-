import { fireEvent, screen } from '@testing-library/react-native';
import type { AdvisorAction } from '@domain/ai-api';
import { renderWithProviders } from '@/test/renderWithProviders';
import { stripBidi } from '@/i18n/format';
import { previewAction, type WriteAction } from '../actions';
import { ActionConfirmSheet } from '../components/ActionConfirmSheet';
import { AssistantMessage } from '../components/AssistantMessage';
import { Composer } from '../components/Composer';
import type { DisplayItem } from '../conversation';
import { Markdown } from '../markdown';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));

type AssistantItem = Extract<DisplayItem, { kind: 'assistant' }>;

const task: AdvisorAction = {
  type: 'add_task',
  id: 't1',
  label: 'x',
  title: 'Call three suppliers',
  description: 'Ask for minimum order quantities',
  phase: 'days_30',
  priority: 'high',
  dueInDays: 7,
};
const cost: AdvisorAction = { type: 'add_startup_cost', id: 's1', label: 'x', costLabel: 'Espresso machine', amountMinor: 1_250_000 };

function assistant(extra: Partial<AssistantItem> = {}): AssistantItem {
  return {
    kind: 'assistant',
    key: 'a1',
    messageId: 'a1',
    text: '## Pricing\n\nStart with **cost plus**.\n\n- Know your costs\n- Check competitors',
    actions: [task, cost],
    followUps: ['What about discounts?'],
    appliedActionIds: [],
    state: 'complete',
    error: null,
    retryText: null,
    ...extra,
  };
}

const noop = () => undefined;

function allText(): string {
  return stripBidi(JSON.stringify(screen.toJSON()));
}

describe('Markdown', () => {
  it('renders headings, emphasis and lists as text, never HTML', async () => {
    await renderWithProviders(<Markdown source={'# Title\n\nUse **bold** and `code`.\n\n1. one\n2. two\n\n<b>raw</b>'} />, { locale: 'en' });
    expect(screen.getByText('Title')).toBeTruthy();
    expect(screen.getByText('bold')).toBeTruthy();
    expect(screen.getByText('code')).toBeTruthy();
    expect(screen.getByText('one')).toBeTruthy();
    expect(screen.getByText('2.')).toBeTruthy();
    expect(screen.getByText('<b>raw</b>')).toBeTruthy();
  });
});

describe('AssistantMessage', () => {
  it('lists proposed actions and opens one on tap', async () => {
    const onAction = jest.fn();
    await renderWithProviders(
      <AssistantMessage item={assistant()} appliedIds={new Set()} showFollowUps online canSend onAction={onAction} onFollowUp={noop} onRetry={noop} />,
      { locale: 'en' },
    );
    expect(allText()).toContain('Add task: Call three suppliers');
    await fireEvent.press(screen.getByTestId('advisor-action-t1'));
    expect(onAction).toHaveBeenCalledWith(task, 'a1');
  });

  it('shows applied actions as Added and does not offer them again', async () => {
    const onAction = jest.fn();
    await renderWithProviders(
      <AssistantMessage item={assistant()} appliedIds={new Set(['t1'])} showFollowUps={false} online canSend onAction={onAction} onFollowUp={noop} onRetry={noop} />,
      { locale: 'en' },
    );
    expect(screen.getByText('Added')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('advisor-action-t1'));
    expect(onAction).not.toHaveBeenCalled();
  });

  it('disables actions while streaming and hides follow-ups unless requested', async () => {
    const onAction = jest.fn();
    await renderWithProviders(
      <AssistantMessage
        item={assistant({ state: 'streaming', messageId: null })}
        appliedIds={new Set()}
        showFollowUps={false}
        online
        canSend={false}
        onAction={onAction}
        onFollowUp={noop}
        onRetry={noop}
      />,
      { locale: 'en' },
    );
    await fireEvent.press(screen.getByTestId('advisor-action-t1'));
    expect(onAction).not.toHaveBeenCalled();
    expect(screen.queryByText('What about discounts?')).toBeNull();
    expect(screen.getAllByText('Suggestions become available when the reply finishes.').length).toBeGreaterThan(0);
  });

  it('sends a follow-up on tap', async () => {
    const onFollowUp = jest.fn();
    await renderWithProviders(
      <AssistantMessage item={assistant()} appliedIds={new Set()} showFollowUps online canSend onAction={noop} onFollowUp={onFollowUp} onRetry={noop} />,
      { locale: 'he' },
    );
    await fireEvent.press(screen.getByText('What about discounts?'));
    expect(onFollowUp).toHaveBeenCalledWith('What about discounts?');
  });

  it('explains quota errors without a retry and offers retry for transient errors', async () => {
    const quota = { code: 'quota_exceeded' as const, messageKey: 'errors.quotaExceeded' as const, message: 'q', retryable: false };
    const { unmount } = await renderWithProviders(
      <AssistantMessage item={assistant({ state: 'error', error: quota, actions: [], retryText: 'hi' })} appliedIds={new Set()} showFollowUps={false} online canSend onAction={noop} onFollowUp={noop} onRetry={noop} />,
      { locale: 'en' },
    );
    expect(screen.getByText('You’ve reached this month’s advisor limit')).toBeTruthy();
    expect(screen.queryByText('Send again')).toBeNull();
    await unmount();

    const onRetry = jest.fn();
    const network = { code: 'ai_unavailable' as const, messageKey: 'errors.aiUnavailable' as const, message: 'n', retryable: true };
    await renderWithProviders(
      <AssistantMessage item={assistant({ state: 'error', error: network, actions: [], retryText: 'hi' })} appliedIds={new Set()} showFollowUps={false} online canSend onAction={noop} onFollowUp={noop} onRetry={onRetry} />,
      { locale: 'en' },
    );
    await fireEvent.press(screen.getByText('Send again'));
    expect(onRetry).toHaveBeenCalledWith('hi');
  });
});

describe('ActionConfirmSheet', () => {
  it('shows exactly what will be written for a task', async () => {
    const onConfirm = jest.fn();
    const preview = previewAction(task as WriteAction, new Date(2026, 10, 5));
    await renderWithProviders(
      <ActionConfirmSheet preview={preview} currency="ILS" submitting={false} error={null} online onConfirm={onConfirm} onClose={noop} />,
      { locale: 'en' },
    );
    const text = allText();
    expect(text).toContain('Call three suppliers');
    expect(text).toContain('Ask for minimum order quantities');
    expect(text).toContain('First 30 days');
    expect(text).toContain('High');
    expect(text).toContain('November 12, 2026');
    await fireEvent.press(screen.getByTestId('advisor-action-confirm'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('labels finance amounts as AI estimates', async () => {
    const preview = previewAction(cost as WriteAction);
    await renderWithProviders(<ActionConfirmSheet preview={preview} currency="ILS" submitting={false} error={null} online onConfirm={noop} onClose={noop} />, {
      locale: 'en',
    });
    const text = allText();
    expect(text).toContain('Espresso machine');
    expect(text).toContain('12,500');
    expect(text).toContain('AI estimate');
  });
});

describe('Composer', () => {
  it('sends, and is disabled offline with an explanation', async () => {
    const onSend = jest.fn();
    const { rerender } = await renderWithProviders(
      <Composer value="Hello" onChangeText={noop} onSend={onSend} onStop={noop} streaming={false} online />,
      { locale: 'en' },
    );
    await fireEvent.press(screen.getByTestId('advisor-send'));
    expect(onSend).toHaveBeenCalledTimes(1);

    await rerender(<Composer value="Hello" onChangeText={noop} onSend={onSend} onStop={noop} streaming={false} online={false} />);
    expect(screen.getByText('You’re offline. You can read this conversation and send messages once you reconnect.')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('advisor-send'));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('shows Stop while streaming', async () => {
    const onStop = jest.fn();
    await renderWithProviders(<Composer value="" onChangeText={noop} onSend={noop} onStop={onStop} streaming online />, { locale: 'en' });
    await fireEvent.press(screen.getByTestId('advisor-stop'));
    expect(onStop).toHaveBeenCalled();
  });
});
