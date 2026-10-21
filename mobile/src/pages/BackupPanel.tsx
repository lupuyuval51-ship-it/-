import { useRef, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { Button, Card, Textarea } from "@/components/ui";
import { backupFileName, BackupError, createBackup, fileTooLarge, importBackup, MAX_BACKUP_BYTES, serializeBackup } from "@/lib/offline/backup";
import { store, storageErrorKey } from "../app-state";

type Message = { tone: "ok" | "error"; text: string };
interface Health { writable: "ok" | "full" | "unavailable"; percent: number; damaged: number }
/** How the file left the app: through the share sheet, as a plain download (nothing confirms the phone kept it), or the learner cancelled. */
type SaveOutcome = "shared" | "downloaded" | "cancelled";

/** The storage warnings are shown from this share of the practical limit. */
const WARN_PERCENT = 80;

function readHealth(): Health {
  const usage = store.storageUsage();
  const report = store.integrity();
  return { writable: store.checkWritable(), percent: Math.round((usage.chars / usage.limit) * 100), damaged: report.damagedGames.length + report.damagedSessions.length };
}

/**
 * Hands the backup text to the user: the share sheet where the WebView can share files, otherwise a normal file download.
 * A plain download is not confirmed by anything (the Android app's WebView may ignore it), so the caller says so honestly.
 */
async function saveFile(name: string, text: string): Promise<SaveOutcome> {
  const file = new File([text], name, { type: "application/json" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title: name }); return "shared"; } catch (e) { if ((e as Error).name === "AbortError") return "cancelled"; }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return "downloaded";
}

/** Puts the text on the clipboard (works in the app's WebView, which has no file-saving plugin). False if the phone refused. */
async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* try the older way */ }
  try {
    const box = document.createElement("textarea");
    box.value = text;
    box.setAttribute("readonly", "");
    box.style.position = "fixed";
    box.style.opacity = "0";
    document.body.appendChild(box);
    box.select();
    const ok = document.execCommand("copy");
    box.remove();
    return ok;
  } catch { return false; }
}

export function BackupPanel() {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState<Health>(readHealth);
  const [pasted, setPasted] = useState("");
  const errorText = (e: unknown): string => t(`mob.backup.err.${e instanceof BackupError ? e.code : "INVALID"}` as "mob.backup.err.INVALID");

  async function exportAll(how: "file" | "copy") {
    setMessage(null);
    setBusy(true);
    try {
      const backup = createBackup(store);
      if (backup.games.length === 0) { setMessage({ tone: "error", text: t("mob.backup.empty") }); return; }
      let text: string;
      try { text = serializeBackup(backup); } catch (e) { setMessage({ tone: "error", text: errorText(e) }); return; }
      const counts = { games: String(backup.games.length), sessions: String(backup.sessions.length), runs: String(backup.sessions.length) };
      if (how === "copy") {
        const copied = await copyText(text);
        setMessage(copied ? { tone: "ok", text: t("mob.backup.copied", counts) } : { tone: "error", text: t("mob.backup.err.COPY") });
        return;
      }
      let outcome: SaveOutcome;
      try { outcome = await saveFile(backupFileName(backup.exportedAt), text); } catch { setMessage({ tone: "error", text: t("mob.backup.err.SAVE") }); return; }
      if (outcome === "cancelled") return;
      setMessage({ tone: "ok", text: t(outcome === "shared" ? "mob.backup.exported" : "mob.backup.downloaded", counts) });
    } finally { setBusy(false); }
  }

  /** Imports backup text (from a file or pasted) and says what happened. */
  function restore(text: string) {
    try {
      const r = importBackup(store, text);
      const skipped = r.rejectedGames.length;
      const droppedRuns = r.droppedSessions + r.droppedCards;
      setMessage({
        tone: "ok",
        text: t("mob.backup.imported", { added: String(r.gamesAdded), updated: String(r.gamesUpdated), kept: String(r.gamesKept), sessions: String(r.sessionsImported), cards: String(r.cardsImported) })
          + (skipped ? " " + t("mob.backup.skipped", { count: String(skipped) }) : "")
          + (droppedRuns ? " " + t("mob.backup.skipped.runs", { count: String(droppedRuns) }) : ""),
      });
      return true;
    } catch (e) {
      setMessage({ tone: "error", text: errorText(e) });
      return false;
    } finally {
      setHealth(readHealth());
    }
  }

  async function importFile(file: File) {
    setBusy(true);
    setMessage(null);
    try {
      // an enormous file is refused before it is read into memory
      if (fileTooLarge(file.size)) { setMessage({ tone: "error", text: t("mob.backup.err.TOO_LARGE") }); return; }
      let text: string;
      try { text = await file.text(); } catch { setMessage({ tone: "error", text: t("mob.backup.err.READ") }); return; }
      restore(text);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  function importPasted() {
    setMessage(null);
    if (restore(pasted)) setPasted("");
  }

  function purge() {
    try {
      const n = store.purgeDamaged();
      setMessage({ tone: "ok", text: t("mob.storage.purged", { count: String(n) }) });
    } catch (e) {
      // the phone refused to write the shortened lists: say so instead of a button that silently does nothing
      setMessage({ tone: "error", text: t(storageErrorKey(e) ?? "mob.backup.err.STORAGE_UNAVAILABLE") });
    } finally {
      setHealth(readHealth());
    }
  }

  return (
    <Card className="space-y-3" data-testid="mobile-backup">
      <h2 className="text-lg font-bold">{t("mob.backup.title")}</h2>
      <p className="text-sm text-muted">{t("mob.backup.hint")}</p>
      {health.writable !== "ok" && (
        <p role="alert" className="text-sm text-rose" data-testid="storage-blocked">{t(health.writable === "full" ? "mob.backup.err.STORAGE_FULL" : "mob.storage.blocked")}</p>
      )}
      {health.writable === "ok" && health.percent >= WARN_PERCENT && (
        <p role="status" className="text-sm text-amber" data-testid="storage-nearly-full">{t("mob.storage.full", { percent: String(Math.min(100, health.percent)) })}</p>
      )}
      {health.damaged > 0 && (
        <div className="flex flex-wrap items-center gap-2" data-testid="storage-damaged">
          <p role="status" className="text-sm text-amber">{t("mob.storage.damaged", { count: String(health.damaged) })}</p>
          <Button variant="secondary" size="sm" disabled={busy} onClick={purge} data-testid="storage-purge">{t("mob.storage.purge")}</Button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" disabled={busy} onClick={() => void exportAll("file")} data-testid="backup-export">{t("mob.backup.export")}</Button>
        <Button variant="secondary" disabled={busy} onClick={() => void exportAll("copy")} data-testid="backup-copy">{t("mob.backup.copy")}</Button>
        <Button variant="secondary" disabled={busy} onClick={() => input.current?.click()} data-testid="backup-import">{t("mob.backup.import")}</Button>
        <input ref={input} type="file" accept=".json,application/json" className="hidden" data-testid="backup-file" onChange={(e) => { const f = e.target.files?.[0]; if (f) void importFile(f); }} />
      </div>
      <details className="text-sm">
        <summary className="flex min-h-11 cursor-pointer items-center font-medium text-neon">{t("mob.backup.paste.title")}</summary>
        <div className="mt-2 space-y-2">
          <Textarea dir="ltr" rows={4} value={pasted} maxLength={MAX_BACKUP_BYTES} onChange={(e) => setPasted(e.target.value)} placeholder={t("mob.backup.paste.placeholder")} aria-label={t("mob.backup.paste.title")} data-testid="backup-paste" />
          <Button variant="secondary" size="sm" disabled={busy || pasted.trim().length === 0} onClick={importPasted} data-testid="backup-paste-import">{t("mob.backup.paste.import")}</Button>
        </div>
      </details>
      {message && <p role={message.tone === "error" ? "alert" : "status"} className={message.tone === "error" ? "text-sm text-rose" : "text-sm text-lime"}>{message.text}</p>}
    </Card>
  );
}
