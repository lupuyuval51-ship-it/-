import { useEffect, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { GoogleLogo } from "@/components/forms/GoogleButton";
import { Alert, Button } from "@/components/ui";
import { isFinishingGoogleSignIn, onAppResume, onGoogleResult, signInWithGoogle } from "../cloud/google-native";

/** After the learner is back from the browser, how long a deep link that is still arriving may win before the button is given back. */
const RESUME_GRACE_MS = 1500;
/** While a link that did arrive is still being finished, the button waits in steps of this, for at most `FINISH_WAIT_MAX_MS`. */
const FINISH_POLL_MS = 500;
const FINISH_WAIT_MAX_MS = 30_000;

/**
 * The first screen of a phone that is not signed in: the app needs a Google sign-in (Supabase Auth, the system browser, back
 * through the app's own deep link). Nothing else is shown until it has happened; once this phone has a sign-in, the app opens
 * without the network.
 */
export function GoogleGate() {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"cancelled" | "failed" | null>(null);

  useEffect(() => onGoogleResult((r) => { setBusy(false); if (!r.ok) setError(r.reason); }), []);
  // The learner closed the browser or pressed Back there: no link ever comes back, and the app is behind this gate, so the button
  // must not stay on "Loading". A deep link that is on its way arrives within the grace time and answers first.
  useEffect(() => {
    if (!busy) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = onAppResume(() => {
      clearTimeout(timer);
      let waited = 0;
      const giveBack = () => {
        // a link that arrived is still being exchanged: its answer gives the button back (onGoogleResult)
        if (isFinishingGoogleSignIn() && waited < FINISH_WAIT_MAX_MS) { waited += FINISH_POLL_MS; timer = setTimeout(giveBack, FINISH_POLL_MS); return; }
        setBusy(false);
      };
      timer = setTimeout(giveBack, RESUME_GRACE_MS);
    });
    return () => { stop(); clearTimeout(timer); };
  }, [busy]);

  async function start() {
    setError(null);
    setBusy(true);
    const r = await signInWithGoogle();
    // on success the system browser is open and the result comes back through the deep link (the session listener swaps this screen)
    if (!r.ok) { setBusy(false); setError("failed"); }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-6 py-10" data-testid="google-gate">
      <div className="w-full max-w-sm space-y-5 text-center">
        <h1 className="text-3xl font-extrabold">{t("mob.gate.title")}</h1>
        <p className="text-muted">{t("mob.gate.text")}</p>
        {error && <Alert tone="error" data-testid="google-gate-error">{t(error === "cancelled" ? "mob.account.google.cancelled" : "mob.gate.error")}</Alert>}
        <Button type="button" className="w-full" disabled={busy} onClick={() => void start()} data-testid="google-gate-button">
          <GoogleLogo className="size-5" />{busy ? t("common.loading") : t("mob.account.google")}
        </Button>
        <p className="text-xs text-muted">{t("mob.gate.privacy")}</p>
      </div>
    </main>
  );
}
