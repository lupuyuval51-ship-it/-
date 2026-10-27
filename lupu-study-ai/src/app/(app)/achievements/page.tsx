"use client";

import { useMemo, useState } from "react";
import { Flame, Lock, Plus, Target, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/PageHeader";
import { Icon } from "@/components/shared/Icon";
import { useData, useToday } from "@/hooks/useApp";
import { act } from "@/services/data/actions";
import { ACHIEVEMENTS, levelFromXp, totalXp, XP } from "@/services/learning/gamification";
import { activeDays, computeStreak, weeklyGoalProgress } from "@/services/learning/stats";
import { relativeDay, dateToIsoDay } from "@/lib/dates";
import { toast } from "@/lib/bus";
import { cn } from "@/lib/utils";
import type { PersonalGoal } from "@/types";

const METRICS: Record<PersonalGoal["metric"], { label: string; unit: string; default: number }> = {
  studyMinutesWeek: { label: "דקות לימוד בשבוע", unit: "דקות", default: 150 },
  practiceWeek: { label: "תרגילים בשבוע", unit: "תרגילים", default: 30 },
  cardsWeek: { label: "כרטיסיות בשבוע", unit: "כרטיסיות", default: 40 },
};

export default function AchievementsPage() {
  const data = useData();
  const today = useToday();
  const [adding, setAdding] = useState(false);
  const xp = totalXp(data.xpEvents);
  const lv = levelFromXp(xp);
  const streak = computeStreak(activeDays(data), today);
  const unlocked = useMemo(() => new Map(data.achievements.map((a) => [a.key, a])), [data.achievements]);
  const recent = useMemo(() => [...data.xpEvents].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8), [data.xpEvents]);

  return (
    <>
      <PageHeader title="הישגים ויעדים" description="התקדמות, רמות ומוטיבציה. ימי מנוחה הם חלק בריא מהלמידה, ולכן לא מענישים עליהם." />
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <Card className="p-5 md:col-span-2">
            <div className="flex items-center gap-4">
              <div className="flex size-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow"><span className="text-[11px] font-bold">רמה</span><span className="text-3xl font-extrabold leading-none" data-testid="level">{lv.level}</span></div>
              <div className="min-w-0 flex-1"><p className="flex items-center gap-1.5 text-lg font-extrabold"><Zap className="size-5 text-warning" aria-hidden /> {xp} XP</p><Progress className="my-2" value={lv.progress * 100} label="התקדמות לרמה הבאה" /><p className="text-sm text-muted-foreground">עוד {lv.next - lv.current} XP לרמה {lv.level + 1}</p></div>
            </div>
          </Card>
          <Card className="flex items-center gap-4 p-5"><Flame className="size-10 text-amber-500" aria-hidden /><div><p className="text-3xl font-extrabold">{streak.current}</p><p className="text-sm text-muted-foreground">ימי רצף · שיא {streak.best}</p></div></Card>
        </section>

        <Card className="p-5 text-sm text-muted-foreground">
          <p><b className="text-foreground">איך צוברים XP?</b> שיעורי בית ({XP.homework}), סימולציות ({XP.attemptBase}+ בונוס לפי ציון), מפגשי ריכוז (1 לכל 2 דקות, עד {XP.sessionCap}), כרטיסיות ידעתי (1, עד {XP.flashcardDailyCap} ביום), סיכומים ({XP.summary}) ותרגילים שמורים ({XP.scan}). כל פעולה מזכה פעם אחת בלבד, כך שלחיצות חוזרות לא מוסיפות נקודות.</p>
        </Card>

        <section aria-labelledby="goals">
          <div className="mb-3 flex items-center justify-between"><h2 id="goals" className="text-lg font-bold">יעדים אישיים</h2><Button size="sm" onClick={() => setAdding(true)}><Plus /> יעד חדש</Button></div>
          {data.personalGoals.length === 0 ? <Card className="p-5 text-sm text-muted-foreground">הגדר יעד שבועי משלך, למשל 150 דקות לימוד, והתקדמות תוצג כאן.</Card> : (
            <ul className="grid gap-3 md:grid-cols-2">
              {data.personalGoals.map((g) => {
                const cur = weeklyGoalProgress(data, g.metric, today);
                const done = cur >= g.target;
                return (
                  <li key={g.id}><Card className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2"><div className="flex items-center gap-2"><Target className={cn("size-5", done ? "text-success" : "text-primary")} aria-hidden /><p className="font-bold">{g.title}</p></div><Button size="icon-sm" variant="ghost" aria-label={`מחיקת היעד ${g.title}`} onClick={() => { act.removeGoal(g.id); toast.info("היעד נמחק"); }}><Trash2 className="text-destructive" /></Button></div>
                    <Progress value={(cur / g.target) * 100} label={g.title} barClassName={done ? "from-success to-success" : undefined} />
                    <p className="text-xs text-muted-foreground">{Math.round(cur)} מתוך {g.target} {METRICS[g.metric].unit} ב-7 הימים האחרונים{done ? " · היעד הושג 🎉" : ""}</p>
                  </Card></li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="ach">
          <h2 id="ach" className="mb-3 text-lg font-bold">הישגים ({unlocked.size}/{ACHIEVEMENTS.length})</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ACHIEVEMENTS.map((a) => {
              const u = unlocked.get(a.key);
              return (
                <li key={a.key}><Card className={cn("flex items-center gap-3 p-4", !u && "opacity-60")} data-testid={u ? "achievement-unlocked" : "achievement-locked"}>
                  <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", u ? "bg-gradient-to-br from-primary to-accent text-primary-foreground" : "bg-muted text-muted-foreground")}>{u ? <Icon name={a.icon} className="size-6" /> : <Lock className="size-5" aria-hidden />}</span>
                  <div className="min-w-0"><p className="font-bold">{a.title}</p><p className="text-xs text-muted-foreground">{a.description}</p>{u && <p className="text-[11px] font-semibold text-success">התקבל {relativeDay(dateToIsoDay(u.unlockedAt), today)}</p>}</div>
                </Card></li>
              );
            })}
          </ul>
        </section>

        {recent.length > 0 && (
          <Card>
            <CardHeader><CardTitle>XP אחרון</CardTitle><CardDescription>הפעולות האחרונות שזיכו בנקודות</CardDescription></CardHeader>
            <CardContent><ul className="divide-y text-sm">{recent.map((e) => <li key={e.id} className="flex items-center justify-between py-2"><span>{e.reason}</span><span className="font-bold text-warning">+{e.amount}</span></li>)}</ul></CardContent>
          </Card>
        )}
      </div>
      {adding && <GoalDialog onClose={() => setAdding(false)} />}
    </>
  );
}

function GoalDialog({ onClose }: { onClose: () => void }) {
  const [metric, setMetric] = useState<PersonalGoal["metric"]>("studyMinutesWeek");
  const [target, setTarget] = useState(METRICS.studyMinutesWeek.default);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const save = () => {
    if (!Number.isFinite(target) || target < 1 || target > 100000) return setError("הזן יעד חיובי");
    act.addGoal({ metric, target: Math.round(target), title: title.trim() || METRICS[metric].label });
    toast.success("היעד נוסף");
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title="יעד אישי חדש" footer={<><Button variant="outline" onClick={onClose}>ביטול</Button><Button onClick={save}>שמירה</Button></>}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <Field label="מה למדוד?" htmlFor="g-metric"><Select id="g-metric" value={metric} onChange={(e) => { const m = e.target.value as PersonalGoal["metric"]; setMetric(m); setTarget(METRICS[m].default); }}>{(Object.keys(METRICS) as PersonalGoal["metric"][]).map((m) => <option key={m} value={m}>{METRICS[m].label}</option>)}</Select></Field>
        <Field label="יעד" htmlFor="g-target" error={error}><Input id="g-target" type="number" min={1} value={target} onChange={(e) => setTarget(Number(e.target.value))} /></Field>
        <Field label="שם (אופציונלי)" htmlFor="g-title"><Input id="g-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></Field>
      </form>
    </Dialog>
  );
}
