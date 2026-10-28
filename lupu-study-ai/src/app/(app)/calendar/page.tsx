"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, Pencil, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { useData, useToday } from "@/hooks/useApp";
import { act } from "@/services/data/actions";
import { planStudyBlocks } from "@/services/learning/planner";
import { addDays, daysInMonth, formatLong, formatShort, monthTitle, parseDateStr, startOfMonth, startOfWeek, toDateStr, WEEKDAYS_LONG, WEEKDAYS_SHORT } from "@/lib/dates";
import { colorOf } from "@/lib/catalog";
import { toast } from "@/lib/bus";
import { cn } from "@/lib/utils";
import type { CalendarEvent, EventKind, TimetableSlot } from "@/types";

type Tab = "month" | "week" | "timetable";

const KIND_LABEL: Record<EventKind, string> = { exam: "מבחן", homework: "שיעורי בית", project: "עבודה", review: "משימת חזרה", session: "מפגש לימוד" };
const KIND_DOT: Record<EventKind, string> = { exam: "bg-destructive", homework: "bg-warning", project: "bg-accent", review: "bg-primary", session: "bg-success" };
const KIND_STYLE: Record<EventKind, string> = {
  exam: "bg-destructive/15 text-destructive", homework: "bg-warning/15 text-warning", project: "bg-accent/15 text-accent",
  review: "bg-primary/12 text-primary", session: "bg-success/15 text-success",
};

interface Item {
  key: string;
  title: string;
  kind: EventKind;
  date: string;
  startTime: string;
  endTime: string;
  done: boolean;
  /** אירוע יומן עריך, או פריט נגזר (שיעורי בית) */
  event: CalendarEvent | null;
  href?: string;
  subjectId: string | null;
}

export default function CalendarPage() {
  const data = useData();
  const today = useToday();
  const [tab, setTab] = useState<Tab>("month");
  const [cursor, setCursor] = useState(() => toDateStr(new Date()));
  const [dayOpen, setDayOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ event: CalendarEvent | null; date: string } | null>(null);
  const [slotEdit, setSlotEdit] = useState<TimetableSlot | "new" | null>(null);

  const items = useMemo<Item[]>(() => {
    const events = data.calendarEvents.map((e): Item => ({ key: e.id, title: e.title, kind: e.kind, date: e.date, startTime: e.startTime, endTime: e.endTime, done: e.done, event: e, subjectId: e.subjectId, href: e.kind === "exam" && e.refId ? `/exams/${e.refId}` : undefined }));
    const hw = data.homework.map((h): Item => ({ key: `hw-${h.id}`, title: h.title, kind: "homework", date: h.dueDate, startTime: "", endTime: "", done: h.done, event: null, href: "/homework", subjectId: h.subjectId }));
    return [...events, ...hw];
  }, [data.calendarEvents, data.homework]);

  const byDay = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const it of items) m.set(it.date, [...(m.get(it.date) ?? []), it].sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return m;
  }, [items]);

  const blocks = useMemo(() => planStudyBlocks(data, today), [data, today]);
  const shift = (dir: number) => setCursor(tab === "week" ? addDays(cursor, dir * 7) : toDateStr(new Date(parseDateStr(cursor).getFullYear(), parseDateStr(cursor).getMonth() + dir, 1, 12)));

  const monthDays = useMemo(() => {
    const first = startOfMonth(cursor);
    const lead = parseDateStr(first).getDay();
    const total = Math.ceil((lead + daysInMonth(cursor)) / 7) * 7;
    return Array.from({ length: total }, (_, i) => addDays(first, i - lead));
  }, [cursor]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i)), [cursor]);

  const chip = (it: Item) => <span key={it.key} className={cn("block truncate rounded px-1.5 py-0.5 text-[11px] font-semibold leading-4", KIND_STYLE[it.kind], it.done && "line-through opacity-60")}>{it.title}</span>;

  return (
    <>
      <PageHeader title="לוח שנה" description="מבחנים, שיעורי בית, משימות חזרה ומפגשי לימוד במקום אחד" actions={<Button onClick={() => setEditing({ event: null, date: today })}><Plus /> אירוע חדש</Button>} />

      {blocks.length > 0 && (
        <Card className="mb-5 space-y-3 p-5" data-testid="study-blocks">
          <div className="flex items-center gap-2"><Wand2 className="size-5 text-primary" aria-hidden /><h2 className="font-bold">המלצות תכנון לשבוע הקרוב</h2></div>
          <p className="text-sm text-muted-foreground">מבוסס על מבחנים קרובים, עומס המשימות והתרגול בפועל. כל מפגש משובץ ביום פנוי יחסית.</p>
          <ul className="space-y-2">
            {blocks.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
                <div className="min-w-0 flex-1"><p className="font-semibold">{b.title} · {b.minutes} דק׳</p><p className="text-xs text-muted-foreground">{formatShort(b.date)} ({WEEKDAYS_LONG[parseDateStr(b.date).getDay()]}) · למה? {b.reason}</p></div>
                <Button size="sm" variant="secondary" onClick={() => { act.addEvent({ kind: "session", title: b.title, subjectId: b.subjectId, date: b.date, startTime: "", endTime: "", notes: `${b.minutes} דקות · ${b.reason}` }); toast.success("נוסף ללוח השנה"); }}><Plus /> הוסף ליומן</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs<Tab> label="תצוגת יומן" value={tab} onChange={setTab} items={[{ value: "month", label: "חודש" }, { value: "week", label: "שבוע" }, { value: "timetable", label: "מערכת שעות" }]} />
        {tab !== "timetable" && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" aria-label="הקודם" onClick={() => shift(-1)}><ChevronRight /></Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(today)}>היום</Button>
            <Button variant="outline" size="icon-sm" aria-label="הבא" onClick={() => shift(1)}><ChevronLeft /></Button>
            <span className="ms-2 min-w-32 text-lg font-extrabold" aria-live="polite">{tab === "month" ? monthTitle(cursor) : `${formatShort(weekDays[0])} – ${formatShort(weekDays[6])}`}</span>
          </div>
        )}
      </div>

      {tab === "month" && (
        <div role="grid" aria-label={monthTitle(cursor)}>
          <div role="row" className="grid grid-cols-7 text-center text-xs font-bold text-muted-foreground">{WEEKDAYS_SHORT.map((d, i) => <div key={i} role="columnheader" aria-label={WEEKDAYS_LONG[i]} className="py-2">{d}</div>)}</div>
          <div className="overflow-hidden rounded-xl border bg-border">
            {Array.from({ length: monthDays.length / 7 }, (_, w) => (
              <div key={w} role="row" className={cn("grid grid-cols-7 gap-px", w > 0 && "mt-px")}>
                {monthDays.slice(w * 7, w * 7 + 7).map((d) => {
                  const list = byDay.get(d) ?? [];
                  const inMonth = d.slice(0, 7) === cursor.slice(0, 7);
                  return (
                    <button key={d} type="button" role="gridcell" onClick={() => setDayOpen(d)} className={cn("flex min-h-20 flex-col gap-0.5 bg-card p-1.5 text-start align-top transition-colors hover:bg-muted/60 sm:min-h-28", !inMonth && "bg-muted/30 text-muted-foreground")}>
                      <span aria-hidden className={cn("flex size-6 items-center justify-center rounded-full text-xs font-bold", d === today && "bg-primary text-primary-foreground")}>{parseDateStr(d).getDate()}</span><span className="sr-only">{formatLong(d)}, {list.length} אירועים</span>
                      <span className="hidden space-y-0.5 sm:block">{list.slice(0, 3).map(chip)}{list.length > 3 && <span className="block text-[11px] text-muted-foreground">+{list.length - 3} נוספים</span>}</span>
                      {list.length > 0 && <span className="flex gap-0.5 sm:hidden">{list.slice(0, 4).map((it) => <span key={it.key} className={cn("size-1.5 rounded-full", KIND_DOT[it.kind])} />)}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "week" && (
        <div className="grid gap-3 md:grid-cols-7">
          {weekDays.map((d) => {
            const list = byDay.get(d) ?? [];
            return (
              <Card key={d} className={cn("min-h-28 space-y-1.5 p-3", d === today && "ring-2 ring-primary/40")}>
                <button type="button" onClick={() => setDayOpen(d)} className="flex w-full items-center justify-between text-start"><span className="text-sm font-extrabold">{WEEKDAYS_LONG[parseDateStr(d).getDay()]}</span><span className="text-xs text-muted-foreground">{formatShort(d)}</span></button>
                {list.length === 0 ? <p className="text-xs text-muted-foreground">אין אירועים</p> : list.map((it) => <button key={it.key} type="button" onClick={() => setDayOpen(d)} className="block w-full text-start">{it.startTime && <span className="text-[10px] text-muted-foreground">{it.startTime}</span>}{chip(it)}</button>)}
              </Card>
            );
          })}
        </div>
      )}

      {tab === "timetable" && <Timetable onEdit={setSlotEdit} />}

      <Dialog open={!!dayOpen} onOpenChange={(o) => !o && setDayOpen(null)} title={dayOpen ? formatLong(dayOpen) : ""} footer={dayOpen ? <Button onClick={() => { setEditing({ event: null, date: dayOpen }); setDayOpen(null); }}><Plus /> אירוע ליום זה</Button> : undefined}>
        {dayOpen && (
          <div className="space-y-4">
            {(byDay.get(dayOpen) ?? []).length === 0 && <p className="text-sm text-muted-foreground">אין אירועים ביום הזה.</p>}
            <ul className="space-y-2">
              {(byDay.get(dayOpen) ?? []).map((it) => (
                <li key={it.key} className="flex items-center gap-3 rounded-xl border p-3">
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", KIND_STYLE[it.kind])}>{KIND_LABEL[it.kind]}</span>
                  <div className="min-w-0 flex-1"><p className={cn("truncate font-semibold", it.done && "line-through")}>{it.title}</p>{(it.startTime || it.endTime) && <p className="text-xs text-muted-foreground">{it.startTime}{it.endTime ? `–${it.endTime}` : ""}</p>}</div>
                  {it.href && <Link href={it.href} className="text-xs font-bold text-primary">פתח</Link>}
                  {it.event && <>
                    <Button size="icon-sm" variant="ghost" aria-label="עריכה" onClick={() => { setEditing({ event: it.event, date: it.date }); setDayOpen(null); }}><Pencil /></Button>
                    <Button size="icon-sm" variant="ghost" aria-label="מחיקה" onClick={() => { const removed = it.event!; act.removeEvent(removed.id); toast.info("האירוע נמחק", undefined, { label: "בטל", onClick: () => act.restoreItems("calendarEvents", [removed]) }); }}><Trash2 className="text-destructive" /></Button>
                  </>}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">שיעורי בית מוצגים כאן אוטומטית לפי תאריך ההגשה, וערוכים במסך שיעורי הבית.</p>
          </div>
        )}
      </Dialog>

      {editing && <EventDialog event={editing.event} date={editing.date} onClose={() => setEditing(null)} />}
      {slotEdit && <SlotDialog slot={slotEdit === "new" ? null : slotEdit} onClose={() => setSlotEdit(null)} />}
    </>
  );
}

function EventDialog({ event, date, onClose }: { event: CalendarEvent | null; date: string; onClose: () => void }) {
  const data = useData();
  const [title, setTitle] = useState(event?.title ?? "");
  const [kind, setKind] = useState<EventKind>(event?.kind ?? "session");
  const [subjectId, setSubjectId] = useState(event?.subjectId ?? "");
  const [d, setD] = useState(event?.date ?? date);
  const [start, setStart] = useState(event?.startTime ?? "");
  const [end, setEnd] = useState(event?.endTime ?? "");
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);

  const save = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "יש להזין כותרת";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) e.date = "בחר תאריך";
    if (start && end && end <= start) e.time = "שעת הסיום חייבת להיות אחרי שעת ההתחלה";
    if (Object.keys(e).length) return setErrors(e);
    const payload = { kind, title, subjectId: subjectId || null, date: d, startTime: start, endTime: end, notes };
    if (event) act.updateEvent(event.id, { ...payload, title: title.trim() });
    else act.addEvent(payload);
    toast.success(event ? "האירוע עודכן" : "האירוע נוסף");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={event ? "עריכת אירוע" : "אירוע חדש"} footer={<>{event && <Button variant="ghost" className="me-auto text-destructive" onClick={() => setConfirm(true)}><Trash2 /> מחיקה</Button>}<Button variant="outline" onClick={onClose}>ביטול</Button><Button onClick={save}>שמירה</Button></>}>
      <form className="space-y-4" onSubmit={(ev) => { ev.preventDefault(); save(); }}>
        <Field label="כותרת" htmlFor="ev-title" error={errors.title}><Input id="ev-title" value={title} maxLength={120} onChange={(x) => setTitle(x.target.value)} autoFocus /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="סוג" htmlFor="ev-kind"><Select id="ev-kind" value={kind} onChange={(x) => setKind(x.target.value as EventKind)}>{(Object.keys(KIND_LABEL) as EventKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</Select></Field>
          <Field label="מקצוע" htmlFor="ev-subject"><Select id="ev-subject" value={subjectId} onChange={(x) => setSubjectId(x.target.value)}><option value="">ללא</option>{data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
        </div>
        <Field label="תאריך" htmlFor="ev-date" error={errors.date}><Input id="ev-date" type="date" value={d} onChange={(x) => setD(x.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="שעת התחלה" htmlFor="ev-start" error={errors.time}><Input id="ev-start" type="time" value={start} onChange={(x) => setStart(x.target.value)} /></Field>
          <Field label="שעת סיום" htmlFor="ev-end"><Input id="ev-end" type="time" value={end} onChange={(x) => setEnd(x.target.value)} /></Field>
        </div>
        <Field label="הערות" htmlFor="ev-notes"><Textarea id="ev-notes" value={notes} onChange={(x) => setNotes(x.target.value)} className="min-h-16" /></Field>
      </form>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="למחוק את האירוע?" onConfirm={() => { if (event) { act.removeEvent(event.id); toast.info("האירוע נמחק"); onClose(); } }} />
    </Dialog>
  );
}

function Timetable({ onEdit }: { onEdit: (s: TimetableSlot | "new") => void }) {
  const data = useData();
  const todayDow = new Date().getDay();
  return (
    <section aria-label="מערכת שעות שבועית" className="space-y-3">
      <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">מערכת קבועה שחוזרת מדי שבוע.</p><Button onClick={() => onEdit("new")}><Plus /> שיעור</Button></div>
      {data.timetable.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-8 text-center"><CalendarClock className="size-8 text-primary" /><p className="font-bold">אין עדיין מערכת שעות</p><p className="text-sm text-muted-foreground">הוסף את השיעורים הקבועים שלך כדי לתכנן סביבם.</p></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          {[0, 1, 2, 3, 4, 5].map((dow) => {
            const slots = data.timetable.filter((s) => s.weekday === dow).sort((a, b) => a.startTime.localeCompare(b.startTime));
            return (
              <Card key={dow} className={cn("min-h-24 space-y-2 p-3", dow === todayDow && "ring-2 ring-primary/40")}>
                <h3 className="text-sm font-extrabold">{WEEKDAYS_LONG[dow]}</h3>
                {slots.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
                {slots.map((s) => {
                  const sub = data.subjects.find((x) => x.id === s.subjectId);
                  const c = colorOf(sub?.color ?? "violet");
                  return <button key={s.id} type="button" onClick={() => onEdit(s)} className={cn("block w-full rounded-lg p-2 text-start text-xs", c.bg)}><span className={cn("block font-bold", c.text)}>{sub?.name ?? (s.label || "שיעור")}</span><span className="text-muted-foreground">{s.startTime}–{s.endTime}{s.room ? ` · ${s.room}` : ""}</span></button>;
                })}
              </Card>
            );
          })}
        </div>
      )}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Sparkles className="size-3.5" /> שבת נחשבת יום מנוחה ולכן אינה מוצגת.</p>
    </section>
  );
}

function SlotDialog({ slot, onClose }: { slot: TimetableSlot | null; onClose: () => void }) {
  const data = useData();
  const [weekdayV, setWeekday] = useState(slot?.weekday ?? 0);
  const [start, setStart] = useState(slot?.startTime ?? "08:00");
  const [end, setEnd] = useState(slot?.endTime ?? "08:45");
  const [subjectId, setSubjectId] = useState(slot?.subjectId ?? "");
  const [label, setLabel] = useState(slot?.label ?? "");
  const [room, setRoom] = useState(slot?.room ?? "");
  const [error, setError] = useState("");
  const save = () => {
    if (!start || !end || end <= start) return setError("שעת הסיום חייבת להיות אחרי שעת ההתחלה");
    if (!subjectId && !label.trim()) return setError("בחר מקצוע או כתוב שם לשיעור");
    act.upsertSlot({ id: slot?.id, weekday: weekdayV, startTime: start, endTime: end, subjectId: subjectId || null, label: label.trim(), room: room.trim() });
    toast.success("המערכת עודכנה");
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={slot ? "עריכת שיעור" : "שיעור חדש"} footer={<>{slot && <Button variant="ghost" className="me-auto text-destructive" onClick={() => { act.removeSlot(slot.id); toast.info("השיעור נמחק"); onClose(); }}><Trash2 /> מחיקה</Button>}<Button variant="outline" onClick={onClose}>ביטול</Button><Button onClick={save}>שמירה</Button></>}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <Field label="יום" htmlFor="sl-day"><Select id="sl-day" value={weekdayV} onChange={(e) => setWeekday(Number(e.target.value))}>{[0, 1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{WEEKDAYS_LONG[d]}</option>)}</Select></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="התחלה" htmlFor="sl-start"><Input id="sl-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
          <Field label="סיום" htmlFor="sl-end" error={error}><Input id="sl-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
        </div>
        <Field label="מקצוע" htmlFor="sl-subject"><Select id="sl-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}><option value="">אחר</option>{data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="שם (אם אין מקצוע)" htmlFor="sl-label"><Input id="sl-label" value={label} maxLength={60} onChange={(e) => setLabel(e.target.value)} /></Field>
          <Field label="כיתה / חדר" htmlFor="sl-room"><Input id="sl-room" value={room} maxLength={30} onChange={(e) => setRoom(e.target.value)} /></Field>
        </div>
      </form>
    </Dialog>
  );
}
