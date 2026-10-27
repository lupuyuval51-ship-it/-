"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CheckCircle2, CircleHelp, Loader2, RotateCcw, Sparkles, Trash2, XCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Markdown } from "@/components/shared/Markdown";
import { useAiStatus } from "@/hooks/useAiStatus";
import { useData } from "@/hooks/useApp";
import { act } from "@/services/data/actions";
import { aiGenerate, AiClientError } from "@/services/ai/client";
import { createRun, recommendFromAttempt, saveRun } from "@/services/learning/simulation";
import { scoreLabel } from "@/services/learning/scoring";
import { TYPE_LABEL } from "@/components/exams/QuestionForm";
import { toast } from "@/lib/bus";
import { cn } from "@/lib/utils";
import type { AnswerSubmission, ExamQuestion } from "@/types";

export default function AttemptResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const data = useData();
  const ai = useAiStatus();
  const [busy, setBusy] = useState<string | null>(null);
  const [del, setDel] = useState(false);
  const attempt = data.examAttempts.find((a) => a.id === id);
  const subs = useMemo(() => data.answerSubmissions.filter((s) => s.attemptId === id), [data.answerSubmissions, id]);
  const rows = useMemo(() => (attempt ? attempt.questionIds.map((qid) => ({ q: data.examQuestions.find((x) => x.id === qid), s: subs.find((x) => x.questionId === qid) })) : []), [attempt, data.examQuestions, subs]);

  if (!attempt) return <EmptyState icon={<CircleHelp />} title="התוצאה לא נמצאה" action={<Link href="/exams" className={buttonVariants()}>חזרה למבחנים</Link>} />;

  const questions = rows.map((r) => r.q).filter((q): q is ExamQuestion => !!q);
  const recs = recommendFromAttempt(questions, subs);
  const subject = data.subjects.find((s) => s.id === attempt.subjectId);

  const assessAi = async (q: ExamQuestion, s: AnswerSubmission) => {
    setBusy(s.id);
    try {
      const out = await aiGenerate<{ score: number; feedback: string }>({ kind: "grade", question: q.prompt, modelAnswer: q.answerKey, rubric: q.rubric, studentAnswer: s.response || "(לא נענתה)", grade: data.profile!.grade });
      act.updateSubmission(s.id, { assessment: { score: out.score, feedback: out.feedback }, points: out.score / 100, correct: out.score >= 60, selfAssessed: false }, attempt.id);
      toast.success("התקבלה הערכת AI", "זו הערכה בלבד ואינה ציון רשמי.");
    } catch (e) {
      toast.error("ההערכה נכשלה", e instanceof AiClientError ? e.message : "נסה שוב.");
    } finally {
      setBusy(null);
    }
  };

  const selfAssess = (s: AnswerSubmission, points: number) => act.updateSubmission(s.id, { points, correct: points >= 0.5, assessment: null, selfAssessed: true }, attempt.id);

  const retry = () => {
    const run = createRun({ examId: attempt.examId, subjectId: attempt.subjectId, title: attempt.title, questions, timerMinutes: attempt.timerSeconds ? Math.round(attempt.timerSeconds / 60) : 0 });
    saveRun(run);
    router.push(`/exams/run/${run.attemptId}`);
  };

  const mcqText = (q: ExamQuestion, v: string) => (v === "" ? "(לא נענתה)" : q.options[Number(v)] ?? v);
  const display = (q: ExamQuestion, v: string) => (q.type === "mcq" ? mcqText(q, v) : q.type === "tf" ? (v === "true" ? "נכון" : v === "false" ? "לא נכון" : "(לא נענתה)") : v || "(לא נענתה)");
  const correctDisplay = (q: ExamQuestion) => (q.type === "mcq" ? q.options[Number(q.answerKey)] : q.type === "tf" ? (q.answerKey === "true" ? "נכון" : "לא נכון") : q.answerKey.split("|")[0]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="space-y-4 p-6 text-center">
        <p className="text-sm font-semibold text-muted-foreground">{attempt.title}{subject ? ` · ${subject.name}` : ""}</p>
        <p className={cn("text-6xl font-extrabold", attempt.scorePercent === null ? "text-muted-foreground" : attempt.scorePercent >= 60 ? "text-success" : "text-warning")} data-testid="attempt-score">{attempt.scorePercent === null ? "—" : `${attempt.scorePercent}%`}</p>
        <p className="text-lg font-bold">{scoreLabel(attempt.scorePercent)}</p>
        <p className="text-sm text-muted-foreground">הציון מחושב על {attempt.gradedCount} שאלות שנבדקו{attempt.pendingCount > 0 ? `. ${attempt.pendingCount} שאלות פתוחות ממתינות להערכה ולא נכללות בציון` : ""}. שאלות אמריקאיות, נכון/לא נכון והשלמה נבדקות מול מפתח תשובות; הערכות AI והערכה עצמית הן הערכה בלבד ואינן ציון רשמי.</p>
        <div className="flex flex-wrap justify-center gap-2"><Button onClick={retry}><RotateCcw /> נסה שוב</Button><Link href="/exams" className={buttonVariants({ variant: "outline" })}>למבחנים</Link><Button variant="ghost" size="icon" aria-label="מחיקת התוצאה" onClick={() => setDel(true)}><Trash2 className="text-destructive" /></Button></div>
      </Card>

      {recs.length > 0 && (
        <Card className="space-y-3 p-5" data-testid="recommendations">
          <h2 className="font-bold">המלצות לתרגול נוסף</h2>
          <ul className="space-y-2">
            {recs.map((r) => (
              <li key={r.topic} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 p-3 text-sm">
                <span><b>{r.topic}</b> · {r.percent}% הצלחה בסימולציה זו (המלצה כי הציון נמוך מ-70%)</span>
                <Link href={`/tutor?mode=explain&subject=${attempt.subjectId}&topic=${encodeURIComponent(r.topic)}`} className={buttonVariants({ size: "sm", variant: "secondary" })}><Sparkles /> הסבר ותרגול</Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <section aria-label="סקירת שאלות" className="space-y-3">
        <h2 className="text-lg font-bold">סקירה והסברים</h2>
        {rows.map(({ q, s }, i) => {
          if (!q) return <Card key={i} className="p-4 text-sm text-muted-foreground">שאלה {i + 1} נמחקה מהבנק.</Card>;
          const pending = !s || s.points === null;
          return (
            <Card key={q.id} className={cn("space-y-3 border-s-4 p-4", pending ? "border-s-warning" : s!.points! >= 0.5 ? "border-s-success" : "border-s-destructive")} data-testid="review-item">
              <div className="flex items-start gap-3">
                {pending ? <CircleHelp className="mt-1 size-5 shrink-0 text-warning" aria-label="ממתינה להערכה" /> : s!.points! >= 0.5 ? <CheckCircle2 className="mt-1 size-5 shrink-0 text-success" aria-label="נכונה" /> : <XCircle className="mt-1 size-5 shrink-0 text-destructive" aria-label="שגויה" />}
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-xs text-muted-foreground">שאלה {i + 1} · {TYPE_LABEL[q.type]} · {q.topic}</p>
                  <div className="font-semibold"><Markdown>{q.prompt}</Markdown></div>
                  <p className="text-sm"><span className="text-muted-foreground">התשובה שלך: </span><b>{display(q, s?.response ?? "")}</b></p>
                  {q.type !== "open" && <p className="text-sm"><span className="text-muted-foreground">התשובה הנכונה: </span><b className="text-success">{correctDisplay(q)}</b></p>}
                  {q.type === "open" && (
                    <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
                      <p><span className="text-muted-foreground">תשובה לדוגמה: </span>{q.answerKey}</p>
                      {q.rubric && <p><span className="text-muted-foreground">מחוון: </span>{q.rubric}</p>}
                      {s?.assessment && <p className="rounded-md bg-primary/8 p-2"><Badge className="me-2">הערכת AI · {s.assessment.score}/100</Badge>{s.assessment.feedback}<span className="mt-1 block text-xs text-muted-foreground">זו הערכה של מודל AI ולא ציון רשמי.</span></p>}
                      {s?.selfAssessed && <p><Badge variant="muted">הערכה עצמית</Badge></p>}
                      {s && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Button size="sm" variant="secondary" disabled={!ai.configured || busy === s.id} onClick={() => void assessAi(q, s)}>{busy === s.id ? <Loader2 className="animate-spin" /> : <Sparkles />} הערכת AI</Button>
                          <span className="text-xs text-muted-foreground">או הערכה עצמית:</span>
                          {[[1, "נכון"], [0.5, "חלקי"], [0, "לא נכון"]].map(([p, l]) => <Button key={l} size="sm" variant="outline" onClick={() => selfAssess(s, p as number)}>{l}</Button>)}
                        </div>
                      )}
                    </div>
                  )}
                  {q.explanation && <p className="rounded-lg bg-primary/6 p-3 text-sm"><b>הסבר: </b><Markdown className="inline">{q.explanation}</Markdown></p>}
                </div>
              </div>
            </Card>
          );
        })}
      </section>
      <ConfirmDialog open={del} onOpenChange={setDel} title="למחוק את התוצאה?" onConfirm={() => { act.removeAttempt(attempt.id); toast.info("התוצאה נמחקה"); router.replace("/exams"); }} />
    </div>
  );
}
