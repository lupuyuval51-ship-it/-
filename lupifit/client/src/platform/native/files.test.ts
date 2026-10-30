import { describe, expect, it, vi } from 'vitest';
import { createNativeSaveFile, isShareCancel, safeFileName, SHARE_DIR, toBase64, type FilesystemApi, type ShareApi } from './files';

function fakes(shareImpl?: ShareApi['share']) {
  const written: { path: string; data: string | Blob; directory?: string; encoding?: string; recursive?: boolean }[] = [];
  const removed: string[] = [];
  const filesystem: FilesystemApi = {
    rmdir: vi.fn(async ({ path }) => {
      removed.push(path);
    }),
    writeFile: vi.fn(async (o) => {
      written.push(o);
      return { uri: `file:///data/user/0/com.lupufit.app/cache/${o.path}` };
    }),
  };
  const share: ShareApi = { share: vi.fn(shareImpl ?? (async () => ({ activityType: 'com.google.android.apps.docs' }))) };
  return { filesystem, share, written, removed };
}

describe('native saveFile', () => {
  it('writes text to the app cache and opens the share sheet with it', async () => {
    const f = fakes();
    const save = createNativeSaveFile({ filesystem: f.filesystem, share: f.share, dialogTitle: () => 'Save or send the file' });
    await expect(save('lupu-fit-backup-2026-10-30.json', 'application/json', '{"a":"שלום"}')).resolves.toBe('shared');
    expect(f.removed).toEqual([SHARE_DIR]); // the previous file goes first
    expect(f.written).toEqual([
      { path: 'share/lupu-fit-backup-2026-10-30.json', data: '{"a":"שלום"}', directory: 'CACHE', encoding: 'utf8', recursive: true },
    ]);
    expect(f.share.share).toHaveBeenCalledWith({
      title: 'lupu-fit-backup-2026-10-30.json',
      files: ['file:///data/user/0/com.lupufit.app/cache/share/lupu-fit-backup-2026-10-30.json'],
      dialogTitle: 'Save or send the file',
    });
    // Removing the old folder runs before the write.
    expect((f.filesystem.rmdir as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0]).toBeLessThan(
      (f.filesystem.writeFile as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0]!,
    );
  });

  it('writes bytes and blobs as base64 (binary)', async () => {
    const f = fakes();
    const save = createNativeSaveFile({ filesystem: f.filesystem, share: f.share, dialogTitle: () => 't' });
    await save('a.bin', 'application/octet-stream', new Uint8Array([0, 1, 254, 255]));
    expect(f.written[0]).toEqual({ path: 'share/a.bin', data: 'AAH+/w==', directory: 'CACHE', recursive: true });
    const blob = new Blob([new Uint8Array([104, 105])], { type: 'text/plain' });
    await save('b.txt', 'text/plain', blob);
    expect(f.written[1]!.data).toBe('aGk=');
  });

  it('reports a closed share sheet as cancelled and passes other errors on', async () => {
    const cancelled = fakes(async () => {
      throw new Error('Share canceled');
    });
    await expect(createNativeSaveFile({ filesystem: cancelled.filesystem, share: cancelled.share, dialogTitle: () => 't' })('x.json', 'application/json', '{}')).resolves.toBe('cancelled');
    const broken = fakes(async () => {
      throw new Error('only file urls are supported');
    });
    await expect(createNativeSaveFile({ filesystem: broken.filesystem, share: broken.share, dialogTitle: () => 't' })('x.json', 'application/json', '{}')).rejects.toThrow('only file urls');
  });

  it('still saves when there was no earlier file to remove', async () => {
    const f = fakes();
    (f.filesystem.rmdir as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Folder does not exist.'));
    await expect(createNativeSaveFile({ filesystem: f.filesystem, share: f.share, dialogTitle: () => 't' })('x.json', 'application/json', '{}')).resolves.toBe('shared');
  });
});

describe('helpers', () => {
  it('keeps file names plain: no folders, no odd characters, never empty', () => {
    expect(safeFileName('lupu-fit-backup-2026-10-30.json')).toBe('lupu-fit-backup-2026-10-30.json');
    expect(safeFileName('../../shared_prefs/x.xml')).toBe('x.xml');
    expect(safeFileName('C:\\temp\\a b?.json')).toBe('a-b-.json');
    expect(safeFileName('גיבוי 1.json')).toBe('גיבוי-1.json');
    expect(safeFileName('...')).toBe('lupu-fit-file');
    expect(safeFileName('x'.repeat(300))).toHaveLength(120);
  });

  it('encodes base64 exactly like Node, also for large files', () => {
    const bytes = new Uint8Array(100_003);
    for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 7919) % 256;
    expect(toBase64(bytes)).toBe(Buffer.from(bytes).toString('base64'));
    expect(toBase64(new Uint8Array())).toBe('');
  });

  it('recognises the share sheet’s cancel', () => {
    expect(isShareCancel(new Error('Share canceled'))).toBe(true);
    expect(isShareCancel('Share cancelled')).toBe(true);
    expect(isShareCancel(new Error('boom'))).toBe(false);
    expect(isShareCancel(undefined)).toBe(false);
  });
});
