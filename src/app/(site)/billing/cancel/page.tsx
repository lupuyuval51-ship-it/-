import Link from "next/link";
import { Card } from "@/components/ui";
import { getT } from "@/server/i18n";

export const metadata = { title: "Checkout cancelled" };

export default async function BillingCancelPage() {
  const { t } = await getT();
  return (
    <Card className="mx-auto max-w-lg space-y-3 text-center" data-testid="checkout-cancelled">
      <h1 className="text-2xl font-bold">{t("billing.cancel.title")}</h1>
      <p className="text-sm text-muted">{t("billing.cancel.text")}</p>
      <Link href="/pricing" className="inline-flex min-h-11 items-center rounded-xl border border-line px-5 text-sm font-semibold hover:bg-white/10">{t("nav.pricing")}</Link>
    </Card>
  );
}
