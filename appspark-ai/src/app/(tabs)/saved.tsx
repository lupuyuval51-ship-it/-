import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { IdeaCard } from '@/components/ideas/IdeaCard';
import { ProjectSheet } from '@/components/ideas/ProjectSheet';
import { Screen } from '@/components/layout/Screen';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { ScalePressable } from '@/components/ui/Pressable';
import { Segmented } from '@/components/ui/Segmented';
import { Skeleton } from '@/components/ui/Skeleton';
import { getIdeaById } from '@/data/ideas';
import { PROJECT_STATUSES, type Idea, type Project, type ProjectStatus } from '@/data/types';
import { useGeneratedIdeas, usePrompts, useProjects, useSavedIdeas } from '@/features/library/hooks';
import { formatDate, useI18n } from '@/i18n';
import { useRepositories } from '@/repositories';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

type Tab = 'ideas' | 'projects' | 'prompts';

const STATUS_TONE: Record<ProjectStatus, 'neutral' | 'accent' | 'success' | 'warning'> = {
  saved: 'neutral',
  exploring: 'warning',
  ready: 'accent',
  'in-development': 'accent',
  launched: 'success',
};

function useResolveIdea() {
  const generated = useGeneratedIdeas();
  const map = useMemo(() => new Map((generated.data ?? []).map((g) => [g.id, g.idea])), [generated.data]);
  return (id: string | null): Idea | undefined => (id ? (getIdeaById(id) ?? map.get(id)) : undefined);
}

function ProjectRow({ project, onPress }: { project: Project; onPress: () => void }) {
  const { t, pick, locale } = useI18n();
  const { colors } = useTheme();
  const resolve = useResolveIdea();
  const idea = resolve(project.ideaId);
  return (
    <ScalePressable onPress={onPress} accessibilityRole="button" style={[styles.projectRow, { backgroundColor: colors.surface, borderColor: colors.border }]} testID={`project-${project.id}`}>
      <View style={styles.flex}>
        <View style={styles.projectHeader}>
          <AppText variant="subheading" weight="semibold" numberOfLines={1} style={styles.flex}>
            {project.name}
          </AppText>
          <Badge label={t(`enums.projectStatus.${project.status}`)} tone={STATUS_TONE[project.status]} />
        </View>
        <AppText variant="bodySmall" color="textSecondary" numberOfLines={2}>
          {project.description || (idea ? pick(idea.tagline) : t('saved.noLinkedIdea'))}
        </AppText>
        <AppText variant="caption" color="textTertiary">
          {idea ? `${pick(idea.name)} · ` : ''}
          {t('saved.lastUpdated', { date: formatDate(project.updatedAt, locale) })}
        </AppText>
      </View>
      <Icon name="chevron-right" size={16} color="textTertiary" />
    </ScalePressable>
  );
}

export default function SavedScreen() {
  const { t, pick, locale } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const repos = useRepositories();
  const [tab, setTab] = useState<Tab>('ideas');
  const [projectOpen, setProjectOpen] = useState(false);
  const saved = useSavedIdeas();
  const projects = useProjects();
  const prompts = usePrompts();
  const resolve = useResolveIdea();

  const savedIdeas = useMemo(() => (saved.data ?? []).map((s) => resolve(s.ideaId)).filter((idea): idea is Idea => Boolean(idea)), [saved.data, resolve]);
  const projectList = useMemo(() => projects.data ?? [], [projects.data]);
  const promptList = prompts.data ?? [];

  const statusCounts = useMemo(() => {
    const counts = {} as Record<ProjectStatus, number>;
    for (const status of PROJECT_STATUSES) counts[status] = projectList.filter((p) => p.status === status).length;
    return counts;
  }, [projectList]);

  const loading = tab === 'ideas' ? saved.isLoading : tab === 'projects' ? projects.isLoading : prompts.isLoading;

  return (
    <Screen scroll withTabBar testID="saved-screen">
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <AppText variant="display">{t('saved.title')}</AppText>
          <Badge label={repos.kind === 'cloud' ? t('saved.storageCloud') : t('saved.storageLocal')} icon={repos.kind === 'cloud' ? 'cloud' : 'smartphone'} />
        </View>
        <Segmented
          segments={[
            { value: 'ideas', label: t('saved.ideasTab'), count: saved.data?.length },
            { value: 'projects', label: t('saved.projectsTab'), count: projects.data?.length },
            { value: 'prompts', label: t('saved.promptsTab'), count: prompts.data?.length },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {loading ? (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={112} />
          ))}
        </View>
      ) : null}

      {!loading && tab === 'ideas' ? (
        savedIdeas.length ? (
          <View style={styles.list} testID="saved-ideas-list">
            {savedIdeas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </View>
        ) : (
          <EmptyState icon="bookmark" title={t('saved.emptyIdeasTitle')} hint={t('saved.emptyIdeasHint')} actionLabel={t('tabs.discover')} onAction={() => router.push('/')} />
        )
      ) : null}

      {!loading && tab === 'projects' ? (
        <View style={styles.list}>
          <View style={styles.journey}>
            {PROJECT_STATUSES.map((status) => (
              <View key={status} style={[styles.journeyStep, { backgroundColor: statusCounts[status] ? colors.accentSoft : colors.surfaceElevated, borderColor: statusCounts[status] ? colors.accentBorder : colors.border }]}>
                <AppText variant="caption" weight="semibold" color={statusCounts[status] ? 'text' : 'textTertiary'} align="center" numberOfLines={2} style={styles.journeyLabel}>
                  {t(`enums.projectStatus.${status}`)}
                </AppText>
                <AppText variant="bodySmall" weight="semibold" color={statusCounts[status] ? 'accent' : 'textTertiary'} align="center" forceLtr>
                  {statusCounts[status]}
                </AppText>
              </View>
            ))}
          </View>
          <Button label={t('saved.newProject')} icon="plus" variant="secondary" onPress={() => setProjectOpen(true)} testID="new-project" />
          {projectList.length ? (
            projectList.map((project) => <ProjectRow key={project.id} project={project} onPress={() => router.push({ pathname: '/project/[id]', params: { id: project.id } })} />)
          ) : (
            <EmptyState icon="folder" title={t('saved.emptyProjectsTitle')} hint={t('saved.emptyProjectsHint')} compact />
          )}
        </View>
      ) : null}

      {!loading && tab === 'prompts' ? (
        promptList.length ? (
          <View style={styles.list}>
            {promptList.map((prompt) => {
              const idea = resolve(prompt.ideaId);
              return (
                <ScalePressable
                  key={prompt.id}
                  onPress={() => router.push({ pathname: '/prompt/[ideaId]', params: { ideaId: prompt.ideaId, promptId: prompt.id } })}
                  accessibilityRole="button"
                  style={[styles.projectRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  testID={`prompt-${prompt.id}`}>
                  <Icon name="file-text" size={18} color="textSecondary" />
                  <View style={styles.flex}>
                    <AppText variant="subheading" weight="semibold" numberOfLines={1}>
                      {prompt.title}
                    </AppText>
                    <AppText variant="caption" color="textTertiary">
                      {idea ? `${pick(idea.name)} · ` : ''}
                      {t(`enums.aiTarget.${prompt.options.targetAi}`)} · {t(`enums.scope.${prompt.options.scope}`)} · {formatDate(prompt.updatedAt, locale)}
                    </AppText>
                  </View>
                  <Icon name="chevron-right" size={16} color="textTertiary" />
                </ScalePressable>
              );
            })}
          </View>
        ) : (
          <EmptyState icon="file-text" title={t('saved.emptyPromptsTitle')} hint={t('saved.emptyPromptsHint')} />
        )
      ) : null}

      <ProjectSheet visible={projectOpen} onClose={() => setProjectOpen(false)} ideaId={null} onCreated={(id) => router.push({ pathname: '/project/[id]', params: { id } })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    paddingTop: space.lg,
    paddingBottom: space.xl,
    gap: space.lg,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  list: {
    gap: space.md,
  },
  journey: {
    flexDirection: 'row',
    gap: space.xs,
  },
  journeyStep: {
    flex: 1,
    paddingVertical: space.sm,
    paddingHorizontal: 2,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
    justifyContent: 'space-between',
  },
  journeyLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.xs,
  },
});
