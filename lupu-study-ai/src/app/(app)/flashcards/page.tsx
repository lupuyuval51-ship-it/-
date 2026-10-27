"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Layers, Pencil, Play, Plus, RotateCcw, Sparkles, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Markdown } from "@/components/shared/Markdown";
import { SubjectChip } from "@/components/shared/SubjectIcon";
import { AiCardsDialog } from "@/components/flashcards/AiCardsDialog";
import { useData, useToday } from "@/hooks/useApp";
import { act } from "@/services/data/actions";
import { cardSuccessRate, dueCards, isHardCard } from "@/services/learning/spaced";
import { relativeDay } from "@/lib/dates";
import { toast } from "@/lib/bus";
import { cn, pct } from "@/lib/utils";
import type { Flashcard } from "@/types";

type Tab = "study" | "manage";

export default function FlashcardsPage() {
  const data = useData();
  const today = useToday();
  const [tab, setTab] = useState<Tab>("study");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [editing, setEditing] = useState<Flashcard | "new" | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const cards = useMemo(() => data.flashcards.filter((c) => !subjectFilter || c.subjectId === subjectFilter), [data.flashcards, subjectFilter]);
  const due = useMemo(() => dueCards(cards, today), [cards, today]);

  return (
    <>
      <PageHeader title="כרטיסיות זיכרון" description="חזרה מרווחת: כרטיסיות קשות חוזרות לעיתים קרובות יותר"
        actions={<><Button variant="outline" onClick={() => setAiOpen(true)}><Sparkles /> צור עם AI</Button><Button onClick={() => setEditing("new")}><Plus /> כרטיסייה חדשה</Button></>} />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Tabs<Tab> label="תצוגה" value={tab} onChange={setTab} items={[{ value: "study", label: "לימוד", count: due.length }, { value: "manage", label: "ניהול", count: cards.length }]} />
        <Select aria-label="סינון לפי מקצוע" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="h-10 w-auto min-w-36">
          <option value="">כל המקצועות</option>
          {data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>

      {data.flashcards.length === 0 ? (
        <EmptyState icon={<Layers />} title="אין עדיין כרטיסיות" description="צור כרטיסיות ידנית או באמצעות AI מחומר הלימוד שלך." action={<div className="flex gap-2"><Button onClick={() => setEditing("new")}><Plus /> כרטיסייה חדשה</Button><Button variant="outline" onClick={() => setAiOpen(true)}><Sparkles /> צור עם AI</Button></div>} />
      ) : tab === "study" ? (
        <StudySession key={subjectFilter} cards={cards} due={due} today={today} />
      ) : (
        <Manage cards={cards} onEdit={setEditing} />
      )}

      {editing && <CardDialog card={editing === "new" ? null : editing} onClose={() => setEditing(null)} defaultSubject={subjectFilter} />}
      {aiOpen && <AiCardsDialog open onOpenChange={setAiOpen} initialSubjectId={subjectFilter} />}
    </>
  );
}

function StudySession({ cards, due, today }: { cards: Flashcard[]; due: Flashcard[]; today: string }) {
  const [queue, setQueue] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ known: 0, unknown: 0 });
  const [started, setStarted] = useState(false);
  const data = useData();
  const current = data.flashcards.find((c) => c.id === queue[0]);
  const total = stats.known + stats.unknown + queue.length;

  const answer = (known: boolean) => {
    if (!current) return;
    act.reviewFlashcard(current.id, known);
    setStats((s) => ({ known: s.known + (known ? 1 : 0), unknown: s.unknown + (known ? 0 : 1) }));
    setFlipped(false);
    setQueue((q) => {
      const [first, ...rest] = q;
      // "לא ידעתי": הכרטיס חוזר בהמשך אותו מפגש (אחרי כמה כרטיסים)
      if (!known) {
        const at = Math.min(rest.length, 3);
        return [...rest.slice(0, at), first, ...rest.slice(at)];
      }
      return rest;
    });
  };

  useEffect(() => {
    if (!started || !current) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input,textarea,select,dialog")) return;
      // רווח/Enter על כפתור מופעלים על ידי הדפדפן עצמו (אחרת ההיפוך היה מתבצע פעמיים)
      if ((e.key === " " || e.key === "Enter") && !target.closest("button,a")) { e.preventDefault(); setFlipped((f) => !f); }
      else if (flipped && e.key === "1") answer(true);
      else if (flipped && e.key === "2") answer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, current, flipped]);

  const hard = cards.filter(isHardCard).length;
  const rates = cards.map(cardSuccessRate).filter((r): r is number => r !== null);

  if (!started) {
    const upcoming = cards.filter((c) => c.due > today).sort((a, b) => a.due.localeCompare(b.due))[0];
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5 sm:col-span-2">
          <h2 className="text-xl font-extrabold">{due.length ? `${due.length} כרטיסיות מוכנות לחזרה` : "אין כרטיסיות לחזרה כרגע 🎉"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{due.length ? "הכרטיסיות הקשות מופיעות קודם. כל תשובה מעדכנת מתי הכרטיס יחזור." : upcoming ? `הכרטיסייה הבאה תחזור ${relativeDay(upcoming.due, today)}.` : "הוסף כרטיסיות כדי להתחיל."}</p>
          <Button className="mt-4" size="lg" variant="gradient" disabled={!due.length} onClick={() => { setQueue(due.map((c) => c.id)); setStats({ known: 0, unknown: 0 }); setStarted(true); }}><Play /> התחל סבב חזרה</Button>
          {!due.length && cards.length > 0 && (
            <Button className="mt-4 ms-2" size="lg" variant="outline" onClick={() => { setQueue([...cards].sort((a, b) => a.due.localeCompare(b.due)).slice(0, 10).map((c) => c.id)); setStarted(true); }}>למד מראש (עד 10)</Button>
          )}
        </Card>
        <Card className="space-y-2 p-5 text-sm">
          <p className="flex justify-between"><span className="text-muted-foreground">סה״כ כרטיסיות</span><b>{cards.length}</b></p>
          <p className="flex justify-between"><span className="text-muted-foreground">כרטיסיות קשות</span><b>{hard}</b></p>
          <p className="flex justify-between"><span className="text-muted-foreground">שיעור הצלחה</span><b>{rates.length ? `${Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 100)}%` : "אין נתונים"}</b></p>
        </Card>
      </div>
    );
  }

  if (!current) {
    return (
      <Card className="p-8 text-center" data-testid="cards-done">
        <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden />
        <h2 className="mt-3 text-2xl font-extrabold">סיימת את הסבב!</h2>
        <p className="mt-1 text-muted-foreground">ידעת {stats.known} · לא ידעת {stats.unknown}{stats.known + stats.unknown > 0 ? ` (${pct(stats.known, stats.known + stats.unknown)}% הצלחה)` : ""}</p>
        <Button className="mt-4" onClick={() => { setStarted(false); setStats({ known: 0, unknown: 0 }); }}><RotateCcw /> חזרה</Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3 text-sm"><Progress value={((total - queue.length) / Math.max(1, total)) * 100} label="התקדמות בסבב" /><span className="shrink-0 font-semibold text-muted-foreground">נותרו {queue.length}</span></div>
      <div className="flip-scene">
        <button type="button" onClick={() => setFlipped(!flipped)} aria-label={flipped ? "הצג את השאלה" : "הצג את התשובה"} data-testid="flashcard" className="block w-full">
          <div className="flip-card relative min-h-64 w-full" data-flipped={flipped}>
            <div className="flip-face absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-6 text-center shadow-soft" aria-hidden={flipped}>
              <Badge variant="muted">שאלה{current.topic ? ` · ${current.topic}` : ""}</Badge>
              <div className="text-xl font-bold"><Markdown>{current.front}</Markdown></div>
              <span className="text-xs text-muted-foreground">לחץ או הקש רווח להיפוך</span>
            </div>
            <div className="flip-face flip-back absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-6 text-center shadow-glow" aria-hidden={!flipped}>
              <Badge>תשובה</Badge>
              <div className="text-lg font-semibold"><Markdown>{current.back}</Markdown></div>
            </div>
          </div>
        </button>
      </div>
      <div className={cn("grid grid-cols-2 gap-3 transition-opacity", !flipped && "pointer-events-none opacity-40")}>
        <Button size="lg" variant="outline" className="border-destructive/40 text-destructive" onClick={() => answer(false)} disabled={!flipped}><XCircle /> לא ידעתי</Button>
        <Button size="lg" variant="success" onClick={() => answer(true)} disabled={!flipped}><CheckCircle2 /> ידעתי</Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">מקלדת: רווח = היפוך · 1 = ידעתי · 2 = לא ידעתי</p>
    </div>
  );
}

function Manage({ cards, onEdit }: { cards: Flashcard[]; onEdit: (c: Flashcard) => void }) {
  const data = useData();
  const today = useToday();
  const [q, setQ] = useState("");
  const [deleting, setDeleting] = useState<Flashcard | null>(null);
  const list = cards.filter((c) => !q.trim() || c.front.includes(q) || c.back.includes(q) || c.topic.includes(q));
  return (
    <>
      <Input aria-label="חיפוש כרטיסיות" placeholder="חיפוש…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-3 max-w-sm" />
      <ul className="grid gap-3 md:grid-cols-2">
        {list.map((c) => (
          <li key={c.id}>
            <Card className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 text-sm"><div className="font-bold"><Markdown>{c.front}</Markdown></div><div className="text-muted-foreground"><Markdown>{c.back}</Markdown></div></div>
                <div className="flex shrink-0"><Button size="icon-sm" variant="ghost" aria-label="עריכת כרטיסייה" onClick={() => onEdit(c)}><Pencil /></Button><Button size="icon-sm" variant="ghost" aria-label="מחיקת כרטיסייה" onClick={() => setDeleting(c)}><Trash2 className="text-destructive" /></Button></div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <SubjectChip subject={data.subjects.find((s) => s.id === c.subjectId)} />
                {c.topic && <span>{c.topic}</span>}
                <span>· חזרה: {c.attempts === 0 ? "טרם נלמדה" : relativeDay(c.due, today)}</span>
                {c.attempts > 0 && <span>· {c.successes}/{c.attempts} הצלחות</span>}
                {isHardCard(c) && <Badge variant="warning">קשה</Badge>}
                {c.source === "ai" && <Badge variant="muted">AI</Badge>}
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="למחוק את הכרטיסייה?" onConfirm={() => { if (deleting) { act.removeFlashcard(deleting.id); toast.info("הכרטיסייה נמחקה"); } }} />
    </>
  );
}

function CardDialog({ card, onClose, defaultSubject }: { card: Flashcard | null; onClose: () => void; defaultSubject: string }) {
  const data = useData();
  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");
  const [subjectId, setSubjectId] = useState(card?.subjectId ?? defaultSubject);
  const [topic, setTopic] = useState(card?.topic ?? "");
  const [error, setError] = useState("");
  const topics = data.topics.filter((t) => t.subjectId === subjectId);
  const save = (another = false) => {
    if (!front.trim() || !back.trim()) return setError("יש למלא שאלה ותשובה");
    if (card) act.updateFlashcard(card.id, { front: front.trim(), back: back.trim(), subjectId: subjectId || null, topic: topic.trim() });
    else act.addFlashcards([{ subjectId: subjectId || null, topic, front, back, source: "manual" }]);
    toast.success(card ? "הכרטיסייה עודכנה" : "הכרטיסייה נוספה");
    if (another && !card) { setFront(""); setBack(""); setError(""); } else onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={card ? "עריכת כרטיסייה" : "כרטיסייה חדשה"} footer={<>{!card && <Button variant="secondary" onClick={() => save(true)}>שמור והוסף עוד</Button>}<Button variant="outline" onClick={onClose}>ביטול</Button><Button onClick={() => save()}>שמירה</Button></>}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <Field label="שאלה (צד קדמי)" htmlFor="c-front" error={error}><Textarea id="c-front" value={front} maxLength={600} onChange={(e) => { setFront(e.target.value); setError(""); }} autoFocus /></Field>
        <Field label="תשובה (צד אחורי)" htmlFor="c-back"><Textarea id="c-back" value={back} maxLength={1200} onChange={(e) => setBack(e.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="מקצוע" htmlFor="c-subject"><Select id="c-subject" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setTopic(""); }}><option value="">ללא</option>{data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
          <Field label="נושא" htmlFor="c-topic"><Input id="c-topic" list="c-topics" value={topic} maxLength={80} onChange={(e) => setTopic(e.target.value)} /><datalist id="c-topics">{topics.map((t) => <option key={t.id} value={t.name} />)}</datalist></Field>
        </div>
      </form>
    </Dialog>
  );
}
