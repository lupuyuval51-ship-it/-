import { useRef, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { Button, Card } from "@/components/ui";
import { backupFileName, BackupError, createBackup, importBackup } from "@/lib/offline/backup";
import { store } from "../app-state";

type Message = { tone: "ok" | "error"; text: string };

/** Hands the backup text to the user: the share sheet where the WebView can share files, otherwise a normal file download. */
async function saveFile(name: string, text: string): Promise<void> {
  const file = new File([text], name, { type: "application/json" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title: name }); return; } catch (e) { if ((e as Error).name === "AbortError") return; }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function BackupPanel() {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [busy, setBusy] = useState(false);

  async function exportAll() {
    setMessage(null);
    const backup = createBackup(store);
    if (backup.games.length === 0) { setMessage({ tone: "error", text: t("mob.backup.empty") }); return; }
    setBusy(true);
    try {
      await saveFile(backupFileName(backup.exportedAt), JSON.stringify(backup));
      setMessage({ tone: "ok", text: t("mob.backup.exported", { games: String(backup.games.length), sessions: String(backup.sessions.length) }) });
    } finally { setBusy(false); }
  }

  async function importFile(file: File) {
    setBusy(true);
    setMessage(null);
    try {
      let text: string;
      try { text = await file.text(); } catch { setMessage({ tone: "error", text: t("mob.backup.err.READ") }); return; }
      const r = importBackup(store, text);
      const skipped = r.rejectedGames.length;
      setMessage({
        tone: "ok",
        text: t("mob.backup.imported", { added: String(r.gamesAdded), updated: String(r.gamesUpdated), kept: String(r.gamesKept), sessions: String(r.sessionsImported), cards: String(r.cardsImported) })
          + (skipped ? " " + t("mob.backup.skipped", { count: String(skipped) }) : ""),
      });
    } catch (e) {
      const code = e instanceof BackupError ? e.code : "INVALID";
      setMessage({ tone: "error", text: t(`mob.backup.err.${code}` as "mob.backup.err.INVALID") });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <Card className="space-y-3" data-testid="mobile-backup">
      <h2 className="text-lg font-bold">{t("mob.backup.title")}</h2>
      <p className="text-sm text-muted">{t("mob.backup.hint")}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" disabled={busy} onClick={() => void exportAll()} data-testid="backup-export">{t("mob.backup.export")}</Button>
        <Button variant="secondary" disabled={busy} onClick={() => input.current?.click()} data-testid="backup-import">{t("mob.backup.import")}</Button>
        <input ref={input} type="file" accept=".json,application/json" className="hidden" data-testid="backup-file" onChange={(e) => { const f = e.target.files?.[0]; if (f) void importFile(f); }} />
      </div>
      {message && <p role={message.tone === "error" ? "alert" : "status"} className={message.tone === "error" ? "text-sm text-rose" : "text-sm text-lime"}>{message.text}</p>}
    </Card>
  );
}
