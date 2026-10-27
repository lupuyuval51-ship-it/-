"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ClipboardList, Flag, Send, Timer } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/EmptyState";
import { Markdown } from "@/components/shared/Markdown";
import { useData } from "@/hooks/useApp";
import { act } from "@/services/data/actions";
import { clearRun, gradeRun, loadRun, saveRun, type RunState } from "@/services/learning/simulation";
import { TYPE_LABEL } from "@/components/exams/QuestionForm";
import { cn } from "@/lib/utils";

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function ExamRunPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const data = useData();
  const [run, setRun] = useState<RunState | null | undefined>(undefined);
  const [view, setView] = useState<"question" | "review">("question");
  const [confirm, setConfirm] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const submitted = useRef(false);

  useEffect(() => {
    setRun(loadRun(attemptId));
  }, [attemptId]);

  const questions = useMemo(() => (run ? run.questionIds.map((id) => data.examQuestions.find((q) => q.id === id)).filter((q): q is NonNullable<typeof q> => !!q) : []), [run, data.examQuestions]);

  const update = useCallback((patch: (r: RunState) => RunState) => {
    setRun((cur) => {
      if (!cur) return cur;
      const next = patch(cur);
      saveRun(next);
      return next;
    });
  }, []);

  const submit = useCallback(() => {
    if (!run || submitted.current) return;
    submitted.current = true;
    const { attempt, submissions } = gradeRun(run, questions);
    act.finishAttempt({ attempt, submissions });
    clearRun(run.attemptId);
    router.replace(`/exams/attempt/${run.attemptId}`);
  }, [run, questions, router]);

  // טיימר מבוסס חותמת זמן (לא סופר שניות), כך שהוא נכון גם אחרי רענון או לשונית ברקע
  useEffect(() => {
    if (!run?.deadline) return;
    const tick = () => {
      const left = Math.max(0, Math.round((run.deadline! - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) submit();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [run?.deadline, submit]);

  if (run === undefined) return <div className="skeleton h-72" role="status" aria-label="טוען מבחן" />;
  if (!run || questions.length === 0) {
    return <EmptyState icon={<ClipboardList />} title="המבחן לא נמצא" description="ייתכן שהוא כבר הוגש, או שהשאלות נמחקו." action={<Link href="/exams" className={buttonVariants()}>חזרה למבחנים</Link>} />;
  }

  const q = questions[Math.min(run.current, questions.length - 1)];
  const answered = questions.filter((x) => (run.answers[x.id] ?? "").trim() !== "").length;
  const setAnswer = (v: string) => update((r) => ({ ...r, answers: { ...r.answers, [q.id]: v } }));
  const go = (i: number) => { update((r) => ({ ...r, current: Math.max(0, Math.min(questions.length - 1, i)) })); setView("question"); };
  const flagged = run.flagged.includes(q.id);
  const order = run.optionOrder[q.id] ?? q.options.map((_, i) => i);

  if (view === "review") {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <h1 className="text-2xl font-extrabold">מסך הגשה</h1>
        <Card className="space-y-3 p-5">
          <p className="text-lg font-bold">ענית על {answered} מתוך {questions.length} שאלות</p>
          <Progress value={(answered / questions.length) * 100} label="שאלות שנענו" />
          {answered < questions.length && <p className="text-sm text-warning">שאלות שלא נענו נחשבות שגויות.</p>}
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
            {questions.map((x, i) => {
              const a = (run.answers[x.id] ?? "").trim() !== "";
              return <button key={x.id} type="button" onClick={() => go(i)} aria-label={`שאלה ${i + 1}: ${a ? "נענתה" : "לא נענתה"}${run.flagged.includes(x.id) ? ", מסומנת לבדיקה" : ""}`} className={cn("relative h-11 rounded-lg border-2 font-bold", a ? "border-success/60 bg-success/10 text-success" : "border-warning/60 bg-warning/10 text-warning")}>{i + 1}{run.flagged.includes(x.id) && <Flag className="absolute -end-1 -top-1 size-3.5 fill-primary text-primary" />}</button>;
            })}
          </div>
        </Card>
        <div className="flex gap-3"><Button variant="outline" size="lg" onClick={() => setView("question")}>חזרה למבחן</Button><Button variant="gradient" size="lg" className="flex-1" onClick={() => setConfirm(true)} data-testid="final-submit"><Send /> הגש את המבחן</Button></div>
        <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="להגיש את המבחן?" description={`ענית על ${answered} מתוך ${questions.length} שאלות. לא ניתן לשנות תשובות אחרי ההגשה.`} confirmLabel="הגשה" destructive={false} onConfirm={submit} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0"><h1 className="truncate text-lg font-extrabold">{run.title}</h1><p className="text-sm text-muted-foreground">שאלה {run.current + 1} מתוך {questions.length}</p></div>
        {remaining !== null && <div role="timer" aria-label={`זמן שנותר: ${mmss(remaining)}`} className={cn("flex items-center gap-2 rounded-full px-4 py-2 font-mono text-lg font-bold", remaining <= 60 ? "bg-destructive/12 text-destructive" : "bg-muted")} data-testid="exam-timer"><Timer className="size-5" aria-hidden />{mmss(remaining)}</div>}
      </div>
      <Progress value={(answered / questions.length) * 100} label="התקדמות במבחן" />

      <Card className="space-y-5 p-5 sm:p-6">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground"><span>{TYPE_LABEL[q.type]}</span>
          <button type="button" aria-pressed={flagged} onClick={() => update((r) => ({ ...r, flagged: flagged ? r.flagged.filter((x) => x !== q.id) : [...r.flagged, q.id] }))} className={cn("flex items-center gap-1 rounded-full px-2.5 py-1", flagged ? "bg-primary/12 text-primary" : "hover:bg-muted")}><Flag className={cn("size-3.5", flagged && "fill-current")} /> {flagged ? "מסומנת לבדיקה" : "סמן לבדיקה"}</button>
        </div>
        <div className="text-lg font-semibold" data-testid="exam-question"><Markdown>{q.prompt}</Markdown></div>

        {q.type === "mcq" && (
          <div role="radiogroup" aria-label="תשובות אפשריות" className="space-y-2">
            {order.map((orig, shown) => (
              <label key={orig} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3.5 transition-colors", run.answers[q.id] === String(shown) ? "border-primary bg-primary/8" : "border-border hover:bg-muted/50")}>
                <input type="radio" name={`q-${q.id}`} className="size-5 accent-[hsl(var(--primary))]" checked={run.answers[q.id] === String(shown)} onChange={() => setAnswer(String(shown))} />
                <span className="flex-1"><Markdown>{q.options[orig]}</Markdown></span>
              </label>
            ))}
          </div>
        )}
        {q.type === "tf" && (
          <div role="radiogroup" aria-label="נכון או לא נכון" className="grid grid-cols-2 gap-3">
            {[["true", "נכון"], ["false", "לא נכון"]].map(([v, l]) => (
              <label key={v} className={cn("flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 p-4 font-bold", run.answers[q.id] === v ? "border-primary bg-primary/8" : "border-border hover:bg-muted/50")}>
                <input type="radio" name={`q-${q.id}`} className="size-5 accent-[hsl(var(--primary))]" checked={run.answers[q.id] === v} onChange={() => setAnswer(v)} /> {l}
              </label>
            ))}
          </div>
        )}
        {q.type === "fill" && <Input aria-label="תשובה" value={run.answers[q.id] ?? ""} onChange={(e) => setAnswer(e.target.value)} placeholder="הקלד את התשובה" dir="auto" />}
        {q.type === "open" && <Textarea aria-label="תשובה" value={run.answers[q.id] ?? ""} onChange={(e) => setAnswer(e.target.value)} placeholder="כתוב את תשובתך ואת דרך הפתרון" className="min-h-40" dir="auto" />}
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => go(run.current - 1)} disabled={run.current === 0}><ArrowRight /> הקודמת</Button>
        <div className="no-scrollbar flex max-w-[50%] gap-1.5 overflow-x-auto" aria-label="ניווט בין שאלות">
          {questions.map((x, i) => <button key={x.id} type="button" onClick={() => go(i)} aria-label={`שאלה ${i + 1}`} aria-current={i === run.current ? "step" : undefined} className={cn("size-9 shrink-0 rounded-lg text-sm font-bold", i === run.current ? "bg-primary text-primary-foreground" : (run.answers[x.id] ?? "").trim() ? "bg-success/15 text-success" : "bg-muted")}>{i + 1}</button>)}
        </div>
        {run.current < questions.length - 1 ? <Button onClick={() => go(run.current + 1)}>הבאה <ArrowLeft /></Button> : <Button variant="gradient" onClick={() => setView("review")}>לסיום</Button>}
      </div>
      <div className="text-center"><Button variant="ghost" onClick={() => setView("review")} data-testid="to-review">למסך ההגשה</Button></div>
    </div>
  );
}
