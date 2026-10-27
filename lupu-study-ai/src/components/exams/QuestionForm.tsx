"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import type { Difficulty, ExamQuestion, QuestionType } from "@/types";
import type { QuestionInput } from "@/services/data/reducers";
import { cn } from "@/lib/utils";

export const TYPE_LABEL: Record<QuestionType, string> = { mcq: "אמריקאית", open: "פתוחה", tf: "נכון/לא נכון", fill: "השלמה" };

export function QuestionFormDialog({
  open, onOpenChange, initial, subjectId, examId, topics, onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: ExamQuestion | null;
  subjectId: string;
  examId: string | null;
  topics: string[];
  onSave: (q: QuestionInput) => void;
}) {
  const [type, setType] = useState<QuestionType>(initial?.type ?? "mcq");
  const [topic, setTopic] = useState(initial?.topic ?? topics[0] ?? "");
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [options, setOptions] = useState<string[]>(initial?.options?.length ? initial.options : ["", "", "", ""]);
  const [correct, setCorrect] = useState(initial?.type === "mcq" ? Number(initial.answerKey) : 0);
  const [tf, setTf] = useState(initial?.type === "tf" ? initial.answerKey : "true");
  const [answerText, setAnswerText] = useState(initial?.type === "fill" || initial?.type === "open" ? initial.answerKey : "");
  const [rubric, setRubric] = useState(initial?.rubric ?? "");
  const [explanation, setExplanation] = useState(initial?.explanation ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? 2);
  const [error, setError] = useState("");

  const submit = () => {
    if (!prompt.trim()) return setError("יש לכתוב את נוסח השאלה");
    const clean = options.map((o) => o.trim());
    let answerKey = "";
    if (type === "mcq") {
      const filled = clean.filter(Boolean);
      if (filled.length < 2) return setError("שאלה אמריקאית דורשת לפחות שתי תשובות אפשריות");
      if (!clean[correct]) return setError("סמן תשובה נכונה שאינה ריקה");
      // מסירים אפשרויות ריקות ומעדכנים את אינדקס התשובה הנכונה
      const mapped = clean.map((o, i) => ({ o, i })).filter((x) => x.o);
      answerKey = String(mapped.findIndex((x) => x.i === correct));
      onSave({ examId, subjectId, topic: topic.trim(), type, prompt: prompt.trim(), options: mapped.map((x) => x.o), answerKey, rubric: "", explanation: explanation.trim(), difficulty, source: initial?.source ?? "manual" });
      return onOpenChange(false);
    }
    if (type === "tf") answerKey = tf;
    else {
      if (!answerText.trim()) return setError(type === "fill" ? "יש להזין תשובה מקובלת (אפשר כמה, מופרדות ב-|)" : "יש להזין תשובה לדוגמה לשאלה הפתוחה");
      answerKey = answerText.trim();
    }
    onSave({ examId, subjectId, topic: topic.trim(), type, prompt: prompt.trim(), options: [], answerKey, rubric: type === "open" ? rubric.trim() : "", explanation: explanation.trim(), difficulty, source: initial?.source ?? "manual" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={initial ? "עריכת שאלה" : "שאלה חדשה"} footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button><Button onClick={submit}>שמירה</Button></>}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="סוג שאלה" htmlFor="q-type">
            <Select id="q-type" value={type} onChange={(e) => setType(e.target.value as QuestionType)}>
              {(Object.keys(TYPE_LABEL) as QuestionType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
            </Select>
          </Field>
          <Field label="קושי" htmlFor="q-diff">
            <Select id="q-diff" value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value) as Difficulty)}>
              <option value={1}>קל</option><option value={2}>בינוני</option><option value={3}>מאתגר</option>
            </Select>
          </Field>
          <Field label="נושא" htmlFor="q-topic">
            <Input id="q-topic" list="q-topics" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={80} />
            <datalist id="q-topics">{topics.map((t) => <option key={t} value={t} />)}</datalist>
          </Field>
        </div>
        <Field label="נוסח השאלה" htmlFor="q-prompt" error={error} hint="אפשר להשתמש בנוסחאות LaTeX בין סימני $ (למשל $x^2+3$)">
          <Textarea id="q-prompt" value={prompt} onChange={(e) => { setPrompt(e.target.value); setError(""); }} />
        </Field>

        {type === "mcq" && (
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-semibold">תשובות אפשריות (סמן את הנכונה)</legend>
            {options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name="correct" checked={correct === i} onChange={() => setCorrect(i)} aria-label={`תשובה ${i + 1} היא הנכונה`} className="size-5 accent-[hsl(var(--primary))]" />
                <Input value={o} aria-label={`תשובה ${i + 1}`} onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`תשובה ${i + 1}`} />
                {options.length > 2 && <Button type="button" variant="ghost" size="icon-sm" aria-label="הסר תשובה" onClick={() => { setOptions(options.filter((_, j) => j !== i)); setCorrect(correct >= options.length - 1 ? 0 : correct > i ? correct - 1 : correct); }}><Trash2 className="text-destructive" /></Button>}
              </div>
            ))}
            {options.length < 6 && <Button type="button" variant="outline" size="sm" onClick={() => setOptions([...options, ""])}><Plus /> עוד תשובה</Button>}
          </fieldset>
        )}
        {type === "tf" && (
          <Field label="התשובה הנכונה" htmlFor="q-tf">
            <Select id="q-tf" value={tf} onChange={(e) => setTf(e.target.value)}><option value="true">נכון</option><option value="false">לא נכון</option></Select>
          </Field>
        )}
        {type === "fill" && (
          <Field label="תשובות מקובלות" htmlFor="q-fill" hint="אפשר כמה תשובות חלופיות מופרדות ב-| (למשל: 0.75|3/4). הבדיקה סלחנית לרווחים ולפיסוק.">
            <Input id="q-fill" value={answerText} onChange={(e) => setAnswerText(e.target.value)} />
          </Field>
        )}
        {type === "open" && (
          <>
            <Field label="תשובה לדוגמה" htmlFor="q-open"><Textarea id="q-open" value={answerText} onChange={(e) => setAnswerText(e.target.value)} /></Field>
            <Field label="מחוון הערכה" htmlFor="q-rubric" hint="הגדר איך מחלקים את הנקודות. ה-AI (אם מחובר) יעריך לפי המחוון, וההערכה תסומן כהערכה ולא כציון רשמי."><Textarea id="q-rubric" value={rubric} onChange={(e) => setRubric(e.target.value)} /></Field>
          </>
        )}
        <Field label="הסבר לתשובה (יוצג אחרי ההגשה)" htmlFor="q-exp"><Textarea id="q-exp" value={explanation} onChange={(e) => setExplanation(e.target.value)} /></Field>
      </form>
    </Dialog>
  );
}

export function QuestionBadgeRow({ q }: { q: ExamQuestion }) {
  return (
    <span className={cn("text-xs text-muted-foreground")}>
      {TYPE_LABEL[q.type]} · {["", "קל", "בינוני", "מאתגר"][q.difficulty]}{q.topic ? ` · ${q.topic}` : ""}
    </span>
  );
}
