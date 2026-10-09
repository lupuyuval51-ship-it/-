import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { MEAL_TYPES } from '@shared/constants';
import type { FoodLogEntryDTO } from '@shared/types';
import { qk } from '../../api/queryClient';
import { EmptyState, LinkButton, PageHeader, QueryState, useConfirm, useToast } from '../../components/ui';
import { deleteEntry, fetchDay, fetchProfile, nk } from '../../features/nutrition/api';
import { DateNavigator } from '../../features/nutrition/DateNavigator';
import { DayOverview } from '../../features/nutrition/DayOverview';
import { EditEntryModal } from '../../features/nutrition/EditEntryModal';
import { useNutritionInvalidation, useUserToday } from '../../features/nutrition/hooks';
import { MealSection } from '../../features/nutrition/MealSection';
import { NextMealCard } from '../../features/nutrition/NextMealCard';
import { clampLogDate } from '../../features/nutrition/portion';
import { WeeklySummary } from '../../features/nutrition/WeeklySummary';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import '../../styles/nutrition.css';

export default function NutritionPage() {
  const i18n = useI18n();
  const { t, lt } = i18n;
  useDocumentTitle(t('nutrition.title'));
  const toast = useToast();
  const confirm = useConfirm();
  const invalidate = useNutritionInvalidation();
  const today = useUserToday();
  const [params, setParams] = useSearchParams();
  const date = clampLogDate(params.get('date'), today);
  const setDate = (d: string) => setParams(d === today ? {} : { date: d }, { replace: true });
  const [editing, setEditing] = useState<FoodLogEntryDTO | null>(null);

  const day = useQuery({ queryKey: nk.day(date), queryFn: ({ signal }) => fetchDay(date, signal) });
  const profile = useQuery({ queryKey: qk.profile, queryFn: fetchProfile, staleTime: 5 * 60_000 });

  const remove = useMutation({
    mutationFn: (entry: FoodLogEntryDTO) => deleteEntry(entry.id),
    onSuccess: (res) => {
      invalidate(res.day);
      toast.success(t('nutrition.meals.deleted'));
    },
    onError: (err) => toast.error(errorMessage(err, i18n, 'nutrition')),
  });

  const onDelete = async (entry: FoodLogEntryDTO) => {
    const ok = await confirm({
      title: t('nutrition.meals.deleteTitle'),
      body: t('nutrition.meals.deleteBody', { name: lt(entry.foodName), meal: t(`enums.mealType.${entry.mealType}`) }),
      confirmLabel: t('common.actions.delete'),
      danger: true,
    });
    if (ok) remove.mutate(entry);
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
                      body={t('nutrition.meals.dayEmptyBody')}
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
