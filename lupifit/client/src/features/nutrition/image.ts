/**
 * Client-side photo preparation: meal photos are downscaled to at most 1280 px on the
 * longest side and re-encoded as JPEG before upload (smaller, faster, strips metadata).
 */

export const PHOTO_MAX_DIMENSION = 1280;
/** Server limit is 5 MB decoded; stay well below it. */
export const PHOTO_MAX_BYTES = 4 * 1024 * 1024;

/** Target size that fits within `max`×`max`, keeps the aspect ratio and never upscales. */
export function fitWithin(width: number, height: number, max = PHOTO_MAX_DIMENSION): { width: number; height: number } {
  if (!(width > 0) || !(height > 0)) return { width: 0, height: 0 };
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export interface PreparedPhoto {
  base64: string;
  mediaType: 'image/jpeg';
  width: number;
  height: number;
  blob: Blob;
}

async function loadBitmap(file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; close(): void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      /* fall back to <img> (e.g. formats createImageBitmap rejects) */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => undefined };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode_failed'))), 'image/jpeg', quality),
  );
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

/** Decodes an image file, downscales it and encodes it as JPEG. Throws `Error('invalid_image')` for unreadable files. */
export async function prepareMealPhoto(file: Blob, max = PHOTO_MAX_DIMENSION): Promise<PreparedPhoto> {
  let bitmap: Awaited<ReturnType<typeof loadBitmap>>;
  try {
    bitmap = await loadBitmap(file);
  } catch {
    throw new Error('invalid_image');
  }
  try {
    const size = fitWithin(bitmap.width, bitmap.height, max);
    if (!size.width || !size.height) throw new Error('invalid_image');
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('invalid_image');
    // JPEG has no alpha: paint a white background first (transparent PNGs).
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size.width, size.height);
    ctx.drawImage(bitmap.source, 0, 0, size.width, size.height);
    let quality = 0.85;
    let blob = await toBlob(canvas, quality);
    while (blob.size > PHOTO_MAX_BYTES && quality > 0.4) {
      quality -= 0.15;
      blob = await toBlob(canvas, quality);
    }
    return { base64: await blobToBase64(blob), mediaType: 'image/jpeg', width: size.width, height: size.height, blob };
  } finally {
    bitmap.close();
  }
}
