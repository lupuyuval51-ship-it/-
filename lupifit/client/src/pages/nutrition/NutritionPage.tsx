import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { MEAL_TYPES } from '@shared/constants';
import type { FoodLogEntryDTO } from '@shared/types';
import { qk } from '../../api/queryClient';
import { EmptyState, LinkButton, PageHeader, QueryState, useToast } from '../../components/ui';
import { deleteEntry, fetchProfile, restoreEntry } from '../../features/nutrition/api';
import { outboxSync } from '../../features/offline/sync';
import { isPendingEntry, PENDING_PREFIX } from '../../features/offline/pending';
import { entryToRestoreInput } from '../../features/nutrition/undo';
import { newIdempotencyKey } from '../../lib/ids';
import { MenuTeaser } from '../../features/menu/MenuTeaser';
import { DateNavigator } from '../../features/nutrition/DateNavigator';
import { DayOverview } from '../../features/nutrition/DayOverview';
import { EditEntryModal } from '../../features/nutrition/EditEntryModal';
import { useDayQuery, useNutritionInvalidation, useUserToday } from '../../features/nutrition/hooks';
import { MealSection } from '../../features/nutrition/MealSection';
import { NextMealCard } from '../../features/nutrition/NextMealCard';
import { clampLogDate } from '../../features/nutrition/portion';
import { TargetSuggestionCard } from '../../features/nutrition/TargetSuggestionCard';
import { WeeklySummary } from '../../features/nutrition/WeeklySummary';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';
import { isDeviceMode } from '../../platform';
import { errorMessage } from '../../lib/errors';
import '../../styles/nutrition.css';

export default function NutritionPage() {
  const i18n = useI18n();
  const { t, lt } = i18n;
  useDocumentTitle(t('nutrition.title'));
  const toast = useToast();
  const invalidate = useNutritionInvalidation();
  const today = useUserToday();
  const [params, setParams] = useSearchParams();
  const date = clampLogDate(params.get('date'), today);
  const setDate = (d: string) => setParams(d === today ? {} : { date: d }, { replace: true });
  const [editing, setEditing] = useState<FoodLogEntryDTO | null>(null);

  const day = useDayQuery(date);
  const profile = useQuery({ queryKey: qk.profile, queryFn: fetchProfile, staleTime: 5 * 60_000 });

  // Deleting is immediate and undoable: no confirm dialog to tap through, and a mis-tap costs one tap to fix.
  const undo = useMutation({
    mutationFn: (entry: FoodLogEntryDTO) => restoreEntry(entryToRestoreInput(entry), newIdempotencyKey()),
    onSuccess: (res) => {
      invalidate(res.day);
      toast.success(t('nutrition.meals.restored', { name: lt(res.entry.foodName) }));
    },
    onError: (err) => toast.error(errorMessage(err, i18n, 'nutrition')),
  });
  const remove = useMutation({
    mutationFn: (entry: FoodLogEntryDTO) => deleteEntry(entry.id),
    onSuccess: (res, entry) => {
      invalidate(res.day);
      toast.show(t('nutrition.meals.deletedName', { name: lt(entry.foodName) }), 'info', { label: t('nutrition.meals.undo'), onClick: () => undo.mutate(entry) });
    },
    onError: (err) => toast.error(errorMessage(err, i18n, 'nutrition')),
  });

  const onDelete = (entry: FoodLogEntryDTO) => {
    // Entries not synced yet only exist on this device: removing one just drops it from the outbox.
    if (isPendingEntry(entry)) return outboxSync.discard(entry.id.slice(PENDING_PREFIX.length));
    if (!remove.isPending) remove.mutate(entry);
  };

  return (
    <div className="nutrition-page stack">
      <PageHeader
        title={t('nutrition.title')}
        subtitle={t('nutrition.subtitle')}
        actions={
          <LinkButton variant="primary" icon="plus" to={`/nutrition/log?date=${date}`}>
            {t('nutrition.logFood')}
          </LinkButton>
        }
      />
      <DateNavigator date={date} onChange={setDate} />
      <div className="nutri-layout">
        <div className="nutri-main stack">
          {/* Quiet unless the weight trend calls for a change; first, so it is seen before the long day overview. */}
          {date === today && <TargetSuggestionCard />}
          <MenuTeaser date={date} />
          <QueryState query={day}>
            {(d) => {
              const count = MEAL_TYPES.reduce((n, m) => n + d.meals[m].entries.length, 0);
              return (
                <>
                  <DayOverview day={d} profile={profile.data} isToday={date === today} />
                  {count === 0 && (
                    <EmptyState
                      icon="apple"
                      title={date === today ? t('nutrition.meals.dayEmptyToday') : t('nutrition.meals.dayEmptyOther')}
                      body={t(isDeviceMode ? 'device.nutrition.dayEmptyBody' : 'nutrition.meals.dayEmptyBody')}
                    />
                  )}
                  {MEAL_TYPES.map((m) => (
                    <MealSection key={m} mealType={m} group={d.meals[m]} date={date} onEdit={setEditing} onDelete={onDelete} />
                  ))}
                </>
              );
            }}
          </QueryState>
        </div>
        <div className="nutri-side stack">
          <NextMealCard date={date} />
          <WeeklySummary to={date} />
        </div>
      </div>
      <EditEntryModal entry={editing} open={editing != null} onClose={() => setEditing(null)} />
    </div>
  );
}
