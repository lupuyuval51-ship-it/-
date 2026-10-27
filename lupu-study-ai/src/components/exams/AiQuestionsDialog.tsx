"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { AiUnavailable } from "@/components/shared/AiUnavailable";
import { Markdown } from "@/components/shared/Markdown";
import { useAiStatus } from "@/hooks/useAiStatus";
import { useData } from "@/hooks/useApp";
import { act } from "@/services/data/actions";
import { aiGenerate, AiClientError } from "@/services/ai/client";
import { buildMaterialContext } from "@/services/ai/retrieval";
import { toast } from "@/lib/bus";
import type { Difficulty, Exam, QuestionType } from "@/types";
import { TYPE_LABEL } from "./QuestionForm";
import { cn } from "@/lib/utils";

interface GenQ { type: QuestionType; topic: string; prompt: string; options: string[]; answerKey: string; rubric: string; explanation: string; difficulty: number }

export function AiQuestionsDialog({ exam, onClose }: { exam: Exam; onClose: () => void }) {
  const data = useData();
  const ai = useAiStatus();
  const [types, setTypes] = useState<QuestionType[]>(["mcq", "tf", "fill"]);
  const [count, setCount] = useState(6);
  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [materialIds, setMaterialIds] = useState<string[]>(exam.materialIds);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<(GenQ & { keep: boolean })[]>([]);
  const mats = data.studyMaterials.filter((m) => m.pages.some((p) => p.text.trim()) && (m.subjectId === exam.subjectId || exam.materialIds.includes(m.id)));
  const subject = data.subjects.find((s) => s.id === exam.subjectId);

  const run = async () => {
    setError("");
    if (!types.length) return setError("בחר לפחות סוג שאלה אחד.");
    setBusy(true);
    try {
      const chosen = data.studyMaterials.filter((m) => materialIds.includes(m.id));
      const { ctx } = chosen.length ? buildMaterialContext(chosen, exam.topics.join(" "), 24_000) : { ctx: [] };
      const out = await aiGenerate<{ questions: GenQ[] }>({ kind: "questions", count, types, difficulty, topics: exam.topics, subject: subject?.name, grade: data.profile!.grade, materials: ctx.length ? ctx : undefined });
      if (!out.questions.length) return setError("ה-AI לא החזיר שאלות תקינות. נסה שוב או שנה את ההגדרות.");
      setDrafts(out.questions.map((q) => ({ ...q, keep: true })));
    } catch (e) {
      setError(e instanceof AiClientError ? e.message : "היצירה נכשלה. נסה שוב.");
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    const keep = drafts.filter((d) => d.keep);
    act.addQuestions(keep.map((q) => ({ examId: exam.id, subjectId: exam.subjectId, topic: q.topic || exam.topics[0] || "", type: q.type, prompt: q.prompt, options: q.options, answerKey: q.answerKey, rubric: q.rubric, explanation: q.explanation, difficulty: q.difficulty as Difficulty, source: "ai" as const })));
    toast.success(`נוספו ${keep.length} שאלות`, "מומלץ לעבור עליהן. שאלות AI יכולות להכיל טעויות.");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title="יצירת שאלות עם AI" className="max-w-2xl"
      footer={drafts.length ? <><Button variant="outline" onClick={() => setDrafts([])}>חזרה</Button><Button onClick={save} disabled={!drafts.some((d) => d.keep)}>הוסף {drafts.filter((d) => d.keep).length} שאלות</Button></> : <><Button variant="outline" onClick={onClose}>ביטול</Button><Button variant="gradient" onClick={() => void run()} disabled={busy || !ai.configured}>{busy ? <Loader2 className="animate-spin" /> : <Sparkles />} צור שאלות</Button></>}>
      {ai.loaded && !ai.configured && <div className="mb-4"><AiUnavailable compact /></div>}
      {drafts.length === 0 ? (
        <div className="space-y-4">
          <fieldset><legend className="mb-2 text-sm font-semibold">סוגי שאלות</legend><div className="flex flex-wrap gap-2">{(Object.keys(TYPE_LABEL) as QuestionType[]).map((t) => <button key={t} type="button" aria-pressed={types.includes(t)} onClick={() => setTypes(types.includes(t) ? types.filter((x) => x !== t) : [...types, t])} className={cn("rounded-full border-2 px-4 py-1.5 text-sm font-semibold", types.includes(t) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>{TYPE_LABEL[t]}</button>)}</div></fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="מספר שאלות" htmlFor="aq-count"><Input id="aq-count" type="number" min={1} max={12} value={count} onChange={(e) => setCount(Math.max(1, Math.min(12, Number(e.target.value) || 1)))} /></Field>
            <Field label="רמת קושי" htmlFor="aq-diff"><Select id="aq-diff" value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value) as Difficulty)}><option value={1}>קל</option><option value={2}>בינוני</option><option value={3}>מאתגר</option></Select></Field>
          </div>
          <p className="text-sm text-muted-foreground">נושאי המבחן: {exam.topics.join(", ")}</p>
          {mats.length > 0 && <fieldset><legend className="mb-1.5 text-sm font-semibold">להתבסס על חומר לימוד</legend><div className="space-y-1.5">{mats.map((m) => <label key={m.id} className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[hsl(var(--primary))]" checked={materialIds.includes(m.id)} onChange={(e) => setMaterialIds(e.target.checked ? [...materialIds, m.id].slice(0, 6) : materialIds.filter((x) => x !== m.id))} /> {m.title}</label>)}</div></fieldset>}
          {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
        </div>
      ) : (
        <ul className="space-y-3">
          {drafts.map((d, i) => (
            <li key={i} className="flex gap-3 rounded-xl border p-3">
              <input type="checkbox" checked={d.keep} aria-label={`שמור שאלה ${i + 1}`} onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? { ...x, keep: e.target.checked } : x)))} className="mt-1 size-5 shrink-0 accent-[hsl(var(--primary))]" />
              <div className="min-w-0 flex-1 space-y-1 text-sm">
                <p className="text-xs text-muted-foreground">{TYPE_LABEL[d.type]} · {d.topic}</p>
                <Markdown>{d.prompt}</Markdown>
                {d.type === "mcq" && <ol className="list-[hebrew] ps-6">{d.options.map((o, j) => <li key={j} className={cn(String(j) === d.answerKey && "font-bold text-success")}>{o}</li>)}</ol>}
                {d.type !== "mcq" && <p className="font-semibold text-success">תשובה: {d.type === "tf" ? (d.answerKey === "true" ? "נכון" : "לא נכון") : d.answerKey}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
