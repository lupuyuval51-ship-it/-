"use client";
import { useState } from "react";
import { useApp } from "./context";
import { api, isAdult } from "@/lib/client";
import { Button, Modal, Notice } from "./ui";
export function useCheckout() {
  const { state, setState, go, t, start } = useApp();
  const [pending, setPending] = useState<any>(null);
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
    const profile = state?.user ? state.profile : (await start()).profile;
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
