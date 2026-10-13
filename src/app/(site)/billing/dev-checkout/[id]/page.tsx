import { notFound } from "next/navigation";
import { DevCheckout } from "@/components/pricing/DevCheckout";
import { formatMoney, type CurrencyCode } from "@/config/plans";
import { requireUser } from "@/server/auth/current";
import { db } from "@/server/db";
import { getEnv } from "@/server/env";
import { getT } from "@/server/i18n";
import { titleFor } from "@/components/layout/pageTitle";

export const generateMetadata = titleFor("billing.dev.title");
export const dynamic = "force-dynamic";

export default async function DevCheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getEnv().PLANS_ENABLED) notFound();
  const user = await requireUser(`/billing/dev-checkout/${id}`);
  const env = getEnv();
  if (env.PAYMENTS_MODE !== "dev" || env.APP_ENV === "production") notFound();
  const row = await db.devCheckoutSession.findFirst({ where: { id, userId: user.id } });
  if (!row) notFound();
  const { t } = await getT();
  return <DevCheckout checkoutId={row.id} plan={t(`plan.${row.plan}`)} priceText={formatMoney(row.unitAmount, row.currency.toUpperCase() as CurrencyCode)} completed={Boolean(row.completedAt)} />;
}
