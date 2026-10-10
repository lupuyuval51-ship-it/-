import { NextResponse } from "next/server";
import { handleStripeWebhook } from "@/server/billing/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 1_000_000;

/**
 * Stripe → us. Not subject to the browser Origin/CSRF check (it authenticates by signature instead), so the
 * signature is verified over the exact RAW body before anything is parsed or stored.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > MAX_BYTES) return NextResponse.json({ error: "payload too large" }, { status: 413 });
  const raw = await req.text();
  if (raw.length > MAX_BYTES) return NextResponse.json({ error: "payload too large" }, { status: 413 });
  const res = await handleStripeWebhook(raw, req.headers.get("stripe-signature"));
  return NextResponse.json(res.body, { status: res.status, headers: { "Cache-Control": "no-store" } });
}
