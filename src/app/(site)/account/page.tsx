import { ProfileSettings } from "@/components/account/ProfileSettings";
import { SecurityPanel } from "@/components/account/SecurityPanel";
import { SubscriptionPanel } from "@/components/account/SubscriptionPanel";
import { Badge, Card } from "@/components/ui";
import { PLANS } from "@/config/plans";
import { formatDateTime } from "@/lib/format";
import { getAllowanceSummary } from "@/server/allowance/summary";
import { requireUser } from "@/server/auth/current";
import { getBillingView } from "@/server/billing/service";
import { db } from "@/server/db";
import { getT } from "@/server/i18n";

export const metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser("/account");
  const { t, locale } = await getT();
  const [billing, allowance, usage] = await Promise.all([
    getBillingView(user.id),
    getAllowanceSummary(user.id),
    db.usageRecord.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 15 }),
  ]);
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold">{t("acc.title")}</h1>
        <p className="text-sm text-muted" dir="ltr">{user.email}</p>
      </header>

      <SubscriptionPanel billing={billing} />

      <ProfileSettings
        displayName={user.displayName}
        country={user.country}
        graphicsPreference={user.graphicsPreference}
        allowedTiers={PLANS[allowance.plan].graphics.allowedTiers}
        soundEnabled={user.soundEnabled}
        musicEnabled={user.musicEnabled}
      />

      <Card className="space-y-3" data-testid="usage-ledger">
        <h2 className="text-lg font-semibold">{t("acc.usage.title")}</h2>
        {usage.length === 0 ? (
          <p className="text-sm text-muted">{t("acc.usage.empty")}</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {usage.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>{t(`acc.usage.${u.kind}`)}</span>
                <span className="flex items-center gap-2 text-xs text-muted">
                  <Badge tone={u.kind === "COMMIT" ? "lime" : u.kind === "RELEASE" ? "amber" : "neutral"}>{u.kind}</Badge>
                  {formatDateTime(u.createdAt, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <SecurityPanel />
    </div>
  );
}
