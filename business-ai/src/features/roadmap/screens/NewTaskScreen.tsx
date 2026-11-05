import { Stack, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { EmptyState, LoadingState, Screen, useNotice } from '@/components/ui';
import { useActiveBusiness } from '@/features/business/api';
import { useT } from '@/i18n/I18nProvider';
import { toAppError } from '@/lib/errors';
import { useIsOnline } from '@/lib/net';
import { useCreateTask, useRoadmap } from '../api';
import { DESCRIPTION_MAX, TaskForm, TITLE_MAX, type TaskFormValues } from '../components/TaskForm';
import { todayISO } from '../dates';
import { currentPhase, isRoadmapPhase, phaseRanges } from '../logic';

type Param = string | string[] | undefined;

function firstParam(value: Param): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * /roadmap/task/new — create a task. Optional params prefill the form (used by the roadmap's
 * per-phase "Add task" and by the advisor): `phase` (days_30 | days_60 | days_90), `title`,
 * `description`. Without `phase`, the phase that contains today is preselected.
 */
export default function NewTaskScreen() {
  const t = useT();
  const router = useRouter();
  const online = useIsOnline();
  const notice = useNotice();
  const params = useLocalSearchParams<{ phase?: string; title?: string; description?: string }>();
  const { businessId, isLoading: businessLoading } = useActiveBusiness();
  const roadmap = useRoadmap(businessId);
  const create = useCreateTask(businessId);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const title = <Stack.Screen options={{ title: t('roadmap.task.titleNew') }} />;

  if (!businessId) {
    return (
      <Screen edges={['bottom']}>
        {title}
        {businessLoading ? <LoadingState variant="screen" /> : <EmptyState title={t('roadmap.task.titleNew')} body={t('roadmap.task.noBusiness')} />}
      </Screen>
    );
  }

  // Wait for the roadmap (milestones, current phase) unless it failed — a task can still be created.
  if (roadmap.isLoading) {
    return (
      <Screen edges={['bottom']}>
        {title}
        <LoadingState variant="screen" />
      </Screen>
    );
  }

  const phaseParam = firstParam(params.phase as Param);
  const defaultValues: TaskFormValues = {
    title: (firstParam(params.title as Param) ?? '').slice(0, TITLE_MAX),
    description: (firstParam(params.description as Param) ?? '').slice(0, DESCRIPTION_MAX),
    phase: isRoadmapPhase(phaseParam) ? phaseParam : currentPhase(phaseRanges(roadmap.phases), todayISO()),
    milestoneId: null,
    priority: 'medium',
    status: 'todo',
    dueDate: null,
  };

  const onSubmit = async (values: TaskFormValues) => {
    setSubmitError(null);
    try {
      const task = await create.mutateAsync({
        title: values.title,
        description: values.description,
        phase: values.phase,
        milestoneId: values.milestoneId,
        priority: values.priority,
        status: values.status,
        dueDate: values.dueDate,
        source: 'user',
      });
      notice.show({ message: t('roadmap.task.created') });
      if (router.canGoBack()) router.back();
      else router.replace(`/roadmap/task/${encodeURIComponent(task.id)}` as Href);
    } catch (error) {
      setSubmitError(t(toAppError(error).messageKey));
      throw error;
    }
  };

  return (
    <>
      {title}
      <TaskForm
        mode="create"
        defaultValues={defaultValues}
        milestones={roadmap.milestones}
        submitLabel={t('roadmap.task.create')}
        submitting={create.isPending}
        disabled={!online}
        submitError={submitError}
        onSubmit={onSubmit}
      />
    </>
  );
}
