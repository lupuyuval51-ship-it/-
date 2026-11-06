import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HorizontalIdeas } from '@/components/ideas/HorizontalIdeas';
import { useIdeaMeta } from '@/components/ideas/IdeaMeta';
import { IdeaTile } from '@/components/ideas/IdeaTile';
import { ProjectSheet } from '@/components/ideas/ProjectSheet';
import { SaveButton } from '@/components/ideas/SaveButton';
import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { Surface } from '@/components/ui/Surface';
import { getCategory } from '@/data/categories';
import { allIdeas } from '@/data/ideas';
import type { Idea } from '@/data/types';
import { similarIdeas } from '@/features/discover/sections';
import { useIdea } from '@/features/library/hooks';
import { useI18n } from '@/i18n';
import { copyText } from '@/lib/clipboard';
import { shareText } from '@/lib/share';
import { showToast } from '@/store/toast';
import { useTheme } from '@/theme/ThemeProvider';
import { layout, radius, space } from '@/theme/tokens';

function Section({ title, icon, children }: { title: string; icon: IconName; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitle}>
        <Icon name={icon} size={16} color="textTertiary" />
        <AppText variant="heading">{title}</AppText>
      </View>
      {children}
    </View>
  );
}

function Bullets({ items, numbered = false }: { items: string[]; numbered?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.bullets}>
      {items.map((item, index) => (
        <View key={`${index}-${item.slice(0, 12)}`} style={styles.bullet}>
          {numbered ? (
            <View style={[styles.number, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <AppText variant="caption" weight="semibold" color="textSecondary" forceLtr align="center">
                {index + 1}
              </AppText>
            </View>
          ) : (
            <View style={[styles.dot, { backgroundColor: colors.accent }]} />
          )}
          <AppText variant="body" style={styles.flex}>
            {item}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function IdeaBody({ idea, source }: { idea: Idea; source: 'curated' | 'ai' | 'demo' }) {
  const { t, pick, pickList } = useI18n();
  const { colors } = useTheme();
  const meta = useIdeaMeta(idea);
  const category = getCategory(idea.category);
  const similar = useMemo(() => similarIdeas(allIdeas, idea, 4), [idea]);

  return (
    <>
      <View style={styles.hero}>
        <IdeaTile identity={idea.identity} size={84} />
        <View style={styles.heroTexts}>
          <View style={styles.badges}>
            <Badge label={pick(category.label)} />
            {source === 'ai' ? <Badge label={t('idea.generatedBadgeAi')} tone="accent" icon="sparkles" /> : null}
            {source === 'demo' ? <Badge label={t('idea.generatedBadgeDemo')} tone="warning" icon="beaker" /> : null}
          </View>
          <AppText variant="display">{pick(idea.name)}</AppText>
          <AppText variant="subheading" color="textSecondary">
            {pick(idea.tagline)}
          </AppText>
        </View>
      </View>

      <Surface variant="elevated" style={styles.facts} padding="lg">
        {[
          { label: t('idea.difficulty'), value: meta.difficulty, icon: 'activity' as IconName },
          { label: t('idea.effort'), value: meta.effort, icon: 'clock' as IconName },
          { label: t('idea.business'), value: meta.business, icon: 'wallet' as IconName },
          { label: t('idea.budget'), value: meta.budget, icon: 'tag' as IconName },
        ].map((fact) => (
          <View key={fact.label} style={styles.fact}>
            <Icon name={fact.icon} size={14} color="textTertiary" />
            <View style={styles.flex}>
              <AppText variant="caption" color="textTertiary">
                {fact.label}
              </AppText>
              <AppText variant="bodySmall" weight="semibold">
                {fact.value}
              </AppText>
            </View>
          </View>
        ))}
      </Surface>

      <View style={styles.chipRow}>
        {idea.platforms.map((platform) => (
          <Chip key={platform} size="sm" label={t(`enums.platform.${platform}`)} icon="smartphone" />
        ))}
        {idea.audience.map((audience) => (
          <Chip key={audience} size="sm" label={t(`enums.audience.${audience}`)} icon="users" />
        ))}
      </View>

      <Section title={t('idea.overview')} icon="book">
        <AppText variant="body">{pick(idea.spec.overview)}</AppText>
      </Section>
      <Section title={t('idea.problem')} icon="alert">
        <AppText variant="body">{pick(idea.spec.problem)}</AppText>
      </Section>
      <Section title={t('idea.solution')} icon="lightbulb">
        <AppText variant="body">{pick(idea.spec.solution)}</AppText>
      </Section>
      <Surface variant="accentSoft" style={styles.usp}>
        <AppText variant="caption" weight="semibold" color="accent">
          {t('idea.usp').toUpperCase()}
        </AppText>
        <AppText variant="body">{pick(idea.spec.usp)}</AppText>
      </Surface>
      <Section title={t('idea.targetUsers')} icon="users">
        <Bullets items={pickList(idea.spec.targetUsers)} />
      </Section>
      <Section title={t('idea.coreFeatures')} icon="zap">
        <Bullets items={pickList(idea.spec.coreFeatures)} />
      </Section>
      <Section title={t('idea.screens')} icon="smartphone">
        <View style={styles.screens}>
          {idea.spec.screens.map((screen, index) => (
            <View key={`${index}-${screen.name.en}`} style={[styles.screenCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <AppText variant="caption" color="textTertiary" forceLtr>
                {String(index + 1).padStart(2, '0')}
              </AppText>
              <AppText variant="body" weight="semibold">
                {pick(screen.name)}
              </AppText>
              <AppText variant="bodySmall" color="textSecondary">
                {pick(screen.description)}
              </AppText>
            </View>
          ))}
        </View>
      </Section>
      <Section title={t('idea.userJourney')} icon="compass">
        <Bullets items={pickList(idea.spec.userJourney)} numbered />
      </Section>
      <Section title={t('idea.uxDirection')} icon="palette">
        <AppText variant="body">{pick(idea.spec.uxDirection)}</AppText>
      </Section>
      <Section title={t('idea.architecture')} icon="cpu">
        <AppText variant="body">{pick(idea.spec.architecture)}</AppText>
        <View style={styles.chipRow}>
          {idea.spec.stack.map((item) => (
            <Chip key={item} size="sm" label={item} icon="code" />
          ))}
        </View>
      </Section>
      <Section title={t('idea.database')} icon="database">
        <Bullets items={pickList(idea.spec.database)} />
      </Section>
      <Section title={t('idea.auth')} icon="lock">
        <AppText variant="body">{pick(idea.spec.auth)}</AppText>
      </Section>
      <Section title={t('idea.monetization')} icon="wallet">
        <Bullets items={pickList(idea.spec.monetization)} />
      </Section>
      <Section title={t('idea.milestones')} icon="target">
        <Bullets items={pickList(idea.spec.mvpMilestones)} numbered />
      </Section>
      <Section title={t('idea.risks')} icon="shield">
        <Bullets items={pickList(idea.spec.risks)} />
      </Section>
      <Section title={t('idea.expansion')} icon="trending-up">
        <Bullets items={pickList(idea.spec.expansion)} />
      </Section>
      <AppText variant="caption" color="textTertiary" style={styles.disclaimer}>
        {t('idea.estimateDisclaimer')}
      </AppText>
      {similar.length ? (
        <View style={styles.similar}>
          <AppText variant="heading" style={styles.similarTitle}>
            {t('idea.similar')}
          </AppText>
          <HorizontalIdeas ideas={similar} />
        </View>
      ) : null}
    </>
  );
}

export default function IdeaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, pick } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { idea, source, isLoading } = useIdea(id);
  const [projectOpen, setProjectOpen] = useState(false);

  const share = async () => {
    if (!idea) return;
    const text = `${pick(idea.name)} – ${pick(idea.tagline)}\n\n${pick(idea.spec.usp)}\n\nAppSpark AI`;
    const ok = await shareText(text, pick(idea.name));
    if (!ok) {
      await copyText(text);
      showToast(t('common.copied'), { tone: 'success' });
    }
  };

  return (
    <Screen
      scroll
      header={
        <Header
          back
          right={
            idea ? (
              <>
                <IconButton icon="share" accessibilityLabel={t('common.share')} onPress={share} />
                <SaveButton ideaId={idea.id} testID="save-header" />
              </>
            ) : null
          }
        />
      }
      scrollProps={{ contentContainerStyle: { paddingBottom: 120 + insets.bottom } }}
      testID="idea-screen">
      {isLoading ? (
        <View style={styles.skeletons}>
          <Skeleton height={84} width={84} />
          <Skeleton height={34} width="70%" />
          <Skeleton height={22} />
          <Skeleton height={22} width="90%" />
          <Skeleton height={120} />
        </View>
      ) : !idea ? (
        <EmptyState icon="alert" title={t('idea.notFound')} hint={t('idea.notFoundHint')} actionLabel={t('errors.goHome')} onAction={() => router.replace('/')} />
      ) : (
        <>
          <IdeaBody idea={idea} source={source} />
          <ProjectSheet visible={projectOpen} onClose={() => setProjectOpen(false)} ideaId={idea.id} defaultName={pick(idea.name)} onCreated={(projectId) => router.push({ pathname: '/project/[id]', params: { id: projectId } })} />
        </>
      )}
      {idea ? (
        <View style={[styles.cta, { paddingBottom: Math.max(insets.bottom, space.md), backgroundColor: colors.background, borderTopColor: colors.border }]} pointerEvents="box-none">
          <View style={styles.ctaInner}>
            <Button label={t('idea.createPrompt')} icon="wand" size="lg" fullWidth style={styles.flex} onPress={() => router.push({ pathname: '/prompt/[ideaId]', params: { ideaId: idea.id } })} testID="create-prompt" />
            <IconButton icon="folder" accessibilityLabel={t('idea.addToProject')} onPress={() => setProjectOpen(true)} style={styles.ctaSecondary} testID="add-to-project" />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  skeletons: {
    gap: space.md,
    paddingTop: space.lg,
  },
  hero: {
    gap: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.xl,
  },
  heroTexts: {
    gap: space.sm,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
  },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.lg,
    marginBottom: space.lg,
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minWidth: '42%',
    flexGrow: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    marginBottom: space.xl,
  },
  section: {
    gap: space.md,
    marginBottom: space.xxl,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  bullets: {
    gap: space.sm,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  number: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  usp: {
    gap: space.sm,
    marginBottom: space.xxl,
  },
  screens: {
    gap: space.sm,
  },
  screenCard: {
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space.xs,
  },
  disclaimer: {
    marginBottom: space.xxl,
  },
  similar: {
    marginBottom: space.xl,
  },
  similarTitle: {
    marginBottom: space.md,
  },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: space.md,
    paddingHorizontal: layout.gutter,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  ctaInner: {
    width: '100%',
    maxWidth: layout.maxWidth,
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
  },
  ctaSecondary: {
    width: 52,
    height: 52,
  },
});
