import { Star } from "lucide-react";
import { Children, cloneElement, isValidElement, useId, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactElement, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export const cx = (...parts: (string | false | null | undefined)[]): string => parts.filter(Boolean).join(" ");

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-neon text-ink-950 shadow-glow hover:brightness-110 active:brightness-95 disabled:bg-ink-600 disabled:text-muted disabled:shadow-none",
  secondary: "bg-ink-700 text-text border border-line shadow-e1 hover:bg-ink-600 active:bg-ink-700 disabled:opacity-50",
  ghost: "bg-transparent text-text border border-transparent hover:bg-text/10 active:bg-text/15 disabled:opacity-50",
  danger: "bg-rose text-ink-950 hover:brightness-110 active:brightness-95 disabled:opacity-50",
  success: "bg-lime text-ink-950 hover:brightness-110 active:brightness-95 disabled:opacity-50",
};

/**
 * Buttons keep a 44px minimum height (touch-target size, WCAG 2.5.5) while padding and text follow the fluid type scale,
 * so they grow with the viewport instead of being fixed-height boxes.
 */
export function Button({ variant = "primary", size = "md", className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "px-[0.85em] py-[0.4em] text-sm", md: "px-[1.1em] py-[0.6em] text-sm", lg: "px-[1.4em] py-[0.75em] text-base" };
  return (
    <button
      {...rest}
      className={cx("inline-flex min-h-11 items-center justify-center gap-2 rounded-xl font-semibold transition-[background-color,filter,transform,box-shadow] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100", sizes[size], VARIANTS[variant], className)}
    />
  );
}

/**
 * Surfaces with an elevation hierarchy: `flat` for inset content, `raised` (default) for cards, `floating` for menus
 * and dialogs. `interactive` adds hover lift, pressed state and a focus ring for cards that are a single control.
 */
export function Card({ className, elevation = "raised", interactive = false, ...rest }: HTMLAttributes<HTMLDivElement> & { elevation?: "flat" | "raised" | "floating"; interactive?: boolean }) {
  const elev = { flat: "bg-ink-900/60", raised: "bg-ink-800/80 shadow-e2", floating: "bg-ink-800 shadow-e3" }[elevation];
  return (
    <div
      {...rest}
      className={cx(
        "rounded-2xl border border-line p-5 backdrop-blur",
        elev,
        interactive && "transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-neon/50 hover:shadow-e3 focus-within:border-neon/60 active:translate-y-0",
        className,
      )}
    />
  );
}

export function Badge({ tone = "neutral", className, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "neon" | "violet" | "lime" | "amber" | "rose" }) {
  const tones = {
    neutral: "border-line bg-ink-700 text-muted",
    neon: "border-neon/40 bg-neon/10 text-neon",
    violet: "border-violet/40 bg-violet/15 text-violet-soft",
    lime: "border-lime/40 bg-lime/10 text-lime",
    amber: "border-amber/40 bg-amber/10 text-amber",
    rose: "border-rose/40 bg-rose/10 text-rose",
  };
  return <span {...rest} className={cx("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", tones[tone], className)} />;
}

/** Decorative by default (it always sits next to text that says what is happening); pass a translated `label` to make it a status of its own. */
export function Spinner({ className, label }: { className?: string; label?: string }) {
  return <span {...(label ? { role: "status", "aria-label": label } : { "aria-hidden": true })} className={cx("inline-block size-5 animate-spin rounded-full border-2 border-neon border-t-transparent", className)} />;
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

/** Field states: default, focus, invalid (`aria-invalid`), valid (`data-valid`), disabled. */
const fieldBase = cx(
  "w-full rounded-xl border border-line bg-ink-900 px-3.5 py-2.5 text-sm text-text shadow-e1 transition-[border-color,box-shadow] placeholder:text-muted",
  "hover:border-muted/60 focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/40",
  "aria-[invalid=true]:border-rose aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-rose/30",
  "data-[valid=true]:border-lime/70",
  "disabled:cursor-not-allowed disabled:bg-ink-700 disabled:text-muted disabled:opacity-70",
);

/**
 * Label + control + hint/error/success. The single child control gets `id`, `aria-invalid` and `aria-describedby`
 * wired automatically, so error and success messages are announced with the field.
 */
export function Field({ label, hint, error, success, children, htmlFor, required }: { label: string; hint?: string; error?: string | null; success?: string | null; children: ReactNode; htmlFor?: string; required?: boolean }) {
  const auto = useId();
  const id = htmlFor ?? `f${auto}`;
  const msgId = `${id}-msg`;
  const message = error ?? success ?? hint ?? null;
  const only = Children.count(children) === 1 && isValidElement(children) ? (children as ReactElement<Record<string, unknown>>) : null;
  const control = only
    ? cloneElement(only, {
        id: (only.props.id as string | undefined) ?? id,
        "aria-invalid": error ? true : (only.props["aria-invalid"] as boolean | undefined),
        "aria-describedby": message ? msgId : (only.props["aria-describedby"] as string | undefined),
        "aria-required": required ? true : (only.props["aria-required"] as boolean | undefined),
        "data-valid": success && !error ? true : undefined,
      })
    : children;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-text">
        {label}
      </label>
      {control}
      {error ? (
        <p id={msgId} role="alert" className="text-xs font-medium text-rose">{error}</p>
      ) : success ? (
        <p id={msgId} role="status" className="text-xs font-medium text-lime">{success}</p>
      ) : hint ? (
        <p id={msgId} className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

// dir="auto": what people type (a subject, a goal, a name) can be Hebrew or English inside an RTL page; a field pinned to one
// direction would misplace the other. Fields that must stay LTR (e-mail, passwords, codes) pass dir="ltr" explicitly.
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input dir="auto" {...p} className={cx(fieldBase, p.className)} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea dir="auto" {...p} className={cx(fieldBase, "min-h-24 resize-y", p.className)} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx(fieldBase, p.className)} />;

export function Stars({ n, size = "md", label }: { n: number; size?: "sm" | "md" | "lg"; label?: string }) {
  const sz = { sm: "size-4", md: "size-5", lg: "size-9" }[size];
  return (
    <span role="img" aria-label={label ?? `${n}/3`} className="inline-flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <Star key={i} aria-hidden className={cx(sz, i <= n ? "fill-amber text-amber" : "fill-ink-600 text-ink-600")} />
      ))}
    </span>
  );
}

/** Direction-aware arrow: "forward" points to where reading continues (right in LTR, left in RTL). */
export function Arrow({ back = false }: { back?: boolean }) {
  return <span aria-hidden className="inline-block rtl:-scale-x-100">{back ? "←" : "→"}</span>;
}
