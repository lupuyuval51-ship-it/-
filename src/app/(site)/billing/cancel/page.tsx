import Link from "next/link";
import { Card } from "@/components/ui";
import { getT } from "@/server/i18n";
import { titleFor } from "@/components/layout/pageTitle";

export const generateMetadata = titleFor("billing.cancel.title");

export default async function BillingCancelPage() {
  const { t } = await getT();
  return (
    <Card className="mx-auto max-w-lg space-y-3 text-center" data-testid="checkout-cancelled">
      <h1 className="text-2xl font-bold">{t("billing.cancel.title")}</h1>
      <p className="text-sm text-muted">{t("billing.cancel.text")}</p>
      <Link href="/pricing" className="inline-flex min-h-11 items-center rounded-xl border border-line px-5 text-sm font-semibold hover:bg-text/10">{t("nav.pricing")}</Link>
    </Card>
  );
}
