import { useState, type ReactNode, type Ref } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputBlurEvent,
  type TextInputFocusEvent,
  type TextInputInstance,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { currencySymbol, isolate } from '@/i18n/format';
import { useLocale, useT, useTextAlign } from '@/i18n/I18nProvider';
import { fontStyleFor } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeProvider';
import { layout, radii, spacing, typography } from '@/theme/tokens';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { Text } from './Text';

export type TextFieldMode = 'text' | 'email' | 'password' | 'number' | 'money';

export interface TextFieldProps extends Omit<TextInputProps, 'style' | 'editable' | 'secureTextEntry' | 'multiline'> {
  label: string;
  /** Helper text under the field (hidden while an error is shown). */
  hint?: string;
  /** Translated error message. Turns the field red and is announced to screen readers. */
  error?: string;
  /**
   * Marks the field invalid without a message under it (when the message is shown elsewhere,
   * e.g. the password rules checklist).
   */
  invalid?: boolean;
  /**
   * text (default) · email (email keyboard, no autocaps) · password (secure + show/hide) ·
   * number (decimal keyboard) · money (decimal keyboard + currency symbol; parse with parseMoneyInput).
   */
  mode?: TextFieldMode;
  /** ISO-4217, required for `money` mode adornment. */
  currency?: string;
  multiline?: boolean;
  disabled?: boolean;
  /** Small control on the label row, at the end (e.g. a "Forgot password?" link). */
  labelAccessory?: ReactNode;
  ref?: Ref<TextInputInstance>;
  containerStyle?: StyleProp<ViewStyle>;
}

function modeProps(mode: TextFieldMode): Partial<TextInputProps> {
  switch (mode) {
    case 'email':
      return {
        keyboardType: 'email-address',
        inputMode: 'email',
        autoCapitalize: 'none',
        autoCorrect: false,
        autoComplete: 'email',
        textContentType: 'emailAddress',
      };
    case 'password':
      return { autoCapitalize: 'none', autoCorrect: false };
    case 'number':
    case 'money':
      return { keyboardType: 'decimal-pad', inputMode: 'decimal', autoCorrect: false };
    case 'text':
      return {};
  }
}

export function TextField({
  label,
  hint,
  error,
  invalid = false,
  mode = 'text',
  currency,
  multiline = false,
  disabled = false,
  labelAccessory,
  ref,
  containerStyle,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const { colors, fontsAvailable } = useTheme();
  const { locale } = useLocale();
  const textAlign = useTextAlign();
  const t = useT();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const handleFocus = (e: TextInputFocusEvent) => {
    setFocused(true);
    onFocus?.(e);
  };
  const handleBlur = (e: TextInputBlurEvent) => {
    setFocused(false);
    onBlur?.(e);
  };

  const hasError = !!error || invalid;
  const borderColor = hasError ? colors.danger : focused ? colors.accent : colors.borderStrong;
  const type = typography.body;
  const prefix = mode === 'money' && currency ? isolate(currencySymbol(currency, locale)) : null;

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.labelRow}>
        <Text variant="callout" weight={500} style={styles.label}>
          {label}
        </Text>
        {labelAccessory}
      </View>
      <View
        style={[
          styles.field,
          {
            borderColor,
            backgroundColor: disabled ? colors.backgroundAlt : colors.surface,
            minHeight: multiline ? 112 : layout.controlHeight,
            alignItems: multiline ? 'flex-start' : 'center',
          },
        ]}
      >
        {prefix ? (
          <Text variant="body" tone="secondary" style={styles.prefix}>
            {prefix}
          </Text>
        ) : null}
        <TextInput
          ref={ref}
          {...modeProps(mode)}
          {...inputProps}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          accessibilityState={{ disabled }}
          editable={!disabled}
          multiline={multiline}
          secureTextEntry={mode === 'password' && !revealed}
          textAlignVertical={multiline ? 'top' : 'center'}
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            fontStyleFor(locale, 400, fontsAvailable),
            {
              color: colors.text,
              fontSize: type.fontSize,
              lineHeight: Platform.OS === 'ios' ? undefined : type.lineHeight,
              textAlign: textAlign.start,
              paddingVertical: multiline ? spacing[3] : Platform.OS === 'web' ? spacing[3] : 0,
              minHeight: multiline ? 112 - 2 : layout.controlHeight - 2,
            },
            Platform.OS === 'web' ? styles.webInput : null,
          ]}
        />
        {mode === 'password' ? (
          <IconButton
            icon={revealed ? 'eye-off' : 'eye'}
            accessibilityLabel={revealed ? t('common.a11y.hidePassword') : t('common.a11y.showPassword')}
            onPress={() => setRevealed((v) => !v)}
            size="compact"
            tone="secondary"
            style={styles.reveal}
          />
        ) : null}
      </View>
      {error ? (
        <View style={styles.message} accessibilityLiveRegion="polite">
          <Icon name="alert-circle" size={14} tone="danger" style={styles.messageIcon} />
          <Text variant="caption" tone="danger" style={styles.messageText}>
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text variant="caption" tone="secondary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'stretch', gap: spacing[2] },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] },
  label: { flexShrink: 1 },
  field: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radii.control,
    paddingHorizontal: spacing[3],
    gap: spacing[2],
  },
  prefix: { alignSelf: 'center' },
  input: { flex: 1, minWidth: 0, margin: 0 },
  // The field border shows focus (accent); drop the browser's default focus ring on the inner <input>.
  webInput: { outlineStyle: 'none' } as unknown as TextStyle,
  reveal: { alignSelf: 'center', marginEnd: -spacing[2] },
  message: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[1] + 2 },
  messageIcon: { marginTop: 2 },
  messageText: { flexShrink: 1 },
});
