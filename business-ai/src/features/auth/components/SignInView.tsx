import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, StyleSheet, View, type TextInputInstance } from 'react-native';
import { Button, InlineNotice, Text, TextField } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { toAppError, type AppError } from '@/lib/errors';
import { useFieldError } from '@/lib/forms';
import { spacing } from '@/theme/tokens';
import { useAuth } from '../AuthProvider';
import { parseAuthCallbackParams } from '../recovery';
import { signInSchema, type SignInValues } from '../schemas';
import { AuthScaffold } from './AuthScaffold';

export function SignInView() {
  const t = useT();
  const router = useRouter();
  const { signIn, exchangeCodeForSession } = useAuth();
  const fieldError = useFieldError();
  const [serverError, setServerError] = useState<AppError | null>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const params = useLocalSearchParams<{ code?: string; error_code?: string; error_description?: string }>();
  const exchanged = useRef<string | null>(null);

  // Email-confirmation links on native return here with a PKCE code (web: detected automatically).
  useEffect(() => {
    const callback = parseAuthCallbackParams(params);
    if (Platform.OS === 'web' || !callback.code || exchanged.current === callback.code) return;
    exchanged.current = callback.code;
    exchangeCodeForSession(callback.code).catch((e: unknown) => setServerError(toAppError(e)));
  }, [params, exchangeCodeForSession]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await signIn(values.email, values.password);
      // Navigation happens through the root guards once the session is set.
    } catch (e) {
      setServerError(toAppError(e));
    }
  });

  return (
    <AuthScaffold
      title={t('auth.signIn.title')}
      subtitle={t('auth.signIn.subtitle')}
      testID="sign-in-screen"
      footer={
        <>
          <Text variant="callout" tone="secondary">
            {t('auth.signIn.noAccount')}
          </Text>
          <Button variant="quiet" inline size="compact" label={t('auth.signIn.createAccount')} onPress={() => router.replace('/sign-up')} testID="go-sign-up" />
        </>
      }
    >
      {serverError ? <InlineNotice tone="error" message={t(serverError.messageKey)} testID="sign-in-error" /> : null}
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label={t('auth.fields.email')}
            mode="email"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            error={fieldError(errors.email)}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            submitBehavior="submit"
            testID="email-input"
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label={t('auth.fields.password')}
            mode="password"
            autoComplete="current-password"
            textContentType="password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            ref={(instance) => {
              field.ref(instance);
              passwordRef.current = instance;
            }}
            error={fieldError(errors.password)}
            returnKeyType="go"
            onSubmitEditing={() => void onSubmit()}
            labelAccessory={
              <Button variant="quiet" inline size="compact" tone="secondary" label={t('auth.signIn.forgot')} onPress={() => router.push('/forgot-password')} testID="go-forgot" />
            }
            testID="password-input"
          />
        )}
      />
      <View style={styles.submit}>
        <Button label={t('auth.signIn.submit')} onPress={() => void onSubmit()} loading={isSubmitting} fullWidth testID="sign-in-submit" />
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: spacing[2] },
});
