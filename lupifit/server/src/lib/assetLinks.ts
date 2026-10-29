/**
 * Digital Asset Links for the Android app (a Trusted Web Activity). Chrome opens the app full screen only
 * when https://<host>/.well-known/assetlinks.json lists the app's package and signing certificate(s).
 */
const FINGERPRINT = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;

export interface AssetLinkStatement {
  relation: string[];
  target: { namespace: 'android_app'; package_name: string; sha256_cert_fingerprints: string[] };
}

/** Parses a comma/space separated list of SHA-256 fingerprints; invalid entries are dropped. */
export function parseFingerprints(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\s,]+/)
        .map((f) => f.trim().toUpperCase())
        .filter((f) => FINGERPRINT.test(f)),
    ),
  );
}

/** The assetlinks.json body, or null when the app is not configured (the route then answers 404). */
export function assetLinks(packageName: string, fingerprints: string[]): AssetLinkStatement[] | null {
  if (!/^[a-zA-Z][\w]*(\.[a-zA-Z][\w]*)+$/.test(packageName) || fingerprints.length === 0) return null;
  return [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: { namespace: 'android_app', package_name: packageName, sha256_cert_fingerprints: fingerprints },
    },
  ];
}
