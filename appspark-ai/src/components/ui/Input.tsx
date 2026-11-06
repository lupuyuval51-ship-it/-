import { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { useI18n } from '@/i18n';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeProvider';
import { hit, radius, space, type as typeScale } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { IconButton } from './IconButton';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: IconName;
  onClear?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  /** Visual size. `lg` is used for the hero search bar. */
  size?: 'md' | 'lg';
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, hint, error, icon, onClear, containerStyle, inputStyle, size = 'md', multiline, value, onFocus, onBlur, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const { isRTL, t } = useI18n();
  const [focused, setFocused] = useState(false);
  const minHeight = multiline ? 120 : size === 'lg' ? 52 : hit;

  return (
    <View style={containerStyle}>
      {label ? (
        <AppText variant="bodySmall" weight="medium" color="textSecondary" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : focused ? colors.borderStrong : colors.border,
            minHeight,
            alignItems: multiline ? 'flex-start' : 'center',
            paddingVertical: multiline ? space.md : 0,
          },
          inputStyle,
        ]}>
        {icon ? <Icon name={icon} size={18} color={focused ? 'text' : 'textTertiary'} style={multiline ? styles.iconTop : undefined} /> : null}
        <TextInput
          ref={ref}
          {...rest}
          value={value}
          multiline={multiline}
          placeholderTextColor={colors.textTertiary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            typeScale.body,
            {
              color: colors.text,
              fontFamily: fonts.sans,
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
              textAlignVertical: multiline ? 'top' : 'center',
              minHeight: multiline ? 96 : undefined,
            },
          ]}
        />
        {onClear && value ? <IconButton icon="x" size={14} variant="plain" accessibilityLabel={t('a11y.clearSearch')} onPress={onClear} style={styles.clear} /> : null}
      </View>
      {error ? (
        <AppText variant="caption" color="danger" style={styles.helper}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color="textTertiary" style={styles.helper}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    marginBottom: space.sm,
  },
  field: {
    flexDirection: 'row',
    gap: space.sm,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.md + 2,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    outlineStyle: 'none',
  } as object,
  iconTop: {
    marginTop: 2,
  },
  clear: {
    width: 32,
    height: 32,
    marginEnd: -space.sm,
  },
  helper: {
    marginTop: space.xs + 2,
  },
});
