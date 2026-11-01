/** Client-side image downscale for the meal-photo estimate: longest side ≤ 1280 px, JPEG, base64 without the data: prefix. */
export const MAX_SIDE = 1280;
export const MAX_BASE64_CHARS = 10_500_000; // server cap is 11,000,000

/** Target size that fits within `max` on the longest side, preserving aspect ratio, never upscaling. */
export function fitWithin(width: number, height: number, max = MAX_SIDE): { width: number; height: number } {
  if (!(width > 0) || !(height > 0)) return { width: 0, height: 0 };
  const longest = Math.max(width, height);
  if (longest <= max) return { width: Math.round(width), height: Math.round(height) };
  const k = max / longest;
  return { width: Math.max(1, Math.round(width * k)), height: Math.max(1, Math.round(height * k)) };
}

export const stripDataUrl = (dataUrl: string): string => dataUrl.replace(/^data:[^,]*,/, '');

async function decode(file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === 'function') {
    const bmp = await createImageBitmap(file);
    return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close?.() };
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('image_decode_failed')); img.src = url; });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (e) { URL.revokeObjectURL(url); throw e; }
}

/** Decodes, scales to ≤1280 px and re-encodes as JPEG, lowering quality until it fits the server payload cap. */
export async function downscaleToJpegBase64(file: Blob, max = MAX_SIDE): Promise<string> {
  const img = await decode(file);
  try {
    const { width, height } = fitWithin(img.width, img.height, max);
    if (width === 0) throw new Error('image_decode_failed');
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas_unavailable');
    ctx.drawImage(img.source, 0, 0, width, height);
    for (const q of [0.82, 0.7, 0.55, 0.4]) {
      const b64 = stripDataUrl(canvas.toDataURL('image/jpeg', q));
      if (b64.length <= MAX_BASE64_CHARS) return b64;
    }
    throw new Error('payload_too_large');
  } finally { img.close(); }
}
