import { notFound } from "next/navigation";
import { plansEnabled } from "@/server/env";
import { CheckoutStatus } from "@/components/pricing/CheckoutStatus";
import { requireUser } from "@/server/auth/current";
import { titleFor } from "@/components/layout/pageTitle";

export const generateMetadata = titleFor("billing.success.title");
export const dynamic = "force-dynamic";

export default async function BillingSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  if (!plansEnabled()) notFound();
  await requireUser("/billing/success");
  const sp = await searchParams;
  return <CheckoutStatus sessionId={sp.session_id && sp.session_id.length < 220 ? sp.session_id : null} />;
}
