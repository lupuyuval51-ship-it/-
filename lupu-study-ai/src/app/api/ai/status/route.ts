import { NextResponse } from "next/server";
import { getProvider } from "@/services/ai";
import { supabaseServerConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** מדווח אם ה-AI מחובר, בלי לחשוף שום סוד. הדגל authRequired מציין שיש Supabase (אורחים מוגבלים). */
export function GET() {
  const p = getProvider();
  return NextResponse.json({ configured: !!p, model: p?.model, authRequired: !!supabaseServerConfig() }, { headers: { "cache-control": "no-store" } });
}
