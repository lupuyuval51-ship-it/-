import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { MEAL_TYPES, type MealType } from '@shared/constants';
import type { FoodDTO } from '@shared/types';
import { Card, LinkButton, PageHeader, SelectField, Tabs, TextField } from '../../components/ui';
import { fetchDay, nk } from '../../features/nutrition/api';
import { mealForHour, useMealLabel, useUserHour, useUserToday } from '../../features/nutrition/hooks';
import { useMacroFormat } from '../../features/nutrition/Macros';
import { PortionDialog, type PortionSource } from '../../features/nutrition/PortionDialog';
import { RepeatYesterdayButton } from '../../features/nutrition/RepeatYesterdayButton';
import { clampLogDate, maxLogDate } from '../../features/nutrition/portion';
import { BarcodeTab } from '../../features/nutrition/tabs/BarcodeTab';
import { CustomFoodTab } from '../../features/nutrition/tabs/CustomFoodTab';
import { HistoryTab } from '../../features/nutrition/tabs/HistoryTab';
import { PhotoTab } from '../../features/nutrition/tabs/PhotoTab';
import { QuickAddTab } from '../../features/nutrition/tabs/QuickAddTab';
import { SavedMealsTab } from '../../features/nutrition/tabs/SavedMealsTab';
import { SearchTab } from '../../features/nutrition/tabs/SearchTab';
import { SuggestionsTab } from '../../features/nutrition/tabs/SuggestionsTab';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';
import '../../styles/nutrition.css';

const TABS = ['search', 'recent', 'frequent', 'saved', 'suggestions', 'custom', 'quick', 'barcode', 'photo'] as const;
type Tab = (typeof TABS)[number];

interface PortionState {
  food: FoodDTO;
  source: PortionSource;
  initialGrams?: number;
}

export default function FoodLogPage() {
  const { t } = useI18n();
  useDocumentTitle(t('nutrition.logTitle'));
  const labels = useMealLabel();
  const f = useMacroFormat();
  const today = useUserToday();
  const hour = useUserHour();
  const [params, setParams] = useSearchParams();
  const date = clampLogDate(params.get('date'), today);
  const mealParam = params.get('meal');
  const meal: MealType = (MEAL_TYPES as readonly string[]).includes(mealParam ?? '') ? (mealParam as MealType) : mealForHour(hour);
  const tabParam = params.get('tab');
  const tab: Tab = (TABS as readonly string[]).includes(tabParam ?? '') ? (tabParam as Tab) : 'search';
  const [portion, setPortion] = useState<PortionState | null>(null);
  const [customBarcode, setCustomBarcode] = useState<string | undefined>(undefined);

  const update = (patch: Partial<{ date: string; meal: MealType; tab: Tab }>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) next.set(k, String(v));
        return next;
      },
      { replace: true },
    );

  const day = useQuery({ queryKey: nk.day(date), queryFn: ({ signal }) => fetchDay(date, signal) });
  const mealGroup = day.data?.meals[meal];
  const select = (food: FoodDTO, source: PortionSource = 'manual', initialGrams?: number) => setPortion({ food, source, initialGrams });

  return (
    <div className="food-log-page stack">
      <PageHeader
        title={t('nutrition.logTitle')}
        subtitle={t('nutrition.logSubtitle', { meal: labels.meal(meal), date: labels.date(date) })}
        backTo={`/nutrition?date=${date}`}
        backLabel={t('nutrition.backToDay')}
        actions={
          <LinkButton to={`/nutrition?date=${date}`} variant="secondary" icon="check">
            {t('nutrition.done')}
          </LinkButton>
        }
      />

      <Card className="nutri-log-context">
        <div className="grid-2">
          <SelectField
            label={t('nutrition.meal.label')}
            value={meal}
            onChange={(e) => update({ meal: e.target.value as MealType })}
            options={MEAL_TYPES.map((m) => ({ value: m, label: t(`enums.mealType.${m}`) }))}
            name="meal"
          />
          <TextField
            label={t('nutrition.date.label')}
            type="date"
            value={date}
            max={maxLogDate(today)}
            onChange={(e) => {
              const v = e.target.value;
              if (v && v <= maxLogDate(today)) update({ date: v });
            }}
            name="date"
          />
        </div>
        {mealGroup && (
          <div className="row-between nutri-meal-so-far">
            <p className="small muted" aria-live="polite">
              {t('nutrition.log.mealSoFar', { meal: labels.meal(meal), kcal: f.kcal(mealGroup.totals.kcal) })} · {t('nutrition.log.mealItems', { count: mealGroup.entries.length })}
            </p>
            {mealGroup.entries.length === 0 && <RepeatYesterdayButton date={date} mealType={meal} />}
          </div>
        )}
      </Card>

      <Tabs<Tab> label={t('nutrition.tabs.label')} value={tab} onChange={(v) => update({ tab: v })} tabs={TABS.map((v) => ({ value: v, label: t(`nutrition.tabs.${v}`) }))} />

      <div role="tabpanel" aria-label={t(`nutrition.tabs.${tab}`)} className="nutri-tabpanel">
        {tab === 'search' && (
          <SearchTab
            onSelect={(food, grams) => select(food, 'manual', grams)}
            onCreateCustom={() => update({ tab: 'custom' })}
            onQuickAdd={() => update({ tab: 'quick' })}
          />
        )}
        {(tab === 'recent' || tab === 'frequent') && <HistoryTab key={tab} kind={tab} onSelect={(food, grams) => select(food, 'manual', grams)} />}
        {tab === 'saved' && <SavedMealsTab date={date} mealType={meal} />}
        {tab === 'suggestions' && <SuggestionsTab date={date} mealType={meal} onSelect={(food, grams) => select(food, 'suggestion', grams)} />}
        {tab === 'custom' && <CustomFoodTab key={customBarcode ?? ''} prefillBarcode={customBarcode} onSelect={(food) => select(food)} />}
        {tab === 'quick' && <QuickAddTab date={date} mealType={meal} />}
        {tab === 'barcode' && (
          <BarcodeTab
            onFound={(food) => select(food, 'barcode')}
            onCreateCustom={(barcode) => {
              setCustomBarcode(barcode);
              update({ tab: 'custom' });
            }}
          />
        )}
        {tab === 'photo' && <PhotoTab date={date} mealType={meal} />}
      </div>

      <PortionDialog
        food={portion?.food ?? null}
        open={portion != null}
        onClose={() => setPortion(null)}
        date={date}
        mealType={meal}
        source={portion?.source}
        initialGrams={portion?.initialGrams}
      />
    </div>
  );
}
