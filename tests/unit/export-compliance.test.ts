import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * US export-law declaration (docs/play-release.md → "US export laws"): the app may only use the platform's own standard encryption (HTTPS,
 * Android backup). This guard fails when the app's own code or its mobile dependencies start doing cryptography themselves, so the
 * declaration the owner made in the Play Console stays true. Hashing and random ids are not encryption and are allowed.
 */
const APP_DIRS = ["mobile/src", "src/lib/offline", "src/lib/game", "src/components", "src/lib/i18n", "src/config"];
const SKIP = (p: string) => p.includes(`${path.sep}topics${path.sep}content${path.sep}`) || p.endsWith("catalog.ts") || p.endsWith("catalog-plus-pro.ts"); // learning content may talk about AES
const files: string[] = [];
const walk = (dir: string) => {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|mjs)$/.test(e) && !SKIP(p)) files.push(p);
  }
};
APP_DIRS.forEach(walk);

describe("export compliance: no encryption of our own in the app", () => {
  it("uses no cipher, key or crypto-library API in the app's source", () => {
    const banned = /crypto\.subtle\.(encrypt|decrypt|generateKey|importKey|deriveKey|deriveBits|wrapKey|unwrapKey|sign|verify)|createCipher(iv)?\b|createDecipher(iv)?\b|from ["'](crypto-js|node-forge|tweetnacl|libsodium[\w-]*|@noble\/[\w-]+|sjcl|jose|jsonwebtoken|bcrypt\w*|argon2\w*|openpgp|aes-js|crypto)["']|require\(["'](crypto-js|node-forge|crypto)["']\)/;
    const hits = files.filter((f) => banned.test(readFileSync(f, "utf8")));
    expect(hits).toEqual([]);
  });

  it("the mobile app depends on no cryptography package", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { dependencies?: Record<string, string> };
    const crypto = /crypt|sodium|forge|noble|tweetnacl|sjcl|jose|jwt|openpgp|aes-js|elliptic|node-rsa/i;
    // the website's server-only password hashing is not part of the app: it is listed here so adding more is a conscious decision
    const serverOnly = new Set(["bcryptjs", "argon2", "@node-rs/argon2", "jose", "stripe"]);
    const offenders = Object.keys(pkg.dependencies ?? {}).filter((d) => crypto.test(d) && !serverOnly.has(d));
    expect(offenders).toEqual([]);
  });

  it("the Android app sends no cleartext traffic", () => {
    expect(readFileSync("android/app/src/main/AndroidManifest.xml", "utf8")).toContain('android:usesCleartextTraffic="false"');
  });
});
