import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View, type TextInputInstance } from 'react-native';
import { Button, InlineNotice, Text, TextField } from '@/components/ui';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { toAppError, type AppError } from '@/lib/errors';
import { useFieldError } from '@/lib/forms';
import { spacing } from '@/theme/tokens';
import { useAuth } from '../AuthProvider';
import { signUpSchema, type SignUpValues } from '../schemas';
import { AuthScaffold } from './AuthScaffold';
import { PasswordRules } from './PasswordRules';

export function SignUpView() {
  const t = useT();
  const router = useRouter();
  const { locale } = useLocale();
  const { signUp } = useAuth();
  const fieldError = useFieldError();
  const [serverError, setServerError] = useState<AppError | null>(null);
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { displayName: '', email: '', password: '', locale },
  });
  const password = useWatch({ control, name: 'password' });

  // The language picked on this screen becomes the account's language.
  useEffect(() => {
    setValue('locale', locale);
  }, [locale, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const { needsEmailConfirmation } = await signUp(values);
      if (needsEmailConfirmation) setConfirmationSentTo(values.email.trim());
      // Otherwise the session is set and the root guards open onboarding.
    } catch (e) {
      setServerError(toAppError(e));
    }
  });

  if (confirmationSentTo) {
    return (
      <AuthScaffold
        title={t('auth.confirmEmail.title')}
        subtitle={t('auth.confirmEmail.body', { email: confirmationSentTo })}
        testID="confirm-email-screen"
      >
        <Button label={t('auth.confirmEmail.backToSignIn')} onPress={() => router.replace('/sign-in')} fullWidth />
        <Button
          variant="quiet"
          label={t('auth.confirmEmail.useDifferentEmail')}
          onPress={() => {
            reset({ displayName: '', email: '', password: '', locale });
            setConfirmationSentTo(null);
          }}
          fullWidth
        />
      </AuthScaffold>
    );
  }

  return (
    <AuthScaffold
      title={t('auth.signUp.title')}
      subtitle={t('auth.signUp.subtitle')}
      testID="sign-up-screen"
      footer={
        <>
          <Text variant="callout" tone="secondary">
            {t('auth.signUp.haveAccount')}
          </Text>
          <Button variant="quiet" inline label={t('auth.signUp.signIn')} onPress={() => router.replace('/sign-in')} testID="go-sign-in" />
        </>
      }
    >
      {serverError ? (
        <InlineNotice
          tone="error"
          message={t(serverError.messageKey)}
          action={serverError.code === 'user_already_exists' ? { label: t('auth.signUp.signIn'), onPress: () => router.replace('/sign-in') } : undefined}
          testID="sign-up-error"
        />
      ) : null}
      <Controller
        control={control}
        name="displayName"
        render={({ field }) => (
          <TextField
            label={t('auth.fields.displayName')}
            hint={t('auth.fields.displayNameHint')}
            autoComplete="name"
            textContentType="name"
            autoCapitalize="words"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            error={fieldError(errors.displayName)}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            submitBehavior="submit"
            maxLength={100}
            testID="display-name-input"
          />
        )}
      />
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
            ref={(instance) => {
              field.ref(instance);
              emailRef.current = instance;
            }}
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
            autoComplete="new-password"
            textContentType="newPassword"
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
            testID="password-input"
          />
        )}
      />
      <PasswordRules password={password} />
      <View style={styles.submit}>
        <Button label={t('auth.signUp.submit')} onPress={() => void onSubmit()} loading={isSubmitting} fullWidth testID="sign-up-submit" />
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: spacing[2] },
});
