import { useEffect, useRef, useState } from 'react';
import { Modal, Notice, Spinner } from '../../components/ui';
import { useI18n } from '../../i18n';

/** Minimal typing for the Barcode Detection API (not yet in TypeScript's DOM lib). */
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorInstance {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance;
  getSupportedFormats?(): Promise<string[]>;
}

const PRODUCT_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

/** True when the browser can scan barcodes from the camera (BarcodeDetector + getUserMedia). */
export function barcodeScanningSupported(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
}

/**
 * Camera preview that scans for product barcodes. The media stream is always stopped when
 * a code is found, the dialog is closed or the component unmounts.
 */
export function BarcodeScanner({ open, onClose, onDetected }: { open: boolean; onClose(): void; onDetected(code: string): void }) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  // Latest callbacks without restarting the camera on every parent render.
  const latest = useRef({ onDetected, t });
  useEffect(() => {
    latest.current = { onDetected, t };
  });

  useEffect(() => {
    if (!open) return;
    let stream: MediaStream | null = null;
    let timer: number | null = null;
    let stopped = false;
    const stop = () => {
      stopped = true;
      if (timer != null) window.clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
    };

    (async () => {
      setError(null);
      setStarting(true);
      try {
        const Detector = (window as unknown as { BarcodeDetector: BarcodeDetectorConstructor }).BarcodeDetector;
        const supported = (await Detector.getSupportedFormats?.()) ?? PRODUCT_FORMATS;
        const formats = PRODUCT_FORMATS.filter((f) => supported.includes(f));
        const detector = new Detector(formats.length ? { formats } : undefined);
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (stopped) return stop();
        const video = videoRef.current;
        if (!video) return stop();
        video.srcObject = stream;
        await video.play();
        setStarting(false);
        const tick = async () => {
          if (stopped) return;
          try {
            const codes = await detector.detect(video);
            const hit = codes.map((c) => c.rawValue.trim()).find((v) => /^\d{6,14}$/.test(v));
            if (hit) {
              stop();
              latest.current.onDetected(hit);
              return;
            }
          } catch {
            /* frame not ready — try again */
          }
          timer = window.setTimeout(tick, 250);
        };
        void tick();
      } catch (err) {
        stop();
        setStarting(false);
        const name = (err as { name?: string })?.name;
        const tr = latest.current.t;
        setError(name === 'NotAllowedError' || name === 'SecurityError' ? tr('nutrition.barcode.cameraDenied') : tr('nutrition.barcode.cameraError'));
      }
    })();

    return stop;
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title={t('nutrition.barcode.scannerTitle')}>
      <div className="stack">
        {error ? (
          <Notice tone="warning">{error}</Notice>
        ) : (
          <>
            <p className="small muted">{t('nutrition.barcode.scannerHint')}</p>
            <div className="scanner-frame">
              <video ref={videoRef} className="scanner-video" muted playsInline aria-label={t('nutrition.barcode.scannerTitle')} />
              <span className="scanner-guide" aria-hidden="true" />
            </div>
            <p className="row small muted" role="status" aria-live="polite">
              <Spinner size={14} />
              {starting ? t('common.states.loading') : t('nutrition.barcode.scanning')}
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
