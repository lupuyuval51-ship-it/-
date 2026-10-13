"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale, useT } from "@/components/I18nProvider";
import { Alert, Button, Card, Field, Input, Select } from "@/components/ui";
import { REGIONS, OTHER_REGION } from "@/lib/regions";
import { PasswordInput } from "./PasswordInput";

type Mode = "login" | "register";

export function AuthForm({ mode, next, defaultRegion }: { mode: Mode; next: string; defaultRegion: string | null }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const register = mode === "register";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const errs: Record<string, string> = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errs.email = t("auth.error.email");
    if (!register && !password) errs.password = t("auth.error.password");
    if (register && password.length < 10) errs.password = t("auth.error.weak");
    if (register && !String(form.get("displayName") ?? "").trim()) errs.displayName = t("auth.error.name");
    setFields(errs);
    if (Object.keys(errs).length) {
      // keyboard and screen-reader users land on the first field that needs fixing (its message is read with it)
      const first = (["displayName", "email", "password"] as const).find((k) => errs[k]);
      if (first) formEl.querySelector<HTMLElement>(`#${first}`)?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const region = String(form.get("country") ?? "");
      const body = register
        ? { email, password, displayName: String(form.get("displayName")).trim(), locale, country: region && region !== OTHER_REGION ? region : null }
        : { email, password };
      const res = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        router.push(next);
        router.refresh();
        return;
      }
      const json = (await res.json().catch(() => ({}))) as { error?: { code?: string } };
      const code = json.error?.code;
      setError(code === "INVALID_CREDENTIALS" ? t("auth.error.invalid") : code === "EMAIL_TAKEN" ? t("auth.error.taken") : code === "RATE_LIMITED" ? t("common.error.rateLimited") : code === "VALIDATION_ERROR" ? t("auth.error.weak") : t("common.error.generic"));
    } catch {
      setError(t("common.error.network"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md space-y-5 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{register ? t("auth.register.title") : t("auth.login.title")}</h1>
        <p className="text-sm text-muted">{register ? t("auth.register.subtitle") : t("auth.login.subtitle")}</p>
      </div>
      <form onSubmit={submit} className="space-y-4" noValidate data-testid={`${mode}-form`}>
        {register && (
          <Field label={t("auth.name")} htmlFor="displayName" error={fields.displayName} required>
            <Input id="displayName" name="displayName" autoComplete="nickname" maxLength={60} required />
          </Field>
        )}
        <Field label={t("auth.email")} htmlFor="email" error={fields.email} required>
          <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" dir="ltr" required />
        </Field>
        <Field label={t("auth.password")} htmlFor="password" hint={register ? t("auth.password.hint") : undefined} error={fields.password} required>
          <PasswordInput id="password" name="password" autoComplete={register ? "new-password" : "current-password"} required />
        </Field>
        {register && (
          <Field label={t("auth.region")} htmlFor="country" hint={t("auth.region.hint")}>
            <Select id="country" name="country" defaultValue={defaultRegion && REGIONS.some((r) => r.code === defaultRegion) ? defaultRegion : OTHER_REGION}>
              {REGIONS.map((r) => <option key={r.code} value={r.code}>{r[locale]}</option>)}
              <option value={OTHER_REGION}>{t("auth.region.other")}</option>
            </Select>
          </Field>
        )}
        {error && <Alert tone="error" data-testid="auth-error">{error}</Alert>}
        <Button type="submit" size="lg" className="w-full" disabled={busy} data-testid="auth-submit">
          {busy ? t("common.loading") : register ? t("auth.submit.register") : t("auth.submit.login")}
        </Button>
      </form>
      <p className="text-center text-sm">
        <Link href={register ? `/login?next=${encodeURIComponent(next)}` : "/register"} className="text-neon hover:underline">
          {register ? t("auth.switch.toLogin") : t("auth.switch.toRegister")}
        </Link>
      </p>
    </Card>
  );
}
