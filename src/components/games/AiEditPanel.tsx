"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useLocale, useT } from "@/components/I18nProvider";
import { Alert, Badge, Button, Card, Field, Spinner, Textarea } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { DictKey } from "@/lib/i18n";

export interface EditCapabilities {
  plan: "FREE" | "PLUS" | "PRO";
  robot: "none" | "B" | "A";
  versionHistory: boolean;
  aiEdits: { limit: number; used: number; remaining: number; periodEnd: string };
}

type Outcome = { id: number; instruction: string; ok: boolean; text: string };

const ERROR_KEY: Record<string, DictKey> = {
  EDIT_QUOTA_EXHAUSTED: "det.ai.err.quota",
  EDIT_IN_PROGRESS: "det.ai.err.busy",
  EDIT_CONFLICT: "det.ai.err.conflict",
  EDIT_EXPIRED: "det.ai.err.failed",
  FEATURE_LOCKED: "det.ai.err.locked",
  AI_UNAVAILABLE: "det.ai.unavailable",
  EDIT_NOT_SUPPORTED: "det.ai.notAi",
  RATE_LIMITED: "common.error.rateLimited",
};

/**
 * The personal AI robot: describe a change in words and the server edits the saved game. Everything shown here is
 * only a view — the plan, the quota and the validation are enforced by the server; this component never decides them.
 */
export function AiEditPanel({ gameId, revision, capabilities, editable, aiAvailable }: { gameId: string; revision: number; capabilities: EditCapabilities; editable: boolean; aiAvailable: boolean }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [caps, setCaps] = useState(capabilities);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<Outcome[]>([]);
  const [rev, setRev] = useState(revision);
  const pending = useRef<{ instruction: string; key: string } | null>(null);
  const counter = useRef(0);

  if (caps.robot === "none") {
    return (
      <Card className="space-y-3" data-testid="ai-locked">
        <h2 className="font-semibold">{t("det.ai.locked.title")}</h2>
        <p className="text-sm text-muted">{t("det.ai.locked.text")}</p>
        <Link href="/pricing" className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-text/10" data-testid="ai-locked-cta">{t("det.ai.locked.cta")}</Link>
      </Card>
    );
  }

  const blocked = !editable ? t("det.ai.notAi") : !aiAvailable ? t("det.ai.unavailable") : caps.aiEdits.remaining <= 0 ? t("det.ai.err.quota") : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const instruction = text.trim();
    if (instruction.length < 3 || busy || blocked) return;
    // A retry of the same request after an unknown outcome (network drop) reuses its key, so it is never charged twice.
    const key = pending.current?.instruction === instruction ? pending.current.key : crypto.randomUUID();
    pending.current = { instruction, key };
    setBusy(true);
    const id = ++counter.current;
    try {
      const res = await fetch(`/api/games/${gameId}/edit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ instruction, idempotencyKey: key, expectedRevision: rev }) });
      const json = (await res.json().catch(() => ({}))) as { summary?: string; revision?: number; capabilities?: EditCapabilities; error?: { code?: string } };
      if (res.ok && json.revision) {
        pending.current = null;
        setText("");
        setRev(json.revision);
        if (json.capabilities) setCaps(json.capabilities);
        setLog((l) => [{ id, instruction, ok: true, text: t("det.ai.done", { summary: json.summary ?? "" }) }, ...l]);
        router.refresh();
      } else {
        pending.current = null;
        const code = json.error?.code ?? "";
        setLog((l) => [{ id, instruction, ok: false, text: t(ERROR_KEY[code] ?? "det.ai.err.failed") }, ...l]);
        if (code === "EDIT_QUOTA_EXHAUSTED") setCaps((c) => ({ ...c, aiEdits: { ...c.aiEdits, remaining: 0, used: c.aiEdits.limit } }));
      }
    } catch {
      // Outcome unknown: keep the key so pressing the button again cannot spend a second edit.
      setLog((l) => [{ id, instruction, ok: false, text: t("common.error.network") }, ...l]);
    } finally {
      setBusy(false);
    }
  }

  const examples: DictKey[] = ["det.ai.example1", "det.ai.example2", "det.ai.example3"];
  return (
    <Card className="space-y-4" data-testid="ai-edit">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">{t("det.ai.title")}</h2>
          <Badge tone="violet" data-testid="ai-level">{t(`det.ai.level.${caps.robot}` as DictKey)}</Badge>
        </div>
        <p className="text-sm text-muted">{t("det.ai.text")}</p>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <Field label={t("det.ai.label")} htmlFor="ai-instruction">
          <Textarea id="ai-instruction" value={text} maxLength={1000} rows={3} placeholder={t("det.ai.placeholder")} onChange={(e) => setText(e.target.value)} disabled={busy || Boolean(blocked)} data-testid="ai-instruction" />
        </Field>
        <div className="flex flex-wrap gap-1.5">
          {examples.map((k) => <button key={k} type="button" className="min-h-9 rounded-full border border-line px-3 text-xs hover:bg-text/10 disabled:opacity-50" disabled={busy || Boolean(blocked)} onClick={() => setText(t(k))}>{t(k)}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy || Boolean(blocked) || text.trim().length < 3} data-testid="ai-submit">{t("det.ai.submit")}</Button>
          <p className="text-xs text-muted" data-testid="ai-quota">
            {t("det.ai.quota", { n: caps.aiEdits.remaining, total: caps.aiEdits.limit })} · {t("det.ai.quota.reset", { date: formatDate(caps.aiEdits.periodEnd, locale) })}
          </p>
        </div>
      </form>
      {busy && <div className="flex items-center gap-2 text-sm text-muted" role="status" data-testid="ai-working"><Spinner /> {t("det.ai.working")}</div>}
      {blocked && <Alert tone="warn" data-testid="ai-blocked">{blocked}</Alert>}
      {log.length > 0 && (
        <ul className="space-y-2" aria-live="polite" data-testid="ai-log">
          {log.map((o) => (
            <li key={o.id}>
              <p className="text-xs text-muted">“{o.instruction}”</p>
              <Alert tone={o.ok ? "success" : "error"}>{o.text}</Alert>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
