"use client";

import { useEffect } from "react";
import { useData, useToday } from "@/hooks/useApp";
import { diffDays } from "@/lib/dates";

const KEY = "lupu:notified";

/**
 * תזכורות מערכת: פועלות רק אחרי שהמשתמש אישר הרשאה, ורק כשהאפליקציה פתוחה (אין שרת Push).
 * כל תזכורת נשלחת פעם אחת ביום.
 */
export function ReminderHost() {
  const data = useData();
  const today = useToday();
  const enabled = data.meta.notificationsEnabled;

  useEffect(() => {
    if (!enabled || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const run = () => {
      let seen: Record<string, string> = {};
      try { seen = JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch { /* מתעלמים */ }
      const fire = (id: string, title: string, body: string) => {
        if (seen[id] === today) return;
        seen[id] = today;
        new Notification(title, { body, lang: "he", dir: "rtl", tag: id });
      };
      const late = data.homework.filter((h) => !h.done && h.dueDate < today);
      if (late.length) fire("late", "שיעורי בית באיחור", `${late.length} משימות עברו את מועד ההגשה`);
      const due = data.homework.filter((h) => !h.done && h.dueDate === today);
      if (due.length) fire("due", "שיעורי בית להיום", due.map((h) => h.title).slice(0, 3).join(", "));
      for (const e of data.exams) {
        const left = diffDays(today, e.date);
        if (left >= 0 && left <= 2) fire(`exam-${e.id}`, left === 0 ? "המבחן היום!" : `מבחן בעוד ${left} ימים`, e.title);
      }
      try { localStorage.setItem(KEY, JSON.stringify(seen)); } catch { /* מתעלמים */ }
    };
    run();
    const id = setInterval(run, 15 * 60_000);
    return () => clearInterval(id);
  }, [enabled, data.homework, data.exams, today]);

  return null;
}
