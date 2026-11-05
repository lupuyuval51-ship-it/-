import { fireEvent, screen } from '@testing-library/react-native';
import { I18nManager, StyleSheet } from 'react-native';
import { palettes } from '@/theme/tokens';
import { renderWithProviders } from '@/test/renderWithProviders';
import {
  BasisTag,
  Button,
  Checkbox,
  ChoiceList,
  EmptyState,
  ErrorState,
  Icon,
  InlineNotice,
  ListRow,
  LoadingState,
  ProgressBar,
  Section,
  SegmentedControl,
  Text,
  TextField,
} from '..';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));

function flat(style: unknown) {
  return StyleSheet.flatten(style as never) as Record<string, unknown>;
}

describe('Text', () => {
  it('picks Heebo per weight in Hebrew and never tracks or uppercases Hebrew', async () => {
    await renderWithProviders(
      <>
        <Text variant="heading">כותרת</Text>
        <Text variant="body">גוף</Text>
        <Text variant="overline">תווית</Text>
      </>,
      { locale: 'he' },
    );
    expect(flat(screen.getByText('כותרת').props.style)).toMatchObject({ fontFamily: 'Heebo-SemiBold', fontSize: 17, lineHeight: 24, letterSpacing: 0 });
    expect(flat(screen.getByText('גוף').props.style)).toMatchObject({ fontFamily: 'Heebo-Regular', fontSize: 16 });
    const overline = flat(screen.getByText('תווית').props.style);
    expect(overline.fontFamily).toBe('Heebo-Medium');
    expect(overline.textTransform).toBeUndefined();
  });

  it('picks Inter in English, uppercases overlines and applies tone colors', async () => {
    await renderWithProviders(
      <>
        <Text variant="overline">Label</Text>
        <Text variant="body" tone="secondary" weight={600}>
          Body
        </Text>
        <Text numeric>1,234</Text>
      </>,
      { locale: 'en', theme: 'dark' },
    );
    expect(flat(screen.getByText('Label').props.style)).toMatchObject({ fontFamily: 'Inter-Medium', textTransform: 'uppercase', letterSpacing: 0.4 });
    expect(flat(screen.getByText('Body').props.style)).toMatchObject({ fontFamily: 'Inter-SemiBold', color: palettes.dark.textSecondary });
    expect(flat(screen.getByText('1,234').props.style).fontVariant).toEqual(['tabular-nums']);
  });

  it('falls back to system weights when custom fonts failed to load', async () => {
    await renderWithProviders(<Text variant="heading">X</Text>, { locale: 'en', fontsAvailable: false });
    const style = flat(screen.getByText('X').props.style);
    expect(style.fontFamily).toBeUndefined();
    expect(style.fontWeight).toBe('600');
  });

  it('marks heading variants as headers and keeps font scaling enabled', async () => {
    await renderWithProviders(<Text variant="title">T</Text>);
    const node = screen.getByText('T');
    expect(node.props.accessibilityRole).toBe('header');
    expect(node.props.allowFontScaling).not.toBe(false);
  });
});

describe('Button', () => {
  it('fires onPress and exposes button semantics', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Save" onPress={onPress} />, { locale: 'en' });
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is not pressable while loading or disabled and reports busy', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <>
        <Button label="Loading" onPress={onPress} loading />
        <Button label="Disabled" onPress={onPress} disabled />
      </>,
    );
    const loading = screen.getByRole('button', { name: 'Loading' });
    expect(loading.props.accessibilityState).toMatchObject({ busy: true, disabled: true });
    await fireEvent.press(loading);
    await fireEvent.press(screen.getByRole('button', { name: 'Disabled' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('primary uses the accent and onAccent colors', async () => {
    await renderWithProviders(<Button label="Go" />, { theme: 'light' });
    const style = flat(screen.getByRole('button', { name: 'Go' }).props.style);
    expect(style.backgroundColor).toBe(palettes.light.accent);
    expect(flat(screen.getByText('Go').props.style).color).toBe(palettes.light.onAccent);
  });
});

describe('TextField', () => {
  it('labels the input, shows the hint, then the error instead', async () => {
    const { rerender } = await renderWithProviders(<TextField label="Email" hint="We never share it" mode="email" value="" onChangeText={() => undefined} />, {
      locale: 'en',
    });
    const input = screen.getByLabelText('Email');
    expect(input.props.keyboardType).toBe('email-address');
    expect(input.props.autoCapitalize).toBe('none');
    expect(screen.getByText('We never share it')).toBeTruthy();

    await rerender(<TextField label="Email" hint="We never share it" mode="email" value="" onChangeText={() => undefined} error="Enter a valid email address" />);
    expect(screen.queryByText('We never share it')).toBeNull();
    expect(screen.getByText('Enter a valid email address')).toBeTruthy();
    expect(screen.getByLabelText('Email').props.accessibilityHint).toBe('Enter a valid email address');
  });

  it('toggles password visibility with a labelled button', async () => {
    await renderWithProviders(<TextField label="Password" mode="password" value="secret1" onChangeText={() => undefined} />, { locale: 'en' });
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
    await fireEvent.press(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeTruthy();
  });

  it('money mode uses a decimal keyboard and shows the currency symbol', async () => {
    await renderWithProviders(<TextField label="Amount" mode="money" currency="ILS" value="" onChangeText={() => undefined} />);
    expect(screen.getByLabelText('Amount').props.keyboardType).toBe('decimal-pad');
    expect(screen.getByText('⁨₪⁩')).toBeTruthy();
  });

  it('reports changes', async () => {
    const onChangeText = jest.fn();
    await renderWithProviders(<TextField label="Name" value="" onChangeText={onChangeText} />);
    await fireEvent.changeText(screen.getByLabelText('Name'), 'Dana');
    expect(onChangeText).toHaveBeenCalledWith('Dana');
  });
});

describe('selection controls', () => {
  it('ChoiceList selects with radio semantics', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <ChoiceList
        accessibilityLabel="Experience"
        value="some"
        onChange={onChange}
        options={[
          { value: 'none', label: 'None' },
          { value: 'some', label: 'Some', description: 'A little' },
        ]}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Some. A little' }).props.accessibilityState).toMatchObject({ checked: true });
    await fireEvent.press(screen.getByRole('radio', { name: 'None' }));
    expect(onChange).toHaveBeenCalledWith('none');
  });

  it('SegmentedControl ignores presses on the selected segment', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <SegmentedControl
        value="light"
        onChange={onChange}
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
      />,
    );
    await fireEvent.press(screen.getByRole('radio', { name: 'Light' }));
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('radio', { name: 'Dark' }));
    expect(onChange).toHaveBeenCalledWith('dark');
  });

  it('Checkbox toggles', async () => {
    const onChange = jest.fn();
    await renderWithProviders(<Checkbox label="Done" checked={false} onChange={onChange} />);
    const box = screen.getByRole('checkbox', { name: 'Done' });
    expect(box.props.accessibilityState).toMatchObject({ checked: false });
    await fireEvent.press(box);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('content primitives', () => {
  it('ListRow combines title and value for screen readers and is pressable', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<ListRow title="Language" value="English" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Language, English' }));
    expect(onPress).toHaveBeenCalled();
  });

  it('Section renders a header and dividers between rows', async () => {
    await renderWithProviders(
      <Section title="Account" separated>
        <ListRow title="A" />
        <ListRow title="B" />
      </Section>,
    );
    expect(screen.getByRole('header', { name: 'Account' })).toBeTruthy();
  });

  it('ProgressBar clamps and reports its value', async () => {
    await renderWithProviders(<ProgressBar value={1.7} accessibilityLabel="Usage" />, { locale: 'en' });
    const bar = screen.getByRole('progressbar', { name: 'Usage' });
    expect(bar.props.accessibilityValue).toMatchObject({ min: 0, max: 100, now: 100 });
  });

  it('BasisTag labels provenance in the current language', async () => {
    await renderWithProviders(<BasisTag basis="ai_estimate" />, { locale: 'he' });
    expect(screen.getByText('הערכת AI')).toBeTruthy();
    expect(screen.getByLabelText('מקור המידע: ⁨הערכת AI⁩')).toBeTruthy();
  });

  it('EmptyState shows a single action', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<EmptyState title="No tasks" body="Add your first task." action={{ label: 'Add task', onPress }} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Add task' }));
    expect(onPress).toHaveBeenCalled();
  });

  it('ErrorState translates mapped errors and retries', async () => {
    const onRetry = jest.fn();
    await renderWithProviders(<ErrorState error={{ code: 'P0001', message: 'quota_exceeded' }} onRetry={onRetry} />, { locale: 'en' });
    expect(screen.getByText('You’ve reached this month’s limit for this action. It resets at the start of next month.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('ErrorState shows the offline variant for network errors', async () => {
    await renderWithProviders(<ErrorState error={new TypeError('Network request failed')} />, { locale: 'en' });
    expect(screen.getByText('You’re offline')).toBeTruthy();
  });

  it('InlineNotice announces errors as alerts', async () => {
    await renderWithProviders(<InlineNotice tone="error" message="Failed" />);
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('LoadingState is a labelled busy progressbar', async () => {
    await renderWithProviders(<LoadingState />, { locale: 'en' });
    expect(screen.getByRole('progressbar', { name: 'Loading' }).props.accessibilityState).toMatchObject({ busy: true });
  });
});

describe('Icon', () => {
  it('is decorative by default', async () => {
    await renderWithProviders(<Icon name="home" testID="icon" />);
    // Hidden from assistive tech: only found when hidden elements are included.
    expect(screen.queryByTestId('icon')).toBeNull();
    expect(screen.getByTestId('icon', { includeHiddenElements: true }).props.accessible).toBe(false);
  });

  it('mirrors directional icons only in RTL layouts', async () => {
    const replaced = jest.replaceProperty(I18nManager, 'isRTL', true);
    await renderWithProviders(
      <>
        <Icon name="chevron-right" testID="chevron" />
        <Icon name="home" testID="home" />
      </>,
    );
    expect(flat(screen.getByTestId('chevron', { includeHiddenElements: true }).props.style).transform).toEqual([{ scaleX: -1 }]);
    expect(flat(screen.getByTestId('home', { includeHiddenElements: true }).props.style).transform).toBeUndefined();
    replaced.restore();

    await renderWithProviders(<Icon name="chevron-right" testID="ltr" />);
    expect(flat(screen.getByTestId('ltr', { includeHiddenElements: true }).props.style).transform).toBeUndefined();
  });
});

