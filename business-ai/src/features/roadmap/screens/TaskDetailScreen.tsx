import { Stack, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, ConfirmDialog, EmptyState, ErrorState, ListRow, LoadingState, Screen, Section, Text, useNotice } from '@/components/ui';
import { useActiveBusiness } from '@/features/business/api';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { formatDate } from '@/i18n/format';
import { toAppError } from '@/lib/errors';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { useDeleteTask, useRoadmap, useTask, useUpdateTask } from '../api';
import { DependenciesSheet } from '../components/DependenciesSheet';
import { TaskForm, type TaskFormValues } from '../components/TaskForm';
import type { TaskRow } from '../types';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** /roadmap/task/[id] — view and edit one task, its dependencies, or delete it. */
export default function TaskDetailScreen() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const online = useIsOnline();
  const notice = useNotice();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const taskId = firstParam(params.id);
  const { businessId, isLoading: businessLoading } = useActiveBusiness();
  const detail = useTask(businessId, taskId);
  const roadmap = useRoadmap(businessId);
  const update = useUpdateTask(businessId);
  const remove = useDeleteTask(businessId);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [depsOpen, setDepsOpen] = useState(false);
  const [depsSession, setDepsSession] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const task = detail.task;
  const tasksById = useMemo(() => new Map(roadmap.tasks.map((x) => [x.id, x])), [roadmap.tasks]);

  const title = <Stack.Screen options={{ title: t('roadmap.task.titleEdit') }} />;

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/roadmap' as Href);
  };

  if (!businessId || !taskId) {
    return (
      <Screen edges={['bottom']}>
        {title}
        {businessLoading ? <LoadingState variant="screen" /> : <EmptyState title={t('roadmap.task.notFound.title')} body={t('roadmap.task.noBusiness')} />}
      </Screen>
    );
  }

  if (detail.isLoading) {
    return (
      <Screen edges={['bottom']}>
        {title}
        <LoadingState variant="screen" />
      </Screen>
    );
  }

  if (detail.error && !detail.data) {
    return (
      <Screen edges={['bottom']}>
        {title}
        <ErrorState error={detail.error} onRetry={() => void detail.refetch()} retrying={detail.isFetching} />
      </Screen>
    );
  }

  if (!task && remove.isSuccess) {
    // Deleted: we are navigating away; don't flash "not found".
    return <Screen edges={['bottom']}>{title}</Screen>;
  }

  if (!task) {
    return (
      <Screen edges={['bottom']}>
        {title}
        <EmptyState
          icon="alert-circle"
          title={t('roadmap.task.notFound.title')}
          body={t('roadmap.task.notFound.body')}
          action={{ label: t('roadmap.task.notFound.back'), onPress: () => router.replace('/roadmap' as Href) }}
        />
      </Screen>
    );
  }

  const defaultValues: TaskFormValues = {
    title: task.title,
    description: task.description,
    phase: task.phase,
    milestoneId: task.milestone_id,
    priority: task.priority,
    status: task.status,
    dueDate: task.due_date,
  };

  const onSubmit = async (values: TaskFormValues) => {
    setSubmitError(null);
    try {
      await update.mutateAsync({
        id: task.id,
        patch: {
          title: values.title,
          description: values.description,
          phase: values.phase,
          milestoneId: values.milestoneId,
          priority: values.priority,
          status: values.status,
          dueDate: values.dueDate,
        },
      });
      notice.show({ message: t('roadmap.task.saved') });
    } catch (error) {
      setSubmitError(t(toAppError(error).messageKey));
      throw error;
    }
  };

  const onDelete = () => {
    remove.mutate(task.id, {
      onSuccess: () => {
        setConfirmDelete(false);
        notice.show({ message: t('roadmap.task.delete.done') });
        leave();
      },
      onError: (error) => {
        setConfirmDelete(false);
        notice.show({ tone: 'error', message: t(toAppError(error).messageKey) });
      },
    });
  };

  const dependsOn = detail.dependsOn.map((id) => tasksById.get(id)).filter((x): x is TaskRow => !!x);
  const dependents = detail.dependents.map((id) => tasksById.get(id)).filter((x): x is TaskRow => !!x);

  const provenance = (
    <View style={styles.provenance}>
      <Text variant="caption" tone="secondary">
        {t(`roadmap.task.source.${task.source}`)}
      </Text>
      {task.status === 'done' && task.completed_at ? (
        <Text variant="caption" tone="secondary">
          {t('roadmap.task.completedOn', { date: formatDate(task.completed_at, locale, { style: 'medium' }) })}
        </Text>
      ) : null}
    </View>
  );

  return (
    <>
      {title}
      <TaskForm
        key={task.id}
        mode="edit"
        defaultValues={defaultValues}
        milestones={roadmap.milestones}
        submitLabel={t('roadmap.task.save')}
        submitting={update.isPending}
        disabled={!online}
        submitError={submitError}
        onSubmit={onSubmit}
        header={provenance}
      >
        <Section
          title={t('roadmap.task.fields.dependencies')}
          action={{
            label: t('roadmap.task.dependencies.edit'),
            onPress: () => {
              setDepsSession((n) => n + 1);
              setDepsOpen(true);
            },
          }}
          separated={dependsOn.length > 0}
        >
          {dependsOn.length === 0 ? (
            <Text variant="callout" tone="secondary">
              {t('roadmap.task.dependencies.none')}
            </Text>
          ) : (
            dependsOn.map((dep) => (
              <ListRow
                key={dep.id}
                title={dep.title}
                subtitle={t(`roadmap.task.status.${dep.status}`)}
                accessibilityRole="link"
                onPress={() => router.push(`/roadmap/task/${encodeURIComponent(dep.id)}` as Href)}
              />
            ))
          )}
        </Section>
        {dependents.length > 0 ? (
          <Text variant="caption" tone="secondary">
            {t('roadmap.task.dependencies.dependents', { titles: dependents.map((d) => d.title).join(', ') })}
          </Text>
        ) : null}

        <Button
          variant="destructive"
          icon="trash-2"
          label={t('roadmap.task.delete.action')}
          disabled={!online}
          onPress={() => setConfirmDelete(true)}
          testID="task-delete"
        />
      </TaskForm>

      <DependenciesSheet
        key={depsSession}
        businessId={businessId}
        task={task}
        tasks={roadmap.tasks}
        dependencies={roadmap.dependencies}
        dependsOn={detail.dependsOn}
        visible={depsOpen}
        onClose={() => setDepsOpen(false)}
      />

      <ConfirmDialog
        visible={confirmDelete}
        destructive
        title={t('roadmap.task.delete.title')}
        message={t('roadmap.task.delete.body', { title: task.title })}
        confirmLabel={t('roadmap.task.delete.confirm')}
        confirming={remove.isPending}
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  provenance: { gap: spacing[1] },
});
