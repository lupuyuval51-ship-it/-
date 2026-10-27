"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, FileText, FolderOpen, Image as ImageIcon, Loader2, Pencil, Plus, Search, Sparkles, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SubjectChip } from "@/components/shared/SubjectIcon";
import { Markdown } from "@/components/shared/Markdown";
import { PageSkeleton } from "@/components/ui/skeleton";
import { useData } from "@/hooks/useApp";
import { act } from "@/services/data/actions";
import { deleteFile, loadFile, saveFile } from "@/services/data/files";
import { extractPdfText } from "@/services/data/pdf";
import { checkFile } from "@/lib/files";
import { toast } from "@/lib/bus";
import { formatBytes, nowIso, uid } from "@/lib/utils";
import type { StudyMaterial } from "@/types";

export default function LibraryPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Library />
    </Suspense>
  );
}

function Library() {
  const data = useData();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [uploading, setUploading] = useState<string[]>([]);
  const [textDialog, setTextDialog] = useState(false);
  const [editing, setEditing] = useState<StudyMaterial | null>(null);
  const [viewing, setViewing] = useState<StudyMaterial | null>(null);
  const [deleting, setDeleting] = useState<StudyMaterial | null>(null);
  const [uploadSubject, setUploadSubject] = useState("");
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const open = params.get("open");
    if (open) setViewing(data.studyMaterials.find((m) => m.id === open) ?? null);
    // רק בטעינה ראשונית לפי הפרמטר
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const materials = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...data.studyMaterials]
      .filter((m) => !subjectFilter || m.subjectId === subjectFilter)
      .filter((m) => !q || m.title.toLowerCase().includes(q) || m.topic.toLowerCase().includes(q) || m.pages.some((p) => p.text.toLowerCase().includes(q)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [data.studyMaterials, query, subjectFilter]);

  const upload = async (files: FileList | File[]) => {
    for (const f of Array.from(files)) {
      const check = checkFile(f);
      if (!check.ok) { toast.error(`${f.name}: לא הועלה`, check.error); continue; }
      const id = uid();
      setUploading((u) => [...u, f.name]);
      try {
        let pages: StudyMaterial["pages"] = [];
        let extraction: StudyMaterial["extraction"] = "not_applicable";
        if (check.kind === "pdf") {
          try {
            const r = await extractPdfText(f);
            pages = r.pages;
            extraction = r.status;
          } catch {
            extraction = "none";
          }
        } else if (check.kind === "text") {
          pages = [{ page: 1, text: (await f.text()).slice(0, 200_000) }];
          extraction = "ok";
        }
        await saveFile(id, f);
        act.addMaterial({
          id, subjectId: uploadSubject || null, topic: "", title: f.name.replace(/\.[^.]+$/, ""), kind: check.kind, mime: f.type, size: f.size,
          pages, extraction, hasBlob: true, createdAt: nowIso(),
        });
        if (extraction === "none") toast.info(`${f.name}: אין טקסט שניתן לקריאה`, "הקובץ נשמר, אבל נראה כסריקה. המורה AI לא יוכל להשתמש בתוכנו.");
        else toast.success(`${f.name} נוסף לספרייה`);
      } catch {
        toast.error(`${f.name}: השמירה נכשלה`, "ייתכן שאין מספיק מקום אחסון במכשיר.");
      } finally {
        setUploading((u) => u.filter((n) => n !== f.name));
      }
    }
  };

  const open = async (m: StudyMaterial) => {
    if (m.kind === "text") return setViewing(m);
    const blob = await loadFile(m.id);
    if (!blob) return toast.error("הקובץ לא זמין במכשיר הזה");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  return (
    <>
      <PageHeader title="ספריית חומרי לימוד" description="העלה PDF, תמונות וטקסטים, סווג לפי מקצוע, וחפש בתוכן" actions={<Button variant="outline" onClick={() => setTextDialog(true)}><Plus /> טקסט / סיכום</Button>} />

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); void upload(e.dataTransfer.files); }}
        className={`mb-6 flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${drag ? "border-primary bg-primary/5" : "border-border"}`}
      >
        <Upload className="size-8 text-primary" aria-hidden />
        <p className="font-bold">גרור לכאן קבצים או בחר מהמכשיר</p>
        <p className="text-xs text-muted-foreground">PDF (עד 15MB), תמונות JPG/PNG/WebP (עד 6MB), קובצי טקסט. הקבצים נשמרים במכשיר שלך.</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Select aria-label="שיוך המקצוע להעלאה" value={uploadSubject} onChange={(e) => setUploadSubject(e.target.value)} className="h-10 w-auto min-w-36">
            <option value="">ללא מקצוע</option>
            {data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Button onClick={() => input.current?.click()}><Upload /> בחר קבצים</Button>
          <input ref={input} type="file" multiple hidden accept="application/pdf,image/jpeg,image/png,image/webp,text/plain,text/markdown,.txt,.md,.pdf" onChange={(e) => { if (e.target.files) void upload(e.target.files); e.target.value = ""; }} aria-label="בחירת קבצים להעלאה" data-testid="library-file-input" />
        </div>
        {uploading.length > 0 && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> מעבד: {uploading.join(", ")}</p>}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute start-3 top-3.5 size-4 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="חיפוש בשמות ובתוכן החומרים…" aria-label="חיפוש חומרים" className="ps-10" />
        </div>
        <Select aria-label="סינון לפי מקצוע" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="h-11 w-auto min-w-36">
          <option value="">כל המקצועות</option>
          {data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>

      {materials.length === 0 ? (
        <EmptyState icon={<FolderOpen />} title={data.studyMaterials.length === 0 ? "הספרייה ריקה" : "לא נמצאו חומרים"} description={data.studyMaterials.length === 0 ? "העלה את החומר הראשון שלך, והמורה AI יוכל להשתמש בו כדי להסביר, לסכם וליצור שאלות." : "נסה חיפוש אחר או סינון אחר."} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {materials.map((m) => (
            <li key={m.id}>
              <Card className="space-y-2 p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{m.kind === "image" ? <ImageIcon className="size-5" /> : <FileText className="size-5" />}</span>
                  <div className="min-w-0 flex-1">
                    <button type="button" onClick={() => void open(m)} className="block max-w-full truncate text-start font-bold hover:text-primary">{m.title}</button>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="muted">{m.kind === "pdf" ? "PDF" : m.kind === "image" ? "תמונה" : "טקסט"}</Badge>
                      <SubjectChip subject={data.subjects.find((s) => s.id === m.subjectId)} />
                      {m.topic && <span>{m.topic}</span>}
                      <span>{formatBytes(m.size)}</span>
                      {m.kind === "pdf" && m.extraction === "ok" && <span>{m.pages.length} עמודים</span>}
                    </div>
                  </div>
                </div>
                {m.extraction === "none" && <p className="flex items-start gap-2 rounded-lg bg-warning/10 p-2 text-xs font-semibold text-warning"><AlertTriangle className="mt-0.5 size-4 shrink-0" /> אין בקובץ טקסט שניתן לקריאה (כנראה סריקה). המורה AI לא יכול להשתמש בתוכן שלו כרגע. אפשר להקליד את הטקסט כחומר חדש, או לצלם את העמוד בצילום שאלה.</p>}
                {m.kind === "image" && <p className="text-xs text-muted-foreground">תמונה: אפשר לצרף אותה לשיחה עם המורה כתמונה.</p>}
                <div className="flex flex-wrap gap-1.5">
                  <Link href={`/tutor?mode=explain&subject=${m.subjectId ?? ""}&material=${m.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground hover:brightness-110 aria-disabled:opacity-50" aria-disabled={m.extraction === "none"}><Sparkles className="size-4" /> שלח למורה AI</Link>
                  <Button size="sm" variant="outline" onClick={() => void open(m)}>פתח</Button>
                  <Button size="icon-sm" variant="ghost" aria-label={`עריכת ${m.title}`} onClick={() => setEditing(m)}><Pencil /></Button>
                  <Button size="icon-sm" variant="ghost" aria-label={`מחיקת ${m.title}`} onClick={() => setDeleting(m)}><Trash2 className="text-destructive" /></Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {textDialog && <TextMaterialDialog onClose={() => setTextDialog(false)} />}
      {editing && <EditMaterialDialog m={editing} onClose={() => setEditing(null)} />}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)} title={viewing?.title ?? ""}>
        {viewing && <div className="space-y-4">{viewing.pages.map((p) => <section key={p.page}>{viewing.pages.length > 1 && <h3 className="mb-1 text-xs font-bold text-muted-foreground">עמוד {p.page}</h3>}<Markdown>{p.text || "(עמוד ללא טקסט)"}</Markdown></section>)}</div>}
      </Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title={`למחוק את "${deleting?.title}"?`} description="הקובץ והטקסט שחולץ ממנו יימחקו." onConfirm={() => { if (deleting) { void deleteFile(deleting.id); act.removeMaterial(deleting.id); toast.info("החומר נמחק"); } }} />
    </>
  );
}

function TextMaterialDialog({ onClose }: { onClose: () => void }) {
  const data = useData();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [error, setError] = useState("");
  const save = () => {
    if (!title.trim() || !text.trim()) return setError("יש להזין כותרת וטקסט");
    act.addMaterial({ id: uid(), subjectId: subjectId || null, topic: "", title: title.trim().slice(0, 160), kind: "text", mime: "text/plain", size: new Blob([text]).size, pages: [{ page: 1, text: text.slice(0, 200_000) }], extraction: "ok", hasBlob: false, createdAt: nowIso() });
    toast.success("החומר נשמר");
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title="טקסט או סיכום חדש" footer={<><Button variant="outline" onClick={onClose}>ביטול</Button><Button onClick={save}>שמירה</Button></>}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <Field label="כותרת" htmlFor="m-title"><Input id="m-title" value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} autoFocus /></Field>
        <Field label="מקצוע" htmlFor="m-subject"><Select id="m-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}><option value="">ללא מקצוע</option>{data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
        <Field label="תוכן" htmlFor="m-text" error={error} hint="אפשר להדביק טקסט מהספר או לכתוב סיכום משלך."><Textarea id="m-text" value={text} onChange={(e) => { setText(e.target.value); setError(""); }} className="min-h-48" /></Field>
      </form>
    </Dialog>
  );
}

function EditMaterialDialog({ m, onClose }: { m: StudyMaterial; onClose: () => void }) {
  const data = useData();
  const [title, setTitle] = useState(m.title);
  const [subjectId, setSubjectId] = useState(m.subjectId ?? "");
  const [topic, setTopic] = useState(m.topic);
  const topics = data.topics.filter((t) => t.subjectId === subjectId);
  const save = () => {
    if (!title.trim()) return;
    act.updateMaterial(m.id, { title: title.trim().slice(0, 160), subjectId: subjectId || null, topic: topic.trim() });
    toast.success("החומר עודכן");
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title="עריכת חומר" footer={<><Button variant="outline" onClick={onClose}>ביטול</Button><Button onClick={save}>שמירה</Button></>}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <Field label="שם" htmlFor="e-title"><Input id="e-title" value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="מקצוע" htmlFor="e-subject"><Select id="e-subject" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setTopic(""); }}><option value="">ללא מקצוע</option>{data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
        <Field label="נושא" htmlFor="e-topic"><Input id="e-topic" list="e-topics" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={80} /><datalist id="e-topics">{topics.map((t) => <option key={t.id} value={t.name} />)}</datalist></Field>
      </form>
    </Dialog>
  );
}
