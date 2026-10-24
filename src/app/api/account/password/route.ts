import { z } from "zod";
import { RATE_LIMITS, INPUT_LIMITS } from "@/config/limits";
import { passwordSchema } from "@/lib/schemas/auth";
import { changePassword } from "@/server/account";
import { apiRoute } from "@/server/http/route";

const schema = z.object({ currentPassword: z.string().min(1).max(INPUT_LIMITS.passwordMax), newPassword: passwordSchema });

export const POST = apiRoute({ body: schema, rateLimit: [{ name: "password", rule: { max: 8, windowSec: 600 }, by: "user" }, { name: "account", rule: RATE_LIMITS.account, by: "user" }] }, async ({ user, body, sessionToken }) => {
  await changePassword(user.id, body.currentPassword, body.newPassword, sessionToken);
  return { ok: true };
});
