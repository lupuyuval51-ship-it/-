"use client";
import Reinforcement from "../reinforcement";
import { useCheckout } from "../checkout";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Lock,
  Clock,
  Flame,
  Zap,
  Target,
  Gamepad2,
  Trophy,
  Plus,
  BookOpen,
  ArrowUpRight,
  Send,
  Bookmark,
  Flag,
  CheckCircle2,
  ChevronLeft,
  Lightbulb,
} from "lucide-react";
import { useApp } from "../context";
import {
  Button,
  PageTitle,
  Empty,
  Progress,
  PathCard,
  Countdown,
  Field,
  Notice,
  Back,
  Modal,
} from "../ui";
import { api, allTasks, completedIds, nextTask, progressOf } from "@/lib/client";
import QuestArt from "../quest-art";
import type { MessageKey } from "@/lib/i18n";
export function Dashboard() {
  const { state, catalog, t, l, go } = useApp();
  const enrollment =
    state.enrollments?.find((e: any) => e.status !== "completed") ||
    state.enrollments?.[0];
  const path = catalog.paths.find((p: any) => p.id === enrollment?.pathId);
  const task = nextTask(path, enrollment);
  const completions = (state.submissions || []).filter(
    (s: any) => Date.now() - new Date(s.createdAt).getTime() < 7 * 86400000,
  ).length;
  return (
    <>
      <PageTitle
        title={
          t("hello") +
          " " +
          (state.profile?.displayName || state.user?.displayName || "")
        }
        subtitle={t("todaySubtitle")}
        action={
          <Link className="button secondary compact" href="/onboarding">
            <Plus size={17} />
            {t("newPath")}
          </Link>
        }
      />
      <div className="dashboard-columns">
        <div className="dashboard-primary">
          <section className="daily-task-panel">
            <div className="section-kicker">
              <span className="small-square" />
              {t("dailyTask")}
              <span className="muted">
                {new Date().toLocaleDateString(
                  state.profile?.locale === "en" ? "en-GB" : "he-IL",
                  { day: "numeric", month: "long" },
                )}
              </span>
            </div>
            {task ? (
              <>
                <div className="task-context">
                  {l(path.title)}
                  <ChevronLeft size={14} />
                  {t("step")} {completedIds(enrollment).length + 1}
                </div>
                <h2>{l(task.title)}</h2>
                <p>{l(task.description)}</p>
                <div className="task-footer">
                  <div className="metadata">
                    <span>
                      <Clock size={16} />
                      {task.minutes} {t("minutes")}
                    </span>
                    <span>
                      <Zap size={16} />
                      {task.xp} XP
                    </span>
                  </div>
                  <Link
                    className="button primary"
                    href={"/tasks/" + enrollment.id + "/" + task.id}
                  >
                    {t("continueTask")}
                    <ArrowLeft size={18} />
                  </Link>
                </div>
              </>
            ) : (
              <Empty
                title={t("noPaths")}
                description={t("noPathsSub")}
                action={
                  <Link href="/onboarding" className="button primary">
                    {t("newPath")}
                  </Link>
                }
              />
            )}
          </section>
          <section className="daily-quest-panel">
            <div className="quest-panel-copy">
              <div className="eyebrow">
                <Gamepad2 size={17} />
                {t("dailyQuest")}
                <span className="tag">{state.plan}</span>
              </div>
              <h2>{t("questTitle")}</h2>
              <p>{t("questSub")}</p>
              <div className="metadata">
                <span>
                  <Clock size={15} />
                  3–7 {t("minutes")}
                </span>
                <span>
                  <Zap size={15} />
                  XP
                </span>
              </div>
              <Link href="/quest" className="button quest-button">
                {t(
                  state.features?.canPlayFull3DGames ? "startGame" : "preview",
                )}
                <ArrowLeft size={18} />
              </Link>
              <div className="quest-countdown">
                <span>{t("nextGame")}</span>
                <Countdown />
              </div>
            </div>
            <QuestArt />
          </section>
          <section className="journey-section">
            <div className="section-heading">
              <h2>{t("yourJourney")}</h2>
              <Link href="/paths">
                {t("allPaths")}
                <ArrowLeft size={15} />
              </Link>
            </div>
            {path ? (
              <Link href={"/paths/" + enrollment.id} className="journey-row">
                <div className="journey-icon">
                  <CodeIcon />
                </div>
                <div className="journey-info">
                  <h3>{l(path.title)}</h3>
                  <small>
                    {completedIds(enrollment).length} / {allTasks(path).length}{" "}
                    {t("tasks")}
                  </small>
                  <Progress value={progressOf(enrollment, path)} />
                </div>
                <b>{progressOf(enrollment, path)}%</b>
                <ChevronLeft size={19} />
              </Link>
            ) : (
              <p>{t("noPathsSub")}</p>
            )}
          </section>
          <section>
            <div className="section-heading">
              <h2>{t("recommended")}</h2>
              <Link href="/marketplace">
                {t("allCatalog")}
                <ArrowLeft size={15} />
              </Link>
            </div>
            <div className="path-grid two">
              {catalog.paths
                .filter((p: any) => p.id !== path?.id)
                .slice(0, 2)
                .map((p: any) => (
                  <PathCard path={p} key={p.id} />
                ))}
            </div>
          </section>
        </div>
        <aside className="dashboard-secondary">
          <section className="xp-panel">
            <div className="rank-icon">
              <Zap size={26} />
            </div>
            <div>
              <small>
                {t("level")} {Math.floor((state.xp || 0) / 500) + 1}
              </small>
              <h2>
                {(state.xp || 0).toLocaleString()} <small>XP</small>
              </h2>
            </div>
            <Progress value={((state.xp || 0) % 500) / 5} />
            <div className="xp-to-go">
              {500 - ((state.xp || 0) % 500)} XP {t("toGo")}
            </div>
            <div className="stats-pair">
              <div>
                <Flame size={19} />
                <b>{state.streak || 0}</b>
                <span>{t("streak")}</span>
              </div>
              <div>
                <Target size={19} />
                <b>{state.coins || 0}</b>
                <span>{t("coins")}</span>
              </div>
            </div>
          </section>
          <section className="weekly-panel">
            <h3>{t("weekly")}</h3>
            <div className="weekly-number">
              <b>{completions}</b>
              <span>{t("completedTasks")}</span>
            </div>
            <div className="weekly-marks">
              {Array.from({ length: 7 }, (_, i) => (
                <span
                  className={state.weekly?.[i]?.xp > 0 ? "done" : ""}
                  key={i}
                >
                  {state.weekly?.[i]?.xp > 0 ? <Check size={14} /> : i + 1}
                </span>
              ))}
            </div>
            <p>{t("weeklySub")}</p>
          </section>
          <section className="coach-tip">
            <div className="section-heading">
              <span className="coach-avatar">
                <Zap size={18} />
              </span>
              <h3>{t("coach")}</h3>
            </div>
            <p>{t("coachIntro")}</p>
            <Button variant="tertiary" onClick={() => go("/coach")}>
              {t("needHelp")}
              <ArrowLeft size={16} />
            </Button>
          </section>
          <section className="activity-panel">
            <h3>{t("activity")}</h3>
            {state.submissions?.length ? (
              state.submissions.slice(0, 3).map((s: any) => {
                const found = catalog.paths
                  .flatMap(allTasks)
                  .find((x: any) => x.id === s.taskId);
                return (
                  <div className="activity-item" key={s.id}>
                    <CheckCircle2 size={17} />
                    <div>
                      <p>{found ? l(found.title) : t("completed")}</p>
                      <small>+{s.xp || found?.xp || 0} XP</small>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="muted small-text">{t("noActivity")}</p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
function CodeIcon() {
  return <BookOpen size={24} />;
}
export function Paths() {
  const { state, catalog, t, l } = useApp();
  return (
    <>
      <PageTitle
        title={t("paths")}
        subtitle={t("todaySubtitle")}
        action={
          <Link href="/onboarding" className="button primary">
            <Plus size={18} />
            {t("newPath")}
          </Link>
        }
      />
      {state.enrollments?.length ? (
        <div className="enrollments">
          {state.enrollments.map((e: any) => {
            const p = catalog.paths.find((p: any) => p.id === e.pathId);
            if (!p)
              return (
                <div className="enrollment-row" key={e.id}>
                  <div>
                    <div className="eyebrow">{e.dailyMinutes} {t("minutes")}</div>
                    <h2>{l(e.title) || e.skill}</h2>
                    <p>{t("pathUnavailable")}</p>
                  </div>
                </div>
              );
            return (
              <Link
                className="enrollment-row"
                href={"/paths/" + e.id}
                key={e.id}
              >
                <img src={p.cover} alt="" />
                <div>
                  <div className="eyebrow">
                    {t(p.level)} · {e.dailyMinutes} {t("minutes")}
                  </div>
                  <h2>{l(p.title)}</h2>
                  <p>{e.goal || l(p.description)}</p>
                  <Progress value={progressOf(e, p)} label={t("progress")} />
                </div>
                <ArrowLeft size={22} />
              </Link>
            );
          })}
        </div>
      ) : (
        <Empty title={t("noPaths")} description={t("noPathsSub")} />
      )}
    </>
  );
}
export function PathDetail({ id }: { id: string }) {
  const { state, catalog, t, l, refresh, toast } = useApp();
  const e = state.enrollments?.find((x: any) => x.id === id);
  const path = catalog.paths.find((p: any) => p.id === e?.pathId);
  if (!path)
    return (
      <Empty
        title={t("notFound")}
        description={e ? t("pathUnavailable") : undefined}
        action={
          <Link href="/paths" className="button primary">
            {t("allPaths")}
          </Link>
        }
      />
    );
  const done = completedIds(e);
  const next = nextTask(path, e);
  let idx = 0;
  return (
    <>
      <Back href="/paths" />
      <PageTitle
        title={l(path.title)}
        subtitle={e.goal || l(path.description)}
        action={
          next && (
            <Link
              className="button primary"
              href={"/tasks/" + id + "/" + next.id}
            >
              {t("continueTask")}
              <ArrowLeft size={18} />
            </Link>
          )
        }
      />
      {path.sourceNotice && <Notice>{l(path.sourceNotice)}</Notice>}
      <div className="path-layout">
        <div className="journey-map">
          {path.chapters.map((chapter: any, ci: number) => (
            <section className="chapter" key={chapter.id}>
              <div className="chapter-heading">
                <span>{String(ci + 1).padStart(2, "0")}</span>
                <div>
                  <small>
                    {t("step")} {ci + 1}
                  </small>
                  <h2>{l(chapter.title)}</h2>
                </div>
              </div>
              <div className="chapter-tasks">
                {chapter.tasks.map((task: any) => {
                  const isDone = done.includes(task.id);
                  const unlocked = isDone || idx <= done.length;
                  idx++;
                  return (
                    <div
                      className={
                        "map-task " +
                        (isDone ? "done" : unlocked ? "current" : "")
                      }
                      key={task.id}
                    >
                      <span className="task-node">
                        {isDone ? (
                          <Check size={20} />
                        ) : unlocked ? (
                          <BookOpen size={19} />
                        ) : (
                          <Lock size={17} />
                        )}
                      </span>
                      <div>
                        <span className="tag">
                          {t(
                            isDone
                              ? "completed"
                              : unlocked
                                ? "available"
                                : "locked",
                          )}
                        </span>
                        <h3>{l(task.title)}</h3>
                        <p>
                          {task.minutes} {t("minutes")} · {task.xp} XP
                        </p>
                      </div>
                      {unlocked && (
                        <Link
                          href={"/tasks/" + id + "/" + task.id}
                          aria-label={l(task.title)}
                          className="icon-button"
                        >
                          <ArrowLeft size={19} />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <aside className="path-aside">
          <img className="path-aside-cover" src={path.cover} alt="" />
          <Progress value={progressOf(e, path)} label={t("progress")} />
          <dl className="detail-list">
            <div>
              <dt>{t("tasks")}</dt>
              <dd>
                {done.length}/{allTasks(path).length}
              </dd>
            </div>
            <div>
              <dt>{t("targetDate")}</dt>
              <dd>{e.targetDate}</dd>
            </div>
            <div>
              <dt>{t("time")}</dt>
              <dd>
                {e.dailyMinutes} {t("minutes")}
              </dd>
            </div>
          </dl>
          <Button
            variant="secondary"
            className="full-width"
            onClick={async () => {
              try {
                await api("/enrollments/" + id, {
                  status: e.status === "paused" ? "active" : "paused",
                });
                await refresh();
                toast(t("saved"));
              } catch (error) {
                toast((error as Error).message);
              }
            }}
          >
            {t(e.status === "paused" ? "resumePath" : "pausePath")}
          </Button>
          <h3>{t("finalProject")}</h3>
          <p>{l(allTasks(path).at(-1)?.objective)}</p>
          <div className="divider" />
          <Trophy size={26} />
          <h3>{t("firstReward")}</h3>
          <p>{t("welcomeReward")}</p>
          <Link href="/quest" className="button secondary full-width">
            <Gamepad2 size={18} />
            {t("dailyQuest")}
          </Link>
        </aside>
      </div>
    </>
  );
}
export function Task({ id, taskId }: { id: string; taskId: string }) {
  const { state, catalog, t, l, toast, setState } = useApp();
  const enrollment = state.enrollments?.find((e: any) => e.id === id);
  const path = catalog.paths.find((p: any) => p.id === enrollment?.pathId);
  const task = allTasks(path).find((x: any) => x.id === taskId);
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [difficulty, setDifficulty] = useState("right");
  const [answer, setAnswer] = useState<number | undefined>();
  const [hints, setHints] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(completedIds(enrollment).includes(taskId));
  const [help, setHelp] = useState(false);
  useEffect(() => {
    setText(localStorage.getItem("task-draft-" + taskId) || "");
  }, [taskId]);
  if (!task) return <Empty title={t("notFound")} />;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      let fileId;
      if (file) {
        const f = new FormData();
        f.append("file", file);
        f.append("purpose", "task");
        const upload = await api("/uploads", f);
        fileId = upload.fileId || upload.id;
      }
      const r = await api("/tasks/submit", {
        enrollmentId: id,
        taskId,
        text,
        link: link || undefined,
        fileId,
        difficulty,
        answer,
      });
      if (r.state) setState(r.state);
      setDone(true);
      localStorage.removeItem("task-draft-" + taskId);
      toast(t("taskSaved"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Back href={"/paths/" + id} />
      <PageTitle
        title={l(task.title)}
        subtitle={l(task.objective)}
        action={
          <span className="tag">
            <Clock size={15} />
            {task.minutes} {t("minutes")} · {task.xp} XP
          </span>
        }
      />
      <div className="task-layout">
        <article className="lesson-content">
          <Reinforcement enrollment={enrollment} />
          <p className="lesson-lead">{l(task.description)}</p>
          <h2>{t("instructions")}</h2>
          <ol className="instructions">
            {(
              task.instructions?.[state.profile?.locale || "he"] ||
              task.instructions.he
            ).map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <h2>{t("example")}</h2>
          <div className="example-block">{l(task.example)}</div>
          {task.question && (
            <fieldset className="task-question">
              <legend>{l(task.question.prompt)}</legend>
              {(
                task.question.options?.[state.profile?.locale || "he"] ||
                task.question.options.he
              ).map((s: string, i: number) => (
                <label
                  className={"option " + (answer === i ? "selected" : "")}
                  key={i}
                >
                  <input
                    type="radio"
                    name="answer"
                    checked={answer === i}
                    onChange={() => setAnswer(i)}
                  />
                  {s}
                </label>
              ))}
            </fieldset>
          )}
          <div className="hint-section">
            <Button
              variant="secondary"
              onClick={() =>
                setHints(Math.min(hints + 1, task.hints.he.length))
              }
              disabled={hints >= task.hints.he.length}
            >
              <Lightbulb size={17} />
              {t("hint")}
            </Button>
            {task.hints.he.slice(0, hints).map((_: string, i: number) => (
              <Notice key={i}>
                {task.hints[state.profile?.locale || "he"]?.[i] ||
                  task.hints.he[i]}
              </Notice>
            ))}
          </div>
          {task.resources?.length > 0 && (
            <section className="resource-list">
              <h2>{t("resources")}</h2>
              {task.resources.map((r: any) => (
                <a key={r.url} target="_blank" rel="noreferrer" href={r.url}>
                  {l(r.title)}
                  <ArrowUpRight size={17} />
                </a>
              ))}
            </section>
          )}
          <form className="submission-form" onSubmit={submit}>
            <h2>{t("evidence")}</h2>
            <p>{t("evidenceHelp")}</p>
            <Field label={t("answer")} help={t("draftSaved")}>
              <textarea
                rows={5}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  localStorage.setItem("task-draft-" + taskId, e.target.value);
                }}
                disabled={done}
              />
            </Field>
            <Field label={t("link")}>
              <input
                type="url"
                dir="ltr"
                placeholder="https://"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                disabled={done}
              />
            </Field>
            <Field label={t("attachment")} help={t("fileHelp")}>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={done}
              />
            </Field>
            <fieldset>
              <legend>{t("difficulty")}</legend>
              <div className="segmented">
                {["easy", "right", "hard"].map((v) => (
                  <button
                    type="button"
                    key={v}
                    className={difficulty === v ? "selected" : ""}
                    onClick={() => setDifficulty(v)}
                  >
                    {t(v as MessageKey)}
                  </button>
                ))}
              </div>
            </fieldset>
            {error && <Notice type="error">{error}</Notice>}
            {done ? (
              <Notice type="success">
                {t("taskSaved")}
                <p>
                  <Link href={"/paths/" + id}>{t("nextTask")}</Link>
                </p>
              </Notice>
            ) : (
              <Button type="submit" busy={busy}>
                <Check size={18} />
                {t("finishTask")}
                <span>+{task.xp} XP</span>
              </Button>
            )}
          </form>
        </article>
        <aside className="task-aside">
          <div className="coach-tip">
            <span className="coach-avatar">
              <Zap size={20} />
            </span>
            <h3>{t("coachTitle")}</h3>
            <p>{t("coachSub")}</p>
            <Button
              variant="secondary"
              className="full-width"
              onClick={() => setHelp(!help)}
            >
              {t("needHelp")}
            </Button>
            {help && <Coach compact enrollmentId={id} />}
          </div>
          <div className="task-reward">
            <Trophy size={25} />
            <h3>{t("reward")}</h3>
            <b>+{task.xp} XP</b>
            <p>{t("welcomeReward")}</p>
          </div>
          {enrollment.adaptation && (
            <Notice>
              {t("adaptation")}
              <p>{l(enrollment.adaptation.message) || t("adaptationHelp")}</p>
            </Notice>
          )}
        </aside>
      </div>
    </>
  );
}
export function Coach({
  compact = false,
  enrollmentId,
}: {
  compact?: boolean;
  enrollmentId?: string;
}) {
  const { state, t, l, setState } = useApp();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<any[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    const optimistic = { id: "pending-" + Date.now(), role: "user", content: text };
    setPending([optimistic]);
    try {
      const r = await api("/coach", {
        message: text,
        enrollmentId: enrollmentId || state.enrollments?.[0]?.id,
        style: state.profile?.coachStyle,
      });
      // The refreshed state already carries both turns, so drop the optimistic copy with it.
      if (r.state) {
        setState(r.state);
        setPending([]);
      } else {
        setPending([
          optimistic,
          {
            id: "pending-reply-" + Date.now(),
            role: "assistant",
            content: r.message?.content || r.message || r.reply || r.content,
          },
        ]);
      }
    } catch (e) {
      setError((e as Error).message);
      setMessage(text);
      setPending([]);
    } finally {
      setBusy(false);
    }
  };
  const saved = state.coachMessages;
  const messages = useMemo(() => [...(saved || []), ...pending], [saved, pending]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length, busy]);
  return (
    <div className={compact ? "coach-compact" : "coach-page"}>
      {!compact && (
        <PageTitle title={t("coachTitle")} subtitle={t("coachSub")} />
      )}
      <div className="chat-panel">
        {state.isDemo && (
          <div className="chat-mode">
            <span className="small-square" />
            {t("coachDemo")}
          </div>
        )}
        <div className="chat-messages" aria-live="polite">
          {!messages.length && (
            <div className="coach-welcome">
              <span className="coach-avatar">
                <Zap size={25} />
              </span>
              <p>{t("coachIntro")}</p>
            </div>
          )}
          {messages.map((m: any, i: number) => (
            <div key={m.id || i} className={"chat-message " + m.role}>
              <span className="chat-role">
                {m.role === "user"
                  ? state.profile?.displayName || t("profile")
                  : t("coach")}
              </span>
              <div>{l(m.content || m.message)}</div>
            </div>
          ))}
          {busy && <div className="chat-typing">{t("loading")}</div>}
          <div ref={endRef} />
        </div>
        {!compact && (
          <div className="chat-suggestions">
            {(
              [
                "coachSuggestion",
                "coachWeekly",
                "coachMistakes",
              ] as MessageKey[]
            ).map((v) => (
              <button key={v} onClick={() => send(t(v))}>
                {t(v)}
              </button>
            ))}
          </div>
        )}
        {error && <Notice type="error">{error}</Notice>}
        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            send(message);
          }}
        >
          <label
            className="sr-only"
            htmlFor={compact ? "compact-message" : "coach-message"}
          >
            {t("coachPlaceholder")}
          </label>
          <input
            id={compact ? "compact-message" : "coach-message"}
            value={message}
            maxLength={2000}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("coachPlaceholder")}
          />
          <Button
            type="submit"
            busy={busy}
            disabled={!message.trim()}
            aria-label={t("send")}
          >
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
}
export function Marketplace() {
  const { catalog, t, l } = useApp();
  // Searching from the top bar re-enters this screen without remounting it, so track the live query.
  const requested = useSearchParams().get("q") || "";
  const [query, setQuery] = useState(requested);
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const [price, setPrice] = useState("all");
  const [duration, setDuration] = useState("all");
  useEffect(() => {
    setQuery(requested);
  }, [requested]);
  const paths = catalog.paths.filter(
    (p: any) =>
      !p.isPrivate &&
      (l(p.title) + " " + l(p.description))
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (category === "all" || p.category === category) &&
      (level === "all" || p.level === level) &&
      (price === "all" || (price === "free" ? p.price === 0 : p.price > 0)) &&
      (duration === "all" || p.durationDays <= (duration === "short" ? 7 : 30)),
  );
  return (
    <>
      <PageTitle
        title={t("marketplace")}
        subtitle={t("builtFor")}
        action={
          <Link href="/marketplace/create" className="button secondary">
            <Plus size={17} />
            {t("publish")}
          </Link>
        }
      />
      <div className="market-filters">
        <Field label={t("search")}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("skillPlaceholder")}
          />
        </Field>
        <Field label={t("category")}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">{t("all")}</option>
            {catalog.categories?.map((c: any) => (
              <option key={c.id} value={c.id}>
                {l(c.title)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("level")}>
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            {["all", "beginner", "intermediate", "advanced"].map((v) => (
              <option key={v} value={v}>
                {t(v as MessageKey)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("price")}>
          <select value={price} onChange={(e) => setPrice(e.target.value)}>
            {["all", "free", "paid"].map((v) => (
              <option key={v} value={v}>
                {t(v as MessageKey)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("duration")}>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            {["all", "short", "medium"].map((v) => (
              <option key={v} value={v}>
                {t(v as MessageKey)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {paths.length ? (
        <div className="path-grid market-grid">
          {paths.map((p: any) => (
            <PathCard key={p.id} path={p} />
          ))}
        </div>
      ) : (
        <Empty
          title={t("noResults")}
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setLevel("all");
                setPrice("all");
                setDuration("all");
              }}
            >
              {t("clearFilters")}
            </Button>
          }
        />
      )}
    </>
  );
}
export function MarketplaceDetail({ id }: { id: string }) {
  const { state, catalog, t, l, go, toast, setState, refresh, start } = useApp();
  const checkout = useCheckout();
  const p = catalog.paths.find((p: any) => p.id === id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(false);
  const [reason, setReason] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [favorite, setFavorite] = useState(
    (state?.favorites || []).some((f: any) => f.pathId === id || f === id),
  );
  if (!p) return <Empty title={t("notFound")} />;
  const enrolled = state?.enrollments?.find((e: any) => e.pathId === id);
  const begin = async () => {
    if (!state?.user) {
      await start();
      go("/onboarding");
      return;
    }
    if (enrolled) {
      go("/paths/" + enrolled.id);
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (p.price && !p.purchased) {
        await checkout.start({ marketplacePathId: id });
      } else {
        const r = await api("/enrollments", {
          pathId: id,
          skill: l(p.title),
          level: p.level,
          dailyMinutes: p.dailyMinutes,
          goal: l(p.description),
          styles: ["mixed"],
          targetDate: new Date(Date.now() + p.durationDays * 86400000)
            .toISOString()
            .slice(0, 10),
        });
        if (r.state) setState(r.state);
        go("/paths/" + (r.enrollment?.id || r.enrollmentId || r.id));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Back href="/marketplace" />
      <div className="market-detail">
        <article>
          <span className="tag">
            {t(p.level)} · {p.durationDays} {t("days")}
          </span>
          <h1>{l(p.title)}</h1>
          <p className="lesson-lead">{l(p.description)}</p>
          <div className="creator-line">
            <span className="avatar small">L</span>
            {p.creator}
            <span className="muted">
              {p.reviewCount
                ? Number(p.rating).toFixed(1) + " / 5 · " + p.reviewCount
                : t("noRatings")}
            </span>
          </div>
          <img className="market-detail-cover" src={p.cover} alt="" />
          <h2>{t("included")}</h2>
          {p.chapters.map((c: any, i: number) => (
            <details className="preview-chapter" key={c.id} open={i === 0}>
              <summary>
                {String(i + 1).padStart(2, "0")} · {l(c.title)}
                <span>
                  {c.tasks.length} {t("tasks")}
                </span>
              </summary>
              {c.tasks.map((task: any) => (
                <div key={task.id}>
                  <BookOpen size={16} />
                  <span>{l(task.title)}</span>
                  <small>
                    {task.minutes} {t("minutes")}
                  </small>
                </div>
              ))}
            </details>
          ))}
          <div className="review-form">
            <h2>{t("review")}</h2>
            {enrolled ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await api("/reviews", { pathId: id, rating, comment });
                    await refresh();
                    toast(t("saved"));
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <Field label={t("rating")}>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                  >
                    {[5, 4, 3, 2, 1].map((v) => (
                      <option value={v} key={v}>
                        {v} / 5
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("comment")}>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    minLength={5}
                  />
                </Field>
                <Button variant="secondary">{t("sendReview")}</Button>
              </form>
            ) : (
              <p>{t("reviewAfterStart")}</p>
            )}
          </div>
        </article>
        <aside className="purchase-panel">
          <h2>{p.price ? "₪" + p.price : t("free")}</h2>
          <p>
            {p.dailyMinutes} {t("minutes")} · {p.durationDays} {t("days")}
          </p>
          <Button className="full-width" busy={busy} onClick={begin}>
            {t(enrolled ? "viewPath" : p.price ? "buyPath" : "startPath")}
            <ArrowLeft size={17} />
          </Button>
          <Button
            variant="secondary"
            className="full-width"
            onClick={async () => {
              try {
                await api("/favorites", { pathId: id });
                setFavorite(!favorite);
                await refresh();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <Bookmark size={17} fill={favorite ? "currentColor" : "none"} />
            {t(favorite ? "unfavorite" : "favorite")}
          </Button>
          <dl className="detail-list">
            <div>
              <dt>{t("chapters")}</dt>
              <dd>{p.chapters.length}</dd>
            </div>
            <div>
              <dt>{t("tasks")}</dt>
              <dd>{allTasks(p).length}</dd>
            </div>
            <div>
              <dt>{t("xp")}</dt>
              <dd>{allTasks(p).reduce((n: number, x: any) => n + x.xp, 0)}</dd>
            </div>
          </dl>
          <p className="small-text muted">{t("privateNote")}</p>
          <Button variant="tertiary" onClick={() => setReport(true)}>
            <Flag size={16} />
            {t("report")}
          </Button>
          {error && <Notice type="error">{error}</Notice>}
        </aside>
      </div>
      {checkout.dialog}
      {checkout.error && <Notice type="error">{checkout.error}</Notice>}
      {report && (
        <Modal title={t("report")} onClose={() => setReport(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api("/reports", { pathId: id, reason });
                toast(t("reported"));
                setReport(false);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <Field label={t("reason")}>
              <textarea
                rows={4}
                required
                minLength={5}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
            <Button>{t("sendReport")}</Button>
          </form>
        </Modal>
      )}
    </>
  );
}
