import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Surface } from '@/components/ui/Surface';
import { useI18n } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { localRepositories } from '@/repositories';
import { countLocalItems, migrateLocalToCloud, wasMigrated } from '@/repositories/migrate';
import { createSupabaseRepositories } from '@/repositories/supabase';
import { useSession } from '@/store/session';
import { showToast } from '@/store/toast';
import { space } from '@/theme/tokens';

type Mode = 'signIn' | 'signUp';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export default function AuthScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const session = useSession();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [migrateCount, setMigrateCount] = useState<number | null>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (session.status !== 'signedIn' || !session.user) return;
      const migrated = await wasMigrated(session.user.id);
      if (migrated) return;
      const counts = await countLocalItems(localRepositories);
      if (!cancelled) setMigrateCount(counts.total);
    })();
    return () => {
      cancelled = true;
    };
  }, [session.status, session.user]);

  const submit = async () => {
    setError(null);
    setNotice(null);
    if (!isValidEmail(email)) return setError(t('auth.errorEmail'));
    if (password.length < 8) return setError(t('auth.errorPassword'));
    setBusy(true);
    try {
      if (mode === 'signIn') {
        await session.signIn(email, password);
      } else {
        const { needsConfirmation } = await session.signUp(email, password);
        if (needsConfirmation) setNotice(t('auth.checkEmail'));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message.toLowerCase() : '';
      setError(message.includes('invalid') || message.includes('credentials') ? t('auth.errorInvalid') : t('auth.errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  const magicLink = async () => {
    setError(null);
    if (!isValidEmail(email)) return setError(t('auth.errorEmail'));
    setBusy(true);
    try {
      await session.sendMagicLink(email);
      setNotice(t('auth.magicLinkSent', { email: email.trim() }));
    } catch {
      setError(t('auth.errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  const migrate = async () => {
    if (!supabase || !session.user) return;
    setBusy(true);
    try {
      await migrateLocalToCloud(localRepositories, createSupabaseRepositories(supabase, session.user.id), session.user.id);
      showToast(t('auth.migrateDone'), { tone: 'success' });
      setMigrateCount(null);
      close();
    } catch {
      showToast(t('errors.generic'), { tone: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll keyboard header={<Header title={t('auth.title')} right={<Button label={t('common.close')} variant="ghost" size="sm" onPress={close} />} />} testID="auth-screen">
      {!session.cloudAvailable ? (
        <Surface style={styles.card}>
          <AppText variant="heading">{t('auth.notConfiguredTitle')}</AppText>
          <AppText variant="body" color="textSecondary">
            {t('auth.notConfiguredText')}
          </AppText>
          <Button label={t('auth.continueAsGuest')} onPress={close} />
        </Surface>
      ) : session.status === 'signedIn' && session.user ? (
        <View style={styles.stack}>
          <Surface style={styles.card}>
            <AppText variant="heading">{t('auth.signedInAs', { email: session.user.email ?? '' })}</AppText>
            {migrateCount && migrateCount > 0 ? (
              <View style={styles.stack}>
                <AppText variant="body" weight="semibold">
                  {t('auth.migrateTitle')}
                </AppText>
                <AppText variant="body" color="textSecondary">
                  {t('auth.migrateText', { count: migrateCount })}
                </AppText>
                <View style={styles.row}>
                  <Button label={t('auth.migrateConfirm')} onPress={migrate} loading={busy} />
                  <Button label={t('auth.migrateSkip')} variant="ghost" onPress={close} />
                </View>
              </View>
            ) : (
              <Button label={t('common.done')} onPress={close} />
            )}
          </Surface>
          <Button label={t('auth.signOut')} variant="outline" icon="log-out" onPress={() => session.signOut()} />
        </View>
      ) : (
        <View style={styles.stack}>
          <AppText variant="display">{mode === 'signIn' ? t('auth.signIn') : t('auth.signUp')}</AppText>
          <AppText variant="body" color="textSecondary">
            {t('auth.guestExplainer')}
          </AppText>
          <Input label={t('auth.email')} icon="mail" value={email} onChangeText={setEmail} placeholder={t('auth.emailPlaceholder')} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" testID="auth-email" />
          <Input label={t('auth.password')} icon="lock" value={password} onChangeText={setPassword} placeholder={t('auth.passwordPlaceholder')} secureTextEntry textContentType={mode === 'signIn' ? 'password' : 'newPassword'} error={error ?? undefined} testID="auth-password" />
          {notice ? (
            <AppText variant="bodySmall" color="success">
              {notice}
            </AppText>
          ) : null}
          <Button label={mode === 'signIn' ? t('auth.signIn') : t('auth.signUp')} onPress={submit} loading={busy} fullWidth size="lg" testID="auth-submit" />
          <Button label={t('auth.magicLink')} variant="secondary" icon="send" onPress={magicLink} disabled={busy} fullWidth />
          <Button label={mode === 'signIn' ? t('auth.switchToSignUp') : t('auth.switchToSignIn')} variant="ghost" onPress={() => setMode((m) => (m === 'signIn' ? 'signUp' : 'signIn'))} fullWidth />
          <Button label={t('auth.continueAsGuest')} variant="ghost" onPress={close} fullWidth />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space.md,
    alignItems: 'flex-start',
  },
  stack: {
    gap: space.lg,
  },
  row: {
    flexDirection: 'row',
    gap: space.sm,
    flexWrap: 'wrap',
  },
});
