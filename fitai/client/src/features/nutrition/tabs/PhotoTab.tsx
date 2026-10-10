import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { MealType } from '@shared/constants';
import { scaleNutrients, sumMacros } from '@shared/nutrition';
import type { BatchLogInput, PhotoAnalysisInput } from '@shared/schemas/nutrition';
import type { FoodDTO, PhotoAnalysisDTO, PhotoAnalysisItemDTO } from '@shared/types';
import { Badge, Button, Card, Checkbox, EmptyState, ErrorState, Icon, IconButton, LoadingState, Notice, NumberField, Spinner, TextField, useConfirm, useToast } from '../../../components/ui';
import { useIdempotentMutation } from '../../../hooks/useIdempotentMutation';
import { useI18n } from '../../../i18n';
import { errorMessage, fieldErrorMessage } from '../../../lib/errors';
import { analyzePhoto, batchLog, fetchHealth, nk } from '../api';
import { ConflictBadges } from '../FoodBits';
import { FoodPickerModal } from '../FoodPickerModal';
import { useNutritionInvalidation } from '../hooks';
import { prepareMealPhoto } from '../image';
import { MacroLine, useMacroFormat } from '../Macros';
import { amountError, estimateNutrients } from '../portion';

interface ReviewItem {
  key: string;
  include: boolean;
  name: string;
  grams: number | null;
  match: FoodDTO | null;
  estimate: PhotoAnalysisItemDTO['estimatedPer100g'];
  confidence: PhotoAnalysisItemDTO['confidence'];
}

const CONFIDENCE_TONE = { low: 'warning', medium: 'info', high: 'success' } as const;

function itemNutrients(item: ReviewItem) {
  const grams = item.grams ?? 0;
  if (grams <= 0) return { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
  if (item.match) return scaleNutrients(item.match.per100g, grams);
  return item.estimate ? estimateNutrients(item.estimate, grams) : { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
}

/**
 * Meal photo → AI estimate → user review → log. The photo is downscaled in the browser,
 * never stored on the server, and nothing is logged until the user confirms the items.
 */
export function PhotoTab({ date, mealType }: { date: string; mealType: MealType }) {
  const i18n = useI18n();
  const { t } = i18n;
  const health = useQuery({ queryKey: nk.health, queryFn: fetchHealth, staleTime: 5 * 60_000 });

  if (health.isPending) return <LoadingState compact />;
  if (health.isError) return <ErrorState compact error={health.error} onRetry={() => void health.refetch()} />;
  if (!health.data.ai.configured) {
    return <EmptyState icon="camera" title={t('nutrition.photo.unavailableTitle')} body={t('nutrition.photo.unavailableBody')} />;
  }
  return <PhotoAnalyzer date={date} mealType={mealType} />;
}

function PhotoAnalyzer({ date, mealType }: { date: string; mealType: MealType }) {
  const i18n = useI18n();
  const { t, lt } = i18n;
  const toast = useToast();
  const confirm = useConfirm();
  const invalidate = useNutritionInvalidation();
  const f = useMacroFormat();
  const [preparing, setPreparing] = useState(false);
  const [prepError, setPrepError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [picking, setPicking] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const urlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const setPreview = (blob: Blob | null) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = blob ? URL.createObjectURL(blob) : null;
    setPreviewUrl(urlRef.current);
  };

  const analyze = useIdempotentMutation((input: PhotoAnalysisInput, key: string) => analyzePhoto(input, key), {
    onSuccess: (res: PhotoAnalysisDTO) => {
      setNotes(res.notes);
      setItems(
        res.items.map((it, idx) => ({
          key: `${idx}-${it.name}`,
          include: true,
          name: it.name,
          grams: it.estimatedGrams,
          match: it.match,
          estimate: it.estimatedPer100g,
          confidence: it.confidence,
        })),
      );
    },
  });

  const log = useIdempotentMutation((input: BatchLogInput, key: string) => batchLog(input, key), {
    onSuccess: (res) => {
      invalidate(res.day);
      toast.success(t('nutrition.photo.logged', { count: res.entries.length, meal: t(`enums.mealType.${mealType}`) }));
      reset();
    },
    onError: (err) => toast.error(errorMessage(err, i18n, 'nutrition')),
  });

  const reset = () => {
    setItems(null);
    setNotes([]);
    setPreview(null);
    setShowErrors(false);
    setPrepError(null);
    analyze.reset();
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    reset();
    setPreparing(true);
    try {
      const photo = await prepareMealPhoto(file);
      setPreview(photo.blob);
      analyze.mutate({ imageBase64: photo.base64, mediaType: photo.mediaType, mealType });
    } catch {
      setPrepError(t('nutrition.errors.invalid_image'));
    } finally {
      setPreparing(false);
    }
  };

  const update = (key: string, patch: Partial<ReviewItem>) => setItems((list) => (list ? list.map((i) => (i.key === key ? { ...i, ...patch } : i)) : list));
  const selected = (items ?? []).filter((i) => i.include);
  const invalid = selected.some((i) => amountError('grams', i.grams, 1) != null || (!i.match && (!i.name.trim() || !i.estimate)));
  const total = sumMacros(selected.map(itemNutrients));

  const submit = async () => {
    setShowErrors(true);
    if (!selected.length) {
      toast.error(t('nutrition.photo.nothingSelected'));
      return;
    }
    if (invalid || log.isPending) return;
    const conflicting = selected.filter((i) => i.match && i.match.conflicts.length > 0);
    if (conflicting.length > 0) {
      const ok = await confirm({
        title: t('nutrition.photo.conflictConfirmTitle'),
        body: t('nutrition.photo.conflictConfirmBody', { names: conflicting.map((i) => lt(i.match!.name)).join(', ') }),
        confirmLabel: t('nutrition.portion.logAnyway'),
        danger: conflicting.some((i) => i.match!.conflicts.some((c) => c.type === 'allergen')),
      });
      if (!ok) return;
    }
    log.mutate({
      date,
      mealType,
      source: 'photo',
      items: selected.map((i) => {
        if (i.match) return { foodId: i.match.id, grams: i.grams! };
        const n = itemNutrients(i);
        return { name: i.name.trim(), grams: i.grams!, kcal: n.kcal, proteinG: n.proteinG, carbsG: n.carbsG, fatG: n.fatG };
      }),
    });
  };

  const busy = preparing || analyze.isPending;
  const pickingItem = items?.find((i) => i.key === picking) ?? null;

  return (
    <Card title={t('nutrition.photo.title')} subtitle={t('nutrition.photo.intro')}>
      <div className="stack">
        <div className="row">
          <label className={`btn btn-${items ? 'secondary' : 'primary'} btn-md photo-pick${busy ? ' is-disabled' : ''}`}>
            <Icon name="camera" size={18} />
            <span className="btn-label">{items ? t('nutrition.photo.another') : t('nutrition.photo.choose')}</span>
            <input type="file" accept="image/*" capture="environment" className="visually-hidden" onChange={onFile} disabled={busy} />
          </label>
        </div>

        {previewUrl && <img src={previewUrl} alt={t('nutrition.photo.previewAlt')} className="photo-preview" />}

        <div aria-live="polite">
          {busy && (
            <p className="row muted" role="status">
              <Spinner size={16} />
              {preparing ? t('nutrition.photo.preparing') : t('nutrition.photo.analyzing')}
            </p>
          )}
          {prepError && <Notice tone="danger">{prepError}</Notice>}
          {analyze.isError && (
            <Notice tone="danger">
              <p>{errorMessage(analyze.error, i18n, 'nutrition')}</p>
              <Button size="sm" icon="refresh" onClick={() => analyze.retryLast()}>
                {t('common.actions.retry')}
              </Button>
            </Notice>
          )}
        </div>

        {items && (
          <section className="stack" aria-label={t('nutrition.photo.reviewTitle')}>
            <h2 className="section-title">{t('nutrition.photo.reviewTitle')}</h2>
            <Notice tone="warning">{t('nutrition.photo.estimatesNote')}</Notice>
            {notes.length > 0 && (
              <div className="small">
                <strong>{t('nutrition.photo.modelNotes')}</strong>
                <ul className="nutri-notes">
                  {notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            )}
            {items.length === 0 ? (
              <EmptyState compact icon="camera" title={t('nutrition.photo.noItems')} />
            ) : (
              <ul className="list photo-items">
                {items.map((item) => {
                  const n = itemNutrients(item);
                  const gramsError = showErrors && item.include ? amountError('grams', item.grams, 1) : null;
                  return (
                    <li key={item.key} className={`photo-item${item.include ? '' : ' photo-item-off'}`}>
                      <div className="row-between">
                        <Checkbox label={<strong>{item.name || '—'}</strong>} checked={item.include} onChange={(v) => update(item.key, { include: v })} />
                        <div className="row">
                          <Badge tone={CONFIDENCE_TONE[item.confidence]}>{t(`nutrition.photo.confidence.${item.confidence}`)}</Badge>
                          <IconButton icon="trash" size="sm" label={t('nutrition.photo.remove', { name: item.name })} onClick={() => setItems((list) => list?.filter((i) => i.key !== item.key) ?? null)} />
                        </div>
                      </div>
                      <div className="grid-2">
                        <TextField
                          label={t('nutrition.photo.itemName')}
                          value={item.name}
                          onChange={(e) => update(item.key, { name: e.target.value })}
                          maxLength={120}
                          error={showErrors && item.include && !item.match && !item.name.trim() ? fieldErrorMessage('required', i18n) : null}
                        />
                        <NumberField
                          label={t('nutrition.photo.grams')}
                          value={item.grams}
                          onChange={(v) => update(item.key, { grams: v })}
                          unit={t('common.units.g')}
                          inputMode="decimal"
                          error={gramsError ? fieldErrorMessage(gramsError, i18n) : null}
                        />
                      </div>
                      <div className="photo-match">
                        {item.match ? (
                          <div className="stack-sm">
                            <span className="small muted">{t('nutrition.photo.match')}</span>
                            <strong>{lt(item.match.name)}</strong>
                            <span className="small muted num">{t('nutrition.units.perHundred', { kcal: f.kcal(item.match.per100g.kcal) })}</span>
                            {item.match.conflicts.length > 0 && (
                              <div className="food-badges">
                                <ConflictBadges conflicts={item.match.conflicts} />
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="small">{t('nutrition.photo.noMatch', { kcal: f.kcal(item.estimate?.kcal ?? 0) })}</span>
                        )}
                        <div className="row">
                          <Button size="sm" icon="search" onClick={() => setPicking(item.key)}>
                            {item.match ? t('nutrition.photo.change') : t('nutrition.photo.findMatch')}
                          </Button>
                          {item.match && item.estimate && (
                            <Button size="sm" variant="ghost" onClick={() => update(item.key, { match: null })}>
                              {t('nutrition.photo.useEstimate')}
                            </Button>
                          )}
                        </div>
                      </div>
                      <MacroLine m={n} className="small" />
                    </li>
                  );
                })}
              </ul>
            )}
            {items.length > 0 && (
              <div className="row-between photo-footer">
                <strong className="num" aria-live="polite">
                  {t('nutrition.photo.selectedTotal', { kcal: f.kcal(total.kcal) })}
                </strong>
                <Button variant="primary" icon="check" loading={log.isPending} onClick={() => void submit()}>
                  {t('nutrition.photo.logSelected')}
                </Button>
              </div>
            )}
          </section>
        )}
      </div>
      <FoodPickerModal
        open={pickingItem != null}
        onClose={() => setPicking(null)}
        initialQuery={pickingItem?.name ?? ''}
        onSelect={(food) => pickingItem && update(pickingItem.key, { match: food })}
      />
    </Card>
  );
}
