"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/I18nProvider";
import { Alert, Button, Card, Field, Input, Select, cx } from "@/components/ui";
import type { DictKey } from "@/lib/i18n";

type Optional = "adaptive_difficulty" | "timed_bonus" | "hazards" | "checkpoints";
const OPTIONAL: Optional[] = ["adaptive_difficulty", "timed_bonus", "hazards", "checkpoints"];

export function GameActions({ gameId, title, timeOfDay, mechanics, hasProgress }: { gameId: string; title: string; timeOfDay: "day" | "dusk" | "night"; mechanics: string[]; hasProgress: boolean }) {
  const t = useT();
  const router = useRouter();
  const [name, setName] = useState(title);
  const [tod, setTod] = useState(timeOfDay);
  const [mech, setMech] = useState<Record<Optional, boolean>>(() => Object.fromEntries(OPTIONAL.map((m) => [m, mechanics.includes(m)])) as Record<Optional, boolean>);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function call(url: string, method: string, body?: unknown): Promise<boolean> {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(url, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
      if (!res.ok) {
        setMsg({ tone: "error", text: res.status === 429 ? t("common.error.rateLimited") : t("common.error.generic") });
        return false;
      }
      return true;
    } catch {
      setMsg({ tone: "error", text: t("common.error.network") });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const mechanicsChange: Partial<Record<Optional, boolean>> = {};
    for (const m of OPTIONAL) if (mech[m] !== mechanics.includes(m)) mechanicsChange[m] = mech[m];
    const ok = await call(`/api/games/${gameId}`, "PATCH", { title: name.trim() || title, timeOfDay: tod, mechanics: mechanicsChange });
    if (ok) {
      setMsg({ tone: "success", text: t("det.edit.saved") });
      router.refresh();
    }
  }

  async function reset() {
    if (!window.confirm(t("det.reset.confirm"))) return;
    if (await call(`/api/games/${gameId}/progress`, "DELETE")) router.refresh();
  }

  async function remove() {
    if (!window.confirm(t("det.delete.confirm"))) return;
    if (await call(`/api/games/${gameId}`, "DELETE")) {
      router.push("/games");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div>
          <h2 className="font-semibold">{t("det.edit.title")}</h2>
          <p className="text-sm text-muted">{t("det.edit.text")}</p>
        </div>
        <form onSubmit={save} className="space-y-4" data-testid="edit-form">
          <Field label={t("det.edit.rename")} htmlFor="title">
            <Input id="title" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} data-testid="edit-title" />
          </Field>
          <Field label={t("det.edit.timeOfDay")} htmlFor="timeOfDay">
            <Select id="timeOfDay" value={tod} onChange={(e) => setTod(e.target.value as typeof tod)}>
              {(["day", "dusk", "night"] as const).map((x) => <option key={x} value={x}>{t(`det.timeOfDay.${x}`)}</option>)}
            </Select>
          </Field>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t("det.edit.mechanics")}</legend>
            <div className="flex flex-wrap gap-2">
              {OPTIONAL.map((m) => (
                <label key={m} className={cx("flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm", mech[m] ? "border-neon bg-neon/10" : "border-line")}>
                  <input type="checkbox" checked={mech[m]} onChange={(e) => setMech((c) => ({ ...c, [m]: e.target.checked }))} className="accent-[var(--color-neon)]" />
                  {t(`mechanic.${m}` as DictKey)}
                </label>
              ))}
            </div>
          </fieldset>
          <Button type="submit" variant="secondary" disabled={busy} data-testid="edit-save">{t("det.edit.save")}</Button>
        </form>
      </Card>
      {msg && <Alert tone={msg.tone} data-testid="edit-message">{msg.text}</Alert>}
      <Card className="space-y-3">
        <h2 className="font-semibold">{t("det.danger")}</h2>
        <div className="flex flex-wrap gap-2">
          <Link href={`/create?mode=EXTEND&game=${gameId}`} className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-white/10" data-testid="extend-link">{t("det.extend")}</Link>
          {hasProgress && <Button variant="secondary" disabled={busy} onClick={reset} data-testid="reset-progress">{t("det.reset")}</Button>}
          <Button variant="danger" disabled={busy} onClick={remove} data-testid="delete-game">{t("det.delete")}</Button>
        </div>
      </Card>
    </div>
  );
}
