import { Stack, useRouter, type Href } from 'expo-router';
import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Checkbox,
  Divider,
  EmptyState,
  ErrorState,
  IconButton,
  InlineNotice,
  ListRow,
  LoadingState,
  ProgressBar,
  Screen,
  Section,
  Sheet,
  Text,
  useNotice,
} from '@/components/ui';
import { useActiveBusiness } from '@/features/business/api';
import { usePlanState } from '@/features/plan/api';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { formatDate } from '@/i18n/format';
import { toAppError, type AppError } from '@/lib/errors';
import { useIsOnline } from '@/lib/net';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { useGenerateRoadmap, useRoadmap, useToggleMilestone, useToggleTask } from '../api';
import { SuggestSheet } from '../components/SuggestSheet';
import { TaskRow } from '../components/TaskRow';
import { todayISO } from '../dates';
import {
  blockedByMap,
  computeProgress,
  currentPhase,
  groupByPhase,
  phaseRanges,
  progressRatio,
  ROADMAP_PHASES,
  sortMilestones,
  sortPhaseTasks,
  type DateRange,
} from '../logic';
import type { MilestoneRow, PhaseProgress, RoadmapPhase, RoadmapPhaseRow, TaskRow as TaskRowData } from '../types';

const taskHref = (id: string) => `/roadmap/task/${encodeURIComponent(id)}` as Href;

/** /roadmap — the 30/60/90 plan as a restrained vertical timeline. */
export default function RoadmapScreen() {
  const t = useT();
  const router = useRouter();
  const online = useIsOnline();
  const notice = useNotice();
  const { businessId, isLoading: businessLoading } = useActiveBusiness();
  const roadmap = useRoadmap(businessId);
  const plan = usePlanState(businessId);
  const toggleTask = useToggleTask(businessId);
  const toggleMilestone = useToggleMilestone(businessId);
  const generate = useGenerateRoadmap(businessId);

  const [suggestOpen, setSuggestOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmingRebuild, setConfirmingRebuild] = useState(false);
  const [generateError, setGenerateError] = useState<AppError | null>(null);

  const today = todayISO();
  const hasRoadmap = !!roadmap.data && !roadmap.isEmpty;
  const ranges = useMemo(() => phaseRanges(roadmap.phases), [roadmap.phases]);
  const activePhase = currentPhase(ranges, today);
  const blockers = useMemo(() => blockedByMap(roadmap.tasks, roadmap.dependencies), [roadmap.tasks, roadmap.dependencies]);
  const tasksByPhase = useMemo(() => groupByPhase(roadmap.tasks), [roadmap.tasks]);
  const progress = useMemo(() => computeProgress(roadmap.tasks), [roadmap.tasks]);
  const openCount = progress.total - progress.done;
  const rebuilding = generate.isPending && generate.variables?.mode === 'replace_ai_items';
  const creating = generate.isPending && generate.variables?.mode === 'create';

  const runGenerate = (mode: 'create' | 'replace_ai_items') => {
    setGenerateError(null);
    generate.mutate(
      { mode },
      {
        onSuccess: () => notice.show({ message: mode === 'create' ? t('roadmap.empty.createdNotice') : t('roadmap.rebuild.done') }),
        onError: (error) => {
          const appError = toAppError(error);
          if (mode === 'create' && appError.code === 'conflict') {
            notice.show({ tone: 'info', message: t('roadmap.empty.alreadyExists') });
            void roadmap.refetch();
            return;
          }
          setGenerateError(appError);
        },
      },
    );
  };

  const onToggleTask = (task: TaskRowData) => {
    const done = task.status !== 'done';
    toggleTask.mutate(
      { id: task.id, done },
      {
        onSuccess: () => {
          if (done) notice.show({ message: t('roadmap.taskRow.doneNotice') });
        },
        onError: (error) => notice.show({ tone: 'error', message: t(toAppError(error).messageKey) }),
      },
    );
  };

  const onToggleMilestone = (milestone: MilestoneRow, achieved: boolean) =>
    toggleMilestone.mutate(
      { id: milestone.id, achieved },
      {
        onSuccess: () => {
          if (achieved) notice.show({ message: t('roadmap.milestones.achievedNotice') });
        },
        onError: (error) => notice.show({ tone: 'error', message: t(toAppError(error).messageKey) }),
      },
    );

  const closeMore = () => {
    setMoreOpen(false);
    setConfirmingRebuild(false);
  };

  const header = (
    <Stack.Screen
      options={{
        title: t('roadmap.title'),
        headerRight: hasRoadmap
          ? () => (
              <IconButton
                icon="more-horizontal"
                accessibilityLabel={t('roadmap.actions.more')}
                onPress={() => setMoreOpen(true)}
                testID="roadmap-more"
              />
            )
          : undefined,
      }}
    />
  );

  /* ---------------- gating states ---------------- */

  if (!businessId) {
    return (
      <Screen edges={['bottom']}>
        {header}
        {businessLoading ? <LoadingState variant="screen" /> : <EmptyState title={t('roadmap.title')} body={t('roadmap.task.noBusiness')} />}
      </Screen>
    );
  }

  if (roadmap.isLoading) {
    return (
      <Screen edges={['bottom']}>
        {header}
        <LoadingState variant="screen" />
      </Screen>
    );
  }

  if (roadmap.error && !roadmap.data) {
    return (
      <Screen edges={['bottom']}>
        {header}
        <ErrorState error={roadmap.error} onRetry={() => void roadmap.refetch()} retrying={roadmap.isFetching} />
      </Screen>
    );
  }

  if (!hasRoadmap) {
    let body: ReactNode;
    if (plan.isLoading) {
      body = <LoadingState variant="text" />;
    } else if (plan.error) {
      body = <ErrorState error={plan.error} onRetry={() => void plan.refetch()} />;
    } else if (plan.isGenerating) {
      body = (
        <EmptyState
          icon="clock"
          title={t('roadmap.empty.planGeneratingTitle')}
          body={t('roadmap.empty.planGeneratingBody')}
          action={{ label: t('roadmap.empty.noPlanAction'), onPress: () => router.push('/plan' as Href) }}
        />
      );
    } else if (!plan.currentVersion) {
      body = (
        <EmptyState
          icon="file-text"
          title={t('roadmap.empty.noPlanTitle')}
          body={t('roadmap.empty.noPlanBody')}
          action={{ label: t('roadmap.empty.noPlanAction'), onPress: () => router.push('/plan' as Href), variant: 'primary' }}
          testID="roadmap-empty-no-plan"
        />
      );
    } else {
      body = (
        <>
          {generateError ? <InlineNotice tone="error" message={t(generateError.messageKey)} onDismiss={() => setGenerateError(null)} /> : null}
          {!online ? <InlineNotice tone="warning" message={t('errors.offline')} /> : null}
          <EmptyState
            icon="flag"
            title={t('roadmap.empty.noRoadmapTitle')}
            body={creating ? t('roadmap.empty.creating') : t('roadmap.empty.noRoadmapBody')}
            action={online ? { label: t('roadmap.empty.create'), onPress: () => runGenerate('create'), variant: 'primary', loading: creating } : undefined}
            testID="roadmap-empty-create"
          />
        </>
      );
    }
    return (
      <Screen edges={['bottom']} refreshing={roadmap.isRefetching} onRefresh={() => void Promise.all([roadmap.refetch(), plan.refetch()])}>
        {header}
        {body}
      </Screen>
    );
  }

  /* ---------------- roadmap ---------------- */

  const phaseRows = new Map<RoadmapPhase, RoadmapPhaseRow>(roadmap.phases.map((p) => [p.phase, p]));
  const unphased = sortPhaseTasks(tasksByPhase.none, today);

  return (
    <Screen edges={['bottom']} refreshing={roadmap.isRefetching} onRefresh={() => void roadmap.refetch()} testID="roadmap-screen">
      {header}

      {rebuilding ? <InlineNotice tone="info" message={t('roadmap.rebuild.pending')} /> : null}
      {roadmap.phases.length === 0 && plan.currentVersion && !plan.isGenerating && !rebuilding ? (
        <InlineNotice
          tone="info"
          message={creating ? t('roadmap.empty.creating') : t('roadmap.empty.partialBody')}
          action={online && !creating ? { label: t('roadmap.empty.create'), onPress: () => runGenerate('create') } : undefined}
          testID="roadmap-partial-create"
        />
      ) : null}
      {generateError ? <InlineNotice tone="error" message={t(generateError.messageKey)} onDismiss={() => setGenerateError(null)} /> : null}

      <View style={styles.top}>
        <ListRow
          title={t('roadmap.overall.title')}
          value={openCount > 0 ? t('roadmap.overall.open', { count: openCount }) : t('roadmap.overall.allDone')}
          onPress={() => router.push('/roadmap/tasks' as Href)}
          accessibilityRole="link"
          testID="roadmap-all-tasks"
        />
        <Button
          variant="secondary"
          label={t('roadmap.actions.suggest')}
          onPress={() => setSuggestOpen(true)}
          disabled={!online || rebuilding}
          testID="roadmap-suggest"
        />
      </View>

      <View>
        {ROADMAP_PHASES.map((phase, index) => (
          <PhaseBlock
            key={phase}
            phase={phase}
            row={phaseRows.get(phase)}
            range={ranges[phase]}
            isCurrent={activePhase === phase}
            isLast={index === ROADMAP_PHASES.length - 1}
            progress={progress.byPhase[phase]}
            milestones={roadmap.milestones.filter((m) => m.phase === phase)}
            tasks={sortPhaseTasks(tasksByPhase[phase], today)}
            blockers={blockers}
            online={online}
            onToggleTask={onToggleTask}
            onToggleMilestone={onToggleMilestone}
            onOpenTask={(id) => router.push(taskHref(id))}
            onAddTask={() => router.push({ pathname: '/roadmap/task/new', params: { phase } } as unknown as Href)}
          />
        ))}
      </View>

      {unphased.length > 0 ? (
        <Section title={t('roadmap.phaseNone')} separated>
          {unphased.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              blockedBy={blockers.get(task.id)}
              toggleDisabled={!online}
              onToggle={() => onToggleTask(task)}
              onPress={() => router.push(taskHref(task.id))}
            />
          ))}
        </Section>
      ) : null}

      <SuggestSheet businessId={businessId} visible={suggestOpen} onClose={() => setSuggestOpen(false)} />

      <Sheet
        visible={moreOpen}
        onClose={closeMore}
        title={confirmingRebuild ? t('roadmap.rebuild.title') : t('roadmap.actions.more')}
        footer={
          confirmingRebuild ? (
            <View style={styles.confirmActions}>
              <Button variant="quiet" label={t('common.actions.cancel')} onPress={() => setConfirmingRebuild(false)} />
              <Button
                variant="destructive"
                label={t('roadmap.rebuild.confirm')}
                disabled={!online}
                onPress={() => {
                  closeMore();
                  runGenerate('replace_ai_items');
                }}
                testID="roadmap-rebuild-confirm"
              />
            </View>
          ) : undefined
        }
      >
        {confirmingRebuild ? (
          <Text variant="callout" tone="secondary">
            {t('roadmap.rebuild.body')}
          </Text>
        ) : (
          <View>
            <ListRow
              icon="refresh-cw"
              title={t('roadmap.actions.rebuild')}
              subtitle={t('roadmap.actions.rebuildHint')}
              disabled={!online || generate.isPending}
              onPress={() => setConfirmingRebuild(true)}
              testID="roadmap-rebuild"
            />
            <Divider />
            <ListRow
              icon="list"
              title={t('roadmap.actions.allTasks')}
              accessibilityRole="link"
              onPress={() => {
                closeMore();
                router.push('/roadmap/tasks' as Href);
              }}
            />
          </View>
        )}
      </Sheet>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* One phase on the timeline                                           */
/* ------------------------------------------------------------------ */

interface PhaseBlockProps {
  phase: RoadmapPhase;
  row: RoadmapPhaseRow | undefined;
  range: DateRange | null;
  isCurrent: boolean;
  isLast: boolean;
  progress: PhaseProgress;
  milestones: MilestoneRow[];
  tasks: TaskRowData[];
  blockers: Map<string, string[]>;
  online: boolean;
  onToggleTask: (task: TaskRowData) => void;
  onToggleMilestone: (milestone: MilestoneRow, achieved: boolean) => void;
  onOpenTask: (id: string) => void;
  onAddTask: () => void;
}

function PhaseBlock({
  phase,
  row,
  range,
  isCurrent,
  isLast,
  progress,
  milestones,
  tasks,
  blockers,
  online,
  onToggleTask,
  onToggleMilestone,
  onOpenTask,
  onAddTask,
}: PhaseBlockProps) {
  const t = useT();
  const { locale } = useLocale();
  const { colors } = useTheme();
  const name = t(`roadmap.phase.${phase}`);
  const sortedMilestones = sortMilestones(milestones);

  return (
    <View style={styles.phaseRow} testID={`roadmap-phase-${phase}`}>
      <View style={styles.rail} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View
          style={[
            styles.marker,
            isCurrent ? { backgroundColor: colors.accent, borderColor: colors.accent } : { backgroundColor: colors.background, borderColor: colors.borderStrong },
          ]}
        />
        {!isLast ? <View style={[styles.line, { backgroundColor: colors.border }]} /> : null}
      </View>

      <View style={[styles.phaseBody, isLast ? null : styles.phaseSpacing]}>
        <View style={styles.phaseHeader}>
          <View style={styles.titleRow}>
            <Text variant="heading" style={styles.flex}>
              {name}
            </Text>
            {isCurrent ? (
              <Text variant="caption" tone="accent" weight={500}>
                {t('roadmap.current')}
              </Text>
            ) : null}
          </View>
          {range ? (
            <Text variant="caption" tone="secondary" numeric>
              {t('roadmap.dateRange', {
                start: formatDate(range.start, locale, { style: 'short' }),
                end: formatDate(range.end, locale, { style: 'medium' }),
              })}
            </Text>
          ) : null}
          {row?.objective ? <Text variant="callout">{row.objective}</Text> : null}
          {progress.total > 0 ? (
            <View style={styles.progressRow}>
              <ProgressBar
                value={progressRatio(progress)}
                height={2}
                style={styles.flex}
                accessibilityLabel={t('roadmap.progressA11y', { done: progress.done, total: progress.total })}
              />
              <Text variant="caption" tone="secondary" numeric>
                {t('roadmap.progress', { done: progress.done, total: progress.total })}
              </Text>
            </View>
          ) : null}
        </View>

        {sortedMilestones.length > 0 ? (
          <View style={styles.block}>
            <Text variant="overline" tone="secondary" accessibilityRole="header">
              {t('roadmap.milestones.heading')}
            </Text>
            {sortedMilestones.map((m) => {
              const achieved = m.achieved_at !== null;
              const target = m.target_date ? t('roadmap.milestones.target', { date: formatDate(m.target_date, locale, { style: 'short' }) }) : undefined;
              return (
                <Checkbox
                  key={m.id}
                  checked={achieved}
                  disabled={!online}
                  label={m.title}
                  description={achieved ? [t('roadmap.milestones.achieved'), target].filter(Boolean).join(' · ') : target}
                  onChange={(next) => onToggleMilestone(m, next)}
                />
              );
            })}
          </View>
        ) : null}

        <View style={styles.block}>
          {sortedMilestones.length > 0 ? (
            <Text variant="overline" tone="secondary" accessibilityRole="header">
              {t('roadmap.tasksHeading')}
            </Text>
          ) : null}
          {tasks.length === 0 ? (
            <Text variant="callout" tone="secondary">
              {t('roadmap.noTasksInPhase')}
            </Text>
          ) : (
            <View>
              {tasks.map((task, i) => (
                <Fragment key={task.id}>
                  {i > 0 ? <Divider /> : null}
                  <TaskRow
                    task={task}
                    blockedBy={blockers.get(task.id)}
                    toggleDisabled={!online}
                    onToggle={() => onToggleTask(task)}
                    onPress={() => onOpenTask(task.id)}
                    testID={`roadmap-task-${task.id}`}
                  />
                </Fragment>
              ))}
            </View>
          )}
          <Button
            variant="quiet"
            inline
            icon="plus"
            label={t('roadmap.addTask')}
            accessibilityHint={name}
            disabled={!online}
            onPress={onAddTask}
            testID={`roadmap-add-task-${phase}`}
          />
        </View>
      </View>
    </View>
  );
}

const MARKER = 9;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { gap: spacing[3] },
  phaseRow: { flexDirection: 'row', alignItems: 'stretch', gap: spacing[3] },
  rail: { width: MARKER, alignItems: 'center', paddingTop: 8 },
  marker: { width: MARKER, height: MARKER, borderRadius: MARKER / 2, borderWidth: 1.5 },
  line: { width: StyleSheet.hairlineWidth * 2, flex: 1, marginTop: spacing[1] },
  phaseBody: { flex: 1, gap: spacing[4] },
  phaseSpacing: { paddingBottom: spacing[10] },
  phaseHeader: { gap: spacing[1] },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[2] },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginTop: spacing[2] },
  block: { gap: spacing[1] },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' },
});
