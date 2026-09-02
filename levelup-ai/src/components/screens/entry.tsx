"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Code2,
  Target,
  Clock,
  Gamepad2,
  Eye,
  EyeOff,
  ChevronDown,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useApp } from "../context";
import { Logo } from "../levelup-app";
import { Button, Field, Notice, PathCard, Back, Progress } from "../ui";
import { api } from "@/lib/client";
import QuestArt from "../quest-art";
import type { MessageKey } from "@/lib/i18n";
export function Landing() {
  const { t, l, catalog, go, setState } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const demo = async () => {
    setBusy(true);
    try {
      const r = await api("/auth/demo", { role: "learner" });
      setState(r.state || r);
      go("/dashboard");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="landing">
      <header className="marketing-nav">
        <Link href="/">
          <Logo />
        </Link>
        <nav>
          <a href="#how">{t("discover")}</a>
          <Link href="/pricing">{t("pricing")}</Link>
          <Link href="/login">{t("login")}</Link>
          <Link className="button primary compact" href="/register">
            {t("startFree")}
          </Link>
        </nav>
      </header>
      <main id="main">
        <section className="marketing-hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="small-square" />
              {t("heroTag")}
            </div>
            <h1>{t("heroTitle")}</h1>
            <p>{t("heroSub")}</p>
            <div className="actions">
              <Link className="button primary" href="/register">
                {t("startFree")}
                <ArrowLeft size={18} />
              </Link>
              {catalog.isDemo && (
                <Button variant="secondary" busy={busy} onClick={demo}>
                  {t("demo")}
                </Button>
              )}
            </div>
            <small className="hero-footnote">
              <ShieldCheck size={16} />
              {t("privateNote")}
            </small>
            {error && <Notice type="error">{error}</Notice>}
          </div>
          <div className="hero-visual">
            <QuestArt />
            <div className="visual-caption">
              <span className="live-dot" />
              <span>{t("dailyQuest")}</span>
              <span>{t("city")}</span>
            </div>
            <div className="hero-task">
              <Code2 size={22} />
              <div>
                <small>{t("dailyTask")}</small>
                <b>
                  {l(catalog.paths[0]?.chapters?.[0]?.tasks?.[0]?.title) ||
                    t("newPath")}
                </b>
              </div>
              <span>
                +{catalog.paths[0]?.chapters?.[0]?.tasks?.[0]?.xp || 0} XP
              </span>
            </div>
          </div>
        </section>
        <section className="marketing-paths">
          <div className="section-heading">
            <div>
              <div className="eyebrow">{t("builtFor")}</div>
              <h2>{t("recommended")}</h2>
            </div>
            <Link href="/register">
              {t("allCatalog")}
              <ArrowLeft size={16} />
            </Link>
          </div>
          <div className="path-grid">
            {catalog.paths.slice(0, 4).map((p: any) => (
              <PathCard key={p.id} path={p} />
            ))}
          </div>
        </section>
        <section id="how" className="how-section">
          <h2>{t("howItWorks")}</h2>
          <div className="how-grid">
            {[Target, Code2, Gamepad2].map((Icon, i) => (
              <div key={i}>
                <span className="step-number">0{i + 1}</span>
                <Icon size={24} />
                <h3>{t(("how" + (i + 1)) as MessageKey)}</h3>
                <p>{t(("how" + (i + 1) + "Sub") as MessageKey)}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="marketing-quest">
          <div>
            <div className="eyebrow">{t("dailyQuest")}</div>
            <h2>{t("questTitle")}</h2>
            <p>{t("questSub")}</p>
            <Link href="/pricing" className="button primary">
              {t("open3d")}
              <Gamepad2 size={19} />
            </Link>
            <small>{t("basicTeaser")}</small>
          </div>
          <QuestArt />
        </section>
        <section className="coach-marketing">
          <Sparkles size={28} />
          <h2>{t("coachTitle")}</h2>
          <p>{t("coachSub")}</p>
          <Link href="/register" className="text-link">
            {t("startFree")}
            <ArrowLeft size={16} />
          </Link>
        </section>
        <section className="faq">
          <h2>{t("faq")}</h2>
          {[1, 2, 3, 4].map((i) => (
            <details key={i}>
              <summary>
                {t(("faq" + i) as MessageKey)}
                <ChevronDown size={18} />
              </summary>
              <p>{t(("faq" + i + "a") as MessageKey)}</p>
            </details>
          ))}
        </section>
      </main>
      <footer className="marketing-footer">
        <Logo />
        <p>{t("footerNote")}</p>
        <div>
          <Link href="/pricing">{t("pricing")}</Link>
          <Link href="/terms">{t("terms")}</Link>
          <Link href="/privacy">{t("privacy")}</Link>
        </div>
      </footer>
    </div>
  );
}
export function Auth({ mode }: { mode: string }) {
  const { t, go, setState, catalog } = useApp();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
    birthYear: 2005,
    parentEmail: "",
    consent: false,
    remember: true,
    token: "",
  });
  useEffect(() => {
    setForm((f) => ({
      ...f,
      token: new URLSearchParams(window.location.search).get("token") || "",
    }));
  }, []);
  const set = (key: string, value: any) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      let r;
      if (mode === "login") {
        r = await api("/auth/login", form);
        setState(r.state || r);
        go("/dashboard");
      } else if (mode === "register") {
        r = await api("/auth/register", form);
        setResult(r);
        setMessage(t("registered"));
      } else if (mode === "forgot") {
        r = await api("/auth/forgot", { email: form.email });
        setResult(r);
        setMessage(t("authNotice"));
      } else if (mode === "verify" || mode === "parent") {
        r = await api(mode === "parent" ? "/auth/parent" : "/auth/verify", {
          token: form.token,
        });
        setResult(r);
        setMessage(t("saved"));
        if (r.state) setState(r.state);
      } else {
        r = await api("/auth/reset", {
          token: form.token,
          password: form.password,
        });
        setMessage(t("saved"));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const demo = async () => {
    setBusy(true);
    try {
      const r = await api("/auth/demo", { role: "learner" });
      setState(r.state || r);
      go("/dashboard");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const title =
    mode === "parent"
      ? "parentTitle"
      : mode === "register"
        ? "register"
        : mode === "forgot"
          ? "resetTitle"
          : mode === "reset"
            ? "resetTitle"
            : mode === "verify"
              ? "verifyTitle"
              : "login";
  const demoLink =
    result?.verification?.url ||
    result?.reset?.url ||
    result?.url ||
    result?.demoUrl;
  return (
    <div className="auth-page">
      <div className="auth-aside">
        <Link href="/">
          <Logo />
        </Link>
        <div>
          <div className="eyebrow">{t("brandTag")}</div>
          <h1>{t("authTitle")}</h1>
          <p>{t("authSub")}</p>
          <QuestArt />
        </div>
        <small>{t("privateNote")}</small>
      </div>
      <main id="main" className="auth-main">
        <div className="auth-form">
          <Back href="/" />
          <h2>{t(title)}</h2>
          <form onSubmit={submit}>
            {mode === "register" && (
              <Field label={t("displayName")}>
                <input
                  autoComplete="nickname"
                  required
                  maxLength={40}
                  value={form.displayName}
                  onChange={(e) => set("displayName", e.target.value)}
                />
              </Field>
            )}
            {!["reset", "verify", "parent"].includes(mode) && (
              <Field label={t("email")}>
                <input
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
            )}
            {!["forgot", "verify", "parent"].includes(mode) && (
              <Field
                label={t("password")}
                help={mode === "register" ? t("passwordHelp") : undefined}
              >
                <div className="password-input">
                  <input
                    required
                    type={show ? "text" : "password"}
                    dir="ltr"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    minLength={mode === "login" ? 1 : 10}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                  />
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={t(show ? "hidePassword" : "showPassword")}
                    onClick={() => setShow(!show)}
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>
            )}
            {["reset", "verify", "parent"].includes(mode) && (
              <Field label={t("token")}>
                <input
                  required
                  value={form.token}
                  onChange={(e) => set("token", e.target.value)}
                />
              </Field>
            )}
            {mode === "register" && (
              <>
                <Field label={t("birthYear")} help={t("parentHelp")}>
                  <input
                    type="number"
                    min={1920}
                    max={new Date().getFullYear() - 5}
                    required
                    value={form.birthYear}
                    onChange={(e) => set("birthYear", Number(e.target.value))}
                  />
                </Field>
                {new Date().getFullYear() - form.birthYear < 16 && (
                  <Field label={t("parentEmail")}>
                    <input
                      type="email"
                      required
                      value={form.parentEmail}
                      onChange={(e) => set("parentEmail", e.target.value)}
                    />
                  </Field>
                )}
                <label className="check-label">
                  <input
                    type="checkbox"
                    required
                    checked={form.consent}
                    onChange={(e) => set("consent", e.target.checked)}
                  />
                  <span>
                    {t("consent")}{" "}
                    <Link href="/terms" target="_blank">
                      {t("terms")}
                    </Link>{" "}
                    ·{" "}
                    <Link href="/privacy" target="_blank">
                      {t("privacy")}
                    </Link>
                  </span>
                </label>
              </>
            )}
            {mode === "login" && (
              <div className="form-between">
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={form.remember}
                    onChange={(e) => set("remember", e.target.checked)}
                  />
                  {t("remember")}
                </label>
                <Link href="/forgot">{t("forgot")}</Link>
              </div>
            )}
            {error && <Notice type="error">{error}</Notice>}
            {message && <Notice type="success">{message}</Notice>}
            {demoLink && (
              <Notice>
                <b>{t("demoMail")}</b>
                <p>
                  <a href={demoLink}>
                    {mode === "forgot" ? t("resetTitle") : t("verifyTitle")}
                  </a>
                </p>
              </Notice>
            )}
            {result?.parental?.url && (
              <Notice>
                <a href={result.parental.url}>{t("pendingParent")}</a>
              </Notice>
            )}
            {mode === "parent" && (
              <label className="check-label">
                <input type="checkbox" required />
                {t("parentConsent")}
              </label>
            )}
            <Button className="full-width" busy={busy} type="submit">
              {t(
                mode === "parent"
                  ? "parentApprove"
                  : mode === "forgot"
                    ? "resetSend"
                    : mode === "reset"
                      ? "resetPassword"
                      : mode === "verify"
                        ? "verify"
                        : mode === "register"
                          ? "register"
                          : "login",
              )}
              <ArrowLeft size={18} />
            </Button>
          </form>
          {mode === "login" || mode === "register" ? (
            <>
              <p className="auth-switch">
                {t(mode === "login" ? "noAccount" : "haveAccount")}{" "}
                <Link href={mode === "login" ? "/register" : "/login"}>
                  {t(mode === "login" ? "register" : "login")}
                </Link>
              </p>
              {catalog.isDemo && (
                <Button
                  variant="secondary"
                  className="full-width"
                  onClick={demo}
                  busy={busy}
                >
                  {t("demo")}
                </Button>
              )}
            </>
          ) : (
            <Link href="/login" className="button secondary full-width">
              {t("login")}
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
export function Onboarding() {
  const { t, l, catalog, go, setState, toast, refresh, state } = useApp();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const emptyForm = {
    skill: "",
    pathId: "website",
    level: "beginner",
    dailyMinutes: 20,
    goal: "",
    targetDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    styles: ["mixed"] as string[],
  };
  const [form, setForm] = useState(emptyForm);
  useEffect(() => {
    try {
      const draft = JSON.parse(
        localStorage.getItem("levelup-onboarding") || "null",
      );
      // A draft written by an older build must never crash the wizard.
      if (draft && typeof draft === "object")
        setForm((current) => ({
          ...current,
          ...draft,
          styles: Array.isArray(draft.styles) ? draft.styles : current.styles,
        }));
    } catch {
      /* An unreadable draft is simply discarded. */
    }
  }, []);
  const store = (next: typeof emptyForm) => {
    setForm(next);
    try {
      localStorage.setItem("levelup-onboarding", JSON.stringify(next));
    } catch {
      /* Private-mode storage failures must not block the wizard. */
    }
  };
  const set = (key: string, value: any) => store({ ...form, [key]: value });
  const stepBlocked =
    (step === 0 &&
      !form.pathId &&
      form.skill.trim().length < 2 &&
      "chooseSkillFirst") ||
    (step === 3 && form.goal.trim().length < 5 && "goalTooShort") ||
    (step === 4 && form.styles.length === 0 && "chooseStyle") ||
    "";
  const create = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await api("/enrollments", {
        ...form,
        pathId: form.pathId || undefined,
      });
      if (r.state) setState(r.state);
      await refresh();
      try {
        localStorage.removeItem("levelup-onboarding");
      } catch {
        /* The draft is replaced on the next run anyway. */
      }
      toast(t("pathCreated"));
      go(
        "/paths/" +
          (r.enrollment?.id ||
            r.enrollmentId ||
            r.id ||
            r.state?.enrollments?.at(-1)?.id),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="onboarding">
      <Back />
      <div className="onboarding-progress">
        <span>
          {t("step")} {step + 1} {t("of")} 6
        </span>
        <Progress value={((step + 1) / 6) * 100} />
      </div>
      <h1>
        {t(
          (
            [
              "onboardingTitle",
              "levelQuestion",
              "timeQuestion",
              "goalQuestion",
              "styleQuestion",
              "readyQuestion",
            ] as MessageKey[]
          )[step],
        )}
      </h1>
      <p>{t(step === 5 ? "readySub" : "onboardingSub")}</p>
      {step === 5 && state.isDemo && <Notice>{t("demoPathNote")}</Notice>}
      <div className="onboarding-body">
        {step === 0 && (
          <>
            <Field label={t("skill")}>
              <input
                className="large-input"
                value={form.skill}
                onChange={(e) =>
                  store({ ...form, skill: e.target.value, pathId: "" })
                }
                placeholder={t("skillPlaceholder")}
                maxLength={150}
              />
            </Field>
            <div className="option-grid">
              {catalog.paths.map((p: any) => (
                <button
                  key={p.id}
                  className={
                    form.pathId === p.id ? "option selected" : "option"
                  }
                  onClick={() =>
                    store({ ...form, pathId: p.id, skill: l(p.title) })
                  }
                >
                  <Code2 size={20} />
                  {l(p.title)}
                  {form.pathId === p.id && <Check size={17} />}
                </button>
              ))}
            </div>
          </>
        )}
        {step === 1 && (
          <div className="option-grid single">
            {["beginner", "intermediate", "advanced"].map((v, i) => (
              <button
                className={form.level === v ? "option selected" : "option"}
                key={v}
                onClick={() => set("level", v)}
              >
                <span className="level-bars">
                  {Array.from({ length: i + 1 }, (_, j) => (
                    <i key={j} />
                  ))}
                </span>
                {t(v as MessageKey)}
                {form.level === v && <Check size={18} />}
              </button>
            ))}
          </div>
        )}
        {step === 2 && (
          <div className="option-grid">
            {[10, 20, 30, 60].map((v) => (
              <button
                className={
                  form.dailyMinutes === v ? "option selected" : "option"
                }
                key={v}
                onClick={() => set("dailyMinutes", v)}
              >
                <Clock size={21} />
                {v} {t("minutes")}
                {form.dailyMinutes === v && <Check size={18} />}
              </button>
            ))}
          </div>
        )}
        {step === 3 && (
          <>
            <Field label={t("goal")}>
              <textarea
                rows={3}
                value={form.goal}
                onChange={(e) => set("goal", e.target.value)}
                placeholder={t("goalPlaceholder")}
                maxLength={1000}
              />
            </Field>
            <Field label={t("targetDate")}>
              <input
                type="date"
                required
                min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                value={form.targetDate}
                onChange={(e) => set("targetDate", e.target.value)}
              />
            </Field>
          </>
        )}
        {step === 4 && (
          <div className="option-grid">
            {[
              "reading",
              "watching",
              "questions",
              "practice",
              "project",
              "games",
              "mixed",
            ].map((v) => (
              <button
                className={
                  form.styles.includes(v) ? "option selected" : "option"
                }
                key={v}
                onClick={() =>
                  set(
                    "styles",
                    form.styles.includes(v)
                      ? form.styles.filter((s) => s !== v)
                      : [...form.styles, v],
                  )
                }
              >
                {t(v as MessageKey)}
                {form.styles.includes(v) && <Check size={18} />}
              </button>
            ))}
          </div>
        )}
        {step === 5 && (
          <div className="journey-summary">
            <Target size={32} />
            <h2>
              {form.skill ||
                l(catalog.paths.find((p: any) => p.id === form.pathId)?.title)}
            </h2>
            <p>{form.goal}</p>
            <dl>
              <div>
                <dt>{t("level")}</dt>
                <dd>{t(form.level as MessageKey)}</dd>
              </div>
              <div>
                <dt>{t("time")}</dt>
                <dd>
                  {form.dailyMinutes} {t("minutes")}
                </dd>
              </div>
              <div>
                <dt>{t("targetDate")}</dt>
                <dd>{form.targetDate}</dd>
              </div>
            </dl>
            <Notice>
              {t("firstReward")}
              <p>{t("welcomeReward")}</p>
            </Notice>
          </div>
        )}
      </div>
      {error && <Notice type="error">{error}</Notice>}
      {stepBlocked && <Notice>{t(stepBlocked as MessageKey)}</Notice>}
      <div className="onboarding-actions">
        <Button
          variant="secondary"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0 || busy}
        >
          {t("back")}
        </Button>
        <Button
          busy={busy}
          onClick={() => (step === 5 ? create() : setStep(step + 1))}
          disabled={!!stepBlocked}
        >
          {t(busy ? "creating" : step === 5 ? "createPath" : "next")}
          <ArrowLeft size={18} />
        </Button>
      </div>
    </div>
  );
}
