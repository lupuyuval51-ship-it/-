"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { Alert, Arrow, Card, Spinner } from "@/components/ui";

interface View {
  plan: "FREE" | "PLUS" | "PRO";
  subscription: { status: string } | null;
}

/** Polls the server until the PROVIDER-confirmed subscription is reflected. The redirect itself grants nothing. */
export function CheckoutStatus({ sessionId }: { sessionId: string | null }) {
  const t = useT();
  const [view, setView] = useState<View | null>(null);
  const [tries, setTries] = useState(0);
  const active = view !== null && view.plan !== "FREE";

  useEffect(() => {
    if (active || tries > 30) return;
    const id = setTimeout(async () => {
      try {
        const qs = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
        const res = await fetch(`/api/billing/status${qs}`, { cache: "no-store" });
        if (res.ok) setView((await res.json()) as View);
      } catch {
        /* keep polling */
      }
      setTries((n) => n + 1);
    }, tries === 0 ? 300 : 2000);
    return () => clearTimeout(id);
  }, [active, tries, sessionId]);

  return (
    <Card className="mx-auto max-w-lg space-y-4 text-center" data-testid="checkout-status" data-active={active}>
      <h1 className="text-2xl font-bold">{t("billing.success.title")}</h1>
      {active ? (
        <>
          <Alert tone="success">{t("billing.success.done", { plan: t(`plan.${view.plan}`) })}</Alert>
          <Link href="/create" className="inline-flex min-h-12 items-center rounded-xl bg-neon px-6 font-semibold text-ink-950 hover:bg-white">{t("dash.create")}</Link>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">{t("billing.success.text")}</p>
          <div className="flex justify-center"><Spinner /></div>
          {tries > 8 && <p className="text-xs text-muted">{t("billing.success.pending")}</p>}
          <Link href="/account" className="text-sm text-neon hover:underline">{t("nav.account")} <Arrow /></Link>
        </>
      )}
    </Card>
  );
}
