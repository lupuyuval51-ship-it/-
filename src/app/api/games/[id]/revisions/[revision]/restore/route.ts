import { RATE_LIMITS } from "@/config/limits";
import { Errors } from "@/server/http/errors";
import { apiRoute } from "@/server/http/route";
import { restoreRevision } from "@/server/games/versions";

export const POST = apiRoute<undefined, { id: string; revision: string }>(
  { rateLimit: [{ name: "account", rule: RATE_LIMITS.account, by: "user" }] },
  async ({ user, params }) => {
    const rev = Number(params.revision);
    if (!Number.isInteger(rev) || rev < 1) throw Errors.badRequest("Invalid version number.");
    return restoreRevision(user.id, params.id, rev);
  },
);
