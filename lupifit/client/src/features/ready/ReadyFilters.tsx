import { useId } from 'react';
import { DIFFICULTIES, LOCATIONS, READY_FOCUSES, TRAINING_MODES, type Difficulty, type Equipment, type ReadyFocus, type TrainingLocation, type TrainingMode } from '@shared/constants';
import type { ReadyListResponse } from '@shared/types';
import { Button, Card, ChipGroup, Segmented } from '../../components/ui';
import { useI18n } from '../../i18n';
import { ChoiceChips } from '../exercises/ChoiceChips';
import { activeMoreFilters, gearOptions, LENGTH_OPTIONS, type ListFilters, type ReadyContext } from './filters';

export interface ReadyFiltersProps {
  ctx: ReadyContext;
  filters: ListFilters;
  /** Matches per muscle focus under the other filters (absent while the first answer is on its way). */
  facets: ReadyListResponse['facets'] | undefined;
  moreOpen: boolean;
  onToggleMore(): void;
  onLocation(place: TrainingLocation): void;
  onEquipment(list: Equipment[]): void;
  onMode(mode: TrainingMode): void;
  onFilters(patch: Partial<ListFilters>): void;
  onReset(): void;
}

/**
 * The filter questions, in the order people think about them: where, with what gear (home and park only),
 * bodyweight or weights, which muscle, then the optional level and length.
 */
export function ReadyFilters({ ctx, filters, facets, moreOpen, onToggleMore, onLocation, onEquipment, onMode, onFilters, onReset }: ReadyFiltersProps) {
  const { t, formatNumber } = useI18n();
  const moreId = useId();
  const gear = gearOptions(ctx.location);
  const moreActive = activeMoreFilters(filters);
  const anyFilter = filters.focus != null || moreActive > 0;
  const total = facets ? READY_FOCUSES.reduce((sum, f) => sum + (facets[f] ?? 0), 0) : undefined;

  return (
    <Card as="section" title={t('ready.filters.title')} className="ready-filters">
      <div className="stack">
        <div className="ready-group ready-seg">
          <Segmented<TrainingLocation>
            label={t('ready.filters.place')}
            value={ctx.location}
            onChange={onLocation}
            options={LOCATIONS.map((l) => ({ value: l, label: t(`enums.location.${l}`) }))}
          />
        </div>

        {gear.length > 0 ? (
          <ChipGroup<Equipment>
            label={t('ready.filters.equipment')}
            hint={t('ready.filters.equipmentHint')}
            value={ctx.equipment}
            onChange={onEquipment}
            options={gear.map((q) => ({ value: q, label: t(`enums.equipment.${q}`) }))}
          />
        ) : (
          <p className="small muted ready-gym-note">{t('ready.filters.gymNote')}</p>
        )}

        <div className="ready-group ready-seg">
          <Segmented<TrainingMode>
            label={t('ready.filters.mode')}
            value={ctx.mode}
            onChange={onMode}
            options={TRAINING_MODES.map((m) => ({ value: m, label: t(`enums.trainingMode.${m}`) }))}
          />
          <p className="field-hint">{t(`ready.filters.modeHint.${ctx.mode}`)}</p>
        </div>

        <div className="ready-focus">
          <ChoiceChips<ReadyFocus>
            label={t('ready.filters.focus')}
            value={filters.focus}
            onChange={(focus) => onFilters({ focus })}
            options={[
              { value: null, label: t('ready.filters.all'), count: total },
              ...READY_FOCUSES.map((f) => ({ value: f, label: t(`enums.readyFocus.${f}`), count: facets ? (facets[f] ?? 0) : undefined })),
            ]}
          />
        </div>

        <div className="ready-more">
          <div className="row-between">
            <Button
              variant="ghost"
              size="sm"
              icon="filter"
              iconEnd={moreOpen ? 'chevronUp' : 'chevronDown'}
              aria-expanded={moreOpen}
              aria-controls={moreId}
              onClick={onToggleMore}
            >
              {moreOpen ? t('ready.filters.fewer') : moreActive > 0 ? t('ready.filters.moreActive', { count: moreActive }) : t('ready.filters.more')}
            </Button>
            {anyFilter && (
              <Button variant="ghost" size="sm" icon="refresh" onClick={onReset}>
                {t('ready.filters.reset')}
              </Button>
            )}
          </div>
          <div id={moreId} className="ready-more-panel stack" hidden={!moreOpen}>
            <div className="ready-group ready-seg">
              <Segmented<string>
                label={t('ready.filters.level')}
                value={filters.level ?? 'any'}
                onChange={(v) => onFilters({ level: DIFFICULTIES.find((d: Difficulty) => d === v) ?? null })}
                options={[{ value: 'any', label: t('ready.filters.anyLevel') }, ...DIFFICULTIES.map((d) => ({ value: d, label: t(`enums.difficulty.${d}`) }))]}
              />
            </div>
            <div className="ready-group ready-seg">
              <Segmented<number>
                label={t('ready.filters.length')}
                value={filters.maxMinutes ?? 0}
                onChange={(v) => onFilters({ maxMinutes: v > 0 ? v : null })}
                options={[{ value: 0, label: t('ready.filters.anyLength') }, ...LENGTH_OPTIONS.map((n) => ({ value: n, label: t('ready.filters.upTo', { minutes: formatNumber(n) }) }))]}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
