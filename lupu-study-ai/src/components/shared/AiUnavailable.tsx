import Link from "next/link";
import { KeyRound } from "lucide-react";

/** הודעה ברורה כשאין חיבור למודל AI – במקום תשובות מזויפות */
export function AiUnavailable({ compact }: { compact?: boolean }) {
  return (
    <div role="status" className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm" data-testid="ai-unavailable">
      <KeyRound className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
      <div>
        <p className="font-bold">פיצ׳רי ה-AI עדיין לא מחוברים</p>
        {!compact && (
          <p className="mt-1 text-muted-foreground">
            כדי להפעיל את המורה האישי יש להגדיר <code className="rounded bg-muted px-1" dir="ltr">ANTHROPIC_API_KEY</code> בשרת (ראה README). עד אז כל שאר חלקי האפליקציה פועלים כרגיל, ולא מוצגות תשובות AI מדומות.
          </p>
        )}
        {compact && <p className="mt-0.5 text-muted-foreground">נדרש מפתח Anthropic בשרת. ראה <Link href="/settings" className="underline">הגדרות</Link>.</p>}
      </div>
    </div>
  );
}
