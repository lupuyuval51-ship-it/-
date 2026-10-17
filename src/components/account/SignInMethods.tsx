"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/I18nProvider";
import { GoogleButton, GoogleLogo } from "@/components/forms/GoogleButton";
import { Alert, Button, Card } from "@/components/ui";

const MESSAGES = ["linked", "failed", "cancelled", "in_use", "other_google_linked", "wrong_account"] as const;
type MessageKey = (typeof MESSAGES)[number];

/** "Connected sign-in methods": the password and Google. The server refuses to disconnect the last way in; the button is only a courtesy. */
export function SignInMethods({ hasPassword, google, googleEnabled, notice }: { hasPassword: boolean; google: { email: string } | null; googleEnabled: boolean; notice: string | null }) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(
    notice && (MESSAGES as readonly string[]).includes(notice) ? { tone: notice === "linked" ? "success" : "error", text: t(`acc.methods.msg.${notice as MessageKey}`) } : null,
  );
  const canDisconnect = hasPassword;

  async function disconnect() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/account/identities/google", { method: "DELETE" });
      if (res.ok) {
        setMsg({ tone: "success", text: t("acc.methods.msg.disconnected") });
        router.refresh();
      } else {
        const json = (await res.json().catch(() => ({}))) as { error?: { code?: string } };
        setMsg({ tone: "error", text: json.error?.code === "LAST_SIGN_IN_METHOD" ? t("acc.methods.last") : t("common.error.generic") });
      }
    } catch {
      setMsg({ tone: "error", text: t("common.error.network") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-4" data-testid="signin-methods">
      <h2 className="text-lg font-semibold">{t("acc.methods.title")}</h2>
      <ul className="divide-y divide-line text-sm">
        <li className="flex flex-wrap items-center justify-between gap-2 py-2">
          <span className="font-medium">{t("acc.methods.password")}</span>
          <span className="text-muted">{hasPassword ? t("acc.methods.password.on") : t("acc.methods.password.off")}</span>
        </li>
        <li className="flex flex-wrap items-center justify-between gap-3 py-2">
          <span className="flex items-center gap-2 font-medium"><GoogleLogo className="size-4" />{t("acc.methods.google")}</span>
          <span className="flex flex-wrap items-center gap-3">
            <span className="text-muted" dir="auto">{google ? t("acc.methods.google.on", { email: google.email }) : t("acc.methods.google.off")}</span>
            {google && <Button type="button" variant="secondary" size="sm" onClick={disconnect} disabled={busy || !canDisconnect} data-testid="google-disconnect">{t("acc.methods.disconnect")}</Button>}
          </span>
        </li>
      </ul>
      {google && !canDisconnect && <p className="text-xs text-muted">{t("acc.methods.last")}</p>}
      {!google && googleEnabled && <GoogleButton href="/api/auth/google/start?intent=link" label={t("acc.methods.connect")} testId="google-connect" className="sm:w-auto" />}
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
    </Card>
  );
}
