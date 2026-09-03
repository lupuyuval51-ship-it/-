"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  Settings,
  ShieldCheck,
  Gamepad2,
  Trophy,
  Zap,
  Flame,
  BookOpen,
  Download,
  Trash2,
  Check,
  Plus,
  Users,
  Flag,
  Lock,
  FileCheck2,
  RefreshCw,
} from "lucide-react";
import { useApp } from "../context";
import {
  Button,
  PageTitle,
  Field,
  Notice,
  Empty,
  Modal,
  Progress,
  Back,
} from "../ui";
import { api } from "@/lib/client";
import type { MessageKey } from "@/lib/i18n";
import { GAME_MODE_LABELS, WORLD_LABELS, type GameMode } from "@/lib/game";
import { orderStatus } from "./account";
export function Profile() {
  const { t, l, state, catalog } = useApp();
  return (
    <>
      <section className="profile-heading">
        <div className="avatar large">
          {state.profile?.avatarId ? (
            <img src={"/api/files/" + state.profile.avatarId} alt="" />
          ) : (
            (state.profile?.displayName || "L").slice(0, 1)
          )}
        </div>
        <div>
          <span className="tag">
            <Lock size={13} />
            {t("privateProfile")}
          </span>
          <h1>{state.profile?.displayName}</h1>
          <p>
            {t("level")} {Math.floor(state.xp / 500) + 1} · {state.plan}
          </p>
        </div>
        <Link href="/settings" className="button secondary">
          <Settings size={17} />
          {t("settings")}
        </Link>
      </section>
      <div className="profile-stats">
        {[
          [Zap, state.xp + " XP", t("xp")],
          [Flame, state.streak, t("streak")],
          [
            BookOpen,
            state.enrollments?.filter((e: any) => e.progress === 100).length ||
              0,
            t("completed"),
          ],
          [Trophy, state.achievements?.length || 0, t("achievements")],
        ].map(([Icon, value, label]: any, i) => (
          <div key={i}>
            <Icon size={21} />
            <b>{value}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="two-columns">
        <section>
          <h2>{t("achievements")}</h2>
          {state.achievements?.length ? (
            <div className="achievement-list">
              {state.achievements.map((a: any) => (
                <div key={a.id}>
                  <span className="achievement-icon">
                    <Trophy size={25} />
                  </span>
                  <h3>{l(a.title)}</h3>
                  <p>{l(a.description)}</p>
                </div>
              ))}
            </div>
          ) : (
            <Empty title={t("noAchievements")} />
          )}
        </section>
        <section>
          <h2>{t("skills")}</h2>
          {state.enrollments?.map((e: any) => {
            const p = catalog.paths.find((p: any) => p.id === e.pathId);
            return (
              <Link
                key={e.id}
                href={"/paths/" + e.id}
                className="profile-skill"
              >
                <span>{l(p?.title) || e.skill}</span>
                <Progress value={e.progress || 0} />
              </Link>
            );
          })}
          <h2>{t("inventory")}</h2>
          <div className="world-tags">
            {Object.values(WORLD_LABELS)
              .slice(
                0,
                state.features?.canAccessPremium3DWorlds
                  ? 5
                  : state.features?.canAccessBasic3DWorlds
                    ? 3
                    : 0,
              )
              .map((v: any, i) => (
                <span className="tag" key={i}>
                  <Gamepad2 size={15} />
                  {l(v)}
                </span>
              ))}
          </div>
        </section>
      </div>
    </>
  );
}
export function SettingsScreen() {
  const {
    t,
    state,
    locale,
    setLocale,
    setTheme,
    theme,
    toast,
    setState,
    go,
    logout,
  } = useApp();
  const [form, setForm] = useState<any>({ ...state.profile, locale, theme });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [remove, setRemove] = useState(false);
  const [cancelPlan, setCancelPlan] = useState(false);
  const [password, setPassword] = useState("");
  const isGuest = !!state.user?.email?.endsWith("@guest.invalid");
  const update = (key: string, value: any) =>
    setForm({ ...form, [key]: value });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { birthYear, ...rest } = form;
      const r = await api("/settings", {
        ...rest,
        ...(birthYear ? { birthYear } : {}),
      });
      setState(r.state);
      setLocale(form.locale);
      setTheme(form.theme);
      toast(t("saved"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const toggle = (key: string, label: MessageKey) => (
    <label className="toggle-row" key={key}>
      <span>{t(label)}</span>
      <input
        type="checkbox"
        checked={form[key] ?? false}
        onChange={(e) => update(key, e.target.checked)}
      />
    </label>
  );
  return (
    <>
      <PageTitle title={t("settings")} subtitle={t("privateNote")} />
      <nav className="settings-shortcuts" aria-label={t("settings")}>
        <Link href="/profile">{t("profile")}</Link>
        <Link href="/coach">{t("coach")}</Link>
        <Link href="/community">{t("community")}</Link>
        <Button variant="tertiary" onClick={logout}>
          {t("logout")}
        </Button>
      </nav>
      <form className="settings-form" onSubmit={save}>
        <section className="settings-section">
          <div>
            <User size={22} />
            <h2>{t("profile")}</h2>
          </div>
          <div>
            <Field label={t("displayName")}>
              <input
                required
                maxLength={40}
                value={form.displayName || ""}
                onChange={(e) => update("displayName", e.target.value)}
              />
            </Field>
            <Field label={t("avatar")} help={t("fileHelp")}>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const f = new FormData();
                    f.append("file", file);
                    f.append("purpose", "avatar");
                    const r = await api("/uploads", f);
                    update("avatarId", r.fileId || r.id);
                    toast(t("saved"));
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              />
            </Field>
            <Field label={t("birthYear")} help={t("birthYearHelp")}>
              <input
                type="number"
                min={1900}
                max={new Date().getFullYear() - 5}
                placeholder="—"
                value={form.birthYear || ""}
                onChange={(e) =>
                  update(
                    "birthYear",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              />
            </Field>
            <div className="field-grid">
              <Field label={t("language")}>
                <select
                  value={form.locale}
                  onChange={(e) => update("locale", e.target.value)}
                >
                  <option value="he">{t("hebrew")}</option>
                  <option value="en">{t("english")}</option>
                </select>
              </Field>
              <Field label={t("appearance")}>
                <select
                  value={form.theme}
                  onChange={(e) => update("theme", e.target.value)}
                >
                  <option value="dark">{t("dark")}</option>
                  <option value="light">{t("light")}</option>
                </select>
              </Field>
            </div>
            <Field label={t("coachStyle")}>
              <select
                value={form.coachStyle || "supportive"}
                onChange={(e) => update("coachStyle", e.target.value)}
              >
                {[
                  ["supportive", "calm"],
                  ["direct", "direct"],
                  ["energetic", "energetic"],
                  ["professional", "professional"],
                ].map(([v, k]) => (
                  <option value={v} key={v}>
                    {t(k as MessageKey)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("timezone")}>
              <select
                value={form.timezone || "Asia/Jerusalem"}
                onChange={(e) => update("timezone", e.target.value)}
              >
                {[
                  "Asia/Jerusalem",
                  "Europe/London",
                  "Europe/Paris",
                  "America/New_York",
                  "America/Los_Angeles",
                  "Asia/Tokyo",
                  "Australia/Sydney",
                ].map((v) => (
                  <option value={v} key={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>
        <section className="settings-section">
          <div>
            <ShieldCheck size={22} />
            <h2>{t("privacySettings")}</h2>
          </div>
          <div>
            <label className="toggle-row">
              <span>{t("privateProfile")}</span>
              <input
                type="checkbox"
                checked={form.privacy !== "public"}
                onChange={(e) =>
                  update("privacy", e.target.checked ? "private" : "public")
                }
              />
            </label>
            {toggle("leaderboards", "leaderboardOpt")}
            {toggle("leagues", "leagueOpt")}
            {toggle("notifications", "notificationOpt")}
            {toggle("streaks", "streakOpt")}
            <p className="small-text muted">{t("privateNote")}</p>
          </div>
        </section>
        <section className="settings-section">
          <div>
            <Gamepad2 size={22} />
            <h2>{t("gameSettings")}</h2>
          </div>
          <div>
            <Field label={t("graphics")}>
              <select
                value={form.quality || "auto"}
                onChange={(e) => update("quality", e.target.value)}
              >
                {["auto", "low", "high"].map((v) => (
                  <option value={v} key={v}>
                    {t(v as MessageKey)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("sensitivity")}>
              <input
                type="range"
                min="0.2"
                max="3"
                step="0.1"
                value={form.sensitivity || 1}
                onChange={(e) => update("sensitivity", Number(e.target.value))}
              />
            </Field>
            {toggle("music", "music")}
            {toggle("effects", "effects")}
            {toggle("reducedMotion", "reducedMotion")}
            <label className="toggle-row">
              <span>{t("leftHanded")}</span>
              <input
                type="checkbox"
                checked={form.controlsSide === "left"}
                onChange={(e) =>
                  update("controlsSide", e.target.checked ? "left" : "right")
                }
              />
            </label>
            <Button
              variant="tertiary"
              type="button"
              onClick={() => {
                localStorage.removeItem("levelup-game-tutorial");
                update("gameTutorial", true);
                toast(t("saved"));
              }}
            >
              {t("howToPlay")}
            </Button>
          </div>
        </section>
        {error && <Notice type="error">{error}</Notice>}
        <div className="settings-save">
          <Button busy={busy}>
            <Check size={17} />
            {t("save")}
          </Button>
        </div>
      </form>
      <section className="settings-section">
        <div>
          <FileCheck2 size={22} />
          <h2>{t("subscription")}</h2>
        </div>
        <div>
          <h3>{state.plan}</h3>
          <dl className="detail-list">
            <div>
              <dt>{t("aiAllowance")}</dt>
              <dd>{state.features?.coachDailyLimit ?? 0}</dd>
            </div>
          </dl>
          <p className="small-text muted">{t("aiAllowanceSub")}</p>
          <p>{t("bitManual")}</p>
          <div className="actions">
            <Link className="button secondary" href="/pricing">
              {t("upgrade")}
            </Link>
            <Link className="button secondary" href="/payment">
              {t("orders")}
            </Link>
            {state.plan !== "FREE" && (
              <Button variant="tertiary" onClick={() => setCancelPlan(true)}>
                {t("cancelSubscription")}
              </Button>
            )}
          </div>
        </div>
      </section>
      <section className="settings-section">
        <div>
          <ShieldCheck size={22} />
          <h2>{t("dataManagement")}</h2>
        </div>
        <div className="actions">
          <a
            href="/api/export"
            className="button secondary"
            download="levelup-data.json"
          >
            <Download size={17} />
            {t("export")}
          </a>
          <Button variant="destructive" onClick={() => setRemove(true)}>
            <Trash2 size={17} />
            {t("deleteAccount")}
          </Button>
        </div>
      </section>
      {state.isDemo && (
        <section className="settings-section">
          <div>
            <ShieldCheck size={22} />
            <h2>{t("demoScenarios")}</h2>
          </div>
          <div className="actions">
            {(["FREE", "BASIC"] as const).map((plan) => (
              <Button
                variant="secondary"
                key={plan}
                onClick={async () => {
                  const r = await api("/auth/demo", { role: "learner", plan });
                  setState(r.state || r);
                  go("/dashboard");
                }}
              >
                {t(plan === "FREE" ? "demoFree" : "demoBasic")}
              </Button>
            ))}
            <Button
              variant="secondary"
              onClick={async () => {
                const r = await api("/auth/demo", { role: "admin" });
                setState(r.state || r);
                go("/admin");
              }}
            >
              {t("demoAdmin")}
            </Button>
          </div>
        </section>
      )}
      {cancelPlan && (
        <Modal
          title={t("cancelSubscription")}
          onClose={() => setCancelPlan(false)}
        >
          <p>{t("cancelSubscriptionWarning")}</p>
          {error && <Notice type="error">{error}</Notice>}
          <div className="actions">
            <Button
              variant="destructive"
              busy={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  const result = await api("/subscription/cancel", {});
                  setState(result.state);
                  setCancelPlan(false);
                  toast(t("saved"));
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t("cancelSubscription")}
            </Button>
            <Button variant="secondary" onClick={() => setCancelPlan(false)}>
              {t("back")}
            </Button>
          </div>
        </Modal>
      )}
      {remove && (
        <Modal title={t("deleteAccount")} onClose={() => setRemove(false)}>
          <p>{t("deleteWarning")}</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api(
                  "/account/delete",
                  isGuest ? { confirm: true } : { password },
                );
                setState(null);
                go("/");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            {isGuest ? (
              <label className="check-label">
                <input type="checkbox" required />
                {t("confirmDeleteGuest")}
              </label>
            ) : (
              <Field label={t("password")}>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
            )}
            {error && <Notice type="error">{error}</Notice>}
            <Button variant="destructive">{t("deleteAccount")}</Button>
          </form>
        </Modal>
      )}
    </>
  );
}
export function Admin() {
  const { state, t, l, toast, refresh } = useApp();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState("payments");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const load = () =>
    api("/admin")
      .then(setData)
      .catch((e) => setError(e.message));
  useEffect(() => {
    if (state.user.role === "admin") load();
  }, [state.user.role]);
  if (state.user.role !== "admin")
    return <Empty title={t("noPermission")} icon={<Lock size={32} />} />;
  const action = async (url: string, body: any, id: string) => {
    setBusy(id);
    try {
      await api(url, body);
      await load();
      await refresh();
      toast(t("saved"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  };
  const orders = data?.orders || [];
  return (
    <>
      <PageTitle
        title={t("adminTitle")}
        subtitle={t("adminSub")}
        action={
          <Button variant="secondary" onClick={load}>
            <RefreshCw size={17} />
            {t("refresh")}
          </Button>
        }
      />
      <div className="admin-stats">
        <div>
          <small>{t("users")}</small>
          <b>{data?.users?.length || 0}</b>
        </div>
        <div>
          <small>{t("underReview")}</small>
          <b>
            {
              orders.filter((o: any) =>
                ["proof_uploaded", "under_review"].includes(o.status),
              ).length
            }
          </b>
        </div>
        <div>
          <small>{t("reports")}</small>
          <b>{data?.reports?.length || 0}</b>
        </div>
        <div>
          <small>{t("suspicious")}</small>
          <b>{data?.suspiciousAttempts?.length || 0}</b>
        </div>
      </div>
      <div className="tabs" role="tablist">
        {[
          "payments",
          "users",
          "moderation",
          "reports",
          "play",
          "pricing",
          "suspicious",
          "audit",
        ].map((v) => (
          <button
            role="tab"
            aria-selected={tab === v}
            key={v}
            className={tab === v ? "active" : ""}
            onClick={() => setTab(v)}
          >
            {t(v as MessageKey)}
          </button>
        ))}
      </div>
      {error && <Notice type="error">{error}</Notice>}
      {!data ? (
        <p>{t("loading")}</p>
      ) : tab === "payments" ? (
        <>
          <Field label={t("reviewNote")}>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
            />
          </Field>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("order")}</th>
                  <th>{t("name")}</th>
                  <th>{t("amount")}</th>
                  <th>{t("status")}</th>
                  <th>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.id}>
                    <td>
                      <b>{o.plan || t("marketplace")}</b>
                      <small dir="ltr">{o.id}</small>
                    </td>
                    <td>{o.displayName || o.userId?.slice(0, 8)}</td>
                    <td>₪{o.amount}</td>
                    <td>
                      <span className={"tag status-" + o.status}>
                        {orderStatus(t, o.status)}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {o.proofId && (
                          <a
                            href={"/api/files/" + o.proofId}
                            target="_blank"
                            rel="noreferrer"
                            className="button secondary compact"
                          >
                            {t("viewProof")}
                          </a>
                        )}
                        {["proof_uploaded", "under_review"].includes(
                          o.status,
                        ) && (
                          <>
                            <Button
                              className="compact"
                              busy={busy === o.id}
                              onClick={() =>
                                action(
                                  "/admin/orders/" + o.id,
                                  { action: "approve", note },
                                  o.id,
                                )
                              }
                            >
                              {t("approve")}
                            </Button>
                            <Button
                              variant="destructive"
                              className="compact"
                              disabled={!!busy}
                              onClick={() =>
                                action(
                                  "/admin/orders/" + o.id,
                                  { action: "reject", note },
                                  o.id,
                                )
                              }
                            >
                              {t("reject")}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!orders.length && <Empty title={t("noOrders")} />}
          </div>
        </>
      ) : tab === "users" ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("name")}</th>
                <th>{t("email")}</th>
                <th>{t("status")}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u: any) => (
                <tr key={u.id}>
                  <td>{u.displayName}</td>
                  <td dir="ltr">{u.email}</td>
                  <td>{t(u.blocked ? "blocked" : "active")}</td>
                  <td>
                    {u.id !== state.user.id && (
                      <Button
                        variant="secondary"
                        className="compact"
                        busy={busy === u.id}
                        onClick={() =>
                          action(
                            "/admin/users/" + u.id,
                            { action: u.blocked ? "unblock" : "block" },
                            u.id,
                          )
                        }
                      >
                        {t(u.blocked ? "unblock" : "block")}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === "moderation" ? (
        <div>
          {(data.marketplace || []).map((p: any) => (
            <div className="moderation-row" key={p.id}>
              <h3>{l(p.title)}</h3>
              <p>{l(p.data?.description)}</p>
              <span className="tag">
                {t(
                  p.status === "approved"
                    ? "approved"
                    : p.status === "rejected"
                      ? "rejected"
                      : p.status === "changes_requested"
                        ? "changesRequested"
                        : "underReview",
                )}
              </span>
              <div className="actions">
                <Button
                  variant="secondary"
                  onClick={() =>
                    action(
                      "/admin/marketplace/" + p.id,
                      { action: "approve", note },
                      p.id,
                    )
                  }
                >
                  {t("approve")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    action(
                      "/admin/marketplace/" + p.id,
                      { action: "reject", note },
                      p.id,
                    )
                  }
                >
                  {t("reject")}
                </Button>
              </div>
            </div>
          ))}
          {!data.marketplace?.length && <Empty title={t("empty")} />}
        </div>
      ) : tab === "pricing" ? (
        <div className="admin-prices">
          {data.plans.map((plan: any) => (
            <form
              key={plan.id}
              className="admin-price-row"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                action(
                  "/admin/plans/" + plan.id,
                  { action: "set-price", price: Number(form.get("price")) },
                  plan.id,
                );
              }}
            >
              <h3>{plan.id}</h3>
              <Field label={t("price")}>
                <input
                  type="number"
                  name="price"
                  min={0}
                  max={9999}
                  step="0.01"
                  defaultValue={plan.price}
                  required
                />
              </Field>
              <Button variant="secondary" busy={busy === plan.id}>
                {t("save")}
              </Button>
            </form>
          ))}
        </div>
      ) : tab === "suspicious" ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("name")}</th>
                <th>{t("score")}</th>
                <th>{t("time")}</th>
                <th>{t("attempts")}</th>
              </tr>
            </thead>
            <tbody>
              {data.suspiciousAttempts.map((attempt: any) => (
                <tr key={attempt.id}>
                  <td>{attempt.user_id}</td>
                  <td>{attempt.score}</td>
                  <td>{new Date(attempt.created_at).toLocaleString()}</td>
                  <td>{attempt.event_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.suspiciousAttempts.length && <Empty title={t("empty")} />}
        </div>
      ) : tab === "reports" ? (
        <div>
          {(data.reports || []).map((r: any) => (
            <div className="moderation-row" key={r.id}>
              <Flag size={19} />
              <p>{r.reason}</p>
              <small>{r.pathId}</small>
              <Button
                variant="secondary"
                onClick={() =>
                  action(
                    "/admin/reports/" + r.id,
                    { action: "resolve", note },
                    r.id,
                  )
                }
              >
                {t("completed")}
              </Button>
            </div>
          ))}
          {!data.reports?.length && <Empty title={t("empty")} />}
        </div>
      ) : tab === "play" ? (
        <div>
          {(data.games || data.dailyGames || []).map((g: any) => (
            <div key={g.dailyGameId || g.id}>
              <div className="game-admin-row">
                <Gamepad2 size={20} />
                <span>{l(GAME_MODE_LABELS[g.mode as GameMode] || g.mode)}</span>
                <small>{g.date}</small>
                <Button
                  variant="secondary"
                  onClick={() =>
                    action(
                      "/admin/games/" + (g.dailyGameId || g.id),
                      { action: g.active === false ? "enable" : "disable" },
                      g.id,
                    )
                  }
                >
                  {t(g.active === false ? "enable" : "disable")}
                </Button>
              </div>
              <details className="admin-question-review">
                <summary>
                  {t("questions")} · {g.questions?.length}
                </summary>
                {g.questions?.map((question: any, index: number) => (
                  <div key={question.id || index}>
                    <h3>{l(question.prompt)}</h3>
                    <p>{l(question.explanation)}</p>
                  </div>
                ))}
              </details>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("time")}</th>
                <th>{t("actions")}</th>
                <th>{t("name")}</th>
              </tr>
            </thead>
            <tbody>
              {(data.logs || data.adminActions || []).map((a: any) => (
                <tr key={a.id}>
                  <td>{new Date(a.createdAt).toLocaleString("he-IL")}</td>
                  <td>{a.action}</td>
                  <td>{a.actorId?.slice(0, 8)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
export function Community() {
  const { t, state, toast } = useApp();
  const [data, setData] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const load = () =>
    api("/challenges")
      .then((r) => setData(r.challenges || r || []))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  return (
    <>
      <PageTitle title={t("challengeTitle")} subtitle={t("challengeSub")} />
      <section className="season-panel">
        <Trophy size={32} />
        <div>
          <span className="eyebrow">{t("season")}</span>
          <h2>{t("weekGoal")}</h2>
          <p>{t("seasonNote")}</p>
          <Progress
            value={Math.min(
              100,
              ((state.submissions || []).filter(
                (s: any) =>
                  Date.now() - new Date(s.createdAt).getTime() < 7 * 86400000,
              ).length /
                3) *
                100,
            )}
          />
        </div>
      </section>
      <div className="two-columns">
        <section>
          <h2>{t("community")}</h2>
          {data.length ? (
            data.map((c: any) => (
              <div className="challenge-row" key={c.id}>
                <Users size={22} />
                <div>
                  <h3>{c.title || c.name}</h3>
                  <small>
                    {t("inviteCode")}: <b dir="ltr">{c.code}</b> ·{" "}
                    {c.score || 0} XP
                  </small>
                </div>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(c.code);
                      await load();
                      toast(t("saved"));
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  {t("copy")}
                </Button>
              </div>
            ))
          ) : (
            <Empty title={t("challengeEmpty")} />
          )}
        </section>
        <section>
          <h2>{t("createChallenge")}</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api("/challenges", {
                  title,
                  name: title,
                  type: "tasks",
                  target: 3,
                });
                setTitle("");
                load();
                toast(t("saved"));
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <Field label={t("challengeName")}>
              <input
                required
                minLength={5}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Button>{t("createChallenge")}</Button>
          </form>
          <div className="divider" />
          <h2>{t("joinCode")}</h2>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await api("/challenges", { action: "join", code });
                setCode("");
                await load();
                toast(t("saved"));
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <Field label={t("inviteCode")}>
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                dir="ltr"
                maxLength={30}
              />
            </Field>
            <Button variant="secondary">{t("joinChallenge")}</Button>
          </form>
          {error && <Notice type="error">{error}</Notice>}
        </section>
      </div>
    </>
  );
}
export function Creator() {
  const { t, state, toast } = useApp();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "programming",
    price: 0,
  });
  const [tasks, setTasks] = useState([
    { title: "", instructions: "" },
    { title: "", instructions: "" },
    { title: "", instructions: "" },
  ]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Back href="/marketplace" />
      <PageTitle title={t("publish")} subtitle={t("publishSub")} />
      {!state.features?.canPublishMarketplacePath ? (
        <Empty
          title={t("noPermission")}
          action={
            <Link href="/pricing" className="button primary">
              {t("upgrade")}
            </Link>
          }
        />
      ) : (
        <form
          className="creator-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api("/marketplace", { ...form, tasks });
              toast(t("publishDone"));
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label={t("title")}>
            <input
              required
              minLength={5}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label={t("description")}>
            <textarea
              required
              minLength={20}
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Field>
          <Field label={t("price")}>
            <input
              type="number"
              min={0}
              max={500}
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
            />
          </Field>
          <h2>{t("tasks")}</h2>
          {tasks.map((task, i) => (
            <fieldset key={i}>
              <legend>
                {t("step")} {i + 1}
              </legend>
              <Field label={t("title")}>
                <input
                  value={task.title}
                  minLength={3}
                  required
                  onChange={(e) =>
                    setTasks(
                      tasks.map((v, j) =>
                        i === j ? { ...v, title: e.target.value } : v,
                      ),
                    )
                  }
                />
              </Field>
              <Field label={t("instructions")}>
                <textarea
                  value={task.instructions}
                  minLength={15}
                  required
                  onChange={(e) =>
                    setTasks(
                      tasks.map((v, j) =>
                        i === j ? { ...v, instructions: e.target.value } : v,
                      ),
                    )
                  }
                />
              </Field>
            </fieldset>
          ))}
          <Button
            variant="secondary"
            type="button"
            onClick={() =>
              setTasks([...tasks, { title: "", instructions: "" }])
            }
          >
            <Plus size={18} />
            {t("tasks")}
          </Button>
          {error && <Notice type="error">{error}</Notice>}
          <Button busy={busy}>{t("submitReview")}</Button>
        </form>
      )}
    </>
  );
}
export function Legal({ type }: { type: string }) {
  const { t } = useApp();
  return (
    <main className="legal-page" id="main">
      <Back href="/" />
      <PageTitle title={t(type === "privacy" ? "privacy" : "terms")} />
      <Notice>{t("legalDemo")}</Notice>
      <p>{t(type === "privacy" ? "privacyBody" : "termsBody")}</p>
      <Link className="button secondary" href="/">
        {t("back")}
      </Link>
    </main>
  );
}
