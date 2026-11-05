import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, InlineNotice, TextField } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { toAppError, type AppError } from '@/lib/errors';
import { useFieldError } from '@/lib/forms';
import { spacing } from '@/theme/tokens';
import { useAuth } from '../AuthProvider';
import { forgotPasswordSchema, type ForgotPasswordValues } from '../schemas';
import { AuthScaffold } from './AuthScaffold';

export function ForgotPasswordView() {
  const t = useT();
  const router = useRouter();
  const { sendPasswordReset } = useAuth();
  const fieldError = useFieldError();
  const [serverError, setServerError] = useState<AppError | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } });

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/sign-in'));

  const send = async (email: string) => {
    setServerError(null);
    try {
      await sendPasswordReset(email);
      setSentTo(email.trim());
    } catch (e) {
      setServerError(toAppError(e));
    }
  };

  const onSubmit = handleSubmit(async (values) => send(values.email));

  if (sentTo) {
    return (
      <AuthScaffold title={t('auth.forgot.sentTitle')} subtitle={t('auth.forgot.sentBody', { email: sentTo })} onBack={goBack} testID="forgot-sent-screen">
        {serverError ? <InlineNotice tone="error" message={t(serverError.messageKey)} /> : null}
        <Button label={t('auth.forgot.backToSignIn')} onPress={() => router.replace('/sign-in')} fullWidth />
        <Button
          variant="quiet"
          label={t('auth.forgot.resend')}
          loading={resending}
          onPress={async () => {
            setResending(true);
            await send(sentTo);
            setResending(false);
          }}
          fullWidth
        />
      </AuthScaffold>
    );
  }

  return (
    <AuthScaffold title={t('auth.forgot.title')} subtitle={t('auth.forgot.subtitle')} onBack={goBack} testID="forgot-screen">
      {serverError ? <InlineNotice tone="error" message={t(serverError.messageKey)} testID="forgot-error" /> : null}
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
            returnKeyType="send"
            onSubmitEditing={() => void onSubmit()}
            testID="email-input"
          />
        )}
      />
      <View style={styles.submit}>
        <Button label={t('auth.forgot.submit')} onPress={() => void onSubmit()} loading={isSubmitting} fullWidth testID="forgot-submit" />
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: spacing[2] },
});
