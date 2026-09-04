"use client";
import { useState } from "react";
import { useApp } from "./context";
import { api, isAdult } from "@/lib/client";

const PENDING_KEY = "levelup-pending-checkout";
import { Button, Modal, Notice } from "./ui";
export function useCheckout() {
  const { state, setState, go, t, start } = useApp();
  // Opening an account mid-checkout swaps the public tree for the app shell and remounts this
  // hook, so the pending purchase has to live outside component state or the modal vanishes and
  // the button looks dead.
  const [pending, setPendingState] = useState<any>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(PENDING_KEY) || "null");
    } catch {
      return null;
    }
  });
  const setPending = (value: any) => {
    setPendingState(value);
    try {
      if (value) sessionStorage.setItem(PENDING_KEY, JSON.stringify(value));
      else sessionStorage.removeItem(PENDING_KEY);
    } catch {
      /* Private-mode storage failures must not block the purchase. */
    }
  };
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const execute = async (input: any) => {
    setBusy(true);
    setError("");
    try {
      const response = await api("/orders", {
        ...input,
        payerAuthorized: approved || isAdult(state?.profile?.birthYear),
      });
      if (response.state) setState(response.state);
      setPending(null);
      go("/payment/" + response.order.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const begin = async (input: any) => {
    // Without a stated adult year of birth the purchase needs an explicit payer confirmation.
    const opened = state?.user ? state : await start();
    if (!opened) return;
    const profile = opened.profile;
    if (!isAdult(profile?.birthYear)) {
      setPending(input);
      setApproved(false);
      return;
    }
    await execute(input);
  };
  const dialog = pending ? (
    <Modal title={t("paymentSub")} onClose={() => setPending(null)}>
      <p>{t("bitManual")}</p>
      <label className="check-label">
        <input
          type="checkbox"
          checked={approved}
          onChange={(e) => setApproved(e.target.checked)}
        />
        {t("payerAuthorized")}
      </label>
      {error && <Notice type="error">{error}</Notice>}
      <Button busy={busy} disabled={!approved} onClick={() => execute(pending)}>
        {t("choosePlan")}
      </Button>
    </Modal>
  ) : null;
  return { start: begin, dialog, busy, error };
}
