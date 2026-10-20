import { useEffect, useRef, useState } from "react";
import { BookOpen, Check } from "lucide-react";
import { useLocale, useT } from "@/components/I18nProvider";
import { Alert, Arrow, ProgressBar } from "@/components/ui";
import { primaryLink, StateView } from "@/components/ui/StateView";
import { DIFFICULTIES, type Difficulty } from "@/lib/game/spec/constants";
import { gameTypeAllowed, modeAllowed } from "@/lib/game/spec/tier";
import { findTopic } from "@/lib/game/topics/catalog";
import { courseChapters, findCourse, type Course } from "@/lib/game/topics/courses";
import { contentLangOf, type DictKey } from "@/lib/i18n";
import { getOfflineTier } from "@/lib/offline/entitlement";
import { generateOfflineWithProgress } from "@/lib/offline/generate";
import { store } from "../app-state";
import { chapterFailure, loadCourseProgress, type ChapterProgress } from "../course-model";
import { navigate } from "../router";

/**
 * A course: its chapters in order, how far the learner got, and one tap to the next chapter. A chapter is a topic-library
 * game (built here, on the phone, never by AI): the lesson boards come first, then the practice, then the hands-on task.
 * The next chapter is suggested, never forced: every chapter can be opened at any time.
 */
export function CoursePage({ courseId }: { courseId: string }) {
  const course = findCourse(courseId);
  if (!course) return <Missing />;
  return <CourseView course={course} />;
}

function Missing() {
  const t = useT();
  return <StateView kind="notfound" data-testid="course-missing" title={t("mob.notfound")} text={t("mob.notfound.text")} actions={<a href="#/" className={primaryLink}>{t("res.library")}</a>} />;
}

function CourseView({ course }: { course: Course }) {
  const t = useT();
  const lang = contentLangOf(useLocale());
  const [progress] = useState(() => loadCourseProgress(store, course));
  const [busy, setBusy] = useState<{ n: number; percent: number } | null>(null);
  const [failed, setFailed] = useState<"full" | "generic" | null>(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  const chapters = courseChapters(course, findTopic);
  const [title, description, audience] = course[lang];

  async function start(ch: ChapterProgress, level: Difficulty) {
    if (busy) return;
    if (ch.resume && level === ch.nextLevel) { navigate(`/play/${ch.resume}`); return; }
    const entry = findTopic(ch.topicId);
    if (!entry) return;
    const tier = getOfflineTier();
    setFailed(null);
    setBusy({ n: ch.number, percent: 0 });
    try {
      // A chapter is played as a Full Adventure (two areas: the lesson and the first questions, then the rest and the task) when the tier has it.
      const { spec } = await generateOfflineWithProgress({
        mode: modeAllowed(tier, "FULL") ? "FULL" : "FAST", subject: entry[lang][0], learningGoal: entry[lang][1], difficulty: level,
        gameType: gameTypeAllowed(tier, "adventure") ? "adventure" : "exploration", contentLanguage: lang, topicId: entry.id, device: "phone",
      }, (percent) => { if (alive.current) setBusy({ n: ch.number, percent }); }, new Date(), tier);
      if (!alive.current) return;
      const id = store.addGame(spec).id;
      navigate(`/play/${id}`);
    } catch (err) {
      if (alive.current) { setFailed(chapterFailure(err)); setBusy(null); }
    }
  }

  const next = progress.next;
  return (
    <div className="space-y-5" data-testid="mobile-course" data-course={course.id} aria-busy={busy !== null}>
      <a href="#/" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted"><Arrow back /> {t("mob.back")}</a>
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-neon">{t("mob.course.label")}</p>
        <h1 className="text-2xl font-extrabold leading-tight">{title}</h1>
        <p className="text-sm font-semibold text-muted" data-testid="course-audience">{audience}</p>
        <p className="text-sm text-muted">{description}</p>
      </header>
      <div className="space-y-1.5" data-testid="course-progress" data-done={progress.done}>
        <ProgressBar value={progress.done} max={course.chapters.length} label={t("mob.course.progress", { done: progress.done, total: course.chapters.length })} />
        <p className="text-sm text-muted">{t("mob.course.progress", { done: progress.done, total: course.chapters.length })}</p>
      </div>
      {next ? (
        <section className="space-y-3 rounded-2xl border border-neon/50 bg-neon/10 p-4 shadow-e1" aria-labelledby="course-next-title" data-testid="course-next" data-chapter={next.number}>
          <p className="text-xs font-bold uppercase tracking-wide text-neon">{t("mob.course.next", { n: next.number })}</p>
          <h2 id="course-next-title" className="text-lg font-bold">{chapters[next.number - 1]?.[lang][0]}</h2>
          <button type="button" disabled={busy !== null} onClick={() => void start(next, next.nextLevel ?? "beginner")} data-testid="course-next-start"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-neon px-5 font-bold text-ink-950 shadow-glow transition active:scale-[0.99] disabled:opacity-60">
            {next.resume ? t("mob.course.continue", { n: next.number }) : t("mob.course.start", { n: next.number })} <Arrow />
          </button>
        </section>
      ) : (
        <Alert tone="success" data-testid="course-complete">{t("mob.course.done.all")}</Alert>
      )}
      <p className="flex gap-2 text-sm text-muted"><BookOpen aria-hidden className="mt-0.5 size-4 shrink-0" />{t("mob.course.how")}</p>
      <div aria-live="polite">
        {busy && <p role="status" className="text-sm font-semibold" data-testid="course-building">{t("mob.course.building", { n: busy.n })} <span className="ltr-num">{busy.percent}%</span></p>}
        {failed && <Alert tone="error" data-testid="course-error">{t(failed === "full" ? "mob.course.error.storage" : "mob.course.error")}</Alert>}
      </div>
      <h2 id="course-chapters" className="text-lg font-semibold">{t("mob.course.chapters")}</h2>
      <ol aria-labelledby="course-chapters" className="space-y-3" data-testid="course-chapters">
        {progress.chapters.map((ch) => {
          const entry = chapters[ch.number - 1];
          if (!entry) return null;
          const status = ch.levelsDone.length
            ? t("mob.course.status.done", { levels: ch.levelsDone.map((d) => t(`difficulty.${d}` as DictKey)).join(" · ") })
            : ch.resume ? t("mob.course.status.progress") : t("mob.course.status.new");
          const action = ch.resume && ch.nextLevel ? t("mob.course.continue", { n: ch.number })
            : ch.levelsDone.length === 0 ? t("mob.course.start", { n: ch.number })
            : ch.nextLevel ? t("mob.course.again", { level: t(`difficulty.${ch.nextLevel}` as DictKey) })
            : t("mob.course.replay");
          return (
            <li key={ch.topicId} className="flex min-w-0 gap-3 rounded-2xl border border-line bg-ink-900/60 p-4" data-testid="course-chapter" data-topic={ch.topicId} data-done={ch.levelsDone.join(",")}>
              <span aria-hidden className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${ch.levelsDone.length ? "bg-neon text-ink-950" : "border border-line text-muted"}`}>
                {ch.levelsDone.length ? <Check className="size-4" /> : <span className="ltr-num">{ch.number}</span>}
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <h3 className="font-semibold leading-snug">{entry[lang][0]}</h3>
                <p className="text-sm text-muted">{entry[lang][1]}</p>
                <p className="text-xs font-medium text-muted" data-testid="chapter-status">{status}</p>
                <div className="flex flex-wrap gap-1.5" aria-hidden>
                  {DIFFICULTIES.map((d) => (
                    <span key={d} className={`rounded-full border px-2 py-0.5 text-xs ${ch.levelsDone.includes(d) ? "border-neon/60 text-neon" : "border-line text-muted"}`}>
                      {ch.levelsDone.includes(d) ? "✓ " : ""}{t(`difficulty.${d}` as DictKey)}
                    </span>
                  ))}
                </div>
                <button type="button" disabled={busy !== null} onClick={() => void start(ch, ch.nextLevel ?? "advanced")} data-testid="chapter-start"
                  className={`inline-flex min-h-11 items-center justify-center gap-1 rounded-xl px-4 text-sm font-bold transition active:scale-[0.98] disabled:opacity-60 ${next?.number === ch.number ? "bg-neon text-ink-950" : "border border-line"}`}>
                  {action} <Arrow />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-center text-xs text-muted" data-testid="course-source">{t("det.generator.catalog")}</p>
    </div>
  );
}
