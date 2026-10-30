/** The barcode tab offers the camera only where it can work: never in the Android app (no camera permission). */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '../../../i18n';
import { BarcodeTab } from './BarcodeTab';

const g = globalThis as { Capacitor?: unknown; BarcodeDetector?: unknown };

function show() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <I18nProvider locale="en">
        <BarcodeTab onFound={() => undefined} onCreateCustom={() => undefined} />
      </I18nProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  // A browser (or WebView) that could scan: BarcodeDetector and getUserMedia.
  g.BarcodeDetector = class {};
  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: async () => new MediaStream() }, configurable: true });
});

afterEach(() => {
  delete g.Capacitor;
  delete g.BarcodeDetector;
  Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true });
});

describe('BarcodeTab', () => {
  it('offers camera scanning in a browser that supports it', () => {
    show();
    expect(screen.getByRole('button', { name: /scan with camera/i })).toBeTruthy();
  });

  it('in the Android app, asks for the number instead of offering the camera', () => {
    g.Capacitor = { isNativePlatform: () => true };
    show();
    expect(screen.queryByRole('button', { name: /scan with camera/i })).toBeNull();
    expect(screen.getByText('Type the number printed under the barcode.')).toBeTruthy();
  });
});
