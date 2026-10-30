/**
 * Saving a file in the Android app (backup, export): a WebView has no downloads, so the file is written to
 * the app's private cache folder and handed to Android's share sheet, where the person picks where it goes
 * (Files / Drive / e-mail …). Plugins are passed in, so tests use fakes.
 */
import { Directory, Encoding, type FilesystemPlugin } from '@capacitor/filesystem';
import type { SharePlugin } from '@capacitor/share';
import type { SaveFileResult } from '../types';

export type FilesystemApi = Pick<FilesystemPlugin, 'writeFile' | 'rmdir'>;
export type ShareApi = Pick<SharePlugin, 'share'>;

/** Sub-folder of the cache folder that res/xml/file_paths.xml lets the share sheet read. */
export const SHARE_DIR = 'share';

/** A plain file name: no folders, nothing Android's file provider or the receiving app could trip on. */
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  const cleaned = base.replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^[.-]+/, '');
  return cleaned.slice(0, 120) || 'lupu-fit-file';
}

/** Bytes as base64 (the Filesystem plugin takes binary data that way). */
export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(binary);
}

async function blobBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === 'function') return new Uint8Array(await blob.arrayBuffer());
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.readAsArrayBuffer(blob);
  });
}

/** The share sheet was closed without picking anything (the plugin rejects with "Share canceled"). */
export function isShareCancel(err: unknown): boolean {
  const message = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  return /cancel/i.test(message);
}

export function createNativeSaveFile({
  filesystem,
  share,
  dialogTitle,
}: {
  filesystem: FilesystemApi;
  share: ShareApi;
  /** Title of the share sheet, in the app's language. */
  dialogTitle: () => string;
}) {
  return async (fileName: string, _mime: string, data: string | Blob | Uint8Array): Promise<SaveFileResult> => {
    const name = safeFileName(fileName);
    // Only the latest file is kept: earlier ones (health data) are removed first. The cache folder is
    // private to the app and Android may also clear it when space runs low.
    await filesystem.rmdir({ path: SHARE_DIR, directory: Directory.Cache, recursive: true }).catch(() => undefined);
    const path = `${SHARE_DIR}/${name}`;
    const written =
      typeof data === 'string'
        ? await filesystem.writeFile({ path, data, directory: Directory.Cache, encoding: Encoding.UTF8, recursive: true })
        : await filesystem.writeFile({ path, data: toBase64(data instanceof Blob ? await blobBytes(data) : data), directory: Directory.Cache, recursive: true });
    try {
      await share.share({ title: name, files: [written.uri], dialogTitle: dialogTitle() });
      return 'shared';
    } catch (err) {
      if (isShareCancel(err)) return 'cancelled';
      throw err;
    }
  };
}
