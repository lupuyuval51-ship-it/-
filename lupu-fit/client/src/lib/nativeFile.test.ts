import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  native: true,
  calls: [] as string[],
  writeFile: vi.fn(), readdir: vi.fn(), deleteFile: vi.fn(), checkPermissions: vi.fn(), share: vi.fn(),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => h.native } }));
vi.mock('@capacitor/filesystem', () => ({
  Directory: { Cache: 'CACHE', Documents: 'DOCUMENTS' }, Encoding: { UTF8: 'utf8' },
  Filesystem: { writeFile: h.writeFile, readdir: h.readdir, deleteFile: h.deleteFile, checkPermissions: h.checkPermissions },
}));
vi.mock('@capacitor/share', () => ({ Share: { share: h.share } }));

const { backupFilename, canSaveToDocuments, safeFilename, saveAndShareBackup, saveBackupToDocuments } = await import('./nativeFile.ts');

const JSON_TEXT = '{"backup":{"version":2}}';
const URI = 'file:///data/user/0/app.lupufit/cache/backups/lupu-fit-backup-2026-05-01.json';

beforeEach(() => {
  h.native = true; h.calls.length = 0;
  for (const f of [h.writeFile, h.readdir, h.deleteFile, h.checkPermissions, h.share]) f.mockReset();
  h.writeFile.mockImplementation(async () => { h.calls.push('write'); return { uri: URI }; });
  h.share.mockImplementation(async () => { h.calls.push('share'); return { activityType: 'com.google.android.apps.docs' }; });
  h.readdir.mockResolvedValue({ files: [] });
  h.deleteFile.mockResolvedValue(undefined);
});

describe('file names', () => {
  it('builds lupu-fit-backup-YYYY-MM-DD.json from the local date, with an optional time', () => {
    const d = new Date(2026, 4, 1, 9, 5);
    expect(backupFilename(d)).toBe('lupu-fit-backup-2026-05-01.json');
    expect(backupFilename(d, true)).toBe('lupu-fit-backup-2026-05-01-0905.json');
  });

  it('keeps only a plain file name: no directories, no traversal, no odd characters, always .json', () => {
    const cases: [string, string][] = [
      ['lupu-fit-backup-2026-05-01.json', 'lupu-fit-backup-2026-05-01.json'],
      ['../../etc/passwd', 'passwd.json'],
      ['..\\..\\Windows\\system.ini', 'system.ini.json'],
      ['/data/data/app.lupufit/databases/x.json', 'x.json'],
      ['a/b/../../c.json', 'c.json'],
      ['..', 'lupu-fit-backup.json'],
      ['', 'lupu-fit-backup.json'],
      ['...json', 'lupu-fit-backup.json'],
      ['my backup (1).JSON', 'my-backup-1.json'],
      ['גיבוי.json', 'lupu-fit-backup.json'],
      ['bad\u0000name\n.json', 'badname.json'],
      ['file:///x/y.json', 'y.json'],
    ];
    for (const [input, out] of cases) expect(safeFilename(input), input).toBe(out);
    for (const out of cases.map((c) => c[1])) expect(safeFilename(out)).toBe(out); // idempotent
    const long = safeFilename(`${'a'.repeat(300)}.json`);
    expect(long.length).toBeLessThanOrEqual(64); expect(long.endsWith('.json')).toBe(true);
    for (const x of ['a/../b', '..%2f..', 'x\\y']) { const s = safeFilename(x); expect(s).not.toMatch(/[\\/]|\.\./); }
  });
});

describe('Android app: write the file, then share its uri', () => {
  it('writes to cache/backups as utf8 text, then calls the share sheet with that uri (and only that file)', async () => {
    const r = await saveAndShareBackup('lupu-fit-backup-2026-05-01.json', JSON_TEXT, { title: 'LUPU-FIT backup' });
    expect(r).toEqual({ status: 'shared', filename: 'lupu-fit-backup-2026-05-01.json' });
    expect(h.calls).toEqual(['write', 'share']); // the file exists before the sheet opens
    expect(h.writeFile).toHaveBeenCalledWith({ path: 'backups/lupu-fit-backup-2026-05-01.json', data: JSON_TEXT, directory: 'CACHE', encoding: 'utf8', recursive: true });
    expect(h.share).toHaveBeenCalledTimes(1);
    const arg = h.share.mock.calls[0]?.[0] as { files?: string[]; url?: string; text?: string; title?: string };
    expect(arg.files).toEqual([URI]);
    expect(arg.url).toBeUndefined(); expect(arg.text).toBeUndefined(); // the file once, no duplicate url/text
    expect(arg.title).toBe('LUPU-FIT backup');
  });

  it('sanitises a hostile name before it reaches the file system', async () => {
    await saveAndShareBackup('../../shared_prefs/secrets.xml', JSON_TEXT);
    const arg = h.writeFile.mock.calls[0]?.[0] as { path: string };
    expect(arg.path).toBe('backups/secrets.xml.json');
    expect(arg.path).not.toContain('..');
  });

  it('closing the share sheet is silent (cancelled, not an error), also when the plugin words it differently', async () => {
    for (const e of [new Error('Share canceled'), new Error('User cancelled the share'), Object.assign(new Error('x'), { name: 'AbortError' })]) {
      h.share.mockRejectedValueOnce(e);
      expect(await saveAndShareBackup('b.json', JSON_TEXT)).toEqual({ status: 'cancelled' });
    }
  });

  it('a real share failure is reported with its stage and the plugin message', async () => {
    h.share.mockRejectedValueOnce(new Error('No Activity found to handle Intent'));
    expect(await saveAndShareBackup('b.json', JSON_TEXT)).toEqual({ status: 'error', stage: 'share', detail: 'No Activity found to handle Intent' });
  });

  it('a write failure never opens the share sheet and says the file could not be created', async () => {
    h.writeFile.mockRejectedValueOnce(new Error('ENOSPC: No space left on device'));
    const r = await saveAndShareBackup('b.json', JSON_TEXT);
    expect(r).toEqual({ status: 'error', stage: 'write', detail: 'ENOSPC: No space left on device' });
    expect(h.share).not.toHaveBeenCalled();
  });

  it('a plugin that answers without a uri is an error, not a share of nothing', async () => {
    h.writeFile.mockResolvedValueOnce({});
    const r = await saveAndShareBackup('b.json', JSON_TEXT);
    expect(r.status).toBe('error'); expect(h.share).not.toHaveBeenCalled();
  });

  it('cleans up older backup copies in the cache but never the new one or foreign files', async () => {
    h.readdir.mockResolvedValue({ files: [
      { name: 'lupu-fit-backup-2026-04-01.json', type: 'file' }, { name: 'lupu-fit-backup-2026-05-01.json', type: 'file' },
      { name: 'other.json', type: 'file' }, { name: 'lupu-fit-backup-dir.json', type: 'directory' },
    ] });
    await saveAndShareBackup('lupu-fit-backup-2026-05-01.json', JSON_TEXT);
    await vi.waitFor(() => expect(h.deleteFile).toHaveBeenCalledTimes(1));
    expect(h.readdir).toHaveBeenCalledWith({ path: 'backups', directory: 'CACHE' });
    expect(h.deleteFile).toHaveBeenCalledWith({ path: 'backups/lupu-fit-backup-2026-04-01.json', directory: 'CACHE' });
  });

  it('a failing clean-up never breaks the export', async () => {
    h.readdir.mockRejectedValue(new Error('no such dir'));
    expect((await saveAndShareBackup('b.json', JSON_TEXT)).status).toBe('shared');
  });
});

describe('Save to Documents', () => {
  it('is offered only when the plugin reports public storage as granted without a prompt', async () => {
    h.checkPermissions.mockResolvedValueOnce({ publicStorage: 'granted' });
    expect(await canSaveToDocuments()).toBe(true);
    h.checkPermissions.mockResolvedValueOnce({ publicStorage: 'prompt' });
    expect(await canSaveToDocuments()).toBe(false);
    h.checkPermissions.mockRejectedValueOnce(new Error('x'));
    expect(await canSaveToDocuments()).toBe(false);
    h.native = false;
    expect(await canSaveToDocuments()).toBe(false);
    expect(h.checkPermissions).toHaveBeenCalledTimes(3); // not asked outside the app
  });

  it('writes Documents/LUPU-FIT/<name> and never asks for a permission', async () => {
    const r = await saveBackupToDocuments('lupu-fit-backup-2026-05-01-0905.json', JSON_TEXT);
    expect(r).toEqual({ status: 'saved', filename: 'lupu-fit-backup-2026-05-01-0905.json', location: 'Documents/LUPU-FIT/lupu-fit-backup-2026-05-01-0905.json' });
    expect(h.writeFile).toHaveBeenCalledWith({ path: 'LUPU-FIT/lupu-fit-backup-2026-05-01-0905.json', data: JSON_TEXT, directory: 'DOCUMENTS', encoding: 'utf8', recursive: true });
    expect(h.share).not.toHaveBeenCalled();
  });

  it('reports a failure in its own stage', async () => {
    h.writeFile.mockRejectedValueOnce(new Error('Permission denied'));
    expect(await saveBackupToDocuments('b.json', JSON_TEXT)).toEqual({ status: 'error', stage: 'documents', detail: 'Permission denied' });
    h.native = false;
    expect((await saveBackupToDocuments('b.json', JSON_TEXT)).status).toBe('error');
  });
});

describe('browser: unchanged behaviour', () => {
  beforeEach(() => { h.native = false; });

  it('downloads through an <a download> link when the browser cannot share files', async () => {
    const create = vi.fn(() => 'blob:x'); Object.assign(URL, { createObjectURL: create, revokeObjectURL: vi.fn() });
    const names: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { names.push(this.download); });
    Object.assign(navigator, { share: undefined, canShare: undefined });
    expect(await saveAndShareBackup('lupu-fit-export.json', JSON_TEXT)).toEqual({ status: 'saved', filename: 'lupu-fit-export.json' });
    expect(names).toEqual(['lupu-fit-export.json']); expect(create).toHaveBeenCalledTimes(1);
    expect(h.writeFile).not.toHaveBeenCalled(); expect(h.share).not.toHaveBeenCalled();
  });

  it('uses Web Share with the file when the browser offers it; cancelling is silent', async () => {
    const share = vi.fn(async () => undefined);
    Object.assign(navigator, { share, canShare: () => true });
    expect(await saveAndShareBackup('lupu-fit-export.json', JSON_TEXT)).toEqual({ status: 'shared', filename: 'lupu-fit-export.json' });
    const arg = share.mock.calls[0] as unknown as [{ files: File[] }];
    expect(arg[0].files[0]?.name).toBe('lupu-fit-export.json');
    share.mockRejectedValueOnce(Object.assign(new Error('x'), { name: 'AbortError' }));
    expect(await saveAndShareBackup('lupu-fit-export.json', JSON_TEXT)).toEqual({ status: 'cancelled' });
    share.mockRejectedValueOnce(new Error('boom'));
    expect(await saveAndShareBackup('lupu-fit-export.json', JSON_TEXT)).toMatchObject({ status: 'error', stage: 'share' });
    expect(h.writeFile).not.toHaveBeenCalled();
  });
});
