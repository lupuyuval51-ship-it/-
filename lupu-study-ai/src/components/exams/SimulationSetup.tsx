"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import type { ExamQuestion, ID, QuestionType } from "@/types";
import { createRun, saveRun, selectQuestions } from "@/services/learning/simulation";
import { TYPE_LABEL } from "./QuestionForm";
import { cn } from "@/lib/utils";

/** הגדרת סימולציית מבחן: כמות, קושי, סוגי שאלות וטיימר אופציונלי */
export function SimulationSetup({ open, onOpenChange, pool, examId, subjectId, title }: { open: boolean; onOpenChange: (o: boolean) => void; pool: ExamQuestion[]; examId: ID | null; subjectId: ID; title: string }) {
  const router = useRouter();
  const types = useMemo(() => [...new Set(pool.map((q) => q.type))] as QuestionType[], [pool]);
  const [selTypes, setSelTypes] = useState<QuestionType[]>(types);
  const [diffs, setDiffs] = useState<(1 | 2 | 3)[]>([1, 2, 3]);
  const [count, setCount] = useState(Math.min(10, pool.length));
  const [timer, setTimer] = useState(false);
  const [minutes, setMinutes] = useState(Math.max(5, Math.min(10, pool.length) * 2));

  const available = selectQuestions(pool, { count: 999, difficulties: diffs, types: selTypes, timerMinutes: 0 }).length;
  const toggle = <T,>(l: T[], v: T) => (l.includes(v) ? l.filter((x) => x !== v) : [...l, v]);

  const start = () => {
    const qs = selectQuestions(pool, { count, difficulties: diffs, types: selTypes, timerMinutes: timer ? minutes : 0 });
    if (qs.length === 0) return;
    const run = createRun({ examId, subjectId, title, questions: qs, timerMinutes: timer ? minutes : 0 });
    saveRun(run);
    router.push(`/exams/run/${run.attemptId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="סימולציית מבחן" description={`${pool.length} שאלות זמינות בבנק השאלות`} footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button><Button variant="gradient" onClick={start} disabled={available === 0}><Play /> התחל מבחן</Button></>}>
      <div className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">סוגי שאלות</legend>
          <div className="flex flex-wrap gap-2">
            {types.map((t) => <Chip key={t} on={selTypes.includes(t)} onClick={() => setSelTypes(toggle(selTypes, t))}>{TYPE_LABEL[t]}</Chip>)}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">רמות קושי</legend>
          <div className="flex flex-wrap gap-2">
            {([1, 2, 3] as const).map((d) => <Chip key={d} on={diffs.includes(d)} onClick={() => setDiffs(toggle(diffs, d))}>{["", "קל", "בינוני", "מאתגר"][d]}</Chip>)}
          </div>
        </fieldset>
        <Field label={`מספר שאלות (עד ${available})`} htmlFor="sim-count">
          <Input id="sim-count" type="number" min={1} max={Math.max(1, available)} value={count} onChange={(e) => setCount(Math.max(1, Math.min(Number(e.target.value) || 1, Math.max(1, available))))} />
        </Field>
        <div className="space-y-2">
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input type="checkbox" checked={timer} onChange={(e) => setTimer(e.target.checked)} className="size-5 accent-[hsl(var(--primary))]" /> טיימר
          </label>
          {timer && (
            <Field label="משך המבחן בדקות" htmlFor="sim-min">
              <Input id="sim-min" type="number" min={1} max={240} value={minutes} onChange={(e) => setMinutes(Math.max(1, Math.min(240, Number(e.target.value) || 1)))} />
            </Field>
          )}
        </div>
        {available === 0 && <p role="alert" className="text-sm font-semibold text-destructive">אין שאלות שמתאימות לסינון שבחרת.</p>}
      </div>
    </Dialog>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={cn("rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors", on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
      {children}
    </button>
  );
}
