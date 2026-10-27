"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { useData, useToday } from "@/hooks/useApp";
import { act } from "@/services/data/actions";
import { addDays, diffDays } from "@/lib/dates";
import { toast } from "@/lib/bus";
import type { Exam } from "@/types";
import { cn } from "@/lib/utils";

export function ExamFormDialog({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (o: boolean) => void; initial?: Exam | null }) {
  const data = useData();
  const today = useToday();
  const router = useRouter();
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? data.subjects[0]?.id ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? addDays(today, 7));
  const [picked, setPicked] = useState<string[]>(initial?.topics ?? []);
  const [extra, setExtra] = useState("");
  const [materialIds, setMaterialIds] = useState<string[]>(initial?.materialIds ?? []);
  const [minutes, setMinutes] = useState(initial?.minutesPerDay ?? data.profile?.dailyMinutes ?? 30);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const suggested = useMemo(() => data.topics.filter((t) => t.subjectId === subjectId).map((t) => t.name), [data.topics, subjectId]);
  const materials = data.studyMaterials.filter((m) => m.subjectId === subjectId);
  const toggle = (l: string[], v: string) => (l.includes(v) ? l.filter((x) => x !== v) : [...l, v]);

  const submit = () => {
    const errs: Record<string, string> = {};
    const subject = data.subjects.find((s) => s.id === subjectId);
    if (!subject) errs.subject = "בחר מקצוע";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errs.date = "בחר תאריך מבחן";
    else if (!initial && diffDays(today, date) < 0) errs.date = "התאריך כבר עבר";
    const topics = [...new Set([...picked, ...extra.split(/[,\n]/).map((t) => t.trim()).filter(Boolean)])];
    if (topics.length === 0) errs.topics = "הוסף לפחות נושא אחד למבחן";
    if (Object.keys(errs).length) return setErrors(errs);
    const input = { subjectId, title: title.trim() || `מבחן ב${subject!.name}`, date, topics, materialIds, minutesPerDay: minutes };
    if (initial) {
      act.updateExam(initial.id, input);
      toast.success("המבחן עודכן");
      onOpenChange(false);
    } else {
      const r = act.addExam(input);
      toast.success("המבחן נוסף");
      onOpenChange(false);
      const id = r.data.exams.at(-1)?.id;
      if (id) router.push(`/exams/${id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={initial ? "עריכת מבחן" : "מבחן חדש"} footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button><Button onClick={submit}>שמירה</Button></>}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="מקצוע" htmlFor="ex-subject" error={errors.subject}>
            <Select id="ex-subject" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setPicked([]); setMaterialIds([]); }}>
              {data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="תאריך המבחן" htmlFor="ex-date" error={errors.date}>
            <Input id="ex-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label="שם המבחן (אופציונלי)" htmlFor="ex-title"><Input id="ex-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="למשל: מבחן שברים ואחוזים" /></Field>
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">נושאי המבחן</legend>
          {suggested.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {suggested.map((t) => (
                <button key={t} type="button" aria-pressed={picked.includes(t)} onClick={() => setPicked(toggle(picked, t))} className={cn("rounded-full border-2 px-3 py-1 text-sm font-semibold", picked.includes(t) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>{t}</button>
              ))}
            </div>
          )}
          <Textarea aria-label="נושאים נוספים" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="נושאים נוספים, מופרדים בפסיק או בשורה חדשה" className="min-h-16" />
          {errors.topics && <p role="alert" className="mt-1 text-xs font-medium text-destructive">{errors.topics}</p>}
        </fieldset>
        {materials.length > 0 && (
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">חומר לימודי רלוונטי</legend>
            <div className="space-y-1.5">
              {materials.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[hsl(var(--primary))]" checked={materialIds.includes(m.id)} onChange={() => setMaterialIds(toggle(materialIds, m.id))} /> {m.title}</label>
              ))}
            </div>
          </fieldset>
        )}
        <Field label="זמן לימוד זמין ביום (דקות)" htmlFor="ex-min" hint="משמש לבניית תוכנית החזרה היומית">
          <Input id="ex-min" type="number" min={10} max={300} step={5} value={minutes} onChange={(e) => setMinutes(Number(e.target.value) || 30)} />
        </Field>
      </form>
    </Dialog>
  );
}
