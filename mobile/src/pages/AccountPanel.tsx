import { useEffect, useState } from "react";
import { useLocale, useT } from "@/components/I18nProvider";
import { GoogleLogo } from "@/components/forms/GoogleButton";
import { Alert, Button, Card, Field, Input } from "@/components/ui";
import { deleteAccount, signIn, signOut, signUp, syncNow, useAccount, type AuthResult } from "../cloud/account";
import { googleAuthEnabled } from "../cloud/google";
import { onGoogleResult, signInWithGoogle } from "../cloud/google-native";
import { formatWhen } from "../format";

/**
 * What is wrong with the typed e-mail and password, or null. The address is checked as it is sent (trimmed): a phone keyboard
 * often puts a space after an address it suggested, and that address is fine. The password is taken exactly as typed.
 */
export function credentialsProblem(email: string, password: string): "mob.account.error.email" | "mob.account.error.password" | null {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "mob.account.error.email";
  if (password.length < 8) return "mob.account.error.password";
  return null;
}

/** Optional account: back up games and progress to the cloud and use them on another phone. The game works without it. */
export function AccountPanel() {
  const t = useT();
  const locale = useLocale();
  const { session, status, lastSyncAt, error } = useAccount();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success" | "info"; text: string } | null>(null);
  // The account the delete confirmation was opened for: after a sign-out (or a sign-in to another account) it is closed, so the
  // next sign-in never opens one tap away from deleting an account.
  const userId = session?.user.id ?? null;
  const [confirmFor, setConfirmFor] = useState<string | null>(null);
  const confirmDelete = confirmFor !== null && confirmFor === userId;

  const google = googleAuthEnabled();
  useEffect(() => google ? onGoogleResult((r) => { if (!r.ok) setMessage({ tone: "error", text: t(r.reason === "cancelled" ? "mob.account.google.cancelled" : "mob.account.google.error") }); }) : undefined, [google, t]);

  async function viaGoogle() {
    setMessage(null);
    const r = await signInWithGoogle();
    // on success the system browser is open; the result comes back through the deep link (onGoogleResult / the session listener)
    if (!r.ok) setMessage({ tone: "error", text: t("mob.account.google.error") });
  }

  async function submit(kind: "in" | "up") {
    setMessage(null);
    const problem = credentialsProblem(email, password);
    if (problem) { setMessage({ tone: "error", text: t(problem) }); return; }
    setBusy(true);
    let r: AuthResult;
    try {
      r = kind === "in" ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    } catch {
      r = { ok: false, message: "failed" }; // never leaves the buttons disabled for good
    } finally {
      setBusy(false);
    }
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
          {status === "syncing" ? t("mob.account.syncing") : status === "error" ? t("mob.account.syncError") : lastSyncAt ? t("mob.account.lastSync", { when: formatWhen(lastSyncAt, locale) }) : t("mob.account.notSynced")}
        </p>
        {error && <p className="text-xs text-muted" dir="ltr">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => void syncNow()} disabled={status === "syncing"} data-testid="sync-now">{t("mob.account.syncNow")}</Button>
          {/* (an old message, e.g. a failed deletion, must not greet the signed-out screen) */}
          <Button size="sm" variant="secondary" onClick={() => { setMessage(null); void signOut(); }} data-testid="sign-out">{t("mob.account.signOut")}</Button>
        </div>
        <div className="space-y-2 border-t border-line pt-3">
          {!confirmDelete ? (
            <Button size="sm" variant="ghost" onClick={() => setConfirmFor(userId)} data-testid="delete-account">{t("mob.account.delete")}</Button>
          ) : (
            <div className="space-y-2 rounded-xl border border-rose/40 p-3 text-sm">
              <p>{t("mob.account.delete.confirm")}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="danger" disabled={busy} data-testid="delete-account-confirm" onClick={async () => {
                  setBusy(true);
                  let r: AuthResult;
                  try { r = await deleteAccount(); } catch { r = { ok: false, message: "failed" }; } finally { setBusy(false); }
                  setConfirmFor(null);
                  setMessage(r.ok ? { tone: "success", text: t("mob.account.deleted") } : { tone: "error", text: t("mob.account.error.generic") });
                }}>{t("common.yes")}</Button>
                {/* a deletion already sent cannot be called back: "No" waits for its answer instead of pretending to cancel it */}
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmFor(null)} data-testid="delete-account-cancel">{t("common.no")}</Button>
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
      {google && (
        <>
          <div className="flex items-center gap-3 text-xs text-muted" role="separator"><span className="h-px flex-1 bg-line" />{t("mob.account.or")}<span className="h-px flex-1 bg-line" /></div>
          <Button size="sm" variant="secondary" className="w-full" onClick={() => void viaGoogle()} disabled={busy} data-testid="sign-in-google"><GoogleLogo className="size-4" />{t("mob.account.google")}</Button>
        </>
      )}
      <p className="text-xs text-muted">{t("mob.account.privacy")}{google ? ` ${t("mob.account.google.privacy")}` : ""}</p>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
    </Card>
  );
}
