"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, Cloud, Download, FlaskConical, KeyRound, LogOut, Palette, ShieldCheck, Trash2, User } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/shared/PageHeader";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAiStatus } from "@/hooks/useAiStatus";
import { useAuth } from "@/hooks/useAuth";
import { useData } from "@/hooks/useApp";
import { useTheme } from "@/hooks/useTheme";
import { act } from "@/services/data/actions";
import { deleteAccountAndData, eraseAllData, exportData } from "@/services/data/account";
import { getSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DAILY_MINUTES_OPTIONS, GRADES } from "@/lib/catalog";
import { toast } from "@/lib/bus";
import { emailToUsername } from "@/lib/auth";

export default function SettingsPage() {
  const data = useData();
  const ai = useAiStatus();
  const auth = useAuth();
  const router = useRouter();
  const { pref, set: setTheme } = useTheme();
  const profile = data.profile!;
  const [name, setName] = useState(profile.displayName);
  const [confirm, setConfirm] = useState<null | "ai" | "all" | "account" | "demo">(null);

  const saveName = () => {
    if (!name.trim()) return toast.error("השם לא יכול להיות ריק");
    act.updateProfile({ displayName: name.trim().slice(0, 40) });
    toast.success("השם עודכן");
  };

  const toggleNotifications = async (on: boolean) => {
    if (!on) return void act.setNotifications(false);
    if (typeof Notification === "undefined") return toast.error("הדפדפן לא תומך בהתראות", "התזכורות יוצגו בתוך האפליקציה בלבד.");
    const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm === "granted") { act.setNotifications(true); toast.success("התראות הופעלו", "ההתראות מוצגות כשהאפליקציה פתוחה."); }
    else toast.error("ההרשאה לא ניתנה", "אפשר לאשר התראות בהגדרות הדפדפן.");
  };

  const download = () => {
    const { filename, blob } = exportData();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast.success("הקובץ הורד");
  };

  return (
    <>
      <PageHeader title="הגדרות" description="פרופיל, מראה, פרטיות ונתונים" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><div className="flex items-center gap-2"><User className="size-5 text-primary" aria-hidden /><CardTitle>פרופיל</CardTitle></div><CardDescription>נאסף רק מה שנחוץ ללמידה</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); saveName(); }}>
              <Field label="שם / כינוי" htmlFor="s-name" className="flex-1"><Input id="s-name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} /></Field>
              <Button type="submit" variant="secondary" disabled={name.trim() === profile.displayName}>שמירה</Button>
            </form>
            <Field label="כיתה" htmlFor="s-grade"><Select id="s-grade" value={profile.grade} onChange={(e) => { act.updateProfile({ grade: Number(e.target.value) }); toast.success("הכיתה עודכנה"); }}>{GRADES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}</Select></Field>
            <Field label="זמן לימוד יומי מועדף" htmlFor="s-min"><Select id="s-min" value={profile.dailyMinutes} onChange={(e) => act.updateProfile({ dailyMinutes: Number(e.target.value) })}>{DAILY_MINUTES_OPTIONS.map((m) => <option key={m} value={m}>{m} דקות</option>)}</Select></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-center gap-2"><Palette className="size-5 text-primary" aria-hidden /><CardTitle>מראה והתראות</CardTitle></div></CardHeader>
          <CardContent className="space-y-4">
            <Field label="ערכת נושא" htmlFor="s-theme"><div className="flex items-center gap-2"><Select id="s-theme" value={pref} onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}><option value="system">לפי המכשיר</option><option value="light">בהיר</option><option value="dark">כהה</option></Select><ThemeToggle /></div></Field>
            <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
              <div className="flex items-start gap-2"><Bell className="mt-0.5 size-5 text-primary" aria-hidden /><div><p className="font-semibold">התראות מערכת</p><p className="text-xs text-muted-foreground">תזכורות לשיעורי בית ומבחנים. פועלות כשהאפליקציה פתוחה, ורק לאחר אישור הרשאה.</p></div></div>
              <Switch checked={data.meta.notificationsEnabled} onCheckedChange={(v) => void toggleNotifications(v)} label="התראות מערכת" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-center gap-2"><KeyRound className="size-5 text-primary" aria-hidden /><CardTitle>מורה AI</CardTitle></div></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {!ai.loaded ? <p className="text-muted-foreground">בודק חיבור…</p> : ai.configured ? <p className="rounded-lg bg-success/10 p-3 font-semibold text-success" data-testid="ai-status-on">מחובר למודל ({ai.model}). המפתח שמור בשרת בלבד ואינו נחשף בדפדפן.</p> : <p className="rounded-lg bg-warning/10 p-3 font-semibold text-warning" data-testid="ai-status-off">לא מחובר. יש להגדיר ANTHROPIC_API_KEY בשרת (ראה README). עד אז פיצ׳רי ה-AI מושבתים ואין תשובות מדומות.</p>}
            <p className="text-muted-foreground">כשמשתמשים ב-AI, ההודעות, הקטעים הרלוונטיים מחומרי הלימוד ותמונות שצירפת נשלחים לספק ה-AI דרך השרת שלנו, ורק לצורך המענה. לא נשלח שום מידע אחר.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-center gap-2"><Cloud className="size-5 text-primary" aria-hidden /><CardTitle>חשבון וסנכרון</CardTitle></div></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {!isSupabaseConfigured() ? <p className="text-muted-foreground">מצב מקומי: הנתונים נשמרים במכשיר בלבד. כדי לאפשר חשבון וסנכרון בין מכשירים יש להגדיר Supabase (ראה README).</p> : auth.status === "signed-in" ? (
              <>
                <p>מחובר כ-<b dir="ltr">{emailToUsername(auth.user.email)}</b></p>
                <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={async () => { await getSupabase()?.auth.signOut(); toast.info("התנתקת"); router.push("/login"); }}><LogOut /> התנתקות</Button><Button variant="destructive" onClick={() => setConfirm("account")}><Trash2 /> מחיקת החשבון</Button></div>
              </>
            ) : <Link href="/login" className={buttonVariants()}>התחברות / הרשמה</Link>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" aria-hidden /><CardTitle>פרטיות ונתונים</CardTitle></div><CardDescription>הפרופיל פרטי תמיד: אין פרופיל ציבורי, אין שיתוף בין תלמידים ואין צ׳אט פתוח.</CardDescription></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <ActionRow title="ייצוא הנתונים שלי" text="הורדת כל המידע האישי כקובץ JSON." button={<Button variant="outline" onClick={download}><Download /> ייצוא</Button>} />
            <ActionRow title="מחיקת היסטוריית AI" text={`${data.conversations.length} שיחות ו-${data.messages.length} הודעות יימחקו.`} button={<Button variant="outline" onClick={() => setConfirm("ai")} disabled={data.conversations.length === 0}><Trash2 /> מחיקה</Button>} />
            <ActionRow title="מחיקת כל הנתונים" text="כל הנתונים והקבצים יימחקו מהמכשיר (ומהענן אם מחוברים) ותתחיל הקמה מחדש." button={<Button variant="destructive" onClick={() => setConfirm("all")}><Trash2 /> מחיקת הכול</Button>} />
            <div id="demo"><ActionRow title="נתוני דמו" text={data.meta.demoLoaded ? "נתוני דוגמה נטענו ומסומנים בבירור. אפשר להסיר אותם בלי לפגוע בנתונים אמיתיים." : "טען נתוני דוגמה כדי להתרשם מהמערכת. הם יסומנו כדמו."} button={data.meta.demoLoaded ? <Button variant="outline" onClick={() => setConfirm("demo")}><FlaskConical /> הסר נתוני דמו</Button> : <Button variant="outline" onClick={() => { act.loadDemoData(); toast.success("נתוני דמו נטענו"); }}><FlaskConical /> טען נתוני דמו</Button>} /></div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog open={confirm === "ai"} onOpenChange={(o) => !o && setConfirm(null)} title="למחוק את כל היסטוריית ה-AI?" description="כל השיחות וההודעות יימחקו." onConfirm={() => { act.clearAiHistory(); toast.info("ההיסטוריה נמחקה"); }} />
      <ConfirmDialog open={confirm === "demo"} onOpenChange={(o) => !o && setConfirm(null)} title="להסיר את נתוני הדמו?" confirmLabel="הסרה" onConfirm={() => { act.removeDemoData(); toast.info("נתוני הדמו הוסרו"); }} />
      <ConfirmDialog open={confirm === "all"} onOpenChange={(o) => !o && setConfirm(null)} title="למחוק את כל הנתונים?" description="כל המקצועות, המשימות, הסיכומים, הקבצים והשיחות יימחקו. אי אפשר לשחזר." confirmLabel="מחק הכול" onConfirm={async () => { try { await eraseAllData(); toast.info("כל הנתונים נמחקו"); router.replace("/onboarding"); } catch { toast.error("המחיקה נכשלה", "בדוק את החיבור ונסה שוב."); } }} />
      <ConfirmDialog open={confirm === "account"} onOpenChange={(o) => !o && setConfirm(null)} title="למחוק את החשבון?" description="החשבון וכל הנתונים והקבצים שבענן יימחקו לצמיתות." confirmLabel="מחק חשבון" onConfirm={async () => { try { await deleteAccountAndData(); toast.info("החשבון נמחק"); router.replace("/onboarding"); } catch { toast.error("מחיקת החשבון נכשלה", "נסה שוב מאוחר יותר."); } }} />
    </>
  );
}

function ActionRow({ title, text, button }: { title: string; text: string; button: React.ReactNode }) {
  return <div className="flex flex-col justify-between gap-3 rounded-xl border p-4"><div><p className="font-bold">{title}</p><p className="text-sm text-muted-foreground">{text}</p></div><div>{button}</div></div>;
}
