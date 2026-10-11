"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale, useT } from "@/components/I18nProvider";
import { Alert, Badge, Button, Card } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { DictKey } from "@/lib/i18n";

export interface RevisionView {
  revision: number;
  reason: string;
  note: string | null;
  title: string;
  createdAt: string;
  current: boolean;
}

/** Saved versions of a game. Plans without version history only see what the feature is; the server never sends them the list. */
export function VersionHistory({ gameId, revisions }: { gameId: string; revisions: RevisionView[] | null }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function restore(n: number) {
    if (!window.confirm(t("det.hist.restore.confirm", { n }))) return;
    setBusy(n);
    setMsg(null);
    try {
      const res = await fetch(`/api/games/${gameId}/revisions/${n}/restore`, { method: "POST" });
      if (res.ok) {
        setMsg({ tone: "success", text: t("det.hist.restored", { n }) });
        router.refresh();
      } else {
        setMsg({ tone: "error", text: res.status === 429 ? t("common.error.rateLimited") : t("common.error.generic") });
      }
    } catch {
      setMsg({ tone: "error", text: t("common.error.network") });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="space-y-3" data-testid="version-history">
      <h2 className="text-lg font-semibold">{t("det.revisions")}</h2>
      {revisions === null ? (
        <div className="space-y-2" data-testid="history-locked">
          <p className="text-sm text-muted">{t("det.hist.lockedText")}</p>
          <Link href="/pricing" className="text-sm text-neon hover:underline">{t("det.ai.locked.cta")}</Link>
        </div>
      ) : (
        <ul className="space-y-2 text-sm">
          {revisions.map((r) => (
            <li key={r.revision} className="flex items-start justify-between gap-3 rounded-xl border border-line p-2.5" data-testid="revision-row" data-revision={r.revision}>
              <div className="min-w-0 space-y-0.5">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {t("det.version", { n: r.revision })} <span className="font-normal text-muted">· {t(`det.rev.${r.reason}` as DictKey)}</span>
                  {r.current && <Badge tone="neon">{t("det.hist.current")}</Badge>}
                </p>
                <p className="truncate text-muted">{r.title}</p>
                {r.note && r.reason === "edit" && <p className="text-xs text-muted">“{r.note}”</p>}
                <p className="text-xs text-muted">{formatDate(r.createdAt, locale)}</p>
              </div>
              {!r.current && <Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => restore(r.revision)} data-testid={`restore-${r.revision}`}>{t("det.hist.restore")}</Button>}
            </li>
          ))}
        </ul>
      )}
      {msg && <Alert tone={msg.tone} data-testid="history-message">{msg.text}</Alert>}
    </Card>
  );
}
