import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Platform, StyleSheet, View, type TextInputInstance } from 'react-native';
import { Button, InlineNotice, LoadingState, TextField, useNotice } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { toAppError, type AppError } from '@/lib/errors';
import { decodeFieldMessage, useFieldError } from '@/lib/forms';
import { spacing } from '@/theme/tokens';
import { useAuth } from '../AuthProvider';
import { hasAuthCallbackError, parseAuthCallbackParams } from '../recovery';
import { PASSWORD_POLICY_ERROR_KEYS, resetPasswordSchema, type ResetPasswordValues } from '../schemas';
import { AuthScaffold } from './AuthScaffold';
import { PasswordRules } from './PasswordRules';

type Phase = 'verifying' | 'form' | 'invalid' | 'missing';

/**
 * /reset-password — reachable signed in or out.
 * Web: supabase-js (detectSessionInUrl + PKCE) exchanges `?code=` during start-up.
 * Native: the deep link `businessai://reset-password?code=…` is exchanged here.
 * Any signed-in user can also use it to change their password.
 */
export function ResetPasswordView() {
  const t = useT();
  const router = useRouter();
  const notice = useNotice();
  const fieldError = useFieldError();
  const { session, isLoading, updatePassword, exchangeCodeForSession } = useAuth();
  const params = useLocalSearchParams<{ code?: string; error?: string; error_code?: string; error_description?: string }>();
  const callback = parseAuthCallbackParams(params);
  const linkError = hasAuthCallbackError(callback);
  const [exchangeResult, setExchangeResult] = useState<{ code: string; ok: boolean } | null>(null);
  const [serverError, setServerError] = useState<AppError | null>(null);
  const attempted = useRef<string | null>(null);
  const confirmRef = useRef<TextInputInstance>(null);
  const code = callback.code;
  const needsExchange = Platform.OS !== 'web' && !isLoading && !session && code !== null && !linkError;

  useEffect(() => {
    if (!needsExchange || !code || attempted.current === code) return;
    attempted.current = code;
    exchangeCodeForSession(code)
      .then(() => setExchangeResult({ code, ok: true }))
      .catch((e: unknown) => {
        setServerError(toAppError(e));
        setExchangeResult({ code, ok: false });
      });
  }, [needsExchange, code, exchangeCodeForSession]);

  const settled = exchangeResult !== null && exchangeResult.code === code;
  const exchangePending = needsExchange && !settled;
  const exchangeSucceeded = settled && exchangeResult.ok; // session arrives a tick later
  const exchangeFailed = settled && !exchangeResult.ok;

  const phase: Phase = session
    ? 'form'
    : isLoading || exchangePending || exchangeSucceeded
      ? 'verifying'
      : linkError || exchangeFailed || code
        ? 'invalid'
        : 'missing';

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: '', confirm: '' } });
  const password = useWatch({ control, name: 'password' });
  const passwordErrorKey = errors.password?.message ? decodeFieldMessage(errors.password.message)?.key : undefined;
  const passwordPolicyError = passwordErrorKey !== undefined && PASSWORD_POLICY_ERROR_KEYS.includes(passwordErrorKey);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await updatePassword(values.password);
      notice.show({ message: t('auth.reset.success') });
      router.replace('/');
    } catch (e) {
      setServerError(toAppError(e));
    }
  });

  if (phase === 'verifying') {
    return (
      <AuthScaffold title={t('auth.reset.title')} subtitle={t('auth.reset.verifying')} testID="reset-verifying">
        <LoadingState variant="text" count={2} accessibilityLabel={t('auth.reset.verifying')} />
      </AuthScaffold>
    );
  }

  if (phase === 'invalid' || phase === 'missing') {
    const invalid = phase === 'invalid';
    return (
      <AuthScaffold
        title={invalid ? t('auth.reset.invalidTitle') : t('auth.reset.missingTitle')}
        subtitle={invalid ? t('auth.reset.invalidBody') : t('auth.reset.missingBody')}
        testID={invalid ? 'reset-invalid' : 'reset-missing'}
      >
        {serverError && serverError.code === 'network' ? <InlineNotice tone="error" message={t(serverError.messageKey)} /> : null}
        <Button label={t('auth.reset.requestNew')} onPress={() => router.replace('/forgot-password')} fullWidth />
        <Button variant="quiet" label={t('auth.forgot.backToSignIn')} onPress={() => router.replace('/sign-in')} fullWidth />
      </AuthScaffold>
    );
  }

  return (
    <AuthScaffold title={t('auth.reset.title')} subtitle={t('auth.reset.subtitle')} testID="reset-form">
      {serverError ? <InlineNotice tone="error" message={t(serverError.messageKey)} testID="reset-error" /> : null}
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label={t('auth.fields.newPassword')}
            mode="password"
            autoComplete="new-password"
            textContentType="newPassword"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            error={passwordPolicyError ? undefined : fieldError(errors.password)}
            invalid={!!errors.password}
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
            submitBehavior="submit"
            testID="new-password-input"
          />
        )}
      />
      <PasswordRules password={password} showErrors={passwordPolicyError} />
      <Controller
        control={control}
        name="confirm"
        render={({ field }) => (
          <TextField
            label={t('auth.fields.confirmPassword')}
            mode="password"
            autoComplete="new-password"
            textContentType="newPassword"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            ref={(instance) => {
              field.ref(instance);
              confirmRef.current = instance;
            }}
            error={fieldError(errors.confirm)}
            returnKeyType="go"
            onSubmitEditing={() => void onSubmit()}
            testID="confirm-password-input"
          />
        )}
      />
      <View style={styles.submit}>
        <Button label={t('auth.reset.submit')} onPress={() => void onSubmit()} loading={isSubmitting} fullWidth testID="reset-submit" />
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: spacing[2] },
});
