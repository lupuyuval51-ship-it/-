import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Screen } from '@/components/layout/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { OptionGroup } from '@/components/ui/OptionGroup';
import { ScalePressable } from '@/components/ui/Pressable';
import { Segmented } from '@/components/ui/Segmented';
import { categories } from '@/data/categories';
import { AI_TARGETS, EXPERIENCE_LEVELS, PROMPT_PLATFORMS, type Locale } from '@/data/types';
import { useI18n } from '@/i18n';
import { syncLayoutDirection } from '@/lib/direction';
import { usePreferences } from '@/store/preferences';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

const STEPS = ['welcome', 'interests', 'experience', 'platform', 'assistant', 'finish'] as const;

export default function OnboardingScreen() {
  const { t, pick, locale, setLocale } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const onboarding = usePreferences((s) => s.onboarding);
  const toggleInterest = usePreferences((s) => s.toggleInterest);
  const setExperience = usePreferences((s) => s.setExperience);
  const setPlatform = usePreferences((s) => s.setPlatform);
  const setAssistant = usePreferences((s) => s.setAssistant);
  const completeOnboarding = usePreferences((s) => s.completeOnboarding);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const finish = () => {
    completeOnboarding();
    router.replace('/');
  };

  const changeLocale = (next: Locale) => {
    setLocale(next);
    syncLayoutDirection(next);
  };

  return (
    <Screen scroll testID="onboarding-screen">
      <View style={styles.top}>
        <View style={styles.progress}>
          {STEPS.map((key, index) => (
            <View key={key} style={[styles.progressSegment, { backgroundColor: index <= step ? colors.accent : colors.surfaceElevated }]} />
          ))}
        </View>
        <ScalePressable onPress={finish} accessibilityRole="button" hitSlop={8} testID="onboarding-skip">
          <AppText variant="bodySmall" weight="medium" color="textSecondary">
            {t('common.skip')}
          </AppText>
        </ScalePressable>
      </View>

      <Animated.View key={current} entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} style={styles.body}>
        <AppText variant="caption" color="textTertiary">
          {t('onboarding.stepOf', { current: step + 1, total: STEPS.length })}
        </AppText>

        {current === 'welcome' ? (
          <>
            <View style={[styles.mark, { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder }]}>
              <Icon name="sparkles" size={26} color="accent" />
            </View>
            <AppText variant="display">{t('onboarding.welcomeTitle')}</AppText>
            <AppText variant="body" color="textSecondary">
              {t('onboarding.welcomeText')}
            </AppText>
            <View style={styles.language}>
              <AppText variant="bodySmall" weight="medium" color="textSecondary">
                {t('common.language')}
              </AppText>
              <Segmented
                segments={[
                  { value: 'he', label: t('common.hebrew') },
                  { value: 'en', label: t('common.english') },
                ]}
                value={locale}
                onChange={changeLocale}
              />
            </View>
          </>
        ) : null}

        {current === 'interests' ? (
          <>
            <AppText variant="title">{t('onboarding.interestsTitle')}</AppText>
            <AppText variant="body" color="textSecondary">
              {t('onboarding.interestsHint')}
            </AppText>
            <View style={styles.chips}>
              {categories.map((category) => (
                <Chip key={category.slug} label={pick(category.label)} selected={onboarding.interests.includes(category.slug)} onPress={() => toggleInterest(category.slug)} testID={`interest-${category.slug}`} />
              ))}
            </View>
          </>
        ) : null}

        {current === 'experience' ? (
          <>
            <AppText variant="title">{t('onboarding.experienceTitle')}</AppText>
            <View style={styles.cards}>
              {EXPERIENCE_LEVELS.map((level) => {
                const selected = onboarding.experience === level;
                return (
                  <ScalePressable
                    key={level}
                    onPress={() => setExperience(level)}
                    haptic
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={[styles.optionCard, { backgroundColor: selected ? colors.accentSoft : colors.surface, borderColor: selected ? colors.accentBorder : colors.border }]}>
                    <AppText variant="body" weight={selected ? 'semibold' : 'medium'}>
                      {t(`onboarding.experience${level.charAt(0).toUpperCase()}${level.slice(1)}` as 'onboarding.experienceNone')}
                    </AppText>
                    {selected ? <Icon name="check" size={16} color="accent" /> : null}
                  </ScalePressable>
                );
              })}
            </View>
          </>
        ) : null}

        {current === 'platform' ? (
          <>
            <AppText variant="title">{t('onboarding.platformTitle')}</AppText>
            <OptionGroup options={PROMPT_PLATFORMS.map((value) => ({ value, label: t(`enums.platform.${value}`) }))} value={onboarding.platform} onChange={setPlatform} />
          </>
        ) : null}

        {current === 'assistant' ? (
          <>
            <AppText variant="title">{t('onboarding.assistantTitle')}</AppText>
            <AppText variant="body" color="textSecondary">
              {t('onboarding.assistantHint')}
            </AppText>
            <OptionGroup options={AI_TARGETS.map((value) => ({ value, label: t(`enums.aiTarget.${value}`) }))} value={onboarding.assistant} onChange={setAssistant} />
          </>
        ) : null}

        {current === 'finish' ? (
          <>
            <View style={[styles.mark, { backgroundColor: colors.successSoft, borderColor: colors.border }]}>
              <Icon name="check" size={26} color="success" />
            </View>
            <AppText variant="display">{t('onboarding.finishTitle')}</AppText>
            <AppText variant="body" color="textSecondary">
              {t('onboarding.finishText')}
            </AppText>
          </>
        ) : null}
      </Animated.View>

      <View style={styles.actions}>
        {step > 0 ? <Button label={t('common.back')} variant="ghost" onPress={() => setStep((s) => Math.max(0, s - 1))} /> : <View />}
        <Button
          label={isLast ? t('common.getStarted') : step === 0 ? t('common.continue') : t('common.next')}
          iconEnd={isLast ? undefined : 'arrow-right'}
          onPress={() => (isLast ? finish() : setStep((s) => Math.min(STEPS.length - 1, s + 1)))}
          testID="onboarding-next"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.xxl,
  },
  progress: {
    flex: 1,
    flexDirection: 'row',
    gap: space.xs,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  body: {
    flexGrow: 1,
    gap: space.lg,
  },
  mark: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  language: {
    marginTop: space.lg,
    gap: space.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  cards: {
    gap: space.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space.xxl,
  },
});
