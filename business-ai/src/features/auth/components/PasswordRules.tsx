import { StyleSheet, View } from 'react-native';
import { Icon, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { spacing } from '@/theme/tokens';
import { passwordRules } from '../schemas';

export interface PasswordRulesProps {
  password: string;
  /** After a submit attempt: unmet rules turn red (they replace the field's error text). */
  showErrors?: boolean;
}

/** Live checklist of the password policy under a new-password field. */
export function PasswordRules({ password, showErrors = false }: PasswordRulesProps) {
  const t = useT();
  const state = passwordRules(password);
  const rules = [
    { key: 'minLength', met: state.minLength, label: t('auth.passwordRules.minLength') },
    { key: 'letterAndNumber', met: state.letterAndNumber, label: t('auth.passwordRules.letterAndNumber') },
  ] as const;
  return (
    <View style={styles.list} accessibilityLabel={t('auth.passwordRules.title')} testID="password-rules">
      {rules.map((rule) => {
        const failed = showErrors && !rule.met;
        return (
          <View
            key={rule.key}
            style={styles.rule}
            accessible
            accessibilityLabel={`${rule.label}. ${rule.met ? t('auth.passwordRules.met') : t('auth.passwordRules.unmet')}`}
          >
            <Icon
              name={rule.met ? 'check' : failed ? 'alert-circle' : 'circle'}
              size={rule.met || failed ? 14 : 10}
              tone={rule.met ? 'accent' : failed ? 'danger' : 'secondary'}
              style={styles.icon}
            />
            <Text variant="caption" tone={rule.met ? 'default' : failed ? 'danger' : 'secondary'}>
              {rule.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing[1], marginTop: -spacing[2] },
  rule: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  icon: { width: 14, textAlign: 'center' },
});
