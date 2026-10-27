"use client";

import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { useData } from "@/hooks/useApp";

/** מוצג תמיד כשנתוני דמו נטענו, כדי שאף נתון לא יתפרש כפעילות אמיתית */
export function DemoBanner() {
  const data = useData();
  if (!data.meta.demoLoaded) return null;
  return (
    <div role="status" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 bg-accent/15 px-4 py-1.5 text-center text-xs font-semibold text-foreground sm:text-sm">
      <span className="flex items-center gap-2">
        <FlaskConical className="size-4 text-accent" aria-hidden /> מצב דמו: חלק מהנתונים כאן הם נתוני דוגמה ולא פעילות אמיתית שלך.
      </span>
      <Link href="/settings#demo" className="underline underline-offset-2">
        הסרת נתוני הדמו
      </Link>
    </div>
  );
}
