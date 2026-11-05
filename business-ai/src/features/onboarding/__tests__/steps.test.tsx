import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import type { OnboardingAnswers } from '@domain/onboarding';
import { renderWithProviders } from '@/test/renderWithProviders';
import { QuestionStep, type StepContext } from '../components/QuestionSteps';
import { ReviewStep } from '../components/ReviewStep';
import { withAnswer } from '../logic';
import { useOnboardingDraftStore } from '../store';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));

function makeCtx(overrides: Partial<StepContext> = {}): StepContext {
  return {
    scope: 'biz-1',
    answers: {},
    defaults: { countryCode: null, currency: 'ILS' },
    pending: null,
    error: null,
    notice: null,
    announceRestoredDraft: true,
    offline: false,
    onSave: jest.fn(async () => undefined),
    ...overrides,
  };
}

beforeEach(() => {
  useOnboardingDraftStore.getState().clearAll();
});

describe('question steps', () => {
  it('idea step validates, then saves the trimmed idea and working name (no Skip on step 1)', async () => {
    const ctx = makeCtx();
    await renderWithProviders(<QuestionStep step="business_idea" ctx={ctx} />, { locale: 'en' });
    expect(screen.getByText('What’s your idea?')).toBeTruthy();
    expect(screen.getByText('Step ⁨1⁩ of ⁨8⁩')).toBeTruthy();
    expect(screen.queryByTestId('onboarding-skip')).toBeNull();

    await fireEvent.press(screen.getByTestId('onboarding-continue'));
    expect(await screen.findByText('Describe your idea in a few words (at least 3 characters).')).toBeTruthy();
    expect(ctx.onSave).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByTestId('onboarding-idea'), '  A home bakery  ');
    await fireEvent.changeText(screen.getByTestId('onboarding-name'), ' Crumb ');
    await fireEvent.press(screen.getByTestId('onboarding-continue'));
    await waitFor(() => expect(ctx.onSave).toHaveBeenCalledWith('business_idea', { idea: 'A home bakery', name: 'Crumb' }, 'continue'));
  });

  it('mirrors typing into the persisted draft and restores it on the next mount', async () => {
    const ctx = makeCtx();
    const first = await renderWithProviders(<QuestionStep step="target_customers" ctx={ctx} />, { locale: 'he' });
    await fireEvent.changeText(screen.getByTestId('onboarding-customers'), 'הורים צעירים בחיפה');
    await waitFor(() =>
      expect(useOnboardingDraftStore.getState().drafts['biz-1/target_customers']?.fields).toEqual({ text: 'הורים צעירים בחיפה' }),
    );
    await first.unmount();

    await renderWithProviders(<QuestionStep step="target_customers" ctx={ctx} />, { locale: 'he' });
    expect(screen.getByTestId('onboarding-customers').props.value).toBe('הורים צעירים בחיפה');
    expect(screen.getByText('שחזרנו את מה שהתחלת לכתוב.')).toBeTruthy();
  });

  it('budget step parses money into minor units and Skip saves null', async () => {
    const ctx = makeCtx({ defaults: { countryCode: 'IL', currency: 'ILS' } });
    await renderWithProviders(<QuestionStep step="starting_budget" ctx={ctx} />, { locale: 'he' });
    expect(screen.getByText('שלב ⁨3⁩ מתוך ⁨8⁩')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('onboarding-budget-amount'), '₪ 12,500');
    await fireEvent.press(screen.getByTestId('onboarding-continue'));
    await waitFor(() =>
      expect(ctx.onSave).toHaveBeenCalledWith('starting_budget', { amount_minor: 1_250_000, currency: 'ILS' }, 'continue'),
    );
    await fireEvent.press(screen.getByTestId('onboarding-skip'));
    await waitFor(() => expect(ctx.onSave).toHaveBeenLastCalledWith('starting_budget', null, 'skip'));
  });

  it('choice steps require a selection', async () => {
    const ctx = makeCtx();
    await renderWithProviders(<QuestionStep step="weekly_hours" ctx={ctx} />, { locale: 'en' });
    await fireEvent.press(screen.getByTestId('onboarding-continue'));
    expect(await screen.findByText('Choose one of the options.')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('onboarding-hours-h10_20'));
    await fireEvent.press(screen.getByTestId('onboarding-continue'));
    await waitFor(() => expect(ctx.onSave).toHaveBeenCalledWith('weekly_hours', { range: 'h10_20' }, 'continue'));
  });

  it('country step searches in both languages and suggests the currency', async () => {
    const ctx = makeCtx();
    await renderWithProviders(<QuestionStep step="country" ctx={ctx} />, { locale: 'he' });
    await fireEvent.changeText(screen.getByTestId('onboarding-country-search'), 'portu');
    await fireEvent.press(screen.getByTestId('onboarding-country-PT'));
    expect(await screen.findByText('נבחרה: ⁨פורטוגל⁩')).toBeTruthy();
    expect(screen.getByText(/EUR/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('onboarding-continue'));
    await waitFor(() => expect(ctx.onSave).toHaveBeenCalledWith('country', { code: 'PT' }, 'continue'));
  });

  it('offline: actions are disabled and the draft notice explains it', async () => {
    const ctx = makeCtx({ offline: true });
    await renderWithProviders(<QuestionStep step="launch_timeline" ctx={ctx} />, { locale: 'en' });
    expect(screen.getByText(/You’re offline/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('onboarding-timeline-m3'));
    await fireEvent.press(screen.getByTestId('onboarding-continue'));
    expect(ctx.onSave).not.toHaveBeenCalled();
  });
});

describe('review step', () => {
  it('lists every answer, marks skipped ones and jumps back to edit', async () => {
    let answers: OnboardingAnswers = {};
    answers = withAnswer(answers, 'business_idea', { idea: 'A home bakery' });
    answers = withAnswer(answers, 'country', null);
    const onEdit = jest.fn();
    const onCreate = jest.fn();
    await renderWithProviders(
      <ReviewStep answers={answers} onEdit={onEdit} onCreate={onCreate} creating={false} onBack={jest.fn()} error={null} offline={false} />,
      { locale: 'en' },
    );
    expect(screen.getByText('A home bakery')).toBeTruthy();
    expect(screen.getByText('Skipped')).toBeTruthy();
    expect(screen.getAllByText('Not answered yet')).toHaveLength(6);
    await fireEvent.press(screen.getByTestId('onboarding-review-country'));
    expect(onEdit).toHaveBeenCalledWith('country');
    await fireEvent.press(screen.getByText('Create my business plan'));
    expect(onCreate).toHaveBeenCalled();
  });
});
