/** Digital Asset Links for the Android app (Trusted Web Activity). */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assetLinks, parseFingerprints } from '../src/lib/assetLinks';
import { startTestServer, type TestServer } from './helpers/server';

const FP = '14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5';

describe('assetlinks helpers', () => {
  it('parses, normalises and de-duplicates fingerprints and drops invalid ones', () => {
    expect(parseFingerprints(`${FP.toLowerCase()}, ${FP} nonsense AB:CD`)).toEqual([FP]);
    expect(parseFingerprints('')).toEqual([]);
  });

  it('builds the statement only for a valid package with at least one fingerprint', () => {
    expect(assetLinks('com.lupufit.app', [FP])).toEqual([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: { namespace: 'android_app', package_name: 'com.lupufit.app', sha256_cert_fingerprints: [FP] },
      },
    ]);
    expect(assetLinks('', [FP])).toBeNull();
    expect(assetLinks('not a package', [FP])).toBeNull();
    expect(assetLinks('com.lupufit.app', [])).toBeNull();
  });
});

describe('GET /.well-known/assetlinks.json', () => {
  let server: TestServer;
  beforeAll(async () => {
    server = await startTestServer();
  });
  afterAll(async () => {
    await server.close();
  });

  it('answers 404 (JSON) when the Android app is not configured, without needing a session', async () => {
    const res = await fetch(`${server.baseUrl}/.well-known/assetlinks.json`);
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('application/json');
  });
});
