"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CalendarCheck, ClipboardCheck, GraduationCap, Pencil, Play, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { Markdown } from "@/components/shared/Markdown";
import { SubjectChip } from "@/components/shared/SubjectIcon";
import { ExamFormDialog } from "@/components/exams/ExamForm";
import { QuestionBadgeRow, QuestionFormDialog } from "@/components/exams/QuestionForm";
import { SimulationSetup } from "@/components/exams/SimulationSetup";
import { AiQuestionsDialog } from "@/components/exams/AiQuestionsDialog";
import { useData, useToday } from "@/hooks/useApp";
import { act } from "@/services/data/actions";
import { computeMastery } from "@/services/learning/mastery";
import { resultsFor } from "@/services/learning/stats";
import { diffDays, formatLong, formatShort, relativeDay } from "@/lib/dates";
import { toast } from "@/lib/bus";
import { cn } from "@/lib/utils";
import type { ExamQuestion } from "@/types";

type Tab = "plan" | "questions" | "history";

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const data = useData();
  const today = useToday();
  const exam = data.exams.find((e) => e.id === id);
  const [tab, setTab] = useState<Tab>("plan");
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const [sim, setSim] = useState(false);
  const [aiQ, setAiQ] = useState(false);
  const [qForm, setQForm] = useState<ExamQuestion | "new" | null>(null);

  const pool = useMemo(() => data.examQuestions.filter((q) => exam && (q.examId === exam.id || (q.examId === null && q.subjectId === exam.subjectId))), [data.examQuestions, exam]);
  const plan = useMemo(() => data.calendarEvents.filter((e) => exam && e.refId === exam.id && e.kind === "review").sort((a, b) => a.date.localeCompare(b.date)), [data.calendarEvents, exam]);
  const attempts = useMemo(() => data.examAttempts.filter((a) => exam && a.examId === exam.id && a.finishedAt).sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? "")), [data.examAttempts, exam]);

  if (!exam) return <EmptyState icon={<GraduationCap />} title="המבחן לא נמצא" description="ייתכן שהוא נמחק." action={<Link href="/exams" className={buttonVariants()}>חזרה למבחנים</Link>} />;

  const subject = data.subjects.find((s) => s.id === exam.subjectId);
  const left = diffDays(today, exam.date);
  const topicStats = exam.topics.map((t) => ({ topic: t, m: computeMastery(resultsFor(data, exam.subjectId, t)) }));
  const weak = topicStats.filter((t) => (t.m.percent ?? 100) < 60);
  const grouped = plan.reduce<Record<string, typeof plan>>((acc, e) => ((acc[e.date] ??= []).push(e), acc), {});

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold">{exam.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{formatLong(exam.date)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2"><SubjectChip subject={subject} />{exam.topics.map((t) => <Badge key={t} variant="muted">{t}</Badge>)}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn("rounded-2xl px-4 py-2 text-center", left < 0 ? "bg-muted text-muted-foreground" : left <= 3 ? "bg-destructive/12 text-destructive" : "bg-primary/10 text-primary")} data-testid="exam-days-left">
              <p className="text-3xl font-extrabold leading-none">{Math.abs(left)}</p>
              <p className="text-xs font-bold">{left < 0 ? "ימים מאז" : left === 0 ? "היום!" : "ימים נשארו"}</p>
            </div>
            <Button variant="outline" size="icon" aria-label="עריכת מבחן" onClick={() => setEdit(true)}><Pencil /></Button>
            <Button variant="outline" size="icon" aria-label="מחיקת מבחן" onClick={() => setDel(true)}><Trash2 className="text-destructive" /></Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="gradient" onClick={() => setSim(true)} disabled={pool.length === 0}><Play /> התחל סימולציה</Button>
          {pool.length === 0 && <span className="self-center text-sm text-muted-foreground">הוסף שאלות כדי להתחיל סימולציה</span>}
          <Link href={`/tutor?mode=practice&subject=${exam.subjectId}&topic=${encodeURIComponent(exam.topics[0] ?? "")}`} className={buttonVariants({ variant: "secondary" })}><Sparkles /> תרגול עם המורה</Link>
        </div>
      </Card>

      <Tabs<Tab> label="אזורי המבחן" value={tab} onChange={setTab} items={[{ value: "plan", label: "תוכנית חזרה", count: plan.length }, { value: "questions", label: "בנק שאלות", count: pool.length }, { value: "history", label: "סימולציות", count: attempts.length }]} />

      {tab === "plan" && (
        <section aria-label="תוכנית חזרה" className="space-y-4">
          <Card className="space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="font-bold">תוכנית חזרה יומית</h2><p className="text-sm text-muted-foreground">לפי {exam.minutesPerDay} דקות ביום, {exam.topics.length} נושאים ו-{Math.max(0, left)} ימים עד המבחן.</p></div>
              <Button onClick={() => { act.generatePlanEvents(exam.id); toast.success(plan.length ? "התוכנית עודכנה" : "התוכנית נוצרה", "המשימות נוספו ללוח השנה."); }} disabled={left <= 0}><CalendarCheck /> {plan.length ? "בנה תוכנית מחדש" : "צור תוכנית חזרה"}</Button>
            </div>
            {weak.length > 0 && <p className="rounded-lg bg-warning/10 p-3 text-sm"><b>למה כמה נושאים מקבלים תרגול נוסף?</b> לפי התרגולים שלך, שיעור ההצלחה המשוער ב{weak.map((w) => `"${w.topic}" (${w.m.percent}%)`).join(", ")} נמוך מ-60%.</p>}
            <p className="text-xs text-muted-foreground">התוכנית שומרת ימי מנוחה (שבת), מקדישה את היום האחרון לחזרה כללית ויומיים לפני לסימולציה. אפשר לערוך אותה גם בלוח השנה.</p>
          </Card>
          {plan.length === 0 ? <EmptyState icon={<CalendarCheck />} title="עדיין אין תוכנית" description={left <= 0 ? "המבחן כבר היום או שעבר." : "לחץ על 'צור תוכנית חזרה' כדי לקבל משימות יומיות."} /> : (
            <ol className="space-y-3">
              {Object.entries(grouped).map(([date, items]) => (
                <li key={date}>
                  <h3 className="mb-1.5 text-sm font-bold text-muted-foreground">{formatShort(date)} · {relativeDay(date, today)}</h3>
                  <ul className="space-y-1.5">
                    {items.map((e) => (
                      <li key={e.id}><Card className={cn("flex items-center gap-3 p-3", e.done && "opacity-60")}>
                        <button type="button" role="checkbox" aria-checked={e.done} aria-label={`סמן "${e.title}" כהושלם`} onClick={() => act.setEventDone(e.id, !e.done)} className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border-2", e.done ? "border-success bg-success text-success-foreground" : "border-input")}>{e.done && <ClipboardCheck className="size-3.5" />}</button>
                        <div className="min-w-0 flex-1"><p className={cn("font-semibold", e.done && "line-through")}>{e.title}</p><p className="text-xs text-muted-foreground">{e.notes}</p></div>
                      </Card></li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {tab === "questions" && (
        <section aria-label="בנק שאלות" className="space-y-3">
          <div className="flex flex-wrap gap-2"><Button onClick={() => setQForm("new")}><Plus /> שאלה חדשה</Button><Button variant="outline" onClick={() => setAiQ(true)}><Sparkles /> צור עם AI</Button></div>
          {pool.length === 0 ? <EmptyState icon={<ClipboardCheck />} title="בנק השאלות ריק" description="הוסף שאלות ידנית או צור אותן עם AI, ואז אפשר להריץ סימולציית מבחן." /> : (
            <ul className="space-y-2">
              {pool.map((q) => (
                <li key={q.id}><Card className="flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1 space-y-1"><QuestionBadgeRow q={q} />{q.source === "ai" && <Badge variant="muted" className="ms-2">AI</Badge>}<div className="text-sm"><Markdown>{q.prompt}</Markdown></div></div>
                  <Button size="icon-sm" variant="ghost" aria-label="עריכת שאלה" onClick={() => setQForm(q)}><Pencil /></Button>
                  <Button size="icon-sm" variant="ghost" aria-label="מחיקת שאלה" onClick={() => { act.removeQuestion(q.id); toast.info("השאלה נמחקה"); }}><Trash2 className="text-destructive" /></Button>
                </Card></li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "history" && (
        <section aria-label="סימולציות" className="space-y-2">
          {attempts.length === 0 ? <EmptyState icon={<ClipboardCheck />} title="עוד לא בוצעה סימולציה" description="תוצאות הסימולציות יישמרו כאן, עם הסבר לכל שגיאה." /> : attempts.map((a) => (
            <Link key={a.id} href={`/exams/attempt/${a.id}`}><Card className="mb-2 flex items-center justify-between gap-3 p-3.5 hover:bg-muted/50"><span className="font-semibold">{formatShort((a.finishedAt ?? "").slice(0, 10))} · {a.questionIds.length} שאלות</span><Badge variant={a.scorePercent === null ? "muted" : a.scorePercent >= 60 ? "success" : "warning"}>{a.scorePercent === null ? "טרם נבדק" : `${a.scorePercent}%`}</Badge></Card></Link>
          ))}
        </section>
      )}

      {edit && <ExamFormDialog open onOpenChange={setEdit} initial={exam} />}
      {sim && <SimulationSetup open onOpenChange={setSim} pool={pool} examId={exam.id} subjectId={exam.subjectId} title={`סימולציה – ${exam.title}`} />}
      {aiQ && <AiQuestionsDialog exam={exam} onClose={() => setAiQ(false)} />}
      {qForm && <QuestionFormDialog open onOpenChange={(o) => !o && setQForm(null)} initial={qForm === "new" ? null : qForm} subjectId={exam.subjectId} examId={exam.id} topics={exam.topics} onSave={(q) => { if (qForm === "new") { act.addQuestions([q]); toast.success("השאלה נוספה"); } else { act.updateQuestion(qForm.id, q); toast.success("השאלה עודכנה"); } }} />}
      <ConfirmDialog open={del} onOpenChange={setDel} title={`למחוק את "${exam.title}"?`} description="גם תוכנית החזרה, השאלות והתוצאות של המבחן יימחקו." onConfirm={() => { act.removeExam(exam.id); toast.info("המבחן נמחק"); router.replace("/exams"); }} />
    </div>
  );
}
