"use client";

import { useState } from "react";
import { useT } from "@/components/I18nProvider";
import { Alert, Button } from "@/components/ui";
import type { PaidPlanId } from "@/config/plans";

export function CheckoutButton({ plan, label, disabled }: { plan: PaidPlanId; label: string; disabled?: boolean }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan }) });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: { code?: string } };
      if (res.ok && json.url) {
        window.location.assign(json.url);
        return;
      }
      setError(json.error?.code === "ALREADY_SUBSCRIBED" ? t("pricing.error.already") : res.status === 429 ? t("common.error.rateLimited") : t("pricing.error.checkout"));
    } catch {
      setError(t("common.error.network"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={go} disabled={busy || disabled} size="lg" className="w-full" data-testid={`checkout-${plan}`}>
        {busy ? t("common.loading") : label}
      </Button>
      {error && <Alert tone="error">{error}</Alert>}
    </div>
  );
}
