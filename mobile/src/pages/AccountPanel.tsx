import { useState } from "react";
import { useT } from "@/components/I18nProvider";
import { Alert, Button, Card, Field, Input } from "@/components/ui";
import { deleteAccount, signIn, signOut, signUp, syncNow, useAccount } from "../cloud/account";

/** Optional account: back up games and progress to the cloud and use them on another phone. The game works without it. */
export function AccountPanel() {
  const t = useT();
  const { session, status, lastSyncAt, error } = useAccount();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success" | "info"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function submit(kind: "in" | "up") {
    setMessage(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) { setMessage({ tone: "error", text: t("mob.account.error.email") }); return; }
    if (password.length < 8) { setMessage({ tone: "error", text: t("mob.account.error.password") }); return; }
    setBusy(true);
    const r = kind === "in" ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    setBusy(false);
    if (!r.ok) setMessage({ tone: "error", text: t("mob.account.error.generic") });
    else if (r.needsConfirmation) setMessage({ tone: "info", text: t("mob.account.confirm") });
    else setPassword("");
  }

  if (session) {
    return (
      <Card className="space-y-3" data-testid="account-signed-in" aria-busy={status === "syncing"}>
        <h2 className="text-lg font-semibold">{t("mob.account.title")}</h2>
        <p className="text-sm text-muted">{t("mob.account.signedInAs", { email: session.user.email ?? "" })}</p>
        <p className="text-sm" data-testid="sync-status" data-status={status}>
          {status === "syncing" ? t("mob.account.syncing") : status === "error" ? t("mob.account.syncError") : lastSyncAt ? t("mob.account.lastSync", { when: new Date(lastSyncAt).toLocaleString() }) : t("mob.account.notSynced")}
        </p>
        {error && <p className="text-xs text-muted" dir="ltr">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => void syncNow()} disabled={status === "syncing"} data-testid="sync-now">{t("mob.account.syncNow")}</Button>
          <Button size="sm" variant="secondary" onClick={() => void signOut()} data-testid="sign-out">{t("mob.account.signOut")}</Button>
        </div>
        <div className="space-y-2 border-t border-line pt-3">
          {!confirmDelete ? (
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} data-testid="delete-account">{t("mob.account.delete")}</Button>
          ) : (
            <div className="space-y-2 rounded-xl border border-rose/40 p-3 text-sm">
              <p>{t("mob.account.delete.confirm")}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="danger" disabled={busy} data-testid="delete-account-confirm" onClick={async () => {
                  setBusy(true);
                  const r = await deleteAccount();
                  setBusy(false);
                  setConfirmDelete(false);
                  setMessage(r.ok ? { tone: "success", text: t("mob.account.deleted") } : { tone: "error", text: t("mob.account.error.generic") });
                }}>{t("common.yes")}</Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>{t("common.no")}</Button>
              </div>
            </div>
          )}
        </div>
        {message && <Alert tone={message.tone}>{message.text}</Alert>}
      </Card>
    );
  }

  return (
    <Card className="space-y-3" data-testid="account-signed-out" aria-busy={busy}>
      <h2 className="text-lg font-semibold">{t("mob.account.title")}</h2>
      <p className="text-sm text-muted">{t("mob.account.intro")}</p>
      <Field label={t("mob.account.email")} htmlFor="acc-email"><Input id="acc-email" type="email" autoComplete="email" inputMode="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Field label={t("mob.account.password")} htmlFor="acc-password" hint={t("mob.account.password.hint")}><Input id="acc-password" type="password" autoComplete="current-password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void submit("in")} disabled={busy} data-testid="sign-in">{t("mob.account.signIn")}</Button>
        <Button size="sm" variant="secondary" onClick={() => void submit("up")} disabled={busy} data-testid="sign-up">{t("mob.account.signUp")}</Button>
      </div>
      <p className="text-xs text-muted">{t("mob.account.privacy")}</p>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
    </Card>
  );
}
