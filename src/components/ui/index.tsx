import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export const cx = (...parts: (string | false | null | undefined)[]): string => parts.filter(Boolean).join(" ");

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-neon text-ink-950 hover:bg-white shadow-[0_0_24px_-6px_var(--color-neon)] disabled:bg-ink-600 disabled:text-muted disabled:shadow-none",
  secondary: "bg-ink-700 text-text hover:bg-ink-600 border border-line disabled:opacity-50",
  ghost: "bg-transparent text-text hover:bg-white/10 border border-transparent disabled:opacity-50",
  danger: "bg-rose/90 text-white hover:bg-rose disabled:opacity-50",
  success: "bg-lime text-ink-950 hover:bg-white disabled:opacity-50",
};

export function Button({ variant = "primary", size = "md", className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" };
  return (
    <button
      {...rest}
      className={cx("inline-flex min-h-11 items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed", sizes[size], VARIANTS[variant], className)}
    />
  );
}

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cx("rounded-2xl border border-line bg-ink-800/70 p-5 backdrop-blur", className)} />;
}

export function Badge({ tone = "neutral", className, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "neon" | "violet" | "lime" | "amber" | "rose" }) {
  const tones = {
    neutral: "border-line bg-ink-700 text-muted",
    neon: "border-neon/40 bg-neon/10 text-neon",
    violet: "border-violet/40 bg-violet/15 text-violet",
    lime: "border-lime/40 bg-lime/10 text-lime",
    amber: "border-amber/40 bg-amber/10 text-amber",
    rose: "border-rose/40 bg-rose/10 text-rose",
  };
  return <span {...rest} className={cx("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", tones[tone], className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return <span role="status" aria-label="loading" className={cx("inline-block size-5 animate-spin rounded-full border-2 border-neon border-t-transparent", className)} />;
}

export function Alert({ tone = "info", children, className, ...rest }: HTMLAttributes<HTMLDivElement> & { tone?: "info" | "error" | "success" | "warn"; children: ReactNode }) {
  const tones = {
    info: "border-neon/40 bg-neon/10 text-text",
    error: "border-rose/50 bg-rose/10 text-text",
    success: "border-lime/50 bg-lime/10 text-text",
    warn: "border-amber/50 bg-amber/10 text-text",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} {...rest} className={cx("rounded-xl border px-4 py-3 text-sm", tones[tone], className)}>
      {children}
    </div>
  );
}

export function ProgressBar({ value, max = 100, className, label }: { value: number; max?: number; className?: string; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} className={cx("h-2 w-full overflow-hidden rounded-full bg-ink-700", className)}>
      <div className="h-full rounded-full bg-gradient-to-r from-neon to-violet transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

const fieldBase = "w-full rounded-xl border border-line bg-ink-900 px-3.5 py-2.5 text-sm text-text placeholder:text-muted/70 focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon";

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string | null; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-text">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-rose">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(fieldBase, p.className)} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cx(fieldBase, "min-h-24 resize-y", p.className)} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx(fieldBase, p.className)} />;

export function Stars({ n, size = "md" }: { n: number; size?: "sm" | "md" | "lg" }) {
  const sz = { sm: "text-base", md: "text-xl", lg: "text-4xl" }[size];
  return (
    <span aria-label={`${n}/3`} className={cx("inline-flex gap-0.5", sz)}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= n ? "text-amber" : "text-ink-600"}>
          ★
        </span>
      ))}
    </span>
  );
}

/** Direction-aware arrow: "forward" points to where reading continues (right in LTR, left in RTL). */
export function Arrow({ back = false }: { back?: boolean }) {
  return <span aria-hidden className="inline-block rtl:-scale-x-100">{back ? "←" : "→"}</span>;
}
