import { describeBackend } from "@/server/ai/registry";
import { apiRoute } from "@/server/http/route";

/** What generation will use right now. Never includes keys; lets the UI tell real AI from no AI honestly. */
export const GET = apiRoute({ auth: "optional" }, async () => describeBackend());
