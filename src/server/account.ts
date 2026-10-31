import "server-only";
import type { GraphicsTier } from "@/config/plans";
import { GRAPHICS_TIERS, PLANS } from "@/config/plans";
import { db } from "./db";
import { resolveEntitlement } from "./allowance/entitlement";
import { Errors } from "./http/errors";
import { destroyOtherSessions } from "./auth/session";
import { hashPassword, hasUsablePassword, verifyPassword } from "./security/password";
import { sha256Hex } from "./security/tokens";
import { isSessionReauthed } from "./auth/google/identity";

export interface AccountUpdate {
  displayName?: string;
  locale?: "he" | "en";
  country?: string | null;
  /** `null` selects automatic (the plan's default tier). */
  graphicsPreference?: GraphicsTier | null;
  soundEnabled?: boolean;
  musicEnabled?: boolean;
}

/**
 * Update profile preferences. The graphics preference is validated against the user's CURRENT entitlement on the
 * server: asking for Tier A without a Plus/Pro plan is refused, whatever the browser sends.
 */
export async function updateAccount(userId: string, update: AccountUpdate) {
  if (update.graphicsPreference) {  // null (automatic) is always allowed
    const ent = await resolveEntitlement(userId);
    if (!PLANS[ent.plan].graphics.allowedTiers.includes(update.graphicsPreference)) {
      throw Errors.forbidden(`Graphics Tier ${update.graphicsPreference} is not included in your plan.`, "TIER_NOT_ALLOWED");
    }
  }
  const data = {
    ...(update.displayName !== undefined ? { displayName: update.displayName } : {}),
    ...(update.locale ? { locale: update.locale } : {}),
    ...(update.country !== undefined ? { country: update.country } : {}),
    ...(update.graphicsPreference !== undefined ? { graphicsPreference: update.graphicsPreference } : {}),
    ...(update.soundEnabled !== undefined ? { soundEnabled: update.soundEnabled } : {}),
    ...(update.musicEnabled !== undefined ? { musicEnabled: update.musicEnabled } : {}),
  };
  return db.userProfile.update({ where: { userId }, data });
}

export async function changePassword(userId: string, current: string, next: string, keepToken: string | undefined): Promise<void> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true } });
  if (!(await verifyPassword(current, user.passwordHash))) throw Errors.forbidden("The current password is incorrect.", "WRONG_PASSWORD");
  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(next) } });
  await destroyOtherSessions(userId, keepToken); // a password change signs out every other device
}

export type DeleteConfirmation = { password: string } | { googleReauth: true; sessionToken: string | undefined };

/**
 * Accounts with a live paid subscription must cancel it first, so nobody keeps being billed after deleting.
 * Confirmation: the password; or, for accounts that HAVE no password (Google-only), a fresh Google re-authentication
 * of THIS session (see `reauthAt`, 5 minutes, same Google account as the linked identity). An account that has a password
 * always needs it: a stolen session cookie plus a Google re-auth is not enough to delete a password account.
 */
export async function deleteAccount(userId: string, confirmation: DeleteConfirmation): Promise<void> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, include: { subscription: true } });
  if ("password" in confirmation) {
    if (!(await verifyPassword(confirmation.password, user.passwordHash))) throw Errors.forbidden("The password is incorrect.", "WRONG_PASSWORD");
  } else {
    const fresh = !hasUsablePassword(user.passwordHash) && !!confirmation.sessionToken && (await isSessionReauthed(sha256Hex(confirmation.sessionToken)));
    if (!fresh) throw Errors.forbidden("Please confirm with Google first.", "REAUTH_REQUIRED");
  }
  const sub = user.subscription;
  if (sub && ["ACTIVE", "TRIALING", "PAST_DUE"].includes(sub.status) && !(sub.cancelAtPeriodEnd && sub.currentPeriodEnd < new Date())) {
    throw Errors.conflict("SUBSCRIPTION_ACTIVE", "Cancel your subscription before deleting your account.");
  }
  await db.user.delete({ where: { id: userId } }); // cascades to every owned record
}

export const isTier = (v: string): v is GraphicsTier => (GRAPHICS_TIERS as readonly string[]).includes(v);
