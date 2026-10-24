import { getAllowanceSummary } from "@/server/allowance/summary";
import { apiRoute } from "@/server/http/route";

export const GET = apiRoute({}, async ({ user }) => getAllowanceSummary(user.id));
