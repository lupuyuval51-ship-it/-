import type { Allergen, MealSlot } from '@lupu-fit/shared';
import { useMutation } from '@tanstack/react-query';
import { useRef, useState, type ReactNode } from 'react';
import { api } from '../../api/client.ts';
import { fmt, useLang, useT } from '../../i18n/index.tsx';
import { allergenHitsInText } from '../../lib/foodSearch.ts';
import { downscaleToJpegBase64 } from '../../lib/imageDownscale.ts';
import { Banner, Button, errorMessage, TextInput } from '../../ui/kit.tsx';
import { useToast } from '../../ui/toast.tsx';
import { AllergenGate } from './AllergenGate.tsx';
import { nutritionErrorKey, useLogFood } from './data.ts';

interface EstItem { name: string; grams: number; kcal: number; proteinG: number; carbsG: number; fatG: number }
interface EstResponse { estimated: true; requiresConfirmation: true; items: EstItem[]; notes?: string }
interface Row { id: number; name: string; grams: string; kcal: string; proteinG: string; carbsG: string; fatG: string; done: boolean; ack: boolean }

const num = (s: string): number => { const n = Number(s.replace(',', '.')); return Number.isFinite(n) && n >= 0 ? n : NaN; };

export function PhotoPanel({ date, slot, allergies }: { date: string; slot: MealSlot; allergies: readonly Allergen[] }): ReactNode {
  const t = useT(); const { lang } = useLang(); const toast = useToast(); const log = useLogFood();
  const input = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [notes, setNotes] = useState<string | null>(null);
  const [prepErr, setPrepErr] = useState<string | null>(null);

  const estimate = useMutation({
    mutationFn: async (file: File) => {
      const jpegBase64 = await downscaleToJpegBase64(file);
      return api.post<EstResponse>('/api/nutrition/photo-estimate', { jpegBase64, lang });
    },
    onSuccess: (r) => {
      setNotes(r.notes ?? null);
      setRows(r.items.map((x, i) => ({ id: i, name: x.name, grams: String(Math.round(x.grams)), kcal: String(Math.round(x.kcal)), proteinG: String(Math.round(x.proteinG * 10) / 10), carbsG: String(Math.round(x.carbsG * 10) / 10), fatG: String(Math.round(x.fatG * 10) / 10), done: false, ack: false })));
    },
  });
  const onFile = (f: File | undefined) => {
    setPrepErr(null); setRows([]); setNotes(null);
    if (!f) return;
    if (!f.type.startsWith('image/')) { setPrepErr(t('nutrition.photo.notImage')); return; }
    estimate.mutate(f);
  };
  const patch = (id: number, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const addRow = async (r: Row) => {
    const grams = num(r.grams); const kcal = num(r.kcal); const p = num(r.proteinG); const c = num(r.carbsG); const f = num(r.fatG);
    if (!r.name.trim() || ![grams, kcal, p, c, f].every(Number.isFinite) || grams < 0.1) { toast(t('state.invalid'), 'error'); return; }
    try {
      const res = await log.mutateAsync({ loggedDate: date, slot, name: r.name.trim().slice(0, 160), grams, kcal, proteinG: p, carbsG: c, fatG: f, estimated: true });
      toast(res.queued ? t('outbox.queued') : t('nutrition.log.added'), 'ok');
      patch(r.id, { done: true });
    } catch (e) { toast(errorMessage(e, t), 'error'); }
  };
  const errKey = estimate.error ? nutritionErrorKey(estimate.error) : null;
  const err = prepErr ?? (estimate.error ? (errKey ? t(errKey) : (estimate.error as Error).message === 'payload_too_large' ? t('nutrition.err.tooLarge') : errorMessage(estimate.error, t)) : null);

  return (
    <div className="stack">
      <Banner tone="warn">{t('nutrition.photo.estimateNote')}</Banner>
      <input ref={input} className="sr-only" type="file" accept="image/*" capture="environment" aria-label={t('nutrition.photo.choose')} onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      <Button onClick={() => input.current?.click()} disabled={estimate.isPending}>{estimate.isPending ? t('nutrition.photo.analyzing') : t('nutrition.photo.choose')}</Button>
      {err ? <Banner tone="danger">{err}</Banner> : null}
      {estimate.isSuccess && rows.length === 0 ? <Banner>{t('nutrition.photo.none')}</Banner> : null}
      {rows.length > 0 ? (
        <section className="stack" aria-label={t('nutrition.photo.resultTitle')}>
          <div className="row-wrap"><span className="tag warning">{t('nutrition.photo.badge')}</span><span className="small muted">{t('nutrition.photo.reviewHint')}</span></div>
          {notes ? <p className="small muted">{notes}</p> : null}
          {rows.map((r) => {
            const hits = allergenHitsInText(r.name, allergies);
            return (
              <div key={r.id} className="card stack-sm est-row" data-testid="estimate-item">
                <TextInput label={t('nutrition.photo.name')} value={r.name} disabled={r.done} onChange={(e) => patch(r.id, { name: e.target.value })} />
                <div className="grid-2">
                  <TextInput label={t('nutrition.log.grams')} inputMode="decimal" value={r.grams} disabled={r.done} onChange={(e) => patch(r.id, { grams: e.target.value })} />
                  <TextInput label={t('unit.kcal')} inputMode="decimal" value={r.kcal} disabled={r.done} onChange={(e) => patch(r.id, { kcal: e.target.value })} />
                  <TextInput label={t('nutrition.protein')} inputMode="decimal" value={r.proteinG} disabled={r.done} onChange={(e) => patch(r.id, { proteinG: e.target.value })} />
                  <TextInput label={t('nutrition.carbs')} inputMode="decimal" value={r.carbsG} disabled={r.done} onChange={(e) => patch(r.id, { carbsG: e.target.value })} />
                  <TextInput label={t('nutrition.fat')} inputMode="decimal" value={r.fatG} disabled={r.done} onChange={(e) => patch(r.id, { fatG: e.target.value })} />
                </div>
                <AllergenGate hits={hits} ack={r.ack} onAck={(v) => patch(r.id, { ack: v })} />
                <div className="row-between">
                  <span className="small muted">{r.done ? t('nutrition.photo.logged') : t('nutrition.photo.itemKcal', { kcal: fmt.num(num(r.kcal) || 0) })}</span>
                  <div className="row-wrap">
                    {!r.done ? <Button size="sm" onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}>{t('action.remove')}</Button> : null}
                    <Button size="sm" disabled={r.done || log.isPending || (hits.length > 0 && !r.ack)} onClick={() => void addRow(r)}>{t('nutrition.photo.logItem')}</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      ) : null}
    </div>
  );
}
