"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Coffee, Pause, Play, Plus, SkipForward, Square, Timer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SubjectChip } from "@/components/shared/SubjectIcon";
import { useData, useToday } from "@/hooks/useApp";
import { act } from "@/services/data/actions";
import { advance, defaultFocus, finish, formatClock, KEY, pause, remainingMs, segmentMs, skipBreak, start, type FocusState } from "@/services/learning/focus";
import { studyMinutesToday } from "@/services/learning/stats";
import { dateToIsoDay, formatShort } from "@/lib/dates";
import { toast } from "@/lib/bus";
import { cn, formatMinutes } from "@/lib/utils";

const FOCUS_PRESETS = [15, 25, 45, 60];
const BREAK_PRESETS = [5, 10, 15];

function load(): FocusState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultFocus();
    const s = { ...defaultFocus(), ...(JSON.parse(raw) as FocusState) };
    return catchUp(s, Date.now());
  } catch {
    return defaultFocus();
  }
}

/** אם הדפדפן היה סגור בזמן שהקטע הסתיים, מדביקים את הפער בלי לאבד זמן ריכוז */
function catchUp(s: FocusState, now: number): FocusState {
  let cur = s;
  for (let i = 0; i < 40 && cur.status === "running" && remainingMs(cur, now) === 0; i++) {
    const endAt = (cur.segmentStart ?? now) + (segmentMs(cur) - cur.segmentElapsedMs);
    cur = advance(cur, endAt);
  }
  return cur;
}

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; g.gain.value = 0.08;
    o.start(); o.stop(ctx.currentTime + 0.35);
  } catch { /* אין אודיו */ }
}

export default function FocusPage() {
  const data = useData();
  const today = useToday();
  const [state, setState] = useState<FocusState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [summary, setSummary] = useState<{ minutes: number; cycles: number } | null>(null);
  const [manual, setManual] = useState(false);
  const stateRef = useRef<FocusState | null>(null);

  useEffect(() => {
    const s = load();
    stateRef.current = s;
    setState(s);
  }, []);

  const commit = useCallback((next: FocusState) => {
    stateRef.current = next;
    setState(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* מתעלמים */ }
  }, []);

  // טיקר: מעדכן תצוגה ובודק סיום קטע
  useEffect(() => {
    if (!state || state.status !== "running") return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const cur = stateRef.current;
      if (cur && cur.status === "running" && remainingMs(cur, t) === 0) {
        const wasFocus = cur.phase === "focus";
        commit(advance(cur, t));
        beep();
        toast.info(wasFocus ? "סיימת מחזור ריכוז. הפסקה!" : "ההפסקה נגמרה. חוזרים ללמוד!");
        if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) new Notification(wasFocus ? "זמן להפסקה ☕" : "חזרה ללמוד 📚", { body: "LUPU Study AI" });
      }
    }, 500);
    return () => clearInterval(id);
  }, [state?.status, state?.phase, commit, state]);

  // שומר את המסך דלוק בזמן ריכוז (אם נתמך)
  useEffect(() => {
    if (state?.status !== "running" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock.request("screen").then((l) => { lock = l; }).catch(() => {});
    return () => { void lock?.release().catch(() => {}); };
  }, [state?.status]);

  const todayMin = studyMinutesToday(data, today);
  const recent = useMemo(() => [...data.studySessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 8), [data.studySessions]);

  if (!state) return <div className="skeleton h-72" role="status" aria-label="טוען" />;
  const active = state.status !== "idle";
  const remaining = remainingMs(state, now);
  const total = segmentMs(state);
  const progress = 1 - remaining / total;

  const end = () => {
    const r = finish(state, Date.now());
    commit(r.reset);
    if (r.minutes >= 1) {
      act.recordSession({ subjectId: state.subjectId, minutes: r.minutes, plannedMinutes: state.focusMinutes, kind: "focus", completed: r.cycles > 0, startedAt: r.startedAt ?? undefined });
    }
    setSummary({ minutes: r.minutes, cycles: r.cycles });
  };

  const setup = (patch: Partial<FocusState>) => commit({ ...state, ...patch });

  const ring = (
    <svg viewBox="0 0 200 200" className="size-64 -rotate-90 sm:size-80" aria-hidden>
      <circle cx="100" cy="100" r="90" fill="none" strokeWidth="10" className="stroke-muted" />
      <circle cx="100" cy="100" r="90" fill="none" strokeWidth="10" strokeLinecap="round" className={state.phase === "focus" ? "stroke-primary" : "stroke-accent"} strokeDasharray={565.5} strokeDashoffset={565.5 * (1 - progress)} style={{ transition: "stroke-dashoffset 0.5s linear" }} />
    </svg>
  );

  return (
    <>
      <PageHeader title="מצב ריכוז" description="פומודורו: ריכוז מלא, הפסקות קצרות, וזמן לימוד שנשמר בפועל" actions={<Button variant="outline" onClick={() => setManual(true)}><Plus /> זמן לימוד ידני</Button>} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-6 p-6 lg:col-span-2">
          <div className="grid gap-5 sm:grid-cols-2">
            <fieldset><legend className="mb-2 text-sm font-semibold">משך ריכוז (דקות)</legend>
              <div className="flex flex-wrap gap-2">{FOCUS_PRESETS.map((m) => <button key={m} type="button" aria-pressed={state.focusMinutes === m} onClick={() => setup({ focusMinutes: m })} className={cn("h-10 min-w-12 rounded-lg border-2 px-3 font-bold", state.focusMinutes === m ? "border-primary bg-primary/10 text-primary" : "border-border")}>{m}</button>)}
                <Input aria-label="משך ריכוז מותאם אישית" type="number" min={1} max={180} value={state.focusMinutes} onChange={(e) => setup({ focusMinutes: Math.max(1, Math.min(180, Number(e.target.value) || 25)) })} className="h-10 w-20" /></div>
            </fieldset>
            <fieldset><legend className="mb-2 text-sm font-semibold">משך הפסקה (דקות)</legend>
              <div className="flex flex-wrap gap-2">{BREAK_PRESETS.map((m) => <button key={m} type="button" aria-pressed={state.breakMinutes === m} onClick={() => setup({ breakMinutes: m })} className={cn("h-10 min-w-12 rounded-lg border-2 px-3 font-bold", state.breakMinutes === m ? "border-accent bg-accent/10 text-accent" : "border-border")}>{m}</button>)}
                <Input aria-label="משך הפסקה מותאם אישית" type="number" min={1} max={60} value={state.breakMinutes} onChange={(e) => setup({ breakMinutes: Math.max(1, Math.min(60, Number(e.target.value) || 5)) })} className="h-10 w-20" /></div>
            </fieldset>
          </div>
          <Field label="מקצוע" htmlFor="focus-subject"><Select id="focus-subject" value={state.subjectId ?? ""} onChange={(e) => setup({ subjectId: e.target.value || null })}><option value="">ללא מקצוע מסוים</option>{data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-muted/40 p-6">
            <p className="text-5xl font-extrabold tabular-nums" data-testid="focus-preview">{formatClock(state.focusMinutes * 60_000)}</p>
            <Button size="lg" variant="gradient" onClick={() => commit(start(state, Date.now()))} disabled={active} data-testid="focus-start"><Play /> התחל מפגש ריכוז</Button>
            {active && <p className="text-sm text-muted-foreground">מפגש פעיל. המסך המלא נפתח למעלה.</p>}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5"><p className="text-sm text-muted-foreground">זמן לימוד היום</p><p className="text-3xl font-extrabold">{formatMinutes(todayMin)}</p><p className="mt-1 text-xs text-muted-foreground">יעד יומי: {data.profile?.dailyMinutes} דקות. ימי מנוחה בסדר גמור.</p></Card>
          <Card className="p-5">
            <h2 className="mb-2 font-bold">מפגשים אחרונים</h2>
            {recent.length === 0 ? <p className="text-sm text-muted-foreground">עוד לא נשמרו מפגשים.</p> : (
              <ul className="space-y-2 text-sm">
                {recent.map((s) => (
                  <li key={s.id} className="flex items-center gap-2"><Timer className="size-4 shrink-0 text-primary" aria-hidden /><span className="min-w-0 flex-1 truncate">{formatMinutes(s.minutes)} <SubjectChip subject={data.subjects.find((x) => x.id === s.subjectId)} /></span><span className="text-xs text-muted-foreground">{formatShort(dateToIsoDay(s.startedAt))}</span><Button size="icon-sm" variant="ghost" aria-label="מחיקת מפגש" onClick={() => { act.removeSession(s.id); toast.info("המפגש נמחק"); }}><Trash2 className="size-4 text-destructive" /></Button></li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {active && (
        <div role="dialog" aria-modal="true" aria-label="מצב ריכוז" className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-background p-6" data-testid="focus-overlay">
          <p className={cn("flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold", state.phase === "focus" ? "bg-primary/12 text-primary" : "bg-accent/15 text-accent")}>{state.phase === "focus" ? <><Timer className="size-4" /> ריכוז</> : <><Coffee className="size-4" /> הפסקה</>}{state.subjectId && ` · ${data.subjects.find((s) => s.id === state.subjectId)?.name ?? ""}`}</p>
          <div className="relative flex items-center justify-center">
            {ring}
            <div className="absolute text-center"><p className="text-6xl font-extrabold tabular-nums sm:text-7xl" role="timer" aria-live="off" data-testid="focus-clock">{formatClock(remaining)}</p><p className="mt-1 text-sm text-muted-foreground">מחזורים שהושלמו: {state.cycles}</p></div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {state.status === "running" ? <Button size="lg" variant="secondary" onClick={() => commit(pause(state, Date.now()))} data-testid="focus-pause"><Pause /> השהה</Button> : <Button size="lg" variant="gradient" onClick={() => commit(start(state, Date.now()))} data-testid="focus-resume"><Play /> המשך</Button>}
            {state.phase === "break" && <Button size="lg" variant="outline" onClick={() => commit(skipBreak(state, Date.now()))}><SkipForward /> דלג על ההפסקה</Button>}
            <Button size="lg" variant="outline" onClick={end} data-testid="focus-finish"><Square /> סיים ושמור</Button>
          </div>
          <p className="max-w-sm text-center text-xs text-muted-foreground">הזמן נשמר גם אם תרענן את הדף. רק זמן ריכוז אמיתי (בלי הפסקות והשהיות) נספר.</p>
        </div>
      )}

      <Dialog open={!!summary} onOpenChange={(o) => !o && setSummary(null)} title="סיכום מפגש הלימוד" footer={<Button onClick={() => setSummary(null)}>סגירה</Button>}>
        {summary && (summary.minutes >= 1 ? (
          <div className="space-y-3 text-center" data-testid="focus-summary">
            <p className="text-5xl font-extrabold text-primary">{formatMinutes(summary.minutes)}</p>
            <p className="text-muted-foreground">למדת בריכוז. {summary.cycles > 0 ? `הושלמו ${summary.cycles} מחזורי ריכוז.` : ""} הזמן נשמר ונכנס לסטטיסטיקות.</p>
          </div>
        ) : <EmptyState icon={<Timer />} title="המפגש היה קצר מדקה" description="לא נשמר זמן לימוד. בפעם הבאה נסה לפחות דקה." />)}
      </Dialog>
      {manual && <ManualDialog onClose={() => setManual(false)} />}
    </>
  );
}

function ManualDialog({ onClose }: { onClose: () => void }) {
  const data = useData();
  const [minutes, setMinutes] = useState(30);
  const [subjectId, setSubjectId] = useState("");
  const [error, setError] = useState("");
  const save = () => {
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 600) return setError("הזן בין 1 ל-600 דקות");
    act.recordSession({ subjectId: subjectId || null, minutes, plannedMinutes: minutes, kind: "manual", completed: true });
    toast.success("זמן הלימוד נוסף");
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title="הוספת זמן לימוד ידני" description="למדת בלי הטיימר? אפשר לרשום זאת כאן." footer={<><Button variant="outline" onClick={onClose}>ביטול</Button><Button onClick={save}>שמירה</Button></>}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <Field label="דקות" htmlFor="man-min" error={error}><Input id="man-min" type="number" min={1} max={600} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} /></Field>
        <Field label="מקצוע" htmlFor="man-subject"><Select id="man-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}><option value="">ללא</option>{data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
      </form>
    </Dialog>
  );
}
