"use client";

import Link from "next/link";
import { AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { StudyMaterial } from "@/types";

export function MaterialPicker({ open, onOpenChange, materials, selected, onChange }: { open: boolean; onOpenChange: (o: boolean) => void; materials: StudyMaterial[]; selected: string[]; onChange: (ids: string[]) => void }) {
  const usable = (m: StudyMaterial) => m.pages.some((p) => p.text.trim());
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="חומרי לימוד לשיחה" description="המורה יענה על סמך החומר שתבחר, ויציין מאיפה לקח (רק הפניות אמיתיות)." footer={<Button onClick={() => onOpenChange(false)}>סיום</Button>}>
      {materials.length === 0 ? (
        <p className="text-sm text-muted-foreground">אין עדיין חומרי לימוד. <Link href="/library" className="font-bold text-primary underline">העלה חומר בספרייה</Link>.</p>
      ) : (
        <ul className="space-y-2">
          {materials.map((m) => (
            <li key={m.id}>
              <label className={`flex items-start gap-3 rounded-xl border p-3 ${usable(m) ? "cursor-pointer hover:bg-muted/50" : "opacity-60"}`}>
                <input type="checkbox" className="mt-1 size-5 accent-[hsl(var(--primary))]" disabled={!usable(m)} checked={selected.includes(m.id)} onChange={(e) => onChange(e.target.checked ? [...selected, m.id].slice(0, 6) : selected.filter((x) => x !== m.id))} />
                <FileText className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{m.title}</span>
                  {usable(m) ? <span className="text-xs text-muted-foreground">{m.pages.length} {m.kind === "pdf" ? "עמודים" : "קטעים"}</span> : <span className="flex items-center gap-1 text-xs text-warning"><AlertTriangle className="size-3" /> אין טקסט שניתן לקריאה בקובץ</span>}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted-foreground">אפשר לבחור עד 6 חומרים. רק הקטעים הרלוונטיים לשאלה נשלחים למודל.</p>
    </Dialog>
  );
}
