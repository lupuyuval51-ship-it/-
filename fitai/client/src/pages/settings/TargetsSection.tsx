/** Daily nutrition targets: recommended vs. custom, live safety checks, reset (PUT /api/profile/targets). */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { customTargetsSchema, macroCalories, minimumProteinG, type CustomTargetsInput } from '@shared/schemas/profile';
import type { ProfileDTO } from '@shared/types';
import { ApiError } from '../../api/client';
import { Badge, Button, Card, EmptyState, LinkButton, Notice, NumberField, useConfirm, useToast } from '../../components/ui';
import { applyProfileChange, updateTargets } from '../../features/profile/api';
import { firstInvalidField, validate } from '../../features/profile/draft';
import { FieldSlot } from '../../features/profile/fields';
import { EnergyFacts, TargetNotes, TargetStats } from '../../features/profile/TargetsSummary';
import { focusField, localizeIssues, serverFieldErrors, type FieldErrors } from '../../features/profile/validation';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import { SectionCard, useSectionForm } from './sectionForm';

interface TargetsForm {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}

const KEYS = ['calories', 'proteinG', 'carbsG', 'fatG'] as const;

/** Signed percentage difference, e.g. "+4%" / "−12%". */
function percentDiff(value: number, reference: number, formatNumber: (n: number, o?: Intl.NumberFormatOptions) => string) {
  if (reference <= 0) return '—';
  return formatNumber((value - reference) / reference, { style: 'percent', signDisplay: 'exceptZero', maximumFractionDigits: 0 });
}

export function TargetsSection({ profile }: { profile: ProfileDTO }) {
  const { t } = useI18n();
  const targets = profile.targets;
  const [editing, setEditing] = useState(false);
  if (!targets || !targets.computed) {
    return (
      <Card id="settings-targets" title={t('settings.targets.title')} className="settings-section">
        <EmptyState
          compact
          icon="target"
          title={t('settings.targets.incompleteTitle')}
          body={t('settings.targets.incompleteBody')}
          action={
            <LinkButton to="/onboarding" variant="primary" size="sm">
              {t('settings.privacy.redo')}
            </LinkButton>
          }
        />
      </Card>
    );
  }
  return editing ? (
    <TargetsEditor profile={profile} onDone={() => setEditing(false)} />
  ) : (
    <TargetsOverview profile={profile} onEdit={() => setEditing(true)} />
  );
}

function TargetsOverview({ profile, onEdit }: { profile: ProfileDTO; onEdit(): void }) {
  const i18n = useI18n();
  const { t, formatNumber } = i18n;
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const targets = profile.targets!;
  const computed = targets.computed!;

  const reset = useMutation({
    mutationFn: () => updateTargets({ reset: true }),
    onSuccess: async (next) => {
      toast.success(t('settings.targets.resetDone'));
      await applyProfileChange(queryClient, next);
    },
    onError: (err) => toast.error(errorMessage(err, i18n, 'settings')),
  });

  return (
    <Card
      id="settings-targets"
      title={t('settings.targets.title')}
      subtitle={t('settings.targets.subtitle')}
      className="settings-section"
      actions={<Badge tone={targets.custom ? 'info' : 'success'}>{targets.custom ? t('settings.targets.custom') : t('settings.targets.recommended')}</Badge>}
    >
      <div className="stack" aria-live="polite">
        <TargetStats targets={targets} />
        {targets.custom && (
          <Notice tone="info">
            {t('settings.targets.customNote', {
              calories: formatNumber(computed.calories),
              protein: formatNumber(computed.proteinG),
              carbs: formatNumber(computed.carbsG),
              fat: formatNumber(computed.fatG),
            })}
          </Notice>
        )}
        <details className="profile-details">
          <summary>{t('settings.targets.computedTitle')}</summary>
          <div className="stack-sm">
            <EnergyFacts computed={computed} showMinimum />
            <TargetNotes notes={computed.notes} />
          </div>
        </details>
        <div className="settings-actions">
          {targets.custom && (
            <Button
              variant="ghost"
              icon="refresh"
              loading={reset.isPending}
              onClick={async () => {
                const ok = await confirm({ title: t('settings.targets.resetConfirmTitle'), body: t('settings.targets.resetConfirmBody'), confirmLabel: t('settings.targets.reset') });
                if (ok) reset.mutate();
              }}
            >
              {t('settings.targets.reset')}
            </Button>
          )}
          <Button variant="primary" icon="edit" onClick={onEdit}>
            {t('settings.targets.edit')}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function TargetsEditor({ profile, onDone }: { profile: ProfileDTO; onDone(): void }) {
  const i18n = useI18n();
  const { t, formatNumber } = i18n;
  const toast = useToast();
  const queryClient = useQueryClient();
  const targets = profile.targets!;
  const computed = targets.computed!;
  const source = useMemo<TargetsForm>(
    () => ({ calories: targets.calories, proteinG: targets.proteinG, carbsG: targets.carbsG, fatG: targets.fatG }),
    [targets.calories, targets.proteinG, targets.carbsG, targets.fatG],
  );
  const form = useSectionForm('targets', source);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const v = form.values;
  const minProtein = minimumProteinG(profile.weightKg ?? 0);
  const macroKcal = v.proteinG != null && v.carbsG != null && v.fatG != null ? macroCalories({ proteinG: v.proteinG, carbsG: v.carbsG, fatG: v.fatG }) : null;
  const macroOff = macroKcal != null && v.calories != null && v.calories > 0 && Math.abs(macroKcal - v.calories) / v.calories > 0.1;

  const mutation = useMutation({
    mutationFn: (input: CustomTargetsInput) => updateTargets(input),
    onSuccess: async (next) => {
      toast.success(t('settings.targets.savedCustom'));
      await applyProfileChange(queryClient, next);
      onDone();
    },
    onError: (err) => {
      const details = err instanceof ApiError ? (err.details as Record<string, number> | undefined) : undefined;
      if (err instanceof ApiError && err.code === 'calories_below_safe_minimum') {
        setErrors({ calories: t('settings.targets.errors.calories_below_safe_minimum', { minimum: formatNumber(details?.minimum ?? computed.minimumCalories) }) });
        focusField('calories', formRef.current ?? document);
      } else if (err instanceof ApiError && err.code === 'protein_too_low') {
        setErrors({ proteinG: t('settings.targets.errors.protein_too_low', { minimum: formatNumber(details?.minimum ?? minProtein) }) });
        focusField('proteinG', formRef.current ?? document);
      } else if (err instanceof ApiError && err.code === 'macros_inconsistent') {
        setFormError(t('settings.targets.errors.macros_inconsistent', { macroCalories: formatNumber(details?.macroCalories ?? macroKcal ?? 0) }));
      } else if (err instanceof ApiError && err.code === 'validation_error') {
        setErrors(serverFieldErrors(err.details, i18n));
      } else {
        setFormError(errorMessage(err, i18n, 'settings'));
      }
    },
  });

  const set = (patch: Partial<TargetsForm>) => {
    form.set(patch);
    setFormError(null);
    setErrors((errs) => Object.fromEntries(Object.entries(errs).filter(([k]) => !(k in patch))));
  };

  const onSubmit = () => {
    setFormError(null);
    const result = validate(customTargetsSchema, v);
    if (!result.ok) {
      setErrors(localizeIssues(result.issues, i18n, false));
      focusField(firstInvalidField(KEYS, result.issues), formRef.current ?? document);
      return;
    }
    setErrors({});
    mutation.mutate(result.data);
  };

  const fillCarbs = () => {
    if (v.calories == null || v.proteinG == null || v.fatG == null) return;
    set({ carbsG: Math.max(0, Math.round((v.calories - v.proteinG * 4 - v.fatG * 9) / 4)) });
  };

  const g = t('common.units.g');
  return (
    <SectionCard
      id="settings-targets"
      title={t('settings.targets.title')}
      subtitle={t('settings.targets.subtitle')}
      dirty={form.dirty}
      saving={mutation.isPending}
      error={formError}
      formRef={formRef}
      saveLabel={t('settings.targets.save')}
      cancelLabel={t('settings.targets.cancelEdit')}
      onSubmit={onSubmit}
      onDiscard={() => {
        form.reset();
        onDone();
      }}
    >
      <div className="grid-2">
        <FieldSlot name="calories">
          <NumberField
            label={t('common.macros.calories')}
            value={v.calories}
            onChange={(n) => set({ calories: n })}
            unit={t('common.units.kcal')}
            min={1000}
            max={6000}
            step={10}
            required
            error={errors.calories}
            hint={t('settings.targets.caloriesHint', { min: formatNumber(computed.minimumCalories) })}
            name="calories"
          />
        </FieldSlot>
        <FieldSlot name="proteinG">
          <NumberField
            label={t('common.macros.protein')}
            value={v.proteinG}
            onChange={(n) => set({ proteinG: n })}
            unit={g}
            min={20}
            max={400}
            required
            error={errors.proteinG}
            hint={t('settings.targets.proteinHint', { min: formatNumber(minProtein) })}
            name="proteinG"
          />
        </FieldSlot>
        <FieldSlot name="carbsG">
          <NumberField label={t('common.macros.carbs')} value={v.carbsG} onChange={(n) => set({ carbsG: n })} unit={g} min={0} max={900} required error={errors.carbsG} name="carbsG" />
        </FieldSlot>
        <FieldSlot name="fatG">
          <NumberField label={t('common.macros.fat')} value={v.fatG} onChange={(n) => set({ fatG: n })} unit={g} min={15} max={300} required error={errors.fatG} name="fatG" />
        </FieldSlot>
      </div>
      <div className={`profile-macro-check${macroOff ? ' is-off' : ''}`} aria-live="polite">
        {macroKcal != null && v.calories != null ? (
          <p className="small">
            {t('settings.targets.macroSum', { kcal: formatNumber(macroKcal), diff: percentDiff(macroKcal, v.calories, formatNumber) })}
            {macroOff && <strong> {t('settings.targets.macroMismatch')}</strong>}
          </p>
        ) : null}
        <Button size="sm" variant="ghost" icon="sparkles" onClick={fillCarbs} disabled={v.calories == null || v.proteinG == null || v.fatG == null}>
          {t('settings.targets.fillCarbs')}
        </Button>
      </div>
    </SectionCard>
  );
}
