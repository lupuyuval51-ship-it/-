"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, Check, LoaderCircle, X, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useApp } from "./context";
export function Button({
  children,
  variant = "primary",
  busy = false,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: string;
  busy?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || busy}
      className={"button " + variant + " " + className}
    >
      {busy ? <LoaderCircle className="spin" size={18} /> : null}
      {children}
    </button>
  );
}
export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
export function Empty({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { t } = useApp();
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="modal"
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-head">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-button"
          aria-label={t("close")}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Progress({ value, label }: { value: number; label?: string }) {
  const { t } = useApp();
  return (
    <div className="progress-wrap">
      {label && (
        <div className="progress-label">
          <span>{label}</span>
          <b>{Math.round(value)}%</b>
        </div>
      )}
      <div
        className="progress"
        role="progressbar"
        aria-valuenow={Math.min(value, 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || t("progress")}
      >
        <span style={{ width: Math.min(100, value) + "%" }} />
      </div>
    </div>
  );
}
export function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {help && <small>{help}</small>}
    </label>
  );
}
export function Notice({
  children,
  type = "info",
}: {
  children: React.ReactNode;
  type?: string;
}) {
  return (
    <div
      className={"notice " + type}
      role={type === "error" ? "alert" : "status"}
    >
      {type === "success" && <Check size={18} />}
      <div>{children}</div>
    </div>
  );
}
export function Back({ href = "/dashboard" }: { href?: string }) {
  const { t } = useApp();
  return (
    <Link href={href} className="back-link">
      <ArrowLeft size={16} />
      {t("back")}
    </Link>
  );
}
export function PathCard({ path }: { path: any }) {
  const { t, l } = useApp();
  return (
    <Link href={"/marketplace/" + path.id} className="path-card">
      <div className="path-cover">
        <img src={path.cover} alt="" loading="lazy" />
        <span className="cover-category">{t(path.level || "beginner")}</span>
      </div>
      <div className="path-card-content">
        <div className="eyebrow">
          {path.creator} <ArrowUpRight size={16} />
        </div>
        <h3>{l(path.title)}</h3>
        <p>{l(path.description)}</p>
        <div className="path-card-meta">
          <span>
            {path.durationDays} {t("days")} · {path.dailyMinutes} {t("minutes")}
          </span>
          <strong>{path.price ? "₪" + path.price : t("free")}</strong>
        </div>
      </div>
    </Link>
  );
}
export function Countdown() {
  const { state } = useApp();
  const [time, setTime] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      const zone = state?.profile?.timezone || "Asia/Jerusalem";
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: zone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      })
        .format(new Date())
        .split(":")
        .map(Number);
      const s = 86400 - (parts[0] * 3600 + parts[1] * 60 + parts[2]);
      setTime(
        [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
          .map((v) => String(v).padStart(2, "0"))
          .join(":"),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state?.profile?.timezone]);
  return (
    <span className="countdown" dir="ltr">
      {time}
    </span>
  );
}
