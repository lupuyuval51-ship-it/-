import { apiRoute } from "@/server/http/route";
import { listGames } from "@/server/games/library";

export const GET = apiRoute({}, async ({ user }) => ({ games: await listGames(user.id) }));
