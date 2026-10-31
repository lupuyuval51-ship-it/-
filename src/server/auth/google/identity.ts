import "server-only";
import { INPUT_LIMITS } from "@/config/limits";
import { db, isUniqueViolation } from "../../db";
import { Errors } from "../../http/errors";
import { NO_PASSWORD_HASH, hasUsablePassword } from "../../security/password";
import type { GoogleProfile } from "./protocol";

export const GOOGLE = "google";

export type Resolution =
  | { kind: "existing"; userId: string }
  | { kind: "created"; userId: string }
  /** An account with this email exists but Google was never linked to it: never auto-link (account takeover defence). */
  | { kind: "email_exists" };

/**
 * The account-resolution rules for "Continue with Google" (intent = login). Identities are keyed by Google's stable `sub`:
 *  1. known `sub`                  → that user (even if the email changed on either side)
 *  2. unknown `sub`, email in use  → refuse; the owner signs in with their password and links Google from the account page
 *  3. unknown `sub`, email free    → create the account: no usable password, Free plan, private profile, region left empty
 * `email_verified === true` is enforced earlier (validateClaims).
 */
export async function resolveGoogleLogin(profile: GoogleProfile, locale: "he" | "en"): Promise<Resolution> {
  const known = await db.authIdentity.findUnique({ where: { provider_subject: { provider: GOOGLE, subject: profile.sub } }, select: { userId: true } });
  if (known) return { kind: "existing", userId: known.userId };
  if (await db.user.findUnique({ where: { email: profile.email }, select: { id: true } })) return { kind: "email_exists" };
  const displayName = (profile.name ?? profile.email.split("@")[0] ?? "Player").slice(0, INPUT_LIMITS.nameMax) || "Player";
  try {
    const user = await db.user.create({
      data: {
        email: profile.email,
        passwordHash: NO_PASSWORD_HASH,
        profile: { create: { displayName, locale, country: null } }, // minors: private by default (the only visibility); no region guessed
        identities: { create: { provider: GOOGLE, subject: profile.sub, email: profile.email } },
      },
      select: { id: true },
    });
    return { kind: "created", userId: user.id };
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    // Lost a race (double click / two tabs): whoever won created the identity or the email; decide again from the stored truth.
    const again = await db.authIdentity.findUnique({ where: { provider_subject: { provider: GOOGLE, subject: profile.sub } }, select: { userId: true } });
    return again ? { kind: "existing", userId: again.userId } : { kind: "email_exists" };
  }
}

export type LinkResult = "linked" | "already_linked" | "in_use" | "other_google_linked";

/** Attach a Google account to the signed-in user. A Google account already belonging to someone else is never moved. */
export async function linkGoogleIdentity(userId: string, profile: GoogleProfile): Promise<LinkResult> {
  const bySub = await db.authIdentity.findUnique({ where: { provider_subject: { provider: GOOGLE, subject: profile.sub } }, select: { userId: true } });
  if (bySub) return bySub.userId === userId ? "already_linked" : "in_use";
  if (await db.authIdentity.findUnique({ where: { userId_provider: { userId, provider: GOOGLE } }, select: { id: true } })) return "other_google_linked";
  try {
    await db.authIdentity.create({ data: { userId, provider: GOOGLE, subject: profile.sub, email: profile.email } });
    return "linked";
  } catch (err) {
    if (isUniqueViolation(err)) return "in_use";
    throw err;
  }
}

/** Remove Google from an account, but never the last way to sign in. */
export async function unlinkGoogleIdentity(userId: string): Promise<void> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true, identities: { select: { provider: true } } } });
  const others = user.identities.filter((i) => i.provider !== GOOGLE).length;
  if (!hasUsablePassword(user.passwordHash) && others === 0) {
    throw Errors.conflict("LAST_SIGN_IN_METHOD", "This is your only way to sign in, so it cannot be disconnected.");
  }
  await db.authIdentity.deleteMany({ where: { userId, provider: GOOGLE } });
}

export interface SignInMethods {
  password: boolean;
  google: { email: string } | null;
}

export async function getSignInMethods(userId: string): Promise<SignInMethods> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true, identities: { where: { provider: GOOGLE }, select: { email: true } } } });
  return { password: hasUsablePassword(user.passwordHash), google: user.identities[0] ? { email: user.identities[0].email } : null };
}

/** The signed-in user's Google `sub`, for re-authentication ("is this the same Google account?"). */
export async function linkedGoogleSubject(userId: string): Promise<string | null> {
  const row = await db.authIdentity.findUnique({ where: { userId_provider: { userId, provider: GOOGLE } }, select: { subject: true } });
  return row?.subject ?? null;
}

export const REAUTH_WINDOW_MS = 5 * 60_000;

/** Mark this session as freshly re-authenticated with Google. */
export async function markSessionReauthed(tokenHash: string, now = new Date()): Promise<boolean> {
  const { count } = await db.session.updateMany({ where: { tokenHash, expiresAt: { gt: now } }, data: { reauthAt: now } });
  return count === 1;
}

export async function isSessionReauthed(tokenHash: string, now = new Date()): Promise<boolean> {
  const s = await db.session.findUnique({ where: { tokenHash }, select: { reauthAt: true } });
  return !!s?.reauthAt && now.getTime() - s.reauthAt.getTime() <= REAUTH_WINDOW_MS && s.reauthAt.getTime() <= now.getTime() + 60_000;
}
