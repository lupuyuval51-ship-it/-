import { RATE_LIMITS } from "@/config/limits";
import { unlinkGoogleIdentity } from "@/server/auth/google/identity";
import { apiRoute } from "@/server/http/route";

/** Disconnect Google from the signed-in account. Refused (409 LAST_SIGN_IN_METHOD) when it is the only way to sign in. */
export const DELETE = apiRoute({ rateLimit: [{ name: "account", rule: RATE_LIMITS.account, by: "user" }] }, async ({ user }) => {
  await unlinkGoogleIdentity(user.id);
  return { ok: true };
});
