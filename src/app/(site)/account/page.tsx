import { plansEnabled } from "@/server/env";
import { SignInMethods } from "@/components/account/SignInMethods";
import { ProfileSettings } from "@/components/account/ProfileSettings";
import { SecurityPanel } from "@/components/account/SecurityPanel";
import { SubscriptionPanel } from "@/components/account/SubscriptionPanel";
import { Card } from "@/components/ui";
import { PLANS } from "@/config/plans";
import { formatDateTime } from "@/lib/format";
import { getAllowanceSummary } from "@/server/allowance/summary";
import { requireUser } from "@/server/auth/current";
import { getSignInMethods, isSessionReauthed } from "@/server/auth/google/identity";
import { isGoogleEnabled } from "@/server/auth/google/protocol";
import { SESSION_COOKIE } from "@/config/limits";
import { sha256Hex } from "@/server/security/tokens";
import { cookies } from "next/headers";
import { getBillingView } from "@/server/billing/service";
import { db } from "@/server/db";
import { getT } from "@/server/i18n";
import { titleFor } from "@/components/layout/pageTitle";

export const generateMetadata = titleFor("acc.title");
export const dynamic = "force-dynamic";

const USAGE_LIMIT = 15;

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  const { google: notice } = await searchParams;
  const user = await requireUser("/account");
  const { t, locale } = await getT();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const googleEnabled = isGoogleEnabled();
  const [methods, reauthFresh] = await Promise.all([getSignInMethods(user.id), token ? isSessionReauthed(sha256Hex(token)) : false]);
  const [billing, allowance, usage] = await Promise.all([
    getBillingView(user.id),
    getAllowanceSummary(user.id),
    db.usageRecord.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: USAGE_LIMIT }),
  ]);
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold">{t("acc.title")}</h1>
        <p className="text-sm text-muted" dir="ltr">{user.email}</p>
        <p className="text-sm text-muted">{t("acc.intro")}</p>
      </header>

      {plansEnabled() && <SubscriptionPanel billing={billing} />}

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
                <span className="flex items-center gap-2">
                  <span aria-hidden className={`size-2 shrink-0 rounded-full ${u.kind === "COMMIT" ? "bg-lime" : u.kind === "RELEASE" ? "bg-amber" : "bg-muted"}`} />
                  {t(`acc.usage.${u.kind}`)}
                </span>
                <span className="text-xs text-muted">{formatDateTime(u.createdAt, locale)}</span>
              </li>
            ))}
          </ul>
        )}
        {usage.length === USAGE_LIMIT && <p className="text-xs text-muted">{t("acc.usage.more", { n: USAGE_LIMIT })}</p>}
      </Card>

      {(googleEnabled || methods.google) && <SignInMethods hasPassword={methods.password} google={methods.google} googleEnabled={googleEnabled} notice={notice ?? null} />}

      <SecurityPanel hasPassword={methods.password} googleEnabled={googleEnabled} reauthFresh={reauthFresh} />
    </div>
  );
}
