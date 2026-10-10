"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/I18nProvider";
import { Alert, Badge, Button, Card } from "@/components/ui";

export function DevCheckout({ checkoutId, plan, priceText, completed }: { checkoutId: string; plan: string; priceText: string; completed: boolean }) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/dev/complete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ checkoutId }) });
      if (res.ok) {
        router.push("/billing/success");
        return;
      }
      setError(t("pricing.error.checkout"));
    } catch {
      setError(t("common.error.network"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mx-auto max-w-lg space-y-4 border-amber/60" data-testid="dev-checkout">
      <Badge tone="amber">DEV</Badge>
      <h1 className="text-2xl font-bold">{t("billing.dev.title")}</h1>
      <Alert tone="warn">{t("billing.dev.warning")}</Alert>
      <p className="text-lg font-semibold">{t("billing.dev.plan", { plan, price: priceText })}</p>
      {completed ? (
        <Alert tone="success">{t("billing.dev.done")}</Alert>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button onClick={pay} disabled={busy} size="lg" data-testid="dev-pay">{busy ? t("common.loading") : t("billing.dev.pay")}</Button>
          <Link href="/billing/cancel" className="inline-flex min-h-12 items-center rounded-xl border border-line px-6 font-semibold hover:bg-white/10">{t("billing.dev.cancel")}</Link>
        </div>
      )}
      {error && <Alert tone="error">{error}</Alert>}
    </Card>
  );
}
