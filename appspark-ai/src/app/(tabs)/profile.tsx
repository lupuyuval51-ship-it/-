import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { Input } from '@/components/ui/Input';
import { ListRow } from '@/components/ui/ListRow';
import { Segmented } from '@/components/ui/Segmented';
import { Surface } from '@/components/ui/Surface';
import { getCategory } from '@/data/categories';
import type { Locale } from '@/data/types';
import { useAiMode } from '@/features/generator/useAiMode';
import { useClearLocalData, usePrompts, useProjects, useSavedIdeas } from '@/features/library/hooks';
import { useI18n } from '@/i18n';
import { directionMismatch, reloadApp, syncLayoutDirection } from '@/lib/direction';
import { useRepositories } from '@/repositories';
import { usePreferences, type ThemeMode } from '@/store/preferences';
import { useSession } from '@/store/session';
import { showToast } from '@/store/toast';
import { space } from '@/theme/tokens';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="caption" weight="semibold" color="textTertiary" style={styles.sectionTitle}>
        {title.toUpperCase()}
      </AppText>
      <Surface padding="lg">{children}</Surface>
    </View>
  );
}

export default function ProfileScreen() {
  const { t, pick, locale, setLocale } = useI18n();
  const router = useRouter();
  const session = useSession();
  const repos = useRepositories();
  const ai = useAiMode();
  const themeMode = usePreferences((s) => s.themeMode);
  const setThemeMode = usePreferences((s) => s.setThemeMode);
  const displayName = usePreferences((s) => s.displayName);
  const setDisplayName = usePreferences((s) => s.setDisplayName);
  const onboarding = usePreferences((s) => s.onboarding);
  const resetOnboarding = usePreferences((s) => s.resetOnboarding);
  const [nameDraft, setNameDraft] = useState(displayName);
  const [clearOpen, setClearOpen] = useState(false);
  const [restartNeeded, setRestartNeeded] = useState(directionMismatch(locale));
  const clearLocal = useClearLocalData();
  const saved = useSavedIdeas();
  const projects = useProjects();
  const prompts = usePrompts();

  const changeLocale = (next: Locale) => {
    if (next === locale) return;
    setLocale(next);
    const needsRestart = syncLayoutDirection(next);
    setRestartNeeded(needsRestart || directionMismatch(next));
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen scroll withTabBar keyboard testID="profile-screen">
      <View style={styles.hero}>
        <AppText variant="display">{t('profile.title')}</AppText>
        <AppText variant="body" color="textSecondary">
          {session.status === 'signedIn' && session.user ? t('auth.signedInAs', { email: session.user.email ?? '' }) : t('auth.localMode')}
        </AppText>
      </View>

      <Surface variant="elevated" style={styles.stats} padding="lg">
        {[
          { label: t('profile.statsSaved'), value: saved.data?.length ?? 0 },
          { label: t('profile.statsProjects'), value: projects.data?.length ?? 0 },
          { label: t('profile.statsPrompts'), value: prompts.data?.length ?? 0 },
        ].map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <AppText variant="title" forceLtr align="center">
              {stat.value}
            </AppText>
            <AppText variant="caption" color="textSecondary" align="center">
              {stat.label}
            </AppText>
          </View>
        ))}
      </Surface>

      <SectionCard title={t('profile.account')}>
        {session.status === 'signedIn' ? (
          <>
            <ListRow icon="cloud" title={t('auth.cloudMode')} subtitle={session.user?.email ?? ''} />
            <ListRow icon="log-out" title={t('auth.signOut')} onPress={() => session.signOut()} last />
          </>
        ) : (
          <ListRow icon="user" title={session.cloudAvailable ? t('auth.signIn') : t('auth.localMode')} subtitle={session.cloudAvailable ? t('auth.guestExplainer') : t('auth.notConfiguredText')} onPress={() => router.push('/auth')} chevron last testID="profile-sign-in" />
        )}
      </SectionCard>

      <SectionCard title={t('profile.displayName')}>
        <View style={styles.nameRow}>
          <Input value={nameDraft} onChangeText={setNameDraft} placeholder={t('profile.displayNamePlaceholder')} containerStyle={styles.flex} onBlur={() => setDisplayName(nameDraft)} returnKeyType="done" onSubmitEditing={() => setDisplayName(nameDraft)} testID="display-name" />
          <Button label={t('common.save')} size="md" variant="secondary" onPress={() => setDisplayName(nameDraft)} />
        </View>
      </SectionCard>

      <SectionCard title={t('profile.appearance')}>
        <Segmented
          segments={[
            { value: 'system', label: t('profile.themeSystem') },
            { value: 'dark', label: t('profile.themeDark') },
            { value: 'light', label: t('profile.themeLight') },
          ]}
          value={themeMode}
          onChange={(mode: ThemeMode) => setThemeMode(mode)}
        />
      </SectionCard>

      <SectionCard title={t('profile.language')}>
        <Segmented
          segments={[
            { value: 'he', label: t('common.hebrew') },
            { value: 'en', label: t('common.english') },
          ]}
          value={locale}
          onChange={changeLocale}
        />
        {restartNeeded ? (
          <View style={styles.restart}>
            <AppText variant="bodySmall" color="warning">
              {t('profile.rtlRestart')}
            </AppText>
            <Button label={t('profile.rtlRestartNow')} size="sm" variant="secondary" icon="refresh" onPress={async () => (await reloadApp()) || showToast(t('profile.rtlRestart'))} />
          </View>
        ) : null}
      </SectionCard>

      <SectionCard title={t('profile.personalization')}>
        <View style={styles.prefs}>
          <AppText variant="caption" color="textTertiary">
            {t('profile.interests')}
          </AppText>
          <View style={styles.chips}>
            {onboarding.interests.length ? onboarding.interests.map((slug) => <Chip key={slug} size="sm" label={pick(getCategory(slug).label)} />) : <Chip size="sm" label={t('profile.notSet')} />}
          </View>
          <View style={styles.prefRow}>
            <AppText variant="caption" color="textTertiary">
              {t('profile.experience')}
            </AppText>
            <AppText variant="bodySmall" weight="medium">
              {onboarding.experience ? t(`enums.experience.${onboarding.experience}`) : t('profile.notSet')}
            </AppText>
          </View>
          <View style={styles.prefRow}>
            <AppText variant="caption" color="textTertiary">
              {t('profile.platform')}
            </AppText>
            <AppText variant="bodySmall" weight="medium">
              {onboarding.platform ? t(`enums.platform.${onboarding.platform}`) : t('profile.notSet')}
            </AppText>
          </View>
          <View style={styles.prefRow}>
            <AppText variant="caption" color="textTertiary">
              {t('profile.assistant')}
            </AppText>
            <AppText variant="bodySmall" weight="medium">
              {onboarding.assistant ? t(`enums.aiTarget.${onboarding.assistant}`) : t('profile.notSet')}
            </AppText>
          </View>
        </View>
        <ListRow
          icon="sliders"
          title={t('profile.redoOnboarding')}
          onPress={() => {
            resetOnboarding();
            router.replace('/onboarding');
          }}
          chevron
          last
          testID="redo-onboarding"
        />
      </SectionCard>

      <SectionCard title={t('profile.aiStatus')}>
        <ListRow icon={ai.mode === 'live' ? 'zap' : 'beaker'} title={ai.mode === 'live' ? t('profile.aiLive') : t('profile.aiDemo')} subtitle={ai.mode === 'live' ? [ai.provider, ai.model].filter(Boolean).join(' · ') : ai.reason === 'signed-out' ? t('generator.signInRequired') : undefined} last />
      </SectionCard>

      <SectionCard title={t('profile.data')}>
        <ListRow icon={repos.kind === 'cloud' ? 'cloud' : 'smartphone'} title={repos.kind === 'cloud' ? t('saved.storageCloud') : t('saved.storageLocal')} subtitle={repos.kind === 'cloud' ? t('profile.dataCloudHint') : t('profile.dataLocalHint')} />
        <ListRow icon="trash" title={t('profile.clearLocalData')} onPress={() => setClearOpen(true)} danger last testID="clear-local" />
      </SectionCard>

      <SectionCard title={t('profile.about')}>
        <ListRow icon="info" title={t('common.appName')} subtitle={t('profile.version', { version })} />
        <ListRow icon="code" title={t('profile.madeWith')} last />
      </SectionCard>

      <ConfirmSheet
        visible={clearOpen}
        onClose={() => setClearOpen(false)}
        title={t('profile.clearLocalData')}
        message={t('profile.clearLocalDataConfirm')}
        confirmLabel={t('common.delete')}
        destructive
        onConfirm={async () => {
          await clearLocal.mutateAsync();
          showToast(t('profile.clearedLocalData'));
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    paddingTop: space.lg,
    paddingBottom: space.xl,
    gap: space.xs,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: space.xxl,
  },
  stat: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  section: {
    marginBottom: space.xl,
    gap: space.sm,
  },
  sectionTitle: {
    paddingHorizontal: space.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
  },
  restart: {
    marginTop: space.md,
    gap: space.sm,
    alignItems: 'flex-start',
  },
  prefs: {
    gap: space.sm,
    paddingBottom: space.md,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
  },
});
