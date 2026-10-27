"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AlertTriangle, Camera, CalendarClock, CheckCircle2, ChevronLeft, Clock, FlaskConical, Flame, GraduationCap, Layers, Lightbulb, NotebookPen, Play, Sparkles, TrendingUp, Zap } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/EmptyState";
import { SubjectChip } from "@/components/shared/SubjectIcon";
import { StatTile } from "@/components/shared/StatTile";
import { WeeklyBars } from "@/components/charts/LazyCharts";
import { useData, useToday } from "@/hooks/useApp";
import { act } from "@/services/data/actions";
import { buildSuggestions } from "@/services/learning/planner";
import { activeDays, computeStreak, minutesByDay, strongAndWeak, studyMinutesLast, studyMinutesToday } from "@/services/learning/stats";
import { dueCards } from "@/services/learning/spaced";
import { levelFromXp, totalXp } from "@/services/learning/gamification";
import { diffDays, formatLong, formatShort, greetingFor, lastNDays, relativeDay } from "@/lib/dates";
import { cn, formatMinutes } from "@/lib/utils";
import { gradeLabel } from "@/lib/catalog";

export default function DashboardPage() {
  const data = useData();
  const today = useToday();
  const profile = data.profile!;

  const view = useMemo(() => {
    const todayMin = studyMinutesToday(data, today);
    const weekMin = studyMinutesLast(data, 7, today);
    const streak = computeStreak(activeDays(data), today);
    const due = dueCards(data.flashcards, today);
    const overdue = data.homework.filter((h) => !h.done && h.dueDate < today);
    const dueToday = data.homework.filter((h) => !h.done && h.dueDate === today);
    const open = data.homework.filter((h) => !h.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const reviewToday = data.calendarEvents.filter((e) => e.kind === "review" && e.date === today && !e.done);
    const nextExam = data.exams.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
    return {
      todayMin, weekMin, streak, due, overdue, dueToday, open, reviewToday, nextExam,
      week: minutesByDay(data, lastNDays(7, today)),
      weak: strongAndWeak(data).weak.slice(0, 3),
      suggestions: buildSuggestions(data, today).slice(0, 4),
      xp: totalXp(data.xpEvents),
    };
  }, [data, today]);

  const goal = profile.dailyMinutes;
  const weekGoal = goal * 5; // יעד שבועי = 5 ימי לימוד (2 ימי מנוחה)
  const lv = levelFromXp(view.xp);
  const subject = (id: string | null) => data.subjects.find((s) => s.id === id);
  const noContent = data.homework.length + data.exams.length + data.flashcards.length + data.studySessions.length === 0;
  const todayTasks = [
    ...view.overdue.map((h) => ({ id: h.id, kind: "hw" as const, title: h.title, subjectId: h.subjectId, note: `באיחור · ${relativeDay(h.dueDate, today)}`, late: true })),
    ...view.dueToday.map((h) => ({ id: h.id, kind: "hw" as const, title: h.title, subjectId: h.subjectId, note: "להגשה היום", late: false })),
    ...view.reviewToday.map((e) => ({ id: e.id, kind: "review" as const, title: e.title, subjectId: e.subjectId, note: e.notes, late: false })),
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(244_70%_28%)] via-[hsl(262_62%_38%)] to-[hsl(190_80%_36%)] p-6 text-white shadow-glow sm:p-8" aria-labelledby="hello">
        <div aria-hidden className="absolute -start-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/80">{formatLong(today)}</p>
            <h1 id="hello" className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {greetingFor()}, {profile.displayName} 👋
            </h1>
            <p className="mt-1 text-white/80">{gradeLabel(profile.grade)} · רמה {lv.level} · {view.xp} XP</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 backdrop-blur" aria-label={`רצף של ${view.streak.current} ימי לימוד`}>
            <Flame className="size-6 text-amber-300" aria-hidden />
            <div className="leading-tight">
              <p className="text-xl font-extrabold">{view.streak.current}</p>
              <p className="text-[11px] font-semibold text-white/80">ימי רצף</p>
            </div>
          </div>
        </div>
        <div className="relative mt-6 flex flex-wrap gap-3">
          <Link href="/focus" className={cn(buttonVariants({ size: "lg" }), "h-11 px-4 text-sm bg-white text-[hsl(244_70%_28%)] hover:bg-white/90 sm:h-12 sm:px-6 sm:text-base")}>
            <Play /> התחל ללמוד
          </Link>
          <Link href="/tutor" className={cn(buttonVariants({ size: "lg" }), "h-11 px-4 text-sm bg-white/15 text-white backdrop-blur hover:bg-white/25 sm:h-12 sm:px-6 sm:text-base")}>
            <Sparkles /> שאל את המורה AI
          </Link>
          <Link href="/scan" className={cn(buttonVariants({ size: "lg" }), "h-11 px-4 text-sm bg-white/15 text-white backdrop-blur hover:bg-white/25 sm:h-12 sm:px-6 sm:text-base")}>
            <Camera /> צלם שאלה
          </Link>
        </div>
      </section>

      {noContent && (
        <EmptyState
          icon={<Lightbulb />}
          title="בואו נתחיל!"
          description="עדיין אין כאן פעילות. הוסף שיעורי בית או מבחן קרוב, התחל מפגש ריכוז, או טען נתוני דוגמה כדי להתרשם מהמערכת (הם יסומנו בבירור ואפשר להסירם)."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/homework" className={buttonVariants({ variant: "default" })}>
                <NotebookPen /> שיעורי בית
              </Link>
              <Link href="/exams" className={buttonVariants({ variant: "outline" })}>
                <GraduationCap /> מבחן קרוב
              </Link>
              <Button variant="outline" onClick={() => act.loadDemoData()}>
                <FlaskConical /> טען נתוני דמו
              </Button>
            </div>
          }
        />
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="סיכום יומי">
        <StatTile icon={<Clock />} label="זמן לימוד היום" value={formatMinutes(view.todayMin)} hint={view.todayMin >= goal ? "יעד היום הושג 🎉" : `יעד: ${goal} דקות`}>
          <Progress className="mt-2" value={(view.todayMin / goal) * 100} label="התקדמות ליעד היומי" />
        </StatTile>
        <StatTile icon={<Flame />} tone="warning" label="רצף ימי לימוד" value={`${view.streak.current} ימים`} hint={view.streak.todayDone ? "למדת היום" : view.streak.current ? "למד היום כדי להמשיך את הרצף" : `שיא: ${view.streak.best}`} />
        <StatTile icon={<TrendingUp />} tone="accent" label="התקדמות שבועית" value={formatMinutes(view.weekMin)} hint={`מתוך יעד ${formatMinutes(weekGoal)}`}>
          <Progress className="mt-2" value={(view.weekMin / weekGoal) * 100} label="התקדמות שבועית" />
        </StatTile>
        <StatTile icon={<Layers />} tone="success" label="כרטיסיות לחזרה" value={view.due.length} hint={view.due.length ? "מוכנות לחזרה עכשיו" : "אין כרטיסיות לחזרה"} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>משימות להיום</CardTitle>
                <CardDescription>שיעורי בית שמועד ההגשה שלהם הגיע ומשימות חזרה</CardDescription>
              </div>
              <Link href="/homework" className="inline-flex h-9 items-center px-2 text-sm font-semibold text-primary">לכל המשימות</Link>
            </CardHeader>
            <CardContent>
              {todayTasks.length === 0 ? (
                <p className="flex items-center gap-2 rounded-xl bg-success/10 p-4 text-sm font-semibold text-success">
                  <CheckCircle2 className="size-5" /> אין משימות דחופות להיום. אפשר לנוח או לתרגל קצת.
                </p>
              ) : (
                <ul className="space-y-2">
                  {todayTasks.map((t) => (
                    <li key={`${t.kind}-${t.id}`} className="flex items-center gap-3 rounded-xl border p-3">
                      {t.kind === "hw" ? (
                        <button
                          type="button"
                          aria-label={`סמן "${t.title}" כהושלם`}
                          className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-input transition-colors hover:border-success hover:bg-success/10"
                          onClick={() => act.setHomeworkDone(t.id, true)}
                        />
                      ) : (
                        <CalendarClock className="size-5 shrink-0 text-primary" aria-hidden />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{t.title}</p>
                        <p className={cn("text-xs", t.late ? "font-semibold text-destructive" : "text-muted-foreground")}>{t.note}</p>
                      </div>
                      <SubjectChip subject={subject(t.subjectId)} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>זמן לימוד – 7 ימים אחרונים</CardTitle>
              <CardDescription>עמודה בתכלת = הגעת ליעד היומי ({goal} דק׳)</CardDescription>
            </CardHeader>
            <CardContent>
              {view.weekMin === 0 ? (
                <p className="rounded-xl bg-muted/60 p-6 text-center text-sm text-muted-foreground">עוד לא נרשם זמן לימוד השבוע. מפגש ריכוז ראשון יופיע כאן.</p>
              ) : (
                <WeeklyBars points={view.week.map((w) => ({ day: w.day, minutes: w.minutes }))} goal={goal} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>שיעורי בית פתוחים</CardTitle>
                <CardDescription>{view.open.length ? `${view.open.length} משימות ממתינות` : "הכול הושלם"}</CardDescription>
              </div>
              <Link href="/homework" className="inline-flex h-9 items-center px-2 text-sm font-semibold text-primary">ניהול</Link>
            </CardHeader>
            <CardContent>
              {view.open.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין שיעורי בית פתוחים. אפשר להוסיף משימה חדשה במסך שיעורי הבית.</p>
              ) : (
                <ul className="divide-y">
                  {view.open.slice(0, 5).map((h) => (
                    <li key={h.id} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{h.title}</p>
                        <p className={cn("text-xs", h.dueDate < today ? "font-semibold text-destructive" : "text-muted-foreground")}>{relativeDay(h.dueDate, today)} · {formatShort(h.dueDate)}</p>
                      </div>
                      <SubjectChip subject={subject(h.subjectId)} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>המבחן הקרוב</CardTitle>
            </CardHeader>
            <CardContent>
              {view.nextExam ? (
                <ExamCountdown exam={view.nextExam} today={today} subjectName={subject(view.nextExam.subjectId)?.name ?? ""} />
              ) : (
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>לא הוגדר מבחן קרוב.</p>
                  <Link href="/exams" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <GraduationCap /> הוסף מבחן
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>מומלץ עבורך היום</CardTitle>
              <CardDescription>ההמלצות מבוססות על הפעילות שלך, ולכל אחת מצורף הנימוק</CardDescription>
            </CardHeader>
            <CardContent>
              {view.suggestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין המלצות כרגע. ככל שתתרגל יותר, ההמלצות יהיו מדויקות יותר.</p>
              ) : (
                <ul className="space-y-2">
                  {view.suggestions.map((s) => (
                    <li key={s.id}>
                      <Link href={s.href} className="group flex items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/60">
                        <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", s.tone === "urgent" ? "bg-destructive/12 text-destructive" : s.tone === "gentle" ? "bg-accent/15 text-accent" : "bg-primary/12 text-primary")}>
                          {s.tone === "urgent" ? <AlertTriangle className="size-4" /> : <Zap className="size-4" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold">{s.title}</span>
                          <span className="block text-xs text-muted-foreground">למה? {s.reason}</span>
                        </span>
                        <ChevronLeft className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>זקוקים לתרגול</CardTitle>
              <CardDescription>נושאים עם שיעור הצלחה משוער נמוך מ-60%</CardDescription>
            </CardHeader>
            <CardContent>
              {view.weak.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין עדיין מספיק תרגול כדי לזהות נושאים חלשים. תרגול, כרטיסיות וסימולציות יעזרו למערכת ללמוד אותך.</p>
              ) : (
                <ul className="space-y-3">
                  {view.weak.map((w) => (
                    <li key={`${w.subjectId}-${w.topic}`}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                        <Link href={`/tutor?mode=explain&subject=${w.subjectId ?? ""}&topic=${encodeURIComponent(w.topic)}`} className="truncate font-semibold hover:text-primary">
                          {w.topic}
                        </Link>
                        <Badge variant="warning">{w.mastery.percent}%</Badge>
                      </div>
                      <Progress value={w.mastery.percent ?? 0} label={`שליטה ב${w.topic}`} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ExamCountdown({ exam, today, subjectName }: { exam: { id: string; title: string; date: string }; today: string; subjectName: string }) {
  const days = diffDays(today, exam.date);
  return (
    <div>
      <p className="font-bold">{exam.title}</p>
      <p className="text-xs text-muted-foreground">{subjectName} · {formatLong(exam.date)}</p>
      <div className="mt-4 flex items-end gap-2" data-testid="exam-countdown">
        <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-5xl font-extrabold text-transparent">{days}</span>
        <span className="pb-1.5 text-base font-bold text-muted-foreground">{days === 0 ? "המבחן היום!" : days === 1 ? "יום אחד נשאר" : "ימים נשארו"}</span>
      </div>
      <Link href={`/exams/${exam.id}`} className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-4")}>
        להכנה למבחן <ChevronLeft />
      </Link>
    </div>
  );
}
