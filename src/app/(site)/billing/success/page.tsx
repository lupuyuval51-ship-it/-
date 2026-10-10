import { CheckoutStatus } from "@/components/pricing/CheckoutStatus";
import { requireUser } from "@/server/auth/current";

export const metadata = { title: "Payment" };
export const dynamic = "force-dynamic";

export default async function BillingSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  await requireUser("/billing/success");
  const sp = await searchParams;
  return <CheckoutStatus sessionId={sp.session_id && sp.session_id.length < 220 ? sp.session_id : null} />;
}
