import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Checkbox, InlineNotice, Sheet, Text, useNotice } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { toAppError } from '@/lib/errors';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { useSetDependencies } from '../api';
import { todayISO } from '../dates';
import { groupByPhase, ROADMAP_PHASES, sortPhaseTasks, wouldCreateCycle } from '../logic';
import type { TaskDependencyRow, TaskRow } from '../types';

export interface DependenciesSheetProps {
  businessId: string;
  task: TaskRow;
  tasks: readonly TaskRow[];
  dependencies: readonly TaskDependencyRow[];
  /** Current dependency ids of `task`. */
  dependsOn: readonly string[];
  visible: boolean;
  onClose: () => void;
}

/**
 * Picks the tasks `task` depends on (other tasks of the same business). Re-key it each time it opens
 * so the selection starts from the saved dependencies. Options that would close
 * a loop are disabled up front; the database guard stays authoritative and its errors
 * (dependency_cycle / _self / _cross_business) are shown translated.
 */
export function DependenciesSheet({ businessId, task, tasks, dependencies, dependsOn, visible, onClose }: DependenciesSheetProps) {
  const t = useT();
  const notice = useNotice();
  const online = useIsOnline();
  const setDependencies = useSetDependencies(businessId);
  // Initialised from props on mount: the caller re-keys this component each time it opens.
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set(dependsOn));

  const groups = useMemo(() => {
    const today = todayISO();
    const others = tasks.filter((x) => x.id !== task.id);
    const byPhase = groupByPhase(others);
    return [...ROADMAP_PHASES, 'none' as const]
      .map((phase) => ({ phase, tasks: sortPhaseTasks(byPhase[phase], today) }))
      .filter((g) => g.tasks.length > 0);
  }, [tasks, task.id]);

  const toggle = (id: string, checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  const unchanged = selected.size === dependsOn.length && dependsOn.every((id) => selected.has(id));

  const save = async () => {
    try {
      await setDependencies.mutateAsync({ taskId: task.id, dependsOn: [...selected] });
      onClose();
      notice.show({ message: t('roadmap.task.dependencies.saved') });
    } catch {
      // shown below via setDependencies.error
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('roadmap.task.dependencies.sheetTitle')}
      testID="task-dependencies-sheet"
      footer={
        groups.length > 0 ? (
          <Button
            label={t('roadmap.task.dependencies.save')}
            fullWidth
            loading={setDependencies.isPending}
            disabled={unchanged || !online}
            onPress={() => void save()}
            testID="task-dependencies-save"
          />
        ) : undefined
      }
    >
      <Text variant="callout" tone="secondary">
        {t('roadmap.task.dependencies.sheetHint')}
      </Text>
      {!online ? <InlineNotice tone="warning" message={t('errors.offline')} /> : null}
      {setDependencies.error ? <InlineNotice tone="error" message={t(toAppError(setDependencies.error).messageKey)} /> : null}

      {groups.length === 0 ? (
        <Text variant="callout" tone="secondary">
          {t('roadmap.task.dependencies.noCandidates')}
        </Text>
      ) : (
        groups.map((group) => (
          <View key={group.phase} style={styles.group}>
            <Text variant="overline" tone="secondary" accessibilityRole="header">
              {group.phase === 'none' ? t('roadmap.phaseNone') : t(`roadmap.phase.${group.phase}`)}
            </Text>
            {group.tasks.map((candidate) => {
              const checked = selected.has(candidate.id);
              const cycle = !checked && wouldCreateCycle(task.id, candidate.id, dependencies);
              return (
                <Checkbox
                  key={candidate.id}
                  checked={checked}
                  disabled={cycle}
                  label={candidate.title}
                  description={cycle ? t('roadmap.task.dependencies.wouldCycle') : candidate.status === 'done' ? t('roadmap.task.status.done') : undefined}
                  onChange={(next) => toggle(candidate.id, next)}
                />
              );
            })}
          </View>
        ))
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing[1] },
});
