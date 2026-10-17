import { apiRoute } from "@/server/http/route";
import { resetProgress } from "@/server/games/library";

export const DELETE = apiRoute<undefined, { id: string }>({}, async ({ user, params }) => {
  await resetProgress(user.id, params.id);
  return { ok: true };
});
