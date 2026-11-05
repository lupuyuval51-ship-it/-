import { Stack, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { EmptyState, ErrorState, IconButton, LoadingState, Screen, Section, SegmentedControl, useNotice } from '@/components/ui';
import { useActiveBusiness } from '@/features/business/api';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { formatDate } from '@/i18n/format';
import { toAppError } from '@/lib/errors';
import { useIsOnline } from '@/lib/net';
import { useRoadmap, useToggleTask } from '../api';
import { TaskRow } from '../components/TaskRow';
import { todayISO } from '../dates';
import { blockedByMap, groupTasks, isDueThrough, TASK_FILTERS, type TaskFilter, type TaskGroup } from '../logic';
import type { TaskRow as TaskRowData } from '../types';

/** /roadmap/tasks — every task of the business, filtered and grouped by date. */
export default function TasksScreen() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const online = useIsOnline();
  const notice = useNotice();
  const { businessId, isLoading: businessLoading } = useActiveBusiness();
  const roadmap = useRoadmap(businessId);
  const toggle = useToggleTask(businessId);
  const [chosenFilter, setFilter] = useState<TaskFilter | null>(null);

  const today = todayISO();
  // Until the user picks a view: "Today" when something is due, otherwise all open tasks.
  const filter: TaskFilter = chosenFilter ?? (roadmap.tasks.some((task) => isDueThrough(task, today)) ? 'today' : 'open');
  const groups = useMemo(() => groupTasks(roadmap.tasks, filter, today), [roadmap.tasks, filter, today]);
  const blockers = useMemo(() => blockedByMap(roadmap.tasks, roadmap.dependencies), [roadmap.tasks, roadmap.dependencies]);

  const newTask = () => router.push('/roadmap/task/new' as Href);

  const groupTitle = (group: TaskGroup<TaskRowData>): string => {
    switch (group.kind) {
      case 'overdue':
        return t('roadmap.tasks.groups.overdue');
      case 'today':
        return t('roadmap.tasks.groups.today');
      case 'noDate':
        return t('roadmap.tasks.groups.noDate');
      case 'date':
        return group.date ? formatDate(group.date, locale, { style: 'long' }) : t('roadmap.tasks.groups.noDate');
    }
  };

  const onToggle = (task: TaskRowData) => {
    const done = task.status !== 'done';
    toggle.mutate(
      { id: task.id, done },
      {
        onSuccess: () => {
          if (done) notice.show({ message: t('roadmap.taskRow.doneNotice') });
        },
        onError: (error) => notice.show({ tone: 'error', message: t(toAppError(error).messageKey) }),
      },
    );
  };

  const header = (
    <Stack.Screen
      options={{
        title: t('roadmap.tasks.title'),
        headerRight: businessId
          ? () => <IconButton icon="plus" accessibilityLabel={t('roadmap.tasks.new')} onPress={newTask} disabled={!online} testID="tasks-new" />
          : undefined,
      }}
    />
  );

  let content;
  if (!businessId) {
    content = businessLoading ? <LoadingState variant="list" /> : <EmptyState title={t('roadmap.tasks.title')} body={t('roadmap.task.noBusiness')} />;
  } else if (roadmap.isLoading) {
    content = <LoadingState variant="list" count={5} />;
  } else if (roadmap.error && !roadmap.data) {
    content = <ErrorState error={roadmap.error} onRetry={() => void roadmap.refetch()} retrying={roadmap.isFetching} />;
  } else if (roadmap.tasks.length === 0) {
    content = (
      <EmptyState
        icon="list"
        title={t('roadmap.tasks.empty.none.title')}
        body={t('roadmap.tasks.empty.none.body')}
        action={online ? { label: t('roadmap.tasks.new'), onPress: newTask, variant: 'primary' } : undefined}
      />
    );
  } else if (groups.length === 0) {
    content = (
      <EmptyState
        title={t(`roadmap.tasks.empty.${filter}.title`)}
        body={t(`roadmap.tasks.empty.${filter}.body`)}
        action={online && filter !== 'done' ? { label: t('roadmap.tasks.new'), onPress: newTask } : undefined}
      />
    );
  } else {
    content = groups.map((group) => (
      <Section key={group.key} title={groupTitle(group)} titleVariant="overline" separated>
        {group.tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            blockedBy={blockers.get(task.id)}
            toggleDisabled={!online}
            onToggle={() => onToggle(task)}
            onPress={() => router.push(`/roadmap/task/${encodeURIComponent(task.id)}` as Href)}
            testID={`tasks-row-${task.id}`}
          />
        ))}
      </Section>
    ));
  }

  return (
    <Screen edges={['bottom']} refreshing={roadmap.isRefetching} onRefresh={businessId ? () => void roadmap.refetch() : undefined} testID="tasks-screen">
      {header}
      {businessId && roadmap.tasks.length > 0 ? (
        <SegmentedControl
          accessibilityLabel={t('roadmap.tasks.filterA11y')}
          options={TASK_FILTERS.map((f) => ({ value: f, label: t(`roadmap.tasks.filters.${f}`) }))}
          value={filter}
          onChange={setFilter}
          testID="tasks-filter"
        />
      ) : null}
      {content}
    </Screen>
  );
}
