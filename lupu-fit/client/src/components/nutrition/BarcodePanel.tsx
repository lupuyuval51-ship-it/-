import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from '../../api/client.ts';
import { useT } from '../../i18n/index.tsx';
import { useNetworkOnline } from '../live/OfflineBanner.tsx';
import type { Loggable } from '../../lib/foodSearch.ts';
import { Banner, Button, errorMessage, TextInput } from '../../ui/kit.tsx';
import { IconBarcode } from '../../ui/icons.tsx';
import { nutritionErrorKey } from './data.ts';

interface BarcodeResult { barcode: string; name: string; per100g: { kcal: number; proteinG: number; carbsG: number; fatG: number }; servingG: number | null; source: string }
interface Detector { detect(src: CanvasImageSource): Promise<{ rawValue: string }[]> }
type DetectorCtor = new (o?: { formats?: string[] }) => Detector;

const detectorCtor = (): DetectorCtor | null => (typeof window !== 'undefined' ? ((window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector ?? null) : null);
export const canScan = (): boolean => !!detectorCtor() && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

export function BarcodePanel({ onFound }: { onFound: (item: Loggable) => void }): ReactNode {
  const t = useT();
  const online = useNetworkOnline();
  const [ean, setEan] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanErr, setScanErr] = useState<string | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);

  const lookup = useMutation({
    mutationFn: (code: string) => api.get<BarcodeResult>(`/api/nutrition/barcode/${code}`),
    onSuccess: (r) => onFound({
      key: `barcode:${r.barcode}`, kind: 'barcode', id: r.barcode, nameHe: r.name, nameEn: r.name,
      per100: { kcal: r.per100g.kcal, proteinG: r.per100g.proteinG, carbsG: r.per100g.carbsG, fatG: r.per100g.fatG },
      servingG: r.servingG ?? 100, allergens: [],
    }),
  });
  const stop = () => { stream.current?.getTracks().forEach((x) => x.stop()); stream.current = null; setScanning(false); };
  useEffect(() => stop, []);

  useEffect(() => {
    if (!scanning) return;
    const Ctor = detectorCtor(); const el = video.current;
    if (!Ctor || !el || !stream.current) return;
    el.srcObject = stream.current; void el.play?.();
    const det = new Ctor({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
    let alive = true;
    const tick = async () => {
      if (!alive) return;
      try { const r = await det.detect(el); const v = r[0]?.rawValue; if (v && /^\d{8,14}$/.test(v)) { setEan(v); stop(); lookup.mutate(v); return; } } catch { /* frame not ready */ }
      setTimeout(() => void tick(), 400);
    };
    void tick();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  const startScan = async () => {
    setScanErr(null);
    try { stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); setScanning(true); } catch { setScanErr(t('nutrition.barcode.cameraDenied')); }
  };
  const valid = /^\d{8,14}$/.test(ean);
  const err = lookup.error ? (nutritionErrorKey(lookup.error) ? t(nutritionErrorKey(lookup.error) as string) : errorMessage(lookup.error, t)) : null;

  return (
    <div className="stack">
      {canScan() ? (
        scanning
          ? <div className="stack-sm"><video ref={video} className="scan-video" playsInline muted aria-label={t('nutrition.barcode.camera')} /><Button onClick={stop}>{t('nutrition.barcode.stop')}</Button></div>
          : <Button onClick={() => void startScan()}><IconBarcode aria-label={t('nutrition.barcode.scan')} /> {t('nutrition.barcode.scan')}</Button>
      ) : <span className="small muted">{t('nutrition.barcode.noScanner')}</span>}
      {scanErr ? <Banner tone="warn">{scanErr}</Banner> : null}
      <form className="stack-sm" onSubmit={(e) => { e.preventDefault(); if (valid) lookup.mutate(ean); }}>
        <TextInput label={t('nutrition.barcode.number')} hint={t('nutrition.barcode.hint')} inputMode="numeric" autoComplete="off" value={ean} onChange={(e) => setEan(e.target.value.replace(/\D/g, '').slice(0, 14))} />
        <Button type="submit" disabled={!valid || lookup.isPending}>{lookup.isPending ? t('nutrition.barcode.looking') : t('nutrition.barcode.lookup')}</Button>
      </form>
      {/* The lookup is the one feature that needs the internet (Open Food Facts). Offline is said calmly and never blocks anything else. */}
      {!online && !err ? <Banner><span data-testid="barcode-offline">{t('nutrition.barcode.offlineNote')}</span></Banner> : null}
      {err ? <Banner tone="danger"><span data-testid="barcode-error">{err}</span></Banner> : null}
      <span className="small muted">{t('nutrition.barcode.source')} {t('nutrition.barcode.sent')}</span>
    </div>
  );
}
