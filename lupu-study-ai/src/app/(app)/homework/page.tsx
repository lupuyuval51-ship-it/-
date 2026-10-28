"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { BellRing, CheckCircle2, ClipboardList, Paperclip, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SubjectChip } from "@/components/shared/SubjectIcon";
import { FileChip } from "@/components/shared/FileChip";
import { useData, useToday } from "@/hooks/useApp";
import { act } from "@/services/data/actions";
import { deleteFile, saveFile } from "@/services/data/files";
import { checkFile } from "@/lib/files";
import { addDays, diffDays, formatShort, relativeDay } from "@/lib/dates";
import { toast } from "@/lib/bus";
import { cn, uid } from "@/lib/utils";
import type { Homework, Priority } from "@/types";

type View = "open" | "late" | "today" | "soon" | "done" | "all";
const PRIORITY: Record<Priority, { label: string; variant: "destructive" | "warning" | "muted" }> = {
  high: { label: "דחוף", variant: "destructive" },
  medium: { label: "רגיל", variant: "warning" },
  low: { label: "נמוך", variant: "muted" },
};

export default function HomeworkPage() {
  const data = useData();
  const today = useToday();
  const [view, setView] = useState<View>("open");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [editing, setEditing] = useState<Homework | "new" | null>(null);
  const [deleting, setDeleting] = useState<Homework | null>(null);

  const { groups, counts, reminders } = useMemo(() => {
    const all = data.homework;
    const inSubject = (h: Homework) => !subjectFilter || h.subjectId === subjectFilter;
    const open = all.filter((h) => !h.done);
    const late = open.filter((h) => h.dueDate < today);
    const dueToday = open.filter((h) => h.dueDate === today);
    const soon = open.filter((h) => h.dueDate > today && diffDays(today, h.dueDate) <= 7);
    const done = all.filter((h) => h.done);
    const pick = { open, late, today: dueToday, soon, done, all } satisfies Record<View, Homework[]>;
    const sorter = (a: Homework, b: Homework) => a.done !== b.done ? (a.done ? 1 : -1) : a.dueDate.localeCompare(b.dueDate) || prio(b) - prio(a);
    return {
      groups: pick[view].filter(inSubject).sort(sorter),
      counts: { open: open.length, late: late.length, today: dueToday.length, soon: soon.length, done: done.length, all: all.length },
      reminders: [...late, ...dueToday, ...open.filter((h) => h.dueDate === addDays(today, 1))],
    };
  }, [data.homework, today, view, subjectFilter]);

  return (
    <>
      <PageHeader
        title="שיעורי בית"
        description="כל המשימות במקום אחד, עם תזכורות ועזרה מהמורה AI"
        actions={<Button onClick={() => setEditing("new")}><Plus /> משימה חדשה</Button>}
      />

      {reminders.length > 0 && (
        <div role="region" aria-label="תזכורות" className="mb-5 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
          <BellRing className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
          <div className="min-w-0 text-sm">
            <p className="font-bold">תזכורות</p>
            <ul className="mt-1 space-y-0.5">
              {reminders.slice(0, 4).map((h) => (
                <li key={h.id}>
                  <span className="font-semibold">{h.title}</span> · {h.dueDate < today ? <span className="font-semibold text-destructive">באיחור ({relativeDay(h.dueDate, today)})</span> : relativeDay(h.dueDate, today)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs<View>
          label="סינון משימות"
          value={view}
          onChange={setView}
          items={[
            { value: "open", label: "פתוחות", count: counts.open },
            { value: "late", label: "באיחור", count: counts.late },
            { value: "today", label: "להיום", count: counts.today },
            { value: "soon", label: "בשבוע הקרוב", count: counts.soon },
            { value: "done", label: "הושלמו", count: counts.done },
            { value: "all", label: "הכול" },
          ]}
        />
        <Select aria-label="סינון לפי מקצוע" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="h-10 w-auto min-w-40">
          <option value="">כל המקצועות</option>
          {data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={view === "done" ? <CheckCircle2 /> : <ClipboardList />}
          title={data.homework.length === 0 ? "אין עדיין שיעורי בית" : "אין משימות בסינון הזה"}
          description={data.homework.length === 0 ? "הוסף את המשימה הראשונה עם תאריך הגשה, ונזכיר לך בזמן." : "נסה לשנות את הסינון."}
          action={data.homework.length === 0 ? <Button onClick={() => setEditing("new")}><Plus /> משימה חדשה</Button> : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {groups.map((h) => {
            const late = !h.done && h.dueDate < today;
            return (
              <li key={h.id}>
                <Card className={cn("flex items-start gap-3 p-4", h.done && "opacity-70", late && "border-destructive/40")}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={h.done}
                    aria-label={h.done ? `בטל השלמה של ${h.title}` : `סמן ${h.title} כהושלם`}
                    onClick={() => act.setHomeworkDone(h.id, !h.done)}
                    className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-all", h.done ? "border-success bg-success text-success-foreground" : "border-input hover:border-success hover:bg-success/10")}
                  >
                    {h.done && <CheckCircle2 className="size-5" />}
                  </button>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className={cn("font-bold", h.done && "line-through")}>{h.title}</p>
                    {h.description && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{h.description}</p>}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <SubjectChip subject={data.subjects.find((s) => s.id === h.subjectId)} />
                      <Badge variant={PRIORITY[h.priority].variant}>{PRIORITY[h.priority].label}</Badge>
                      <span className={cn("font-semibold", late ? "text-destructive" : "text-muted-foreground")}>
                        {late ? "באיחור · " : ""}{relativeDay(h.dueDate, today)} ({formatShort(h.dueDate)})
                      </span>
                    </div>
                    {h.attachmentIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">{h.attachmentIds.map((id) => <FileChip key={id} id={id} />)}</div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                    <Link
                      href={`/tutor?mode=explain&subject=${h.subjectId ?? ""}&ask=${encodeURIComponent(`אני צריך עזרה בשיעורי בית: ${h.title}${h.description ? `\n${h.description}` : ""}\nבבקשה תכוון אותי בלי לתת את התשובה המלאה מיד.`)}`}
                      aria-label={`עזרה מהמורה AI ב${h.title}`}
                      title="עזרה מהמורה AI"
                      className="inline-flex size-9 items-center justify-center rounded-md text-primary hover:bg-primary/10"
                    >
                      <Sparkles className="size-4" />
                    </Link>
                    <Button variant="ghost" size="icon-sm" aria-label={`עריכת ${h.title}`} onClick={() => setEditing(h)}><Pencil /></Button>
                    <Button variant="ghost" size="icon-sm" aria-label={`מחיקת ${h.title}`} onClick={() => setDeleting(h)}><Trash2 className="text-destructive" /></Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {editing && <HomeworkDialog key={editing === "new" ? "new" : editing.id} initial={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`למחוק את "${deleting?.title}"?`}
        onConfirm={() => {
          if (deleting) {
            // הקבצים המצורפים נשארים כדי שאפשר יהיה לבטל את המחיקה
            const removed = deleting;
            act.removeHomework(removed.id);
            toast.info("המשימה נמחקה", undefined, { label: "בטל", onClick: () => act.restoreItems("homework", [removed]) });
          }
        }}
      />
    </>
  );
}

const prio = (h: Homework) => ({ high: 3, medium: 2, low: 1 })[h.priority];

function HomeworkDialog({ initial, onClose }: { initial: Homework | null; onClose: () => void }) {
  const data = useData();
  const today = useToday();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? addDays(today, 1));
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [files, setFiles] = useState<string[]>(initial?.attachmentIds ?? []);
  const [errors, setErrors] = useState<{ title?: string; date?: string; file?: string }>({});
  const input = useRef<HTMLInputElement>(null);

  const addFiles = async (list: FileList | null) => {
    if (!list) return;
    for (const f of Array.from(list)) {
      const check = checkFile(f, ["image", "pdf"]);
      if (!check.ok) { setErrors((e) => ({ ...e, file: check.error })); continue; }
      const id = uid();
      try {
        await saveFile(id, f);
        setFiles((cur) => [...cur, id]);
        setErrors((e) => ({ ...e, file: undefined }));
      } catch {
        setErrors((e) => ({ ...e, file: "לא הצלחנו לשמור את הקובץ במכשיר" }));
      }
    }
    if (input.current) input.current.value = "";
  };

  const save = () => {
    const errs: typeof errors = {};
    if (!title.trim()) errs.title = "יש להזין כותרת למשימה";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) errs.date = "יש לבחור תאריך הגשה";
    if (errs.title || errs.date) return setErrors(errs);
    const payload = { subjectId: subjectId || null, title, description, dueDate, priority, attachmentIds: files };
    if (initial) act.updateHomework(initial.id, payload);
    else act.addHomework(payload);
    toast.success(initial ? "המשימה עודכנה" : "המשימה נוספה");
    onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={initial ? "עריכת משימה" : "משימה חדשה"}
      footer={<><Button variant="outline" onClick={onClose}>ביטול</Button><Button onClick={save}>שמירה</Button></>}
    >
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <Field label="כותרת" htmlFor="hw-title" error={errors.title}>
          <Input id="hw-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="למשל: תרגילי משוואות עמ׳ 45" autoFocus />
        </Field>
        <Field label="תיאור (אופציונלי)" htmlFor="hw-desc">
          <Textarea id="hw-desc" value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="מקצוע" htmlFor="hw-subject">
            <Select id="hw-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">ללא מקצוע</option>
              {data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="תאריך הגשה" htmlFor="hw-date" error={errors.date}>
            <Input id="hw-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
        </div>
        <Field label="עדיפות" htmlFor="hw-prio">
          <Select id="hw-prio" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            <option value="high">דחוף</option>
            <option value="medium">רגיל</option>
            <option value="low">נמוך</option>
          </Select>
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-semibold">קבצים מצורפים</p>
          <div className="flex flex-wrap items-center gap-2">
            {files.map((id) => <FileChip key={id} id={id} onRemove={() => { void deleteFile(id); setFiles(files.filter((x) => x !== id)); }} />)}
            <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}><Paperclip /> צרף תמונה / PDF</Button>
            <input ref={input} type="file" accept="image/*,application/pdf" multiple hidden onChange={(e) => addFiles(e.target.files)} aria-label="בחירת קבצים לצירוף" />
          </div>
          {errors.file && <p role="alert" className="mt-1 text-xs font-medium text-destructive">{errors.file}</p>}
          <p className="mt-1 text-xs text-muted-foreground">הקבצים נשמרים במכשיר שלך.</p>
        </div>
      </form>
    </Dialog>
  );
}
