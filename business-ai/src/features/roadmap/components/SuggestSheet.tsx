import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BasisTag, Button, Divider, InlineNotice, LoadingState, Sheet, Text, TextField, useNotice } from '@/components/ui';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { formatDate } from '@/i18n/format';
import { toAppError } from '@/lib/errors';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { useCreateTask, useRecommendTasks, type RoadmapSuggestion } from '../api';
import { dueDateFromOffset } from '../dates';

export interface SuggestSheetProps {
  businessId: string;
  visible: boolean;
  onClose: () => void;
}

const MAX_INSTRUCTION = 1000;

/**
 * "Suggest next steps": asks `roadmap.recommend` (nothing is saved) and lets the user add
 * individual suggestions as tasks (source 'advisor', so a later "Rebuild roadmap" keeps them).
 */
export function SuggestSheet({ businessId, visible, onClose }: SuggestSheetProps) {
  const t = useT();
  const { locale } = useLocale();
  const online = useIsOnline();
  const notice = useNotice();
  const recommend = useRecommendTasks(businessId);
  const createTask = useCreateTask(businessId);
  const [instruction, setInstruction] = useState('');
  const [added, setAdded] = useState<ReadonlySet<string>>(new Set());
  const [adding, setAdding] = useState<string | null>(null);
  const [addError, setAddError] = useState<unknown>(null);

  const suggestions = recommend.data;

  const ask = () => {
    setAddError(null);
    setAdded(new Set());
    recommend.mutate({ instruction: instruction.trim() || undefined });
  };

  const add = async (s: RoadmapSuggestion) => {
    setAdding(s.id);
    setAddError(null);
    try {
      await createTask.mutateAsync({
        title: s.title.slice(0, 200),
        description: s.description.slice(0, 2000),
        phase: s.phase,
        priority: s.priority,
        dueDate: dueDateFromOffset(s.dueInDays),
        source: 'advisor',
      });
      setAdded((prev) => new Set(prev).add(s.id));
      notice.show({ message: t('roadmap.suggest.addedNotice', { phase: t(`roadmap.phase.${s.phase}`) }) });
    } catch (error) {
      setAddError(error);
    } finally {
      setAdding(null);
    }
  };

  const error = recommend.error ?? addError;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('roadmap.suggest.title')}
      testID="roadmap-suggest-sheet"
      footer={
        <Button
          label={suggestions ? t('roadmap.suggest.again') : t('roadmap.suggest.submit')}
          variant={suggestions ? 'secondary' : 'primary'}
          fullWidth
          loading={recommend.isPending}
          disabled={!online}
          onPress={ask}
          testID="roadmap-suggest-submit"
        />
      }
    >
      <Text variant="callout" tone="secondary">
        {t('roadmap.suggest.intro')}
      </Text>
      <TextField
        label={t('roadmap.suggest.instructionLabel')}
        hint={t('roadmap.suggest.instructionHint')}
        value={instruction}
        onChangeText={(v) => setInstruction(v.slice(0, MAX_INSTRUCTION))}
        maxLength={MAX_INSTRUCTION}
        multiline
        returnKeyType="done"
      />

      {!online ? <InlineNotice tone="warning" message={t('errors.offline')} /> : null}
      {error ? <InlineNotice tone="error" message={t(toAppError(error).messageKey)} /> : null}

      {recommend.isPending ? <LoadingState variant="list" count={3} accessibilityLabel={t('roadmap.suggest.loading')} /> : null}

      {!recommend.isPending && suggestions ? (
        suggestions.length === 0 ? (
          <Text variant="callout" tone="secondary">
            {t('roadmap.suggest.empty')}
          </Text>
        ) : (
          <View style={styles.results}>
            <View style={styles.provenance}>
              <BasisTag basis="ai_estimate" />
              <Text variant="caption" tone="secondary" style={styles.flex}>
                {t('roadmap.suggest.disclaimer')}
              </Text>
            </View>
            {suggestions.map((s, index) => {
              const isAdded = added.has(s.id);
              const due = dueDateFromOffset(s.dueInDays);
              const meta = [
                t(`roadmap.phase.${s.phase}`),
                due ? t('roadmap.suggest.due', { date: formatDate(due, locale, { style: 'short' }) }) : null,
                t(`roadmap.taskRow.priority.${s.priority}`),
              ]
                .filter(Boolean)
                .join(' · ');
              return (
                <View key={s.id}>
                  {index > 0 ? <Divider spacing={4} /> : null}
                  <View style={styles.item}>
                    <View style={styles.flex}>
                      <Text variant="bodyStrong">{s.title}</Text>
                      {s.description ? (
                        <Text variant="callout" tone="secondary">
                          {s.description}
                        </Text>
                      ) : null}
                      {s.rationale ? (
                        <Text variant="caption" tone="secondary" style={styles.rationale}>
                          {s.rationale}
                        </Text>
                      ) : null}
                      <Text variant="caption" tone="secondary" style={styles.rationale}>
                        {meta}
                      </Text>
                    </View>
                    <Button
                      label={isAdded ? t('roadmap.suggest.added') : t('roadmap.suggest.add')}
                      variant="secondary"
                      size="compact"
                      icon={isAdded ? 'check' : 'plus'}
                      disabled={isAdded || !online || (adding !== null && adding !== s.id)}
                      loading={adding === s.id}
                      accessibilityHint={t('roadmap.suggest.addA11y', { title: s.title })}
                      onPress={() => void add(s)}
                      testID={`roadmap-suggestion-add-${index}`}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  results: { gap: spacing[2] },
  provenance: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  rationale: { marginTop: spacing[1] },
});
