"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, Copy, FileText, Layers, Loader2, Pencil, Plus, Printer, Save, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { PageSkeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { AiUnavailable } from "@/components/shared/AiUnavailable";
import { Markdown } from "@/components/shared/Markdown";
import { SubjectChip } from "@/components/shared/SubjectIcon";
import { AiCardsDialog } from "@/components/flashcards/AiCardsDialog";
import { useAiStatus } from "@/hooks/useAiStatus";
import { useData } from "@/hooks/useApp";
import { act } from "@/services/data/actions";
import { aiGenerate, AiClientError } from "@/services/ai/client";
import { buildMaterialContext } from "@/services/ai/retrieval";
import { relativeDay, dateToIsoDay } from "@/lib/dates";
import { toast } from "@/lib/bus";
import { useToday } from "@/hooks/useApp";
import type { StudyNote, SummaryKind } from "@/types";

const KINDS: { value: SummaryKind; label: string }[] = [
  { value: "short", label: "סיכום קצר" },
  { value: "detailed", label: "סיכום מפורט" },
  { value: "bullets", label: "נקודות עיקריות" },
  { value: "keywords", label: "מושגי מפתח" },
  { value: "examSheet", label: "דף חזרה למבחן" },
  { value: "qa", label: "שאלות ותשובות" },
];

export default function SummariesPage() {
  return <Suspense fallback={<PageSkeleton />}><Summaries /></Suspense>;
}

function Summaries() {
  const data = useData();
  const today = useToday();
  const params = useSearchParams();
  const [openId, setOpenId] = useState<string | null>(params.get("open"));
  const [gen, setGen] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("");
  const notes = useMemo(() => [...data.studyNotes].filter((n) => !subjectFilter || n.subjectId === subjectFilter).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [data.studyNotes, subjectFilter]);
  const note = data.studyNotes.find((n) => n.id === openId);

  if (note) return <NoteEditor key={note.id} note={note} onBack={() => setOpenId(null)} />;

  const createManual = () => {
    const r = act.addNote({ subjectId: subjectFilter || null, title: "סיכום חדש", kind: "manual", content: "", materialIds: [], aiGenerated: false });
    setOpenId(r.id);
  };

  return (
    <>
      <PageHeader title="סיכומים" description="צור סיכום חכם מחומרי הלימוד, ערוך, הדפס או ייצא ל-PDF"
        actions={<><Button variant="outline" onClick={createManual}><Plus /> סיכום ידני</Button><Button variant="gradient" onClick={() => setGen(true)}><Sparkles /> סיכום חכם</Button></>} />
      <Select aria-label="סינון לפי מקצוע" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="mb-4 h-10 w-auto min-w-36">
        <option value="">כל המקצועות</option>
        {data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </Select>
      {notes.length === 0 ? (
        <EmptyState icon={<FileText />} title="אין עדיין סיכומים" description="צור סיכום חכם מחומר שהעלית, או כתוב סיכום משלך." action={<div className="flex gap-2"><Button variant="gradient" onClick={() => setGen(true)}><Sparkles /> סיכום חכם</Button><Button variant="outline" onClick={createManual}>סיכום ידני</Button></div>} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {notes.map((n) => (
            <li key={n.id}>
              <button type="button" onClick={() => setOpenId(n.id)} className="block w-full text-start">
                <Card className="space-y-2 p-4 transition-shadow hover:shadow-glow">
                  <div className="flex items-start justify-between gap-2"><p className="font-bold">{n.title}</p>{n.aiGenerated && <Badge variant="muted">AI</Badge>}</div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{n.content.replace(/[#*$_`>-]/g, "").slice(0, 160) || "(ריק)"}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><SubjectChip subject={data.subjects.find((s) => s.id === n.subjectId)} /><span>{KINDS.find((k) => k.value === n.kind)?.label ?? "ידני"}</span><span>· {relativeDay(dateToIsoDay(n.updatedAt), today)}</span></div>
                </Card>
              </button>
            </li>
          ))}
        </ul>
      )}
      {gen && <GenerateDialog onClose={() => setGen(false)} onCreated={(id) => { setGen(false); setOpenId(id); }} />}
    </>
  );
}

function GenerateDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const data = useData();
  const ai = useAiStatus();
  const [subjectId, setSubjectId] = useState("");
  const [materialIds, setMaterialIds] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<SummaryKind>("short");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mats = data.studyMaterials.filter((m) => (!subjectId || m.subjectId === subjectId) && m.pages.some((p) => p.text.trim()));

  const run = async () => {
    setError("");
    if (!materialIds.length && !text.trim()) return setError("בחר חומר לימוד או הדבק טקסט.");
    setBusy(true);
    try {
      const chosen = data.studyMaterials.filter((m) => materialIds.includes(m.id));
      const { ctx } = chosen.length ? buildMaterialContext(chosen, "סיכום עיקרי נושאים הגדרות", 30_000) : { ctx: [] };
      const out = await aiGenerate<{ title: string; content: string }>({
        kind: "summary", summaryType: kind, subject: data.subjects.find((s) => s.id === subjectId)?.name, grade: data.profile!.grade,
        materials: ctx.length ? ctx : undefined, text: text.trim() ? text.slice(0, 12_000) : undefined,
      });
      const r = act.addNote({ subjectId: subjectId || null, title: out.title || "סיכום", kind, content: out.content, materialIds, aiGenerated: true });
      toast.success("הסיכום נוצר", "בדוק אותו מול החומר לפני שתסתמך עליו.");
      onCreated(r.id);
    } catch (e) {
      setError(e instanceof AiClientError ? e.message : "היצירה נכשלה. נסה שוב.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title="סיכום חכם" description="הסיכום נוצר מהחומר שתבחר בלבד."
      footer={<><Button variant="outline" onClick={onClose}>ביטול</Button><Button variant="gradient" onClick={() => void run()} disabled={busy || !ai.configured}>{busy ? <Loader2 className="animate-spin" /> : <Sparkles />} צור סיכום</Button></>}>
      {ai.loaded && !ai.configured && <div className="mb-4"><AiUnavailable compact /></div>}
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="סוג סיכום" htmlFor="s-kind"><Select id="s-kind" value={kind} onChange={(e) => setKind(e.target.value as SummaryKind)}>{KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}</Select></Field>
          <Field label="מקצוע" htmlFor="s-subject"><Select id="s-subject" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setMaterialIds([]); }}><option value="">כללי</option>{data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
        </div>
        {mats.length > 0 ? (
          <fieldset><legend className="mb-1.5 text-sm font-semibold">חומרי לימוד</legend>
            <div className="space-y-1.5">{mats.map((m) => <label key={m.id} className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[hsl(var(--primary))]" checked={materialIds.includes(m.id)} onChange={(e) => setMaterialIds(e.target.checked ? [...materialIds, m.id].slice(0, 6) : materialIds.filter((x) => x !== m.id))} /> {m.title}</label>)}</div>
          </fieldset>
        ) : <p className="text-sm text-muted-foreground">אין חומרים עם טקסט במקצוע הזה. אפשר להעלות בספרייה או להדביק טקסט כאן.</p>}
        <Field label="או הדבק טקסט" htmlFor="s-text"><Textarea id="s-text" value={text} maxLength={12000} onChange={(e) => setText(e.target.value)} /></Field>
        {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
      </div>
    </Dialog>
  );
}

function NoteEditor({ note, onBack }: { note: StudyNote; onBack: () => void }) {
  const data = useData();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [subjectId, setSubjectId] = useState(note.subjectId ?? "");
  const [editing, setEditing] = useState(note.content === "");
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cards, setCards] = useState(false);
  const dirty = title !== note.title || content !== note.content || (subjectId || null) !== note.subjectId;

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const save = () => {
    act.updateNote(note.id, { title: title.trim() || "סיכום", content, subjectId: subjectId || null });
    toast.success("הסיכום נשמר");
    setEditing(false);
  };

  return (
    <>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack}><ArrowRight /> לכל הסיכומים</Button>
        <div className="flex flex-wrap gap-2">
          {editing ? <Button onClick={save} disabled={!dirty && note.content !== ""}><Save /> שמירה</Button> : <Button variant="outline" onClick={() => setEditing(true)}><Pencil /> עריכה</Button>}
          <Button variant="outline" onClick={() => { void navigator.clipboard.writeText(content).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}>{copied ? <Check /> : <Copy />} {copied ? "הועתק" : "העתק"}</Button>
          <Button variant="outline" onClick={() => window.print()} title="בחלון ההדפסה אפשר לבחור 'שמור כ-PDF'"><Printer /> הדפס / PDF</Button>
          <Button variant="secondary" onClick={() => setCards(true)} disabled={!content.trim()}><Layers /> לכרטיסיות</Button>
          <Button variant="ghost" size="icon" aria-label="מחיקת סיכום" onClick={() => setDeleting(true)}><Trash2 className="text-destructive" /></Button>
        </div>
      </div>
      <Card className="print-area p-5 sm:p-8">
        {editing ? (
          <div className="no-print space-y-4">
            <Field label="כותרת" htmlFor="n-title"><Input id="n-title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} /></Field>
            <Field label="מקצוע" htmlFor="n-subject"><Select id="n-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}><option value="">ללא</option>{data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
            <Field label="תוכן (Markdown, נוסחאות LaTeX בין $)" htmlFor="n-content"><Textarea id="n-content" value={content} onChange={(e) => setContent(e.target.value)} className="min-h-80 font-mono text-sm" dir="auto" /></Field>
            <div><p className="mb-1 text-sm font-semibold">תצוגה מקדימה</p><div className="rounded-lg border bg-muted/30 p-4"><Markdown>{content || "_אין עדיין תוכן_"}</Markdown></div></div>
          </div>
        ) : (
          <>
            <h1 className="mb-1 text-2xl font-extrabold">{note.title}</h1>
            <p className="no-print mb-4 text-xs text-muted-foreground">{note.aiGenerated ? "נוצר באמצעות AI. כדאי לבדוק מול החומר." : "סיכום אישי"}</p>
            <Markdown>{note.content || "_אין עדיין תוכן_"}</Markdown>
          </>
        )}
      </Card>
      {cards && <AiCardsDialog open onOpenChange={setCards} initialText={content} initialSubjectId={subjectId} />}
      <ConfirmDialog open={deleting} onOpenChange={setDeleting} title="למחוק את הסיכום?" onConfirm={() => { act.removeNote(note.id); toast.info("הסיכום נמחק"); onBack(); }} />
    </>
  );
}
