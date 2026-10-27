"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@/components/shared/Icon";
import { SubjectIcon } from "@/components/shared/SubjectIcon";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { DAILY_MINUTES_OPTIONS, GOALS, GRADES, SUBJECT_TEMPLATES } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { act } from "@/services/data/actions";
import { useData, useReady } from "@/hooks/useApp";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Goal } from "@/types";

const STEPS = ["ברוכים הבאים", "כיתה", "מקצועות", "מטרות", "זמן לימוד"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const ready = useReady();
  const data = useData();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(8);
  const [subjects, setSubjects] = useState<string[]>(["math", "english", "hebrew", "science"]);
  const [goals, setGoals] = useState<Goal[]>(["exams"]);
  const [minutes, setMinutes] = useState(30);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && data.profile?.onboarded) router.replace("/dashboard");
  }, [ready, data.profile?.onboarded, router]);

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const next = () => {
    setError("");
    if (step === 0 && !name.trim()) return setError("איך לקרוא לך? כתוב שם או כינוי.");
    if (step === 2 && subjects.length === 0) return setError("בחר לפחות מקצוע אחד. אפשר להוסיף עוד אחר כך.");
    if (step === 3 && goals.length === 0) return setError("בחר לפחות מטרה אחת.");
    if (step === STEPS.length - 1) {
      act.completeOnboarding({ displayName: name, grade, subjectKeys: subjects, goals, dailyMinutes: minutes });
      router.replace("/dashboard");
      return;
    }
    setStep(step + 1);
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-5">
      <header className="flex items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>

      <div className="mt-6" aria-live="polite">
        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-muted-foreground">
          <span>
            שלב {step + 1} מתוך {STEPS.length} · {STEPS[step]}
          </span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} label="התקדמות בהגדרה" />
      </div>

      <main id="main" className="flex-1 py-8">
        {step === 0 && (
          <section className="animate-fade-up space-y-6" aria-labelledby="t0">
            <div className="flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow">
              <Sparkles className="size-8" aria-hidden />
            </div>
            <div>
              <h1 id="t0" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                ברוכים הבאים ל-<span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">LUPU Study AI</span>
              </h1>
              <p className="mt-3 text-base text-muted-foreground sm:text-lg">
                מורה פרטי דיגיטלי שמסביר, בודק תשובות, מכין למבחנים ועוזר לך להבין את החומר, בקצב שלך.
              </p>
            </div>
            <Field label="איך לקרוא לך?" htmlFor="name" hint="שם פרטי או כינוי בלבד. אין צורך במידע נוסף.">
              <Input id="name" value={name} maxLength={40} autoComplete="given-name" placeholder="למשל: נועה" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && next()} autoFocus />
            </Field>
            <p className="flex items-start gap-2 rounded-xl bg-muted/70 p-3 text-sm text-muted-foreground">
              <Lock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                הפרופיל פרטי כברירת מחדל. אין פרופיל ציבורי, אין צ׳אט בין תלמידים, ו{isSupabaseConfigured() ? "הנתונים נשמרים בחשבון המאובטח שלך" : "הנתונים נשמרים רק במכשיר הזה"}.
              </span>
            </p>
            {isSupabaseConfigured() && (
              <p className="text-sm">
                כבר יש לך חשבון?{" "}
                <Link href="/login" className="font-bold text-primary underline underline-offset-2">
                  התחברות
                </Link>
              </p>
            )}
          </section>
        )}

        {step === 1 && (
          <section className="animate-fade-up" aria-labelledby="t1">
            <h2 id="t1" className="text-2xl font-extrabold">באיזו כיתה את/ה?</h2>
            <p className="mt-1 text-muted-foreground">ההסברים והשאלות יותאמו לרמה שלך.</p>
            <div role="radiogroup" aria-labelledby="t1" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {GRADES.map((g) => (
                <Choice key={g.value} selected={grade === g.value} role="radio" onClick={() => setGrade(g.value)}>
                  <span className="text-lg font-extrabold">{g.label}</span>
                  {g.value === 8 && <span className="text-xs text-muted-foreground">מותאם במיוחד</span>}
                </Choice>
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="animate-fade-up" aria-labelledby="t2">
            <h2 id="t2" className="text-2xl font-extrabold">אילו מקצועות ללמוד?</h2>
            <p className="mt-1 text-muted-foreground">אפשר לבחור כמה שרוצים, ולהוסיף מקצועות אישיים בהמשך.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SUBJECT_TEMPLATES.map((s) => (
                <Choice key={s.key} selected={subjects.includes(s.key)} role="checkbox" onClick={() => setSubjects(toggle(subjects, s.key))}>
                  <SubjectIcon subject={s} />
                  <span className="font-bold">{s.name}</span>
                </Choice>
              ))}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="animate-fade-up" aria-labelledby="t3">
            <h2 id="t3" className="text-2xl font-extrabold">מה המטרה שלך?</h2>
            <p className="mt-1 text-muted-foreground">אפשר לבחור יותר ממטרה אחת.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {GOALS.map((g) => (
                <Choice key={g.value} selected={goals.includes(g.value)} role="checkbox" onClick={() => setGoals(toggle(goals, g.value))} className="items-start text-start">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <Icon name={g.icon} className="size-5" />
                  </span>
                  <span className="font-bold">{g.label}</span>
                  <span className="text-sm text-muted-foreground">{g.description}</span>
                </Choice>
              ))}
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="animate-fade-up" aria-labelledby="t4">
            <h2 id="t4" className="text-2xl font-extrabold">כמה זמן ללמוד ביום?</h2>
            <p className="mt-1 text-muted-foreground">התחלה קטנה ועקבית עדיפה על מפגשים ארוכים ונדירים. אפשר לשנות בכל רגע.</p>
            <div role="radiogroup" aria-labelledby="t4" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {DAILY_MINUTES_OPTIONS.map((m) => (
                <Choice key={m} selected={minutes === m} role="radio" onClick={() => setMinutes(m)}>
                  <span className="text-2xl font-extrabold">{m}</span>
                  <span className="text-sm text-muted-foreground">דקות ביום</span>
                </Choice>
              ))}
            </div>
          </section>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm font-semibold text-destructive">
            {error}
          </p>
        )}
      </main>

      <footer className="safe-bottom sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t bg-background/90 px-4 py-4 backdrop-blur">
        <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          <ArrowRight /> חזרה
        </Button>
        <Button variant="gradient" size="lg" onClick={next} data-testid="onboarding-next">
          {step === STEPS.length - 1 ? (
            <>
              מעבר לדשבורד <Check />
            </>
          ) : (
            <>
              המשך <ArrowLeft />
            </>
          )}
        </Button>
      </footer>
    </div>
  );
}

function Choice({ selected, className, children, role, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean; role: "radio" | "checkbox" }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      className={cn(
        "relative flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border-2 bg-card p-4 text-center transition-all hover:border-primary/50",
        selected ? "border-primary bg-primary/8 shadow-glow" : "border-border",
        className,
      )}
      {...props}
    >
      {selected && (
        <span className="absolute end-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3.5" aria-hidden />
        </span>
      )}
      {children}
    </button>
  );
}
