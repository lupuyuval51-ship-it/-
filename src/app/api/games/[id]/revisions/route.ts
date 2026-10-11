import { apiRoute } from "@/server/http/route";
import { listRevisions } from "@/server/games/versions";

export const GET = apiRoute<undefined, { id: string }>({}, async ({ user, params }) => listRevisions(user.id, params.id));
