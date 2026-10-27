"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClipboardCheck, GraduationCap, Plus, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SubjectChip } from "@/components/shared/SubjectIcon";
import { ExamFormDialog } from "@/components/exams/ExamForm";
import { SimulationSetup } from "@/components/exams/SimulationSetup";
import { useData, useToday } from "@/hooks/useApp";
import { diffDays, formatLong, relativeDay } from "@/lib/dates";
import { cn } from "@/lib/utils";

export default function ExamsPage() {
  const data = useData();
  const today = useToday();
  const [adding, setAdding] = useState(false);
  const [simSubject, setSimSubject] = useState<string | null>(null);

  const upcoming = useMemo(() => data.exams.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)), [data.exams, today]);
  const past = useMemo(() => data.exams.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date)), [data.exams, today]);
  const attempts = useMemo(() => data.examAttempts.filter((a) => a.finishedAt).sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? "")), [data.examAttempts]);
  const banks = useMemo(
    () => data.subjects.map((s) => ({ s, count: data.examQuestions.filter((q) => q.subjectId === s.id).length })).filter((x) => x.count > 0),
    [data.subjects, data.examQuestions],
  );
  const simPool = data.examQuestions.filter((q) => q.subjectId === simSubject);

  return (
    <>
      <PageHeader title="מבחנים" description="מועדי מבחנים, תוכנית חזרה וסימולציות" actions={<Button onClick={() => setAdding(true)}><Plus /> מבחן חדש</Button>} />

      {data.exams.length === 0 && attempts.length === 0 ? (
        <EmptyState icon={<GraduationCap />} title="אין עדיין מבחנים" description="הוסף מבחן עם תאריך ונושאים וקבל תוכנית חזרה יומית וסימולציות." action={<Button onClick={() => setAdding(true)}><Plus /> הוספת מבחן</Button>} />
      ) : (
        <div className="space-y-8">
          <section aria-labelledby="up">
            <h2 id="up" className="mb-3 text-lg font-bold">מבחנים קרובים</h2>
            {upcoming.length === 0 ? <p className="text-sm text-muted-foreground">אין מבחנים קרובים.</p> : (
              <ul className="grid gap-3 md:grid-cols-2">
                {upcoming.map((e) => {
                  const left = diffDays(today, e.date);
                  return (
                    <li key={e.id}>
                      <Link href={`/exams/${e.id}`} className="block">
                        <Card className="p-5 transition-shadow hover:shadow-glow">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-lg font-extrabold">{e.title}</p>
                              <p className="mt-0.5 text-sm text-muted-foreground">{formatLong(e.date)}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2"><SubjectChip subject={data.subjects.find((s) => s.id === e.subjectId)} /><span className="text-xs text-muted-foreground">{e.topics.length} נושאים</span></div>
                            </div>
                            <div className={cn("shrink-0 rounded-2xl px-3 py-2 text-center", left <= 3 ? "bg-destructive/12 text-destructive" : "bg-primary/10 text-primary")}>
                              <p className="text-2xl font-extrabold leading-none">{left}</p>
                              <p className="text-[11px] font-bold">{left === 1 ? "יום" : "ימים"}</p>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {banks.length > 0 && (
            <section aria-labelledby="sims">
              <h2 id="sims" className="mb-3 text-lg font-bold">סימולציה מהירה לפי מקצוע</h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {banks.map(({ s, count }) => (
                  <li key={s.id}>
                    <Card className="flex items-center justify-between gap-3 p-4">
                      <div><p className="font-bold">{s.name}</p><p className="text-xs text-muted-foreground">{count} שאלות בבנק</p></div>
                      <Button size="sm" variant="secondary" onClick={() => setSimSubject(s.id)}><Play /> התחל</Button>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {attempts.length > 0 && (
            <section aria-labelledby="res">
              <h2 id="res" className="mb-3 text-lg font-bold">תוצאות אחרונות</h2>
              <ul className="space-y-2">
                {attempts.slice(0, 6).map((a) => (
                  <li key={a.id}>
                    <Link href={`/exams/attempt/${a.id}`}>
                      <Card className="flex items-center gap-3 p-3.5 hover:bg-muted/50">
                        <ClipboardCheck className="size-5 text-primary" aria-hidden />
                        <div className="min-w-0 flex-1"><p className="truncate font-semibold">{a.title}</p><p className="text-xs text-muted-foreground">{relativeDay((a.finishedAt ?? "").slice(0, 10) || today, today)}{a.pendingCount > 0 ? ` · ${a.pendingCount} ממתינות להערכה` : ""}</p></div>
                        <Badge variant={a.scorePercent === null ? "muted" : a.scorePercent >= 60 ? "success" : "warning"}>{a.scorePercent === null ? "טרם נבדק" : `${a.scorePercent}%`}</Badge>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {past.length > 0 && (
            <section aria-labelledby="past">
              <h2 id="past" className="mb-3 text-lg font-bold">מבחנים שעברו</h2>
              <ul className="space-y-2">
                {past.map((e) => (
                  <li key={e.id}><Link href={`/exams/${e.id}`}><Card className="flex items-center justify-between p-3.5 opacity-75 hover:opacity-100"><span className="font-semibold">{e.title}</span><span className="text-xs text-muted-foreground">{formatLong(e.date)}</span></Card></Link></li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {adding && <ExamFormDialog open onOpenChange={setAdding} />}
      {simSubject && <SimulationSetup open onOpenChange={(o) => !o && setSimSubject(null)} pool={simPool} examId={null} subjectId={simSubject} title={`סימולציה – ${data.subjects.find((s) => s.id === simSubject)?.name ?? ""}`} />}
    </>
  );
}
