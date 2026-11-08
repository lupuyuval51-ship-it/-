import type { PosterInput, ShareOutcome } from './types.ts';

/** ASCII slug: "The Undercover Tourist!" → "the-undercover-tourist". */
export function slugify(text: string, maxLength = 60): string {
  const slug = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length <= maxLength) return slug;
  const cut = slug.slice(0, maxLength);
  const lastDash = cut.lastIndexOf('-');
  return (lastDash > maxLength * 0.5 ? cut.slice(0, lastDash) : cut).replace(/-+$/g, '');
}

/** "plot-twist-ep04-the-undercover-tourist.png" */
export function posterFileName(input: Pick<PosterInput, 'title' | 'episodeNumber'>): string {
  const n = Number.isFinite(input.episodeNumber) ? Math.max(0, Math.floor(input.episodeNumber)) : 0;
  const slug = slugify(input.title ?? '') || 'episode';
  return `plot-twist-ep${String(n).padStart(2, '0')}-${slug}.png`;
}

/** Saves a blob through a temporary object URL and <a download>. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  try {
    a.click();
  } finally {
    a.remove();
    // Some browsers read the URL asynchronously after click(); revoke well after.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}

function isAbort(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { name?: unknown }).name === 'AbortError';
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* clipboard denied */
  }
  return false;
}

/**
 * Shares the poster: the PNG itself where the platform supports file sharing,
 * otherwise the text, otherwise copies the text to the clipboard.
 */
export async function sharePoster(blob: Blob, fileName: string, text: string): Promise<ShareOutcome> {
  if (typeof navigator === 'undefined') return 'unsupported';
  const nav = navigator;
  let file: File | null = null;
  try {
    file = typeof File === 'function' ? new File([blob], fileName, { type: blob.type || 'image/png' }) : null;
  } catch {
    file = null;
  }

  if (file && typeof nav.share === 'function' && typeof nav.canShare === 'function') {
    let canShareFiles = false;
    try {
      canShareFiles = nav.canShare({ files: [file] });
    } catch {
      canShareFiles = false;
    }
    if (canShareFiles) {
      try {
        await nav.share({ files: [file], text });
        return 'shared';
      } catch (err) {
        if (isAbort(err)) return 'cancelled';
        // e.g. NotAllowedError — fall back to the clipboard rather than a second share sheet.
        return (await copyText(text)) ? 'copied' : 'failed';
      }
    }
  }

  if (typeof nav.share === 'function') {
    try {
      await nav.share({ text });
      return 'shared';
    } catch (err) {
      if (isAbort(err)) return 'cancelled';
      return (await copyText(text)) ? 'copied' : 'failed';
    }
  }

  if (await copyText(text)) return 'copied';
  return typeof nav.clipboard?.writeText === 'function' ? 'failed' : 'unsupported';
}
