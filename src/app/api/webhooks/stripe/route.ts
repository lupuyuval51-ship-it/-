import { NextResponse } from "next/server";
import { handleStripeWebhook } from "@/server/billing/service";
import { readBodyText } from "@/server/http/body";
import { ApiError } from "@/server/http/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 1_000_000;

/**
 * Stripe → us. Not subject to the browser Origin/CSRF check (it authenticates by signature instead), so the
 * signature is verified over the exact RAW body before anything is parsed or stored. The body is read with a hard
 * byte cap while streaming: this endpoint is public, so nothing unsigned may make the server buffer an unbounded upload.
 */
export async function POST(req: Request): Promise<NextResponse> {
  let raw: string;
  try {
    raw = await readBodyText(req, MAX_BYTES);
  } catch (err) {
    if (err instanceof ApiError && err.status === 413) return NextResponse.json({ error: "payload too large" }, { status: 413 });
    return NextResponse.json({ error: "could not read the request body" }, { status: 400 });
  }
  const res = await handleStripeWebhook(raw, req.headers.get("stripe-signature"));
  return NextResponse.json(res.body, { status: res.status, headers: { "Cache-Control": "no-store" } });
}
