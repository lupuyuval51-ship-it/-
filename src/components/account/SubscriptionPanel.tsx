"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale, useT } from "@/components/I18nProvider";
import { Alert, Badge, Button, Card } from "@/components/ui";
import { formatMoney, type CurrencyCode } from "@/config/plans";
import { formatDate } from "@/lib/format";
import type { DictKey } from "@/lib/i18n";
import type { BillingView } from "@/server/billing/service";

type Action = "cancel" | "resume" | "portal" | "renew" | "payment_failed" | "refund";

export function SubscriptionPanel({ billing }: { billing: BillingView }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState(false);
  const sub = billing.subscription;
  const dev = billing.payments.mode === "dev";

  async function run(action: Action) {
    if (action === "cancel" && !window.confirm(t("acc.sub.cancel.confirm"))) return;
    setBusy(action);
    setError(false);
    try {
      const url = action === "cancel" ? "/api/billing/cancel" : action === "resume" ? "/api/billing/resume" : action === "portal" ? "/api/billing/portal" : "/api/billing/dev/simulate";
      const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: action === "renew" || action === "payment_failed" || action === "refund" ? JSON.stringify({ event: action }) : undefined });
      if (!res.ok) {
        setError(true);
        return;
      }
      if (action === "portal") {
        const { url: portal } = (await res.json()) as { url: string };
        window.location.assign(portal);
        return;
      }
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  }

  const price = sub?.unitAmount && sub.currency ? formatMoney(sub.unitAmount, sub.currency.toUpperCase() as CurrencyCode) : null;
  return (
    <Card className="space-y-4" data-testid="subscription-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t("acc.sub.title")}</h2>
        <Badge tone={billing.plan === "FREE" ? "neutral" : "violet"} data-testid="account-plan">{t(`plan.${billing.plan}`)}</Badge>
      </div>

      {!sub ? (
        <>
          <p className="text-sm text-muted">{t("acc.sub.free")}</p>
          <Link href="/pricing" className="inline-flex min-h-11 items-center rounded-xl bg-neon px-5 text-sm font-semibold text-ink-950 hover:brightness-110">{t("acc.sub.upgrade")}</Link>
        </>
      ) : (
        <>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-muted">{t("acc.sub.plan")}</dt><dd className="font-medium">{t(`plan.${sub.plan}`)}{price && <> · <span className="ltr-num">{price}</span></>}</dd></div>
            <div><dt className="text-muted">{t("acc.sub.status")}</dt><dd className="font-medium" data-testid="sub-status">{t(`acc.sub.status.${sub.status}` as DictKey)}</dd></div>
            <div className="sm:col-span-2"><dt className="text-muted">{t("acc.sub.period")}</dt><dd className="font-medium">{formatDate(sub.currentPeriodStart, locale)} – {formatDate(sub.currentPeriodEnd, locale)}</dd></div>
          </dl>
          {sub.cancelAtPeriodEnd ? (
            <Alert tone="warn" data-testid="sub-ends">{t("acc.sub.ends", { date: formatDate(sub.currentPeriodEnd, locale) })}</Alert>
          ) : (
            !sub.suspended && price && <p className="text-sm text-muted">{t("acc.sub.renews", { date: formatDate(sub.currentPeriodEnd, locale), price })}</p>
          )}
          {sub.suspended === "past_due" && <Alert tone="error" data-testid="sub-past-due">{t("acc.sub.pastDue")}</Alert>}
          {sub.suspended === "refunded" && <Alert tone="warn" data-testid="sub-refunded">{t("acc.sub.refunded")}</Alert>}
          {sub.simulated && <Alert tone="warn" data-testid="sub-simulated">{t("acc.sub.dev")}</Alert>}
          <div className="flex flex-wrap gap-2">
            {sub.status !== "CANCELED" && sub.status !== "INCOMPLETE_EXPIRED" && (sub.cancelAtPeriodEnd ? (
              <Button variant="secondary" disabled={busy !== null} onClick={() => run("resume")} data-testid="sub-resume">{t("acc.sub.resume")}</Button>
            ) : (
              <Button variant="secondary" disabled={busy !== null} onClick={() => run("cancel")} data-testid="sub-cancel">{t("acc.sub.cancel")}</Button>
            ))}
            {sub.canManage && <Button variant="ghost" disabled={busy !== null} onClick={() => run("portal")}>{t("acc.sub.manage")}</Button>}
            {(sub.status === "CANCELED" || sub.cancelAtPeriodEnd) && <Link href="/pricing" className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-text/10">{t("acc.sub.upgrade")}</Link>}
          </div>
          {dev && sub.simulated && (
            <div className="space-y-2 rounded-xl border border-amber/40 bg-amber/5 p-3" data-testid="dev-simulator">
              <p className="text-xs font-semibold text-amber">DEV · {t("billing.dev.title")}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => run("renew")} data-testid="dev-renew">Renew</Button>
                <Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => run("payment_failed")} data-testid="dev-fail">Payment failed</Button>
                <Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => run("refund")} data-testid="dev-refund">Full refund</Button>
              </div>
            </div>
          )}
        </>
      )}
      {error && <Alert tone="error">{t("acc.sub.error")}</Alert>}
    </Card>
  );
}
