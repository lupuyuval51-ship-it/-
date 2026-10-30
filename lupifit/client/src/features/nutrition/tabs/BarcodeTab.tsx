import { useMutation } from '@tanstack/react-query';
import { useCallback, useState, type FormEvent } from 'react';
import { barcodeSchema } from '@shared/schemas/nutrition';
import type { FoodDTO } from '@shared/types';
import { ApiError } from '../../../api/client';
import { Button, Card, Notice, TextField } from '../../../components/ui';
import { useNetworkOnline } from '../../../hooks/useOnline';
import { useI18n } from '../../../i18n';
import { errorMessage } from '../../../lib/errors';
import { isDeviceMode } from '../../../platform';
import { lookupBarcode } from '../api';
import { BarcodeScanner, barcodeScanningSupported } from '../BarcodeScanner';

/**
 * Barcode lookup: typed manually or scanned with the camera (when the browser supports it). In device mode
 * the lookup is the one thing that needs the internet (the app asks Open Food Facts directly, sending only
 * the barcode), so it says so, and says clearly when the phone is offline.
 */
export function BarcodeTab({ onFound, onCreateCustom }: { onFound(food: FoodDTO): void; onCreateCustom(barcode: string): void }) {
  const i18n = useI18n();
  const { t } = i18n;
  const [code, setCode] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const canScan = barcodeScanningSupported();
  const network = useNetworkOnline();
  const offline = isDeviceMode && !network;

  const lookup = useMutation({
    mutationFn: (c: string) => lookupBarcode(c),
    onSuccess: (food) => onFound(food),
  });

  const { mutate } = lookup;
  const run = useCallback(
    (value: string) => {
      const parsed = barcodeSchema.safeParse(value.trim());
      if (!parsed.success) {
        setFieldError(t('nutrition.barcode.invalid'));
        return;
      }
      setFieldError(null);
      mutate(parsed.data);
    },
    [mutate, t],
  );

  const onDetected = useCallback(
    (detected: string) => {
      setScanning(false);
      setCode(detected);
      run(detected);
    },
    [run],
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!lookup.isPending) run(code);
  };

  const notFound = lookup.error instanceof ApiError && (lookup.error.code === 'barcode_not_found' || lookup.error.code === 'barcode_incomplete');
  const unreachable = isDeviceMode && lookup.error instanceof ApiError && lookup.error.code === 'barcode_lookup_failed';

  return (
    <Card title={t('nutrition.barcode.title')} subtitle={t('nutrition.barcode.intro')}>
      <div className="stack">
        {isDeviceMode && <p className="small muted">{t('device.nutrition.barcodeInternet')}</p>}
        <div aria-live="polite">
          {offline && (
            <Notice tone="warning" icon="warning">
              {t('device.nutrition.barcodeOffline')}
            </Notice>
          )}
        </div>
        <form className="nutri-barcode-form" onSubmit={submit} noValidate>
          <TextField
            label={t('nutrition.barcode.code')}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 14))}
            inputMode="numeric"
            autoComplete="off"
            dir="ltr"
            error={fieldError}
            name="barcode"
          />
          <Button type="submit" variant="primary" icon="search" loading={lookup.isPending} disabled={offline}>
            {t('nutrition.barcode.lookup')}
          </Button>
        </form>
        {canScan ? (
          <Button icon="camera" onClick={() => setScanning(true)} disabled={offline}>
            {t('nutrition.barcode.scan')}
          </Button>
        ) : (
          <Notice tone="info">{t('nutrition.barcode.unsupported')}</Notice>
        )}
        <div aria-live="polite">
          {lookup.isError && !offline && (
            <Notice tone={notFound ? 'warning' : 'danger'}>
              <p>{unreachable ? t('device.nutrition.barcodeFailed') : errorMessage(lookup.error, i18n, 'nutrition')}</p>
              {notFound && (
                <Button size="sm" icon="plus" onClick={() => onCreateCustom(code)}>
                  {t('nutrition.barcode.createCustom')}
                </Button>
              )}
            </Notice>
          )}
        </div>
      </div>
      {canScan && <BarcodeScanner open={scanning} onClose={() => setScanning(false)} onDetected={onDetected} />}
    </Card>
  );
}
