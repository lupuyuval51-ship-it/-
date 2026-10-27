"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { AiUnavailable } from "@/components/shared/AiUnavailable";
import { Markdown } from "@/components/shared/Markdown";
import { useAiStatus } from "@/hooks/useAiStatus";
import { useData } from "@/hooks/useApp";
import { act } from "@/services/data/actions";
import { aiGenerate, AiClientError } from "@/services/ai/client";
import { buildMaterialContext } from "@/services/ai/retrieval";
import { toast } from "@/lib/bus";

interface Draft { front: string; back: string; topic: string; keep: boolean }

/** יצירת כרטיסיות באמצעות AI מחומר לימוד, מטקסט או מנושא. המשתמש בוחר אילו כרטיסים לשמור. */
export function AiCardsDialog({ open, onOpenChange, initialText = "", initialSubjectId = "" }: { open: boolean; onOpenChange: (o: boolean) => void; initialText?: string; initialSubjectId?: string }) {
  const data = useData();
  const ai = useAiStatus();
  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [materialIds, setMaterialIds] = useState<string[]>([]);
  const [text, setText] = useState(initialText);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(8);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const subject = data.subjects.find((s) => s.id === subjectId);
  const mats = data.studyMaterials.filter((m) => (!subjectId || m.subjectId === subjectId) && m.pages.some((p) => p.text.trim()));

  const generate = async () => {
    setError("");
    if (!materialIds.length && !text.trim() && !topic.trim()) return setError("בחר חומר, הדבק טקסט או כתוב נושא.");
    setBusy(true);
    try {
      const chosen = data.studyMaterials.filter((m) => materialIds.includes(m.id));
      const { ctx } = chosen.length ? buildMaterialContext(chosen, topic || text.slice(0, 200), 24_000) : { ctx: [] };
      const out = await aiGenerate<{ cards: { front: string; back: string; topic?: string }[] }>({
        kind: "flashcards", count, topic: topic.trim() || undefined, subject: subject?.name, grade: data.profile!.grade,
        materials: ctx.length ? ctx : undefined, text: text.trim() ? text.slice(0, 12_000) : undefined,
      });
      if (!out.cards.length) return setError("ה-AI לא החזיר כרטיסיות. נסה חומר או נושא אחר.");
      setDrafts(out.cards.map((c) => ({ front: c.front, back: c.back, topic: c.topic || topic, keep: true })));
    } catch (e) {
      setError(e instanceof AiClientError ? e.message : "היצירה נכשלה. נסה שוב.");
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    const keep = drafts.filter((d) => d.keep);
    act.addFlashcards(keep.map((d) => ({ subjectId: subjectId || null, topic: d.topic, front: d.front, back: d.back, source: "ai" as const })));
    toast.success(`נוספו ${keep.length} כרטיסיות`, "מומלץ לעבור עליהן ולתקן אם צריך.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="יצירת כרטיסיות עם AI" className="max-w-2xl"
      footer={drafts.length ? <><Button variant="outline" onClick={() => setDrafts([])}>חזרה</Button><Button onClick={save} disabled={!drafts.some((d) => d.keep)}>הוסף {drafts.filter((d) => d.keep).length} כרטיסיות</Button></> : <><Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button><Button variant="gradient" onClick={() => void generate()} disabled={busy || !ai.configured}>{busy ? <Loader2 className="animate-spin" /> : <Sparkles />} צור כרטיסיות</Button></>}>
      {ai.loaded && !ai.configured && <AiUnavailable compact />}
      {drafts.length === 0 ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="מקצוע" htmlFor="ac-subject"><Select id="ac-subject" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setMaterialIds([]); }}><option value="">כללי</option>{data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
            <Field label="מספר כרטיסיות" htmlFor="ac-count"><Input id="ac-count" type="number" min={1} max={20} value={count} onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} /></Field>
          </div>
          <Field label="נושא (אופציונלי)" htmlFor="ac-topic"><Input id="ac-topic" value={topic} maxLength={120} onChange={(e) => setTopic(e.target.value)} placeholder="למשל: משפט פיתגורס" /></Field>
          {mats.length > 0 && (
            <fieldset><legend className="mb-1.5 text-sm font-semibold">חומרי לימוד</legend>
              <div className="space-y-1.5">{mats.map((m) => <label key={m.id} className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[hsl(var(--primary))]" checked={materialIds.includes(m.id)} onChange={(e) => setMaterialIds(e.target.checked ? [...materialIds, m.id].slice(0, 6) : materialIds.filter((x) => x !== m.id))} /> {m.title}</label>)}</div>
            </fieldset>
          )}
          <Field label="או הדבק טקסט" htmlFor="ac-text"><Textarea id="ac-text" value={text} maxLength={12000} onChange={(e) => setText(e.target.value)} /></Field>
          {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
        </div>
      ) : (
        <ul className="space-y-3">
          {drafts.map((d, i) => (
            <li key={i} className="flex gap-3 rounded-xl border p-3">
              <input type="checkbox" checked={d.keep} aria-label={`שמור כרטיסייה ${i + 1}`} onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? { ...x, keep: e.target.checked } : x)))} className="mt-1 size-5 shrink-0 accent-[hsl(var(--primary))]" />
              <div className="min-w-0 flex-1 space-y-1 text-sm"><Markdown>{d.front}</Markdown><div className="rounded-md bg-muted/60 px-2"><Markdown>{d.back}</Markdown></div></div>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
