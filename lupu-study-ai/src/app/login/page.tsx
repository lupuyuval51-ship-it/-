"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/Logo";
import { getSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { toast } from "@/lib/bus";

function hebrewAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "אימייל או סיסמה שגויים.";
  if (m.includes("already registered") || m.includes("already been registered")) return "כבר קיים חשבון עם האימייל הזה. נסה להתחבר.";
  if (m.includes("password") && m.includes("characters")) return "הסיסמה קצרה מדי (לפחות 8 תווים).";
  if (m.includes("email not confirmed")) return "יש לאשר את האימייל דרך ההודעה שנשלחה אליך.";
  if (m.includes("rate limit") || m.includes("too many")) return "יותר מדי ניסיונות. נסה שוב בעוד כמה דקות.";
  if (m.includes("fetch") || m.includes("network")) return "בעיית חיבור לשרת. בדוק את האינטרנט ונסה שוב.";
  return "ההתחברות נכשלה. נסה שוב.";
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async () => {
    setError("");
    setInfo("");
    const sb = getSupabase();
    if (!sb) return;
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("הזן כתובת אימייל תקינה.");
    if (password.length < 8) return setError("הסיסמה חייבת להכיל לפחות 8 תווים.");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: err } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/dashboard` } });
        if (err) throw err;
        if (!data.session) {
          setInfo("שלחנו אליך אימייל לאישור החשבון. לאחר האישור אפשר להתחבר.");
          return;
        }
      } else {
        const { error: err } = await sb.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
      toast.success("התחברת בהצלחה");
      router.replace("/dashboard");
    } catch (e) {
      setError(hebrewAuthError(e instanceof Error ? e.message : ""));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 flex justify-center"><Logo /></div>
      <main id="main">
        <Card className="p-6">
          <h1 className="text-2xl font-extrabold">{mode === "signin" ? "התחברות" : "יצירת חשבון"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">החשבון מאפשר לשמור את הנתונים בענן ולהמשיך מכל מכשיר.</p>

          {!isSupabaseConfigured() ? (
            <div role="status" className="mt-5 space-y-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm" data-testid="auth-unconfigured">
              <p className="font-bold">התחברות עדיין לא הוגדרה</p>
              <p className="text-muted-foreground">כדי להפעיל חשבונות יש להגדיר את <code dir="ltr">NEXT_PUBLIC_SUPABASE_URL</code> ו-<code dir="ltr">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (ראה README). בינתיים האפליקציה פועלת במלואה במצב מקומי, והנתונים נשמרים במכשיר.</p>
              <Link href="/dashboard" className="inline-block font-bold text-primary underline">המשך במצב מקומי</Link>
            </div>
          ) : (
            <form className="mt-5 space-y-4" onSubmit={(e) => { e.preventDefault(); void submit(); }} noValidate>
              <Field label="אימייל" htmlFor="email">
                <div className="relative"><Mail className="pointer-events-none absolute start-3 top-3.5 size-4 text-muted-foreground" /><Input id="email" type="email" autoComplete="email" dir="ltr" className="ps-10 text-start" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              </Field>
              <Field label="סיסמה" htmlFor="password" hint={mode === "signup" ? "לפחות 8 תווים" : undefined}>
                <div className="relative"><Lock className="pointer-events-none absolute start-3 top-3.5 size-4 text-muted-foreground" /><Input id="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} dir="ltr" className="ps-10 text-start" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              </Field>
              {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
              {info && <p role="status" className="text-sm font-semibold text-success">{info}</p>}
              <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={busy}>
                {busy && <Loader2 className="animate-spin" />} {mode === "signin" ? "התחברות" : "יצירת חשבון"}
              </Button>
              <button type="button" className="w-full text-sm font-semibold text-primary" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setInfo(""); }}>
                {mode === "signin" ? "אין לך חשבון? הרשמה" : "כבר יש חשבון? התחברות"}
              </button>
            </form>
          )}
        </Card>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/dashboard" className="font-semibold underline">המשך כאורח</Link> · בלי חשבון, הנתונים נשארים במכשיר ושימוש ה-AI מוגבל.
        </p>
      </main>
    </div>
  );
}
