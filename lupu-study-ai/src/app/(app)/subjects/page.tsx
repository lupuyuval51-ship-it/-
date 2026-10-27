"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/PageHeader";
import { SubjectIcon } from "@/components/shared/SubjectIcon";
import { SubjectFormDialog } from "@/components/shared/SubjectForm";
import { EmptyState } from "@/components/shared/EmptyState";
import { useData } from "@/hooks/useApp";
import { act } from "@/services/data/actions";
import { subjectMastery } from "@/services/learning/stats";
import { toast } from "@/lib/bus";
import { Library } from "lucide-react";

export default function SubjectsPage() {
  const data = useData();
  const [open, setOpen] = useState(false);
  const cards = useMemo(
    () =>
      data.subjects.map((s) => ({
        subject: s,
        topics: data.topics.filter((t) => t.subjectId === s.id).length,
        materials: data.studyMaterials.filter((m) => m.subjectId === s.id).length,
        mastery: subjectMastery(data, s.id),
      })),
    [data],
  );

  return (
    <>
      <PageHeader
        title="מקצועות"
        description="כל מקצוע עם הנושאים, החומרים והתרגולים שלו"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> מקצוע אישי
          </Button>
        }
      />
      {cards.length === 0 ? (
        <EmptyState icon={<Library />} title="אין עדיין מקצועות" description="הוסף מקצוע אישי כדי להתחיל לארגן נושאים, חומרים ותרגולים." action={<Button onClick={() => setOpen(true)}><Plus /> הוספת מקצוע</Button>} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ subject, topics, materials, mastery }) => (
            <li key={subject.id}>
              <Card className="group flex h-full flex-col gap-4 p-5 transition-shadow hover:shadow-glow">
                <div className="flex items-start gap-3">
                  <SubjectIcon subject={subject} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-extrabold">{subject.name}</h2>
                    <p className="text-sm text-muted-foreground">{topics} נושאים · {materials} חומרים</p>
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-semibold">שליטה משוערת</span>
                    <span className="text-muted-foreground">{mastery.percent === null ? "אין עדיין נתונים" : `${mastery.percent}%`}</span>
                  </div>
                  <Progress value={mastery.percent ?? 0} label={`שליטה ב${subject.name}`} />
                  {mastery.percent !== null && mastery.confidence < 0.5 && <p className="mt-1 text-xs text-muted-foreground">אומדן ראשוני (מעט תרגילים)</p>}
                </div>
                <div className="mt-auto flex gap-2">
                  <Link href={`/subjects/${subject.id}`} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-secondary text-sm font-semibold hover:bg-secondary/70">
                    פתח מקצוע
                  </Link>
                  <Link href={`/tutor?mode=explain&subject=${subject.id}`} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:brightness-110">
                    התחל ללמוד <ArrowLeft className="size-4" />
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <SubjectFormDialog
          open={open}
          onOpenChange={setOpen}
          onSave={(v) => {
            act.addSubject(v);
            toast.success("המקצוע נוסף");
          }}
        />
      )}
    </>
  );
}
