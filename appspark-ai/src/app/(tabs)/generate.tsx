import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { IdeaCard } from '@/components/ideas/IdeaCard';
import { Screen } from '@/components/layout/Screen';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { OptionGroup } from '@/components/ui/OptionGroup';
import { Skeleton } from '@/components/ui/Skeleton';
import { Surface } from '@/components/ui/Surface';
import { categories } from '@/data/categories';
import { AUDIENCES, BUSINESS_MODELS, PROMPT_PLATFORMS, type GeneratedIdea } from '@/data/types';
import { AiError, generateIdeasLive } from '@/features/generator/client';
import { generateDemoIdeas } from '@/features/generator/demo';
import { defaultGeneratorInput, GENERATOR_BUDGETS, GENERATOR_COMPLEXITIES, ORIGINALITY_LEVELS, type GeneratorInput } from '@/features/generator/types';
import { useAiMode } from '@/features/generator/useAiMode';
import { useGeneratedIdeas, useSaveGeneratedIdeas } from '@/features/library/hooks';
import { useI18n } from '@/i18n';
import { createId, nowIso } from '@/lib/ids';
import { usePreferences } from '@/store/preferences';
import { showToast } from '@/store/toast';
import { space } from '@/theme/tokens';

export default function GenerateScreen() {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const ai = useAiMode();
  const onboarding = usePreferences((s) => s.onboarding);
  const [input, setInput] = useState<GeneratorInput>({ ...defaultGeneratorInput, platform: onboarding.platform ?? 'cross-platform' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchIds, setBatchIds] = useState<string[] | null>(null);
  const saveGenerated = useSaveGeneratedIdeas();
  const generated = useGeneratedIdeas();

  const batch = useMemo(() => (batchIds ? (generated.data ?? []).filter((g) => batchIds.includes(g.id)) : []), [batchIds, generated.data]);
  const history = useMemo(() => (generated.data ?? []).filter((g) => !batchIds?.includes(g.id)).slice(0, 12), [batchIds, generated.data]);

  const update = <K extends keyof GeneratorInput>(key: K, value: GeneratorInput[K]) => setInput((prev) => ({ ...prev, [key]: value }));

  const generate = async () => {
    setError(null);
    if (input.brief.trim().length < 12) {
      setError(t('generator.briefTooShort'));
      return;
    }
    setBusy(true);
    try {
      let items: GeneratedIdea[];
      if (ai.mode === 'live') {
        const result = await generateIdeasLive(input, locale);
        items = result.ideas.map((idea) => ({ id: idea.id, idea, source: 'ai', brief: input.brief, createdAt: nowIso(), provider: result.provider, model: result.model }));
      } else {
        // Clearly labelled demo: deterministic remix of the catalogue, not an AI.
        await new Promise((resolve) => setTimeout(resolve, 650));
        items = generateDemoIdeas(input, locale).map((idea) => ({ id: idea.id || createId('demo'), idea, source: 'demo', brief: input.brief, createdAt: nowIso() }));
      }
      await saveGenerated.mutateAsync(items);
      setBatchIds(items.map((i) => i.id));
    } catch (err) {
      if (err instanceof AiError) {
        setError(err.code === 'quota' ? t('generator.errorQuota') : err.code === 'network' ? t('generator.errorNetwork') : err.code === 'unauthenticated' ? t('generator.signInRequired') : t('generator.errorGeneric'));
      } else {
        setError(t('generator.errorGeneric'));
      }
      showToast(t('errors.generic'), { tone: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll withTabBar keyboard testID="generate-screen">
      <View style={styles.hero}>
        <AppText variant="display">{t('generator.title')}</AppText>
        <AppText variant="body" color="textSecondary">
          {t('generator.subtitle')}
        </AppText>
      </View>

      <Surface variant={ai.mode === 'live' ? 'accentSoft' : 'elevated'} style={styles.banner} padding="md" testID="ai-mode-banner">
        <Icon name={ai.mode === 'live' ? 'zap' : 'beaker'} size={18} color={ai.mode === 'live' ? 'accent' : 'warning'} />
        <View style={styles.flex}>
          <AppText variant="bodySmall" weight="semibold">
            {ai.mode === 'live' ? t('generator.liveBanner') : t('generator.demoBanner')}
            {ai.mode === 'live' && ai.provider ? ` · ${ai.provider}` : ''}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {ai.mode === 'live' ? t('generator.liveBannerText') : ai.reason === 'signed-out' ? t('generator.signInRequired') : t('generator.demoBannerText')}
          </AppText>
          {ai.reason === 'signed-out' ? <Button label={t('generator.signIn')} size="sm" variant="secondary" onPress={() => router.push('/auth')} style={styles.bannerAction} /> : null}
        </View>
      </Surface>

      <View style={styles.form}>
        <Input
          label={t('generator.briefLabel')}
          value={input.brief}
          onChangeText={(brief) => update('brief', brief)}
          placeholder={t('generator.briefPlaceholder')}
          multiline
          error={error ?? undefined}
          testID="generator-brief"
        />
        <OptionGroup
          label={t('generator.category')}
          options={[{ value: 'any', label: t('generator.anyCategory') }, ...categories.map((c) => ({ value: c.slug, label: pick(c.label) }))]}
          value={input.category ?? 'any'}
          onChange={(value) => update('category', value === 'any' ? null : value)}
          size="sm"
        />
        <OptionGroup
          label={t('generator.audience')}
          options={AUDIENCES.map((value) => ({ value, label: t(`enums.audience.${value}`) }))}
          value={input.audience}
          onChange={(value) => update('audience', value)}
          clearable
          onClear={() => update('audience', null)}
          size="sm"
        />
        <OptionGroup label={t('generator.complexity')} options={GENERATOR_COMPLEXITIES.map((value) => ({ value, label: t(`enums.generatorComplexity.${value}`) }))} value={input.complexity} onChange={(value) => update('complexity', value)} />
        <OptionGroup label={t('generator.platform')} options={PROMPT_PLATFORMS.map((value) => ({ value, label: t(`enums.platform.${value}`) }))} value={input.platform} onChange={(value) => update('platform', value)} />
        <OptionGroup
          label={t('generator.monetization')}
          options={[{ value: 'any', label: t('generator.anyMonetization') }, ...BUSINESS_MODELS.map((value) => ({ value, label: t(`enums.businessModel.${value}`) }))]}
          value={input.monetization ?? 'any'}
          onChange={(value) => update('monetization', value === 'any' ? null : value)}
          size="sm"
        />
        <OptionGroup label={t('generator.budget')} options={GENERATOR_BUDGETS.map((value) => ({ value, label: t(`enums.generatorBudget.${value}`) }))} value={input.budget} onChange={(value) => update('budget', value)} />
        <Input label={t('generator.interests')} value={input.interests} onChangeText={(interests) => update('interests', interests)} placeholder={t('generator.interestsPlaceholder')} />
        <OptionGroup
          label={t('generator.originality')}
          options={ORIGINALITY_LEVELS.map((value) => ({ value, label: t(`generator.originality${value.charAt(0).toUpperCase()}${value.slice(1)}` as 'generator.originalitySafe') }))}
          value={input.originality}
          onChange={(value) => update('originality', value)}
        />
        <Button label={busy ? t('generator.generating') : t('generator.generate')} icon="sparkles" size="lg" fullWidth loading={busy} onPress={generate} testID="generate-button" />
      </View>

      <View style={styles.results}>
        {busy ? (
          <View style={styles.skeletons}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={128} />
            ))}
          </View>
        ) : batch.length ? (
          <Animated.View entering={FadeInDown.duration(260)} style={styles.batch} testID="generated-results">
            <View style={styles.resultsHeader}>
              <AppText variant="heading">{t('generator.results')}</AppText>
              <Badge label={batch[0]?.source === 'ai' ? t('generator.sourceAi', { provider: batch[0]?.provider ?? 'AI' }) : t('generator.sourceDemo')} tone={batch[0]?.source === 'ai' ? 'accent' : 'warning'} icon={batch[0]?.source === 'ai' ? 'sparkles' : 'beaker'} />
            </View>
            <AppText variant="bodySmall" color="textSecondary">
              {t('generator.resultsHint')}
            </AppText>
            {batch.map((item) => (
              <IdeaCard key={item.id} idea={item.idea} badge={item.source === 'demo' ? t('common.demo') : undefined} />
            ))}
          </Animated.View>
        ) : !history.length ? (
          <View style={styles.empty}>
            <Icon name="wand" size={22} color="textTertiary" />
            <AppText variant="body" weight="medium" align="center">
              {t('generator.emptyTitle')}
            </AppText>
            <AppText variant="bodySmall" color="textSecondary" align="center">
              {t('generator.emptyHint')}
            </AppText>
          </View>
        ) : null}

        {history.length ? (
          <View style={styles.history}>
            <AppText variant="heading">{t('generator.history')}</AppText>
            {history.map((item) => (
              <IdeaCard key={item.id} idea={item.idea} badge={item.source === 'demo' ? t('common.demo') : undefined} />
            ))}
          </View>
        ) : null}
      </View>
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
  banner: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'flex-start',
    marginBottom: space.xl,
  },
  bannerAction: {
    marginTop: space.sm,
  },
  form: {
    gap: space.xl,
  },
  results: {
    marginTop: space.xxxl,
    gap: space.xl,
  },
  skeletons: {
    gap: space.md,
  },
  batch: {
    gap: space.md,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  empty: {
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xl,
  },
  history: {
    gap: space.md,
  },
});
