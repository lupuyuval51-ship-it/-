"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Icon } from "./Icon";
import { ICON_CHOICES, SUBJECT_COLORS, type SubjectColor } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types";

export function SubjectFormDialog({ open, onOpenChange, initial, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; initial?: Subject | null; onSave: (v: { name: string; icon: string; color: string }) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "BookMarked");
  const [color, setColor] = useState<string>(initial?.color ?? "violet");
  const [error, setError] = useState("");

  const submit = () => {
    if (!name.trim()) return setError("יש להזין שם למקצוע");
    onSave({ name, icon, color });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "עריכת מקצוע" : "מקצוע אישי חדש"}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button onClick={submit}>שמירה</Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Field label="שם המקצוע" htmlFor="subject-name" error={error}>
          <Input id="subject-name" value={name} maxLength={40} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="למשל: מוזיקה" autoFocus />
        </Field>
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">אייקון</legend>
          <div className="flex flex-wrap gap-2">
            {ICON_CHOICES.map((i) => (
              <button key={i} type="button" aria-label={`אייקון ${i}`} aria-pressed={icon === i} onClick={() => setIcon(i)} className={cn("flex size-10 items-center justify-center rounded-lg border-2", icon === i ? "border-primary bg-primary/10 text-primary" : "border-transparent bg-muted")}>
                <Icon name={i} className="size-5" />
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">צבע</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SUBJECT_COLORS) as SubjectColor[]).map((c) => (
              <button key={c} type="button" aria-label={SUBJECT_COLORS[c].label} aria-pressed={color === c} onClick={() => setColor(c)} className={cn("size-8 rounded-full border-2 border-card ring-2 transition-transform", color === c ? "scale-110 ring-foreground" : "ring-transparent")} style={{ background: SUBJECT_COLORS[c].hex }} />
            ))}
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}
