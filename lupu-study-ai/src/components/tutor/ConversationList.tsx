"use client";

import { MessageSquarePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { relativeDay, dateToIsoDay } from "@/lib/dates";
import type { Conversation, Subject } from "@/types";

export function ConversationList({ conversations, subjects, activeId, today, onSelect, onNew, onDelete }: { conversations: Conversation[]; subjects: Subject[]; activeId: string | null; today: string; onSelect: (id: string) => void; onNew: () => void; onDelete: (c: Conversation) => void }) {
  const groups = new Map<string, Conversation[]>();
  for (const c of [...conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))) {
    const key = c.subjectId ?? "";
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }
  return (
    <div className="flex h-full flex-col gap-3">
      <Button onClick={onNew} variant="gradient" className="w-full"><MessageSquarePlus /> שיחה חדשה</Button>
      {conversations.length === 0 ? (
        <p className="rounded-xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">אין עדיין שיחות. שאל את המורה שאלה ראשונה!</p>
      ) : (
        <div className="flex-1 space-y-4 overflow-y-auto pe-1">
          {[...groups.entries()].map(([sid, list]) => (
            <section key={sid} aria-label={subjects.find((s) => s.id === sid)?.name ?? "כללי"}>
              <h3 className="mb-1 px-1 text-xs font-bold text-muted-foreground">{subjects.find((s) => s.id === sid)?.name ?? "כללי"}</h3>
              <ul className="space-y-0.5">
                {list.map((c) => (
                  <li key={c.id} className="group relative">
                    <button type="button" onClick={() => onSelect(c.id)} aria-current={c.id === activeId ? "true" : undefined} className={cn("w-full rounded-lg px-3 py-2 text-start transition-colors", c.id === activeId ? "bg-primary/12" : "hover:bg-muted")}>
                      <span className="block truncate pe-8 text-sm font-semibold">{c.title}</span>
                      <span className="block text-xs text-muted-foreground">{relativeDay(dateToIsoDay(c.updatedAt), today)}</span>
                    </button>
                    <Button variant="ghost" size="icon-sm" aria-label={`מחק שיחה: ${c.title}`} className="absolute end-1 top-1.5 size-8 opacity-100 sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover:opacity-100" onClick={() => onDelete(c)}><Trash2 className="size-4 text-destructive" /></Button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
