"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  Upload,
  ShieldCheck,
  RefreshCw,
  ChevronLeft,
} from "lucide-react";
import { useApp } from "../context";
import { useCheckout } from "../checkout";
import { Button, PageTitle, Field, Notice, Empty, Back } from "../ui";
import { api } from "@/lib/client";
import type { MessageKey } from "@/lib/i18n";
export {
  Profile,
  SettingsScreen,
  Admin,
  Community,
  Legal,
  Creator,
} from "./management";
export function Pricing() {
  const { t, state, catalog, go, setState } = useApp();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const checkout = useCheckout();
  const plans = catalog.plans?.length ? catalog.plans : [];
  const choose = async (plan: string) => {
    if (!state?.user) {
      go("/register");
      return;
    }
    if (plan === "FREE") {
      go("/dashboard");
      return;
    }
    setBusy(plan);
    try {
      const r = await api("/orders", { plan });
      if (r.state) setState(r.state);
      go("/payment/" + (r.order?.id || r.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  };
  return (
    <div className="pricing-page">
      {checkout.dialog}
      {checkout.error && <Notice type="error">{checkout.error}</Notice>}
      {!state?.user && <Back href="/" />}
      <PageTitle title={t("pricingTitle")} subtitle={t("pricingSub")} />
      {error && <Notice type="error">{error}</Notice>}
      <div className="pricing-grid">
        {plans.map((p: any, i: number) => (
          <section
            className={
              "plan-card " +
              (i === 1 ? "plan-basic" : i === 2 ? "plan-plus" : "")
            }
            key={p.id}
          >
            {i === 1 || i === 2 ? (
              <div className="plan-badge">
                {t(i === 1 ? "basicBadge" : "plusBadge")}
              </div>
            ) : (
              <div className="plan-badge spacer" />
            )}
            <h2>{p.name}</h2>
            <p>
              {t(
                (
                  [
                    "freeDesc",
                    "basicDesc",
                    "plusDesc",
                    "proDesc",
                  ] as MessageKey[]
                )[i],
              )}
            </p>
            <div className="plan-price">
              <b>₪{p.price}</b>
              <span>{i === 0 ? t("free") : t("monthly")}</span>
            </div>
            <Button
              className="full-width"
              variant={i === 1 ? "primary" : "secondary"}
              onClick={() =>
                p.id === "FREE" ? choose(p.id) : checkout.start({ plan: p.id })
              }
              busy={checkout.busy || busy === p.id}
              disabled={state?.plan === p.id}
            >
              {t(state?.plan === p.id ? "currentPlan" : "choosePlan")}
            </Button>
            <ul>
              {[
                (i < 2 ? "1" : i === 2 ? "5" : t("unlimited")) +
                  " " +
                  t("planPaths"),
                t("planTasks"),
                ...(i > 0 ? [t("plan3d"), t("planBoss")] : [t("preview")]),
                ...(i > 1
                  ? [t("weeklySummary"), t("full") + " " + t("planHistory")]
                  : []),
                ...(i === 3 ? [t("planCreate"), t("planPublish")] : []),
              ].map((v, j) => (
                <li key={j}>
                  <Check size={16} />
                  {v}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="table-wrap">
        <table className="comparison">
          <thead>
            <tr>
              <th>{t("pricing")}</th>
              {plans.map((p: any) => (
                <th key={p.id}>{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(
              [
                "planPaths",
                "planTasks",
                "plan3d",
                "planBoss",
                "planAi",
                "planWorlds",
                "planHistory",
                "planCreate",
                "planPublish",
              ] as MessageKey[]
            ).map((key, i) => (
              <tr key={key}>
                <th>{t(key)}</th>
                {[0, 1, 2, 3].map((p) => (
                  <td key={p}>
                    {i === 0 ? (
                      ["1", "1", "5", t("unlimited")][p]
                    ) : i === 1 ? (
                      [t("basic"), t("basic"), t("adapted"), t("advanced")][p]
                    ) : i === 4 ? (
                      [t("basic"), t("basic"), t("extended"), t("advanced")][p]
                    ) : i === 5 ? (
                      [t("no"), t("basic"), t("extended"), t("allWorlds")][p]
                    ) : i === 6 ? (
                      [t("no"), "14 " + t("days"), t("full"), t("full")][p]
                    ) : (
                      <span
                        className={p >= (i >= 7 ? 3 : 1) ? "included" : "muted"}
                      >
                        {t(p >= (i >= 7 ? 3 : 1) ? "yes" : "no")}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Notice>
        <ShieldCheck size={18} />
        {t("bitManual")}
      </Notice>
    </div>
  );
}
export function orderStatus(t: (k: MessageKey) => string, status: string) {
  return t(
    (
      {
        created: "created",
        awaiting_payment: "awaiting",
        proof_uploaded: "underReview",
        under_review: "underReview",
        approved: "approved",
        rejected: "rejected",
        cancelled: "cancelled",
        refunded_manually: "refund",
      } as Record<string, MessageKey>
    )[status] || "created",
  );
}
export function Payment({ id }: { id?: string }) {
  const { t, state, catalog, refresh, toast, setState } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const order = state.orders?.find((o: any) => o.id === id);
  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("purpose", "payment");
      form.append("orderId", order.id);
      const r = await api("/uploads", form);
      if (r.state) setState(r.state);
      else await refresh();
      toast(t("proofUploaded"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (!order)
    return (
      <>
        <PageTitle title={t("orders")} />
        {state.orders?.length ? (
          <div className="order-list">
            {state.orders.map((o: any) => (
              <Link href={"/payment/" + o.id} className="order-row" key={o.id}>
                <span>
                  <b>{o.plan || t("marketplace")}</b>
                  <small dir="ltr">{o.id}</small>
                </span>
                <b>₪{o.amount}</b>
                <span className={"tag status-" + o.status}>
                  {orderStatus(t, o.status)}
                </span>
                <ChevronLeft size={17} />
              </Link>
            ))}
          </div>
        ) : (
          <Empty
            title={t("noOrders")}
            action={
              <Link href="/pricing" className="button primary">
                {t("pricing")}
              </Link>
            }
          />
        )}
      </>
    );
  const reviewing = ["under_review", "proof_uploaded"].includes(order.status);
  // The server keeps accepting a proof after a rejection, so the form has to stay reachable.
  const canUploadProof = ["awaiting_payment", "created", "rejected"].includes(
    order.status,
  );
  return (
    <div className="payment-page">
      <Back href="/pricing" />
      <PageTitle title={t("paymentTitle")} subtitle={t("paymentSub")} />
      <div className="payment-grid">
        <section className="payment-instructions">
          {state.isDemo && <Notice>{t("paymentDemo")}</Notice>}
          <div className="payment-step">
            <span>1</span>
            <div>
              <h2>{t("amount")}</h2>
              <div className="payment-amount">
                ₪{order.amount}
                <small>{order.plan}</small>
              </div>
              <p>
                {t("order")}: <b dir="ltr">{order.id}</b>
              </p>
            </div>
          </div>
          <div className="payment-step">
            <span>2</span>
            <div>
              <h2>{t("bitPhone")}</h2>
              <div className="bit-number">
                <b dir="ltr">{catalog.bit?.phone}</b>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(catalog.bit.phone);
                      toast(t("copied"));
                    } catch {
                      toast(t("error"));
                    }
                  }}
                >
                  <Copy size={17} />
                  {t("copy")}
                </Button>
              </div>
              <p>{t("bitInstruction")}</p>
              {catalog.bit?.url && (
                <a
                  className="button secondary"
                  href={catalog.bit.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {t("bitOpen")}
                </a>
              )}
            </div>
          </div>
          <div className="payment-step">
            <span>3</span>
            <div>
              <h2>
                {t(order.status === "rejected" ? "uploadNewProof" : "uploadProof")}
              </h2>
              {order.status === "rejected" && (
                <Notice type="error">
                  {t("paymentReject")}
                  {order.reviewNote && <p>{order.reviewNote}</p>}
                </Notice>
              )}
              {canUploadProof ? (
                <form onSubmit={upload}>
                  <Field label={t("attachment")} help={t("fileHelp")}>
                    <input
                      type="file"
                      required
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </Field>
                  <Button type="submit" busy={busy} disabled={!file}>
                    <Upload size={18} />
                    {t(
                      order.status === "rejected"
                        ? "uploadNewProof"
                        : "uploadProof",
                    )}
                  </Button>
                </form>
              ) : (
                <Notice
                  type={
                    order.status === "approved"
                      ? "success"
                      : reviewing
                        ? "info"
                        : "error"
                  }
                >
                  {t(
                    order.status === "approved"
                      ? "paymentApproved"
                      : order.status === "cancelled"
                        ? "orderCancelled"
                        : reviewing
                          ? "paymentWait"
                          : "paymentReject",
                  )}
                  {order.reviewNote && <p>{order.reviewNote}</p>}
                </Notice>
              )}
              {error && <Notice type="error">{error}</Notice>}
            </div>
          </div>
        </section>
        <aside className="payment-summary">
          <ShieldCheck size={31} />
          <h2>{orderStatus(t, order.status)}</h2>
          <p>{t("bitManual")}</p>
          <div className="divider" />
          <dl className="detail-list">
            <div>
              <dt>{t("price")}</dt>
              <dd>₪{order.amount}</dd>
            </div>
            <div>
              <dt>{t("status")}</dt>
              <dd>{orderStatus(t, order.status)}</dd>
            </div>
          </dl>
          <p className="small-text muted">{t("proofPrivate")}</p>
          {order.proofId && (
            <a
              href={"/api/files/" + order.proofId}
              target="_blank"
              rel="noreferrer"
              className="button secondary full-width"
            >
              {t("viewProof")}
            </a>
          )}
          <Button
            variant="secondary"
            className="full-width"
            onClick={() => refresh().then(() => toast(t("saved")))}
          >
            <RefreshCw size={17} />
            {t("refresh")}
          </Button>
          {order.status === "approved" && (
            <Link
              href={order.plan ? "/quest" : "/marketplace"}
              className="button primary full-width"
            >
              {t(order.plan ? "startGame" : "marketplace")}
            </Link>
          )}
          {["awaiting_payment", "created", "rejected"].includes(
            order.status,
          ) && (
            <Button
              variant="tertiary"
              busy={busy}
              className="full-width"
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  const r = await api("/orders/" + order.id, {
                    action: "cancel",
                  });
                  setState(r.state);
                  toast(t("orderCancelled"));
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t("cancelOrder")}
            </Button>
          )}
        </aside>
      </div>
    </div>
  );
}
export { default as Quest } from "./quest";
