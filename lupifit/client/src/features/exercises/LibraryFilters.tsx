import { useId } from 'react';
import { Link } from 'react-router';
import { DIFFICULTIES, EQUIPMENT, EXERCISE_CATEGORIES, MUSCLE_GROUPS, MUSCLE_TO_GROUP, MUSCLES, type MuscleGroup } from '@shared/constants';
import type { ExerciseFacetsDTO } from '@shared/types';
import { Field, Switch } from '../../components/ui';
import { useI18n } from '../../i18n';
import { ChoiceChips } from './ChoiceChips';
import type { LibraryFilters as Filters } from './filters';

interface SelectOption {
  value: string;
  label: string;
  count?: number;
}

/** Native select with an "any" choice, optional option groups and result counts. */
function FilterSelect({
  label,
  anyLabel,
  value,
  onChange,
  options = [],
  groups = [],
}: {
  label: string;
  anyLabel: string;
  value: string | null;
  onChange(value: string | null): void;
  options?: SelectOption[];
  groups?: { label: string; options: SelectOption[] }[];
}) {
  const { t, formatNumber } = useI18n();
  const id = useId();
  const renderOption = (o: SelectOption) => (
    <option key={o.value} value={o.value} disabled={o.count === 0 && o.value !== value}>
      {o.count != null ? t('exercises.filters.withCount', { label: o.label, count: formatNumber(o.count) }) : o.label}
    </option>
  );
  return (
    <Field label={label} id={id}>
      <select id={id} className="input select" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">{anyLabel}</option>
        {options.map(renderOption)}
        {groups.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.options.map(renderOption)}
          </optgroup>
        ))}
      </select>
    </Field>
  );
}

/** Library filter controls. Counts come from the facets endpoint (absent while loading). */
export function LibraryFilters({
  filters,
  facets,
  onChange,
}: {
  filters: Filters;
  facets: ExerciseFacetsDTO | undefined;
  onChange(patch: Partial<Filters>): void;
}) {
  const { t, locale } = useI18n();
  const collator = new Intl.Collator(locale);
  const muscleOption = (m: (typeof MUSCLES)[number]): SelectOption => ({ value: m, label: t(`enums.muscle.${m}`), count: facets?.muscle[m] });
  const musclesOf = (g: MuscleGroup) => MUSCLES.filter((m) => MUSCLE_TO_GROUP[m] === g).map(muscleOption);
  const equipmentOptions = EQUIPMENT.map((q) => ({ value: q, label: t(`enums.equipment.${q}`), count: facets?.equipment[q] })).sort((a, b) =>
    collator.compare(a.label, b.label),
  );

  return (
    <div className="ex-filter-fields">
      <div className="ex-filter-chips">
        <ChoiceChips<MuscleGroup>
          label={t('exercises.filters.muscleGroup')}
          value={filters.muscleGroup}
          onChange={(muscleGroup) => onChange({ muscleGroup })}
          options={[
            { value: null, label: t('exercises.filters.all') },
            ...MUSCLE_GROUPS.map((g) => ({ value: g, label: t(`enums.muscleGroup.${g}`), count: facets?.muscleGroup[g] })),
          ]}
        />
        <ChoiceChips
          label={t('exercises.filters.difficulty')}
          value={filters.difficulty}
          onChange={(difficulty) => onChange({ difficulty })}
          options={[
            { value: null, label: t('exercises.filters.all') },
            ...DIFFICULTIES.map((d) => ({ value: d, label: t(`enums.difficulty.${d}`), count: facets?.difficulty[d] })),
          ]}
        />
      </div>
      <div className="ex-filter-selects">
        <FilterSelect
          label={t('exercises.filters.muscle')}
          anyLabel={t('exercises.filters.anyMuscle')}
          value={filters.muscle}
          onChange={(v) => onChange({ muscle: v as Filters['muscle'] })}
          {...(filters.muscleGroup
            ? { options: musclesOf(filters.muscleGroup) }
            : { groups: MUSCLE_GROUPS.map((g) => ({ label: t(`enums.muscleGroup.${g}`), options: musclesOf(g) })) })}
        />
        <FilterSelect
          label={t('exercises.filters.equipment')}
          anyLabel={t('exercises.filters.anyEquipment')}
          value={filters.equipment}
          onChange={(v) => onChange({ equipment: v as Filters['equipment'] })}
          options={[{ value: 'none', label: t('exercises.filters.noEquipment'), count: facets?.equipment.none }, ...equipmentOptions]}
        />
        <FilterSelect
          label={t('exercises.filters.category')}
          anyLabel={t('exercises.filters.anyCategory')}
          value={filters.category}
          onChange={(v) => onChange({ category: v as Filters['category'] })}
          options={EXERCISE_CATEGORIES.map((c) => ({ value: c, label: t(`enums.category.${c}`), count: facets?.category[c] }))}
        />
      </div>
      <Switch
        label={t('exercises.filters.availableOnly')}
        checked={filters.availableOnly}
        onChange={(availableOnly) => onChange({ availableOnly })}
        hint={
          <>
            {facets ? t('exercises.filters.availableCount', { count: facets.availableTotal }) : t('exercises.filters.availableHint')}{' '}
            <Link to="/profile" className="link">
              {t('exercises.filters.editEquipment')}
            </Link>
          </>
        }
      />
    </div>
  );
}
