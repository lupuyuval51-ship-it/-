"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Brain, CheckCircle2, Clock, Flame, Target, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatTile } from "@/components/shared/StatTile";
import { MasteryChart, ScoreChart, WeeklyBars } from "@/components/charts/LazyCharts";
import { useData, useToday } from "@/hooks/useApp";
import { activeDays, averageSimulationScore, computeStreak, exercisesSolved, minutesByDay, practiceAccuracy, resultsFor, strongAndWeak, studyMinutesLast, subjectMastery, topicMasteries } from "@/services/learning/stats";
import { adviseDifficulty, DIFFICULTY_LABEL } from "@/services/learning/mastery";
import { colorOf } from "@/lib/catalog";
import { lastNDays, formatShort, dateToIsoDay } from "@/lib/dates";
import { formatMinutes } from "@/lib/utils";

type Range = "week" | "month";

export default function ProgressPage() {
  const data = useData();
  const today = useToday();
  const [range, setRange] = useState<Range>("week");

  const v = useMemo(() => {
    const week = studyMinutesLast(data, 7, today);
    const month = studyMinutesLast(data, 30, today);
    const subjects = data.subjects.map((s) => ({ s, m: subjectMastery(data, s.id) })).filter((x) => x.m.percent !== null);
    const attempts = data.examAttempts.filter((a) => a.finishedAt && a.scorePercent !== null).sort((a, b) => (a.finishedAt ?? "").localeCompare(b.finishedAt ?? "")).slice(-10);
    return {
      week, month,
      streak: computeStreak(activeDays(data), today),
      exercises: exercisesSolved(data),
      accuracy: practiceAccuracy(data),
      avgScore: averageSimulationScore(data),
      days: minutesByDay(data, lastNDays(range === "week" ? 7 : 30, today)),
      subjects,
      attempts,
      sw: strongAndWeak(data),
      topics: topicMasteries(data),
    };
  }, [data, today, range]);

  const empty = data.studySessions.length === 0 && data.practiceResults.length === 0 && data.examAttempts.length === 0;
  const subjectName = (id: string | null) => data.subjects.find((s) => s.id === id)?.name ?? "כללי";

  return (
    <>
      <PageHeader title="התקדמות וסטטיסטיקות" description="כל הנתונים מחושבים מהפעילות האמיתית שלך. אין כאן ציונים מדומים." />
      {data.meta.demoLoaded && <p className="mb-4 rounded-lg bg-accent/15 p-3 text-sm font-semibold">שים לב: נתוני הדמו נכללים בחישוב. אפשר להסיר אותם בהגדרות.</p>}
      {empty ? (
        <EmptyState icon={<BarChart3 />} title="עדיין אין נתוני פעילות" description="התחל מפגש ריכוז, תרגל כרטיסיות או בצע סימולציית מבחן, והגרפים יתמלאו כאן." />
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-3" aria-label="מדדים עיקריים">
            <StatTile icon={<Clock />} label="לימוד שבועי" value={formatMinutes(v.week)} />
            <StatTile icon={<Clock />} tone="accent" label="לימוד חודשי (30 ימים)" value={formatMinutes(v.month)} />
            <StatTile icon={<Flame />} tone="warning" label="רצף ימי לימוד" value={`${v.streak.current} ימים`} hint={`שיא: ${v.streak.best}`} />
            <StatTile icon={<Target />} tone="success" label="תרגילים שנפתרו" value={v.exercises} hint="מסימולציות וכרטיסיות" />
            <StatTile icon={<CheckCircle2 />} label="דיוק בתרגולים" value={v.accuracy === null ? "—" : `${v.accuracy}%`} hint={v.accuracy === null ? "אין עדיין נתונים" : undefined} />
            <StatTile icon={<Trophy />} tone="accent" label="ממוצע סימולציות" value={v.avgScore === null ? "—" : `${v.avgScore}%`} hint={v.avgScore === null ? "אין סימולציות שהושלמו" : `${data.examAttempts.filter((a) => a.finishedAt).length} סימולציות`} />
          </section>

          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-3"><div><CardTitle>זמן לימוד</CardTitle><CardDescription>דקות לימוד בכל יום</CardDescription></div><Tabs<Range> label="טווח" value={range} onChange={setRange} items={[{ value: "week", label: "שבוע" }, { value: "month", label: "חודש" }]} /></CardHeader>
            <CardContent><WeeklyBars points={v.days} goal={data.profile?.dailyMinutes} height={220} /></CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>התקדמות לפי מקצוע</CardTitle><CardDescription>שליטה משוערת לפי ביצועים בתרגולים, כרטיסיות וסימולציות</CardDescription></CardHeader>
              <CardContent>{v.subjects.length === 0 ? <p className="text-sm text-muted-foreground">אין עדיין תרגול שמשויך למקצוע.</p> : <MasteryChart points={v.subjects.map(({ s, m }) => ({ name: s.name, percent: m.percent!, color: colorOf(s.color).hex }))} />}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>ציוני סימולציות</CardTitle><CardDescription>10 הסימולציות האחרונות (על שאלות שנבדקו)</CardDescription></CardHeader>
              <CardContent>{v.attempts.length === 0 ? <p className="text-sm text-muted-foreground">עדיין לא בוצעו סימולציות.</p> : <ScoreChart points={v.attempts.map((a) => ({ label: formatShort(dateToIsoDay(a.finishedAt!)), score: a.scorePercent! }))} />}</CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>נושאים חזקים</CardTitle><CardDescription>80% ומעלה, לפחות 3 תרגילים</CardDescription></CardHeader>
              <CardContent>{v.sw.strong.length === 0 ? <p className="text-sm text-muted-foreground">אין עדיין נושאים חזקים מספיק מבוססים.</p> : <ul className="space-y-3">{v.sw.strong.map((t) => <TopicRow key={`${t.subjectId}-${t.topic}`} name={t.topic} sub={subjectName(t.subjectId)} percent={t.mastery.percent!} attempts={t.mastery.attempts} />)}</ul>}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>נושאים חלשים</CardTitle><CardDescription>מתחת ל-60%, לפחות 3 תרגילים</CardDescription></CardHeader>
              <CardContent>{v.sw.weak.length === 0 ? <p className="text-sm text-muted-foreground">אין נושאים חלשים מזוהים. מצוין!</p> : <ul className="space-y-3">{v.sw.weak.map((t) => <TopicRow key={`${t.subjectId}-${t.topic}`} name={t.topic} sub={subjectName(t.subjectId)} percent={t.mastery.percent!} attempts={t.mastery.attempts} warn />)}</ul>}</CardContent>
            </Card>
          </div>

          <Card data-testid="personalization">
            <CardHeader><div className="flex items-center gap-2"><Brain className="size-5 text-primary" aria-hidden /><CardTitle>התאמה אישית: למה המערכת ממליצה?</CardTitle></div><CardDescription>לכל נושא מחושבים שיעור ההצלחה בתרגולים האחרונים והקושי המומלץ</CardDescription></CardHeader>
            <CardContent>
              {v.topics.length === 0 ? <p className="text-sm text-muted-foreground">אחרי כמה תרגולים תופיע כאן ההתאמה לכל נושא.</p> : (
                <ul className="space-y-3">
                  {v.topics.sort((a, b) => (a.mastery.percent ?? 0) - (b.mastery.percent ?? 0)).slice(0, 6).map((t) => {
                    const advice = adviseDifficulty(resultsFor(data, t.subjectId, t.topic));
                    return (
                      <li key={`${t.subjectId}-${t.topic}`} className="rounded-xl border p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-bold">{t.topic} <span className="font-normal text-muted-foreground">· {subjectName(t.subjectId)}</span></span><Badge variant={advice.action === "decrease" ? "warning" : advice.action === "increase" ? "success" : "muted"}>רמה מומלצת: {DIFFICULTY_LABEL[advice.difficulty]}</Badge></div>
                        <p className="mt-1 text-muted-foreground">{advice.reason}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {advice.action === "decrease" && <Link href={`/tutor?mode=explain&subject=${t.subjectId ?? ""}&topic=${encodeURIComponent(t.topic)}&ask=${encodeURIComponent(`אני מתקשה ב${t.topic}. תסביר לי שוב מההתחלה בצורה פשוטה.`)}`} className="font-bold text-primary underline">הסבר נוסף</Link>}
                          <Link href={`/tutor?mode=practice&subject=${t.subjectId ?? ""}&topic=${encodeURIComponent(t.topic)}`} className="font-bold text-primary underline">תרגול נוסף</Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function TopicRow({ name, sub, percent, attempts, warn }: { name: string; sub: string; percent: number; attempts: number; warn?: boolean }) {
  return (
    <li>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm"><span className="truncate font-semibold">{name} <span className="font-normal text-muted-foreground">· {sub}</span></span><Badge variant={warn ? "warning" : "success"}>{percent}%</Badge></div>
      <Progress value={percent} label={`שליטה ב${name}`} />
      <p className="mt-0.5 text-xs text-muted-foreground">מבוסס על {attempts} תרגילים</p>
    </li>
  );
}
