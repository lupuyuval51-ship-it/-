"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, FileText, FolderOpen, GraduationCap, Layers, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/dialog";
import { SubjectIcon } from "@/components/shared/SubjectIcon";
import { SubjectFormDialog } from "@/components/shared/SubjectForm";
import { EmptyState } from "@/components/shared/EmptyState";
import { useData } from "@/hooks/useApp";
import { act } from "@/services/data/actions";
import { computeMastery, masteryLevel } from "@/services/learning/mastery";
import { resultsFor, subjectMastery } from "@/services/learning/stats";
import { formatShort } from "@/lib/dates";
import { toast } from "@/lib/bus";
import { cn } from "@/lib/utils";

type Tab = "topics" | "materials" | "practice" | "exams" | "notes";

export default function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const data = useData();
  const subject = data.subjects.find((s) => s.id === id);
  const [tab, setTab] = useState<Tab>("topics");
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const topics = useMemo(() => data.topics.filter((t) => t.subjectId === id), [data.topics, id]);
  const materials = data.studyMaterials.filter((m) => m.subjectId === id);
  const notes = data.studyNotes.filter((n) => n.subjectId === id);
  const exams = data.exams.filter((e) => e.subjectId === id).sort((a, b) => a.date.localeCompare(b.date));
  const cards = data.flashcards.filter((c) => c.subjectId === id);
  const attempts = data.examAttempts.filter((a) => a.subjectId === id && a.finishedAt).sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""));
  const mastery = subject ? subjectMastery(data, subject.id) : null;

  if (!subject || !mastery) {
    return (
      <EmptyState
        icon={<FolderOpen />}
        title="המקצוע לא נמצא"
        description="ייתכן שהוא נמחק."
        action={<Link href="/subjects" className={buttonVariants()}>חזרה למקצועות</Link>}
      />
    );
  }

  const addTopic = () => {
    if (!newTopic.trim()) return;
    act.addTopic(subject.id, newTopic);
    setNewTopic("");
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <SubjectIcon subject={subject} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold">{subject.name}</h1>
            <div className="mt-2 max-w-sm">
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-semibold">שליטה משוערת</span>
                <span className="text-muted-foreground">{mastery.percent === null ? "אין עדיין נתונים" : `${mastery.percent}%`}</span>
              </div>
              <Progress value={mastery.percent ?? 0} label="שליטה במקצוע" />
              <p className="mt-1 text-xs text-muted-foreground">מבוסס על תוצאות תרגולים, כרטיסיות וסימולציות. זהו אומדן ולא ציון רשמי.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/tutor?mode=explain&subject=${subject.id}`} className={buttonVariants({ variant: "gradient" })}>
              <Sparkles /> התחל ללמוד
            </Link>
            <Button variant="outline" size="icon" aria-label="עריכת מקצוע" onClick={() => setEdit(true)}><Pencil /></Button>
            <Button variant="outline" size="icon" aria-label="מחיקת מקצוע" onClick={() => setDel(true)}><Trash2 className="text-destructive" /></Button>
          </div>
        </div>
      </Card>

      <Tabs<Tab>
        label="אזורי המקצוע"
        value={tab}
        onChange={setTab}
        items={[
          { value: "topics", label: "נושאים", count: topics.length },
          { value: "materials", label: "חומרי לימוד", count: materials.length },
          { value: "practice", label: "תרגולים", count: cards.length },
          { value: "exams", label: "מבחנים", count: exams.length },
          { value: "notes", label: "סיכומים", count: notes.length },
        ]}
      />

      {tab === "topics" && (
        <section aria-label="נושאים" className="space-y-3">
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addTopic(); }}>
            <Input value={newTopic} onChange={(e) => setNewTopic(e.target.value)} maxLength={80} placeholder="הוסף נושא אישי…" aria-label="שם נושא חדש" />
            <Button type="submit" disabled={!newTopic.trim()}><Plus /> הוסף</Button>
          </form>
          {topics.length === 0 ? (
            <EmptyState icon={<Layers />} title="אין נושאים במקצוע" description="הוסף נושאים כדי לעקוב אחרי שליטה בכל אחד מהם." />
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {topics.map((t) => {
                const m = computeMastery(resultsFor(data, subject.id, t.name));
                const lvl = masteryLevel(m);
                return (
                  <li key={t.id}>
                    <Card className="flex items-center gap-3 p-3.5">
                      <div className="min-w-0 flex-1">
                        {editing?.id === t.id ? (
                          <form className="flex gap-1" onSubmit={(e) => { e.preventDefault(); act.renameTopic(t.id, editing.name); setEditing(null); }}>
                            <Input autoFocus value={editing.name} aria-label="שם הנושא" onChange={(e) => setEditing({ id: t.id, name: e.target.value })} className="h-9" />
                            <Button type="submit" size="icon-sm" aria-label="שמירה"><Check /></Button>
                            <Button type="button" size="icon-sm" variant="ghost" aria-label="ביטול" onClick={() => setEditing(null)}><X /></Button>
                          </form>
                        ) : (
                          <>
                            <p className="truncate font-semibold">{t.name}</p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <Progress className="h-1.5" value={m.percent ?? 0} label={`שליטה ב${t.name}`} />
                              <span className="w-24 shrink-0 text-xs text-muted-foreground">{m.percent === null ? "אין נתונים" : `${m.percent}%`}</span>
                            </div>
                          </>
                        )}
                      </div>
                      {editing?.id !== t.id && (
                        <div className="flex shrink-0 items-center gap-0.5">
                          {lvl === "weak" && <Badge variant="warning">לחיזוק</Badge>}
                          {lvl === "strong" && <Badge variant="success">חזק</Badge>}
                          <Link href={`/tutor?mode=explain&subject=${subject.id}&topic=${encodeURIComponent(t.name)}`} aria-label={`למד ${t.name}`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
                            <Sparkles />
                          </Link>
                          <Button variant="ghost" size="icon-sm" aria-label={`עריכת ${t.name}`} onClick={() => setEditing({ id: t.id, name: t.name })}><Pencil /></Button>
                          <Button variant="ghost" size="icon-sm" aria-label={`מחיקת ${t.name}`} onClick={() => { act.removeTopic(t.id); toast.info("הנושא הוסר", undefined, { label: "בטל", onClick: () => act.restoreItems("topics", [t]) }); }}><Trash2 className="text-destructive" /></Button>
                        </div>
                      )}
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {tab === "materials" && (
        <section aria-label="חומרי לימוד">
          {materials.length === 0 ? (
            <EmptyState icon={<FolderOpen />} title="אין חומרי לימוד" description="העלה PDF, תמונה או טקסט בספריית החומרים ושייך אותם למקצוע." action={<Link href="/library" className={buttonVariants()}>לספריית החומרים</Link>} />
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {materials.map((m) => (
                <li key={m.id}>
                  <Link href={`/library?open=${m.id}`}>
                    <Card className="flex items-center gap-3 p-3.5 transition-colors hover:bg-muted/50">
                      <FileText className="size-5 text-primary" aria-hidden />
                      <span className="min-w-0 flex-1 truncate font-semibold">{m.title}</span>
                      <Badge variant="muted">{m.kind.toUpperCase()}</Badge>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "practice" && (
        <section aria-label="תרגולים" className="grid gap-3 sm:grid-cols-2">
          <Card><CardContent className="space-y-2 pt-5"><h2 className="font-bold">כרטיסיות</h2><p className="text-sm text-muted-foreground">{cards.length} כרטיסיות במקצוע</p><Link href="/flashcards" className={buttonVariants({ variant: "secondary", size: "sm" })}>לכרטיסיות <ArrowLeft /></Link></CardContent></Card>
          <Card><CardContent className="space-y-2 pt-5"><h2 className="font-bold">תרגול עם המורה AI</h2><p className="text-sm text-muted-foreground">המורה שואל שאלה, ממתין לתשובה ובודק אותה.</p><Link href={`/tutor?mode=practice&subject=${subject.id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>התחל תרגול <ArrowLeft /></Link></CardContent></Card>
        </section>
      )}

      {tab === "exams" && (
        <section aria-label="מבחנים" className="space-y-3">
          {exams.length === 0 && attempts.length === 0 ? (
            <EmptyState icon={<GraduationCap />} title="אין מבחנים במקצוע" description="הוסף מועד מבחן כדי לקבל תוכנית חזרה וסימולציות." action={<Link href="/exams" className={buttonVariants()}>למבחנים</Link>} />
          ) : (
            <>
              <ul className="space-y-2">
                {exams.map((e) => (
                  <li key={e.id}>
                    <Link href={`/exams/${e.id}`}>
                      <Card className="flex items-center justify-between gap-3 p-3.5 hover:bg-muted/50">
                        <span className="font-semibold">{e.title}</span>
                        <Badge>{formatShort(e.date)}</Badge>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
              {attempts.length > 0 && (
                <div>
                  <h2 className="mb-2 text-sm font-bold text-muted-foreground">סימולציות שהושלמו</h2>
                  <ul className="space-y-2">
                    {attempts.slice(0, 5).map((a) => (
                      <li key={a.id}>
                        <Link href={`/exams/attempt/${a.id}`}>
                          <Card className="flex items-center justify-between gap-3 p-3.5 hover:bg-muted/50">
                            <span className="font-semibold">{a.title}</span>
                            <Badge variant={(a.scorePercent ?? 0) >= 60 ? "success" : "warning"}>{a.scorePercent === null ? "ממתין לבדיקה" : `${a.scorePercent}%`}</Badge>
                          </Card>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {tab === "notes" && (
        <section aria-label="סיכומים">
          {notes.length === 0 ? (
            <EmptyState icon={<FileText />} title="אין סיכומים" description="צור סיכום חכם מחומרי הלימוד שלך או כתוב סיכום בעצמך." action={<Link href="/summaries" className={buttonVariants()}>לסיכומים</Link>} />
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {notes.map((n) => (
                <li key={n.id}>
                  <Link href={`/summaries?open=${n.id}`}>
                    <Card className="flex items-center gap-3 p-3.5 hover:bg-muted/50">
                      <FileText className="size-5 text-primary" aria-hidden />
                      <span className={cn("min-w-0 flex-1 truncate font-semibold")}>{n.title}</span>
                      {n.aiGenerated && <Badge variant="muted">AI</Badge>}
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {edit && (
        <SubjectFormDialog
          open={edit}
          onOpenChange={setEdit}
          initial={subject}
          onSave={(v) => { act.updateSubject(subject.id, v); toast.success("המקצוע עודכן"); }}
        />
      )}
      <ConfirmDialog
        open={del}
        onOpenChange={setDel}
        title={`למחוק את "${subject.name}"?`}
        description="הנושאים, המבחנים והשאלות של המקצוע יימחקו. שיעורי בית, חומרים וכרטיסיות יישארו ללא שיוך."
        onConfirm={() => { act.removeSubject(subject.id); toast.info("המקצוע נמחק"); router.replace("/subjects"); }}
      />
    </div>
  );
}
