/** GET /api/catalog/overrides → enabled admin drills + disabled builtin ids (server-cached 5 min, public). */
import { getCatalogOverrides } from "@/server/catalog";
import { jsonOk, withRoute } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withRoute(async () => {
  const body = await getCatalogOverrides();
  return jsonOk(body, { headers: { "cache-control": "public, max-age=300, stale-while-revalidate=60" } });
});
