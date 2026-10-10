"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/I18nProvider";
import { Alert, Button, Card, Field, Input } from "@/components/ui";
import { INPUT_LIMITS } from "@/config/limits";

export function SecurityPanel() {
  const t = useT();
  const router = useRouter();
  const [pw, setPw] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function change(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setPw(null);
    try {
      const res = await fetch("/api/account/password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ currentPassword: String(data.get("current")), newPassword: String(data.get("next")) }) });
      const json = (await res.json().catch(() => ({}))) as { error?: { code?: string } };
      if (res.ok) {
        form.reset();
        setPw({ tone: "success", text: t("acc.password.changed") });
      } else setPw({ tone: "error", text: json.error?.code === "WRONG_PASSWORD" ? t("acc.password.wrong") : json.error?.code === "VALIDATION_ERROR" ? t("auth.error.weak") : t("common.error.generic") });
    } catch {
      setPw({ tone: "error", text: t("common.error.network") });
    } finally {
      setBusy(false);
    }
  }

  async function remove(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    if (!window.confirm(t("acc.delete.text"))) return;
    setBusy(true);
    setDel(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
      const json = (await res.json().catch(() => ({}))) as { error?: { code?: string } };
      if (res.ok) {
        router.push("/");
        router.refresh();
        return;
      }
      setDel(json.error?.code === "SUBSCRIPTION_ACTIVE" ? t("acc.delete.active") : json.error?.code === "WRONG_PASSWORD" ? t("acc.delete.wrong") : t("common.error.generic"));
    } catch {
      setDel(t("common.error.network"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <h2 className="text-lg font-semibold">{t("acc.password.title")}</h2>
        <form onSubmit={change} className="space-y-4" data-testid="password-form">
          <Field label={t("acc.password.current")} htmlFor="current"><Input id="current" name="current" type="password" autoComplete="current-password" dir="ltr" required /></Field>
          <Field label={t("acc.password.new")} htmlFor="next" hint={t("auth.password.hint")}><Input id="next" name="next" type="password" autoComplete="new-password" minLength={INPUT_LIMITS.passwordMin} dir="ltr" required /></Field>
          {pw && <Alert tone={pw.tone}>{pw.text}</Alert>}
          <Button type="submit" variant="secondary" disabled={busy}>{t("acc.password.change")}</Button>
        </form>
      </Card>
      <Card className="space-y-4 border-rose/40">
        <div>
          <h2 className="text-lg font-semibold">{t("acc.delete.title")}</h2>
          <p className="text-sm text-muted">{t("acc.delete.text")}</p>
        </div>
        <form onSubmit={remove} className="space-y-4" data-testid="delete-form">
          <Field label={t("acc.delete.password")} htmlFor="del-password"><Input id="del-password" name="password" type="password" autoComplete="current-password" dir="ltr" required /></Field>
          {del && <Alert tone="error">{del}</Alert>}
          <Button type="submit" variant="danger" disabled={busy}>{t("acc.delete.button")}</Button>
        </form>
      </Card>
    </div>
  );
}
