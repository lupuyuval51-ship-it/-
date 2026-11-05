import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from '@/components/ui';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { formatDate, formatRelativeDue } from '@/i18n/format';
import { useTheme } from '@/theme/ThemeProvider';
import { layout, radii, spacing } from '@/theme/tokens';
import type { TaskRow as TaskRowData } from '../types';

export interface TaskRowProps {
  task: TaskRowData;
  onToggle(): void;
  onPress(): void;
  /** Titles of unfinished tasks this one depends on. Shown as a quiet hint (completion stays possible). */
  blockedBy?: string[];
  /** Disables the checkbox (e.g. while offline). */
  toggleDisabled?: boolean;
  testID?: string;
}

const BOX = 22;

/**
 * One task: checkbox (accent when done), title (struck and muted when done) and a quiet meta line
 * — relative due date, priority (high priority carries a small accent dot), and "Blocked by"
 * when a dependency is still open. Tapping the text opens the task.
 */
export function TaskRow({ task, onToggle, onPress, blockedBy, toggleDisabled = false, testID }: TaskRowProps) {
  const { colors } = useTheme();
  const { locale } = useLocale();
  const t = useT();
  const done = task.status === 'done';

  const relative = !done && task.due_date ? formatRelativeDue(task.due_date) : null;
  const dueText = relative ? t(relative.key, relative.vars) : null;
  const overdue = relative?.status === 'overdue';
  const completedText = done && task.completed_at ? t('roadmap.taskRow.completedOn', { date: formatDate(task.completed_at, locale, { style: 'short' }) }) : null;
  const priorityText = t(`roadmap.taskRow.priority.${task.priority}`);
  const blocked = !done && blockedBy && blockedBy.length > 0 ? t('roadmap.taskRow.blockedBy', { titles: blockedBy.join(', ') }) : null;

  const a11yLabel = [task.title, completedText ?? dueText, done ? null : priorityText, blocked].filter(Boolean).join('. ');

  return (
    <View style={styles.row} testID={testID}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={done ? t('roadmap.taskRow.markOpen', { title: task.title }) : t('roadmap.taskRow.markDone', { title: task.title })}
        accessibilityState={{ checked: done, disabled: toggleDisabled }}
        disabled={toggleDisabled}
        onPress={onToggle}
        hitSlop={4}
        testID={testID ? `${testID}-toggle` : undefined}
        style={({ pressed }) => [styles.toggle, { opacity: toggleDisabled ? 0.4 : pressed ? 0.6 : 1 }]}
      >
        <View
          style={[
            styles.box,
            done ? { backgroundColor: colors.accent, borderColor: colors.accent } : { backgroundColor: colors.surface, borderColor: colors.borderStrong },
          ]}
        >
          {done ? <Icon name="check" size={15} tone="onAccent" /> : null}
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityHint={t('roadmap.taskRow.open')}
        onPress={onPress}
        testID={testID ? `${testID}-open` : undefined}
        style={({ pressed }) => [styles.main, { backgroundColor: pressed ? colors.backgroundAlt : 'transparent' }]}
      >
        <Text variant="body" tone={done ? 'secondary' : 'default'} style={done ? styles.struck : null}>
          {task.title}
        </Text>

        <View style={styles.meta}>
          {completedText ? (
            <Text variant="caption" tone="secondary">
              {completedText}
            </Text>
          ) : null}
          {dueText ? (
            <Text variant="caption" tone={overdue ? 'danger' : 'secondary'} numeric>
              {dueText}
            </Text>
          ) : null}
          {!done ? (
            <View style={styles.priority}>
              {dueText ? (
                <Text variant="caption" tone="secondary" accessibilityElementsHidden importantForAccessibility="no">
                  ·
                </Text>
              ) : null}
              {task.priority === 'high' ? <View style={[styles.dot, { backgroundColor: colors.accent }]} /> : null}
              <Text variant="caption" tone="secondary">
                {priorityText}
              </Text>
            </View>
          ) : null}
        </View>

        {blocked ? (
          <Text variant="caption" tone="secondary" numberOfLines={2}>
            {blocked}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  toggle: {
    width: layout.touchTarget,
    minHeight: layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing[3] + 1,
    marginStart: -spacing[3] + 1,
  },
  box: { width: BOX, height: BOX, borderRadius: radii.control, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  main: {
    flex: 1,
    minHeight: layout.touchTarget,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    marginEnd: -spacing[2],
    borderRadius: radii.control,
    gap: 2,
  },
  struck: { textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: spacing[2], rowGap: 2 },
  priority: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
