"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale, useT } from "@/components/I18nProvider";
import { Alert, Button, Card, Field, Input, Select, cx } from "@/components/ui";
import { GRAPHICS_TIERS, type GraphicsTier } from "@/config/plans";
import { INPUT_LIMITS } from "@/config/limits";
import { OTHER_REGION, REGIONS } from "@/lib/regions";

export interface ProfileSettingsProps {
  displayName: string;
  country: string | null;
  /** null = automatic */
  graphicsPreference: GraphicsTier | null;
  allowedTiers: readonly GraphicsTier[];
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export function ProfileSettings(p: ProfileSettingsProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [name, setName] = useState(p.displayName);
  const [lang, setLang] = useState(locale);
  const [region, setRegion] = useState(p.country ?? OTHER_REGION);
  const [tier, setTier] = useState<GraphicsTier | null>(p.graphicsPreference);
  const [sound, setSound] = useState(p.soundEnabled);
  const [music, setMusic] = useState(p.musicEnabled);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName: name.trim(), country: region === OTHER_REGION ? null : region, graphicsPreference: tier, soundEnabled: sound, musicEnabled: music }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: { code?: string } };
        setMsg({ tone: "error", text: json.error?.code === "TIER_NOT_ALLOWED" ? t("acc.graphics.error") : res.status === 429 ? t("common.error.rateLimited") : t("common.error.generic") });
        return;
      }
      if (lang !== locale) await fetch("/api/locale", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ locale: lang }) });
      setMsg({ tone: "success", text: t("acc.saved") });
      router.refresh();
    } catch {
      setMsg({ tone: "error", text: t("common.error.network") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6" data-testid="profile-form">
      <Card className="space-y-4">
        <h2 className="text-lg font-semibold">{t("acc.profile")}</h2>
        <Field label={t("acc.name")} htmlFor="displayName">
          <Input id="displayName" value={name} maxLength={INPUT_LIMITS.nameMax} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("acc.language")} htmlFor="locale">
            <Select id="locale" value={lang} onChange={(e) => setLang(e.target.value as typeof lang)}>
              <option value="he">{t("lang.he")}</option>
              <option value="en">{t("lang.en")}</option>
            </Select>
          </Field>
          <Field label={t("acc.region")} htmlFor="country" hint={t("acc.region.hint")}>
            <Select id="country" value={region} onChange={(e) => setRegion(e.target.value)} data-testid="account-region">
              {REGIONS.map((r) => <option key={r.code} value={r.code}>{r[locale]}</option>)}
              <option value={OTHER_REGION}>{t("auth.region.other")}</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{t("acc.graphics.title")}</h2>
          <p className="text-sm text-muted">{t("acc.graphics.hint")}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="radiogroup" aria-label={t("acc.graphics.title")}>
          <label className={cx("flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm", tier === null ? "border-neon bg-neon/10" : "border-line")}>
            <span className="flex items-center gap-2 font-semibold">
              <input type="radio" name="tier" value="auto" checked={tier === null} onChange={() => setTier(null)} className="accent-[var(--color-neon)]" data-testid="tier-auto" />
              {t("acc.graphics.auto")}
            </span>
            <span className="text-xs text-muted">{t("acc.graphics.auto.hint")}</span>
          </label>
          {GRAPHICS_TIERS.map((x) => {
            const allowed = p.allowedTiers.includes(x);
            return (
              <label key={x} className={cx("flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm", tier === x ? "border-neon bg-neon/10" : "border-line", !allowed && "cursor-not-allowed opacity-50")}>
                <span className="flex items-center gap-2 font-semibold">
                  <input type="radio" name="tier" value={x} checked={tier === x} disabled={!allowed} onChange={() => setTier(x)} className="accent-[var(--color-neon)]" data-testid={`tier-${x}`} />
                  {t(`tier.short.${x}`)}
                </span>
                <span className="text-xs text-muted">{allowed ? t(`tier.${x}`) : t("acc.graphics.locked")}</span>
              </label>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">{t("acc.audio.title")}</h2>
        <label className="flex min-h-10 items-center gap-3 text-sm"><input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} className="size-4 accent-[var(--color-neon)]" />{t("acc.sound")}</label>
        <label className="flex min-h-10 items-center gap-3 text-sm"><input type="checkbox" checked={music} onChange={(e) => setMusic(e.target.checked)} className="size-4 accent-[var(--color-neon)]" />{t("acc.music")}</label>
      </Card>

      {msg && <Alert tone={msg.tone} data-testid="profile-message">{msg.text}</Alert>}
      <Button type="submit" disabled={busy} data-testid="profile-save">{t("acc.save")}</Button>
    </form>
  );
}
