"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Bookmark, Camera, Eye, ImageUp, Lightbulb, Loader2, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { AiUnavailable } from "@/components/shared/AiUnavailable";
import { Markdown } from "@/components/shared/Markdown";
import { FileChip } from "@/components/shared/FileChip";
import { useAiStatus } from "@/hooks/useAiStatus";
import { useData } from "@/hooks/useApp";
import { act } from "@/services/data/actions";
import { saveFile, deleteFile } from "@/services/data/files";
import { aiVision, AiClientError } from "@/services/ai/client";
import type { VisionResult } from "@/services/ai/schemas";
import { checkFile, downscaleImage, fileToDataUrl } from "@/lib/files";
import { toast } from "@/lib/bus";
import { uid } from "@/lib/utils";

export default function ScanPage() {
  const data = useData();
  const ai = useAiStatus();
  const [subjectId, setSubjectId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<VisionResult | null>(null);
  const [editedText, setEditedText] = useState("");
  const [showSteps, setShowSteps] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const upRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const grade = data.profile!.grade;
  const subject = data.subjects.find((s) => s.id === subjectId);

  useEffect(() => {
    if (!file) return setPreview("");
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const reset = () => {
    setFile(null); setResult(null); setError(""); setShowSteps(false); setShowFinal(false); setSavedId(null); setEditedText("");
  };

  const pick = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    const check = checkFile(f, ["image"]);
    if (!check.ok) return setError(check.error);
    reset();
    setFile(f);
  };

  const apply = (r: VisionResult) => {
    setResult(r);
    setEditedText(r.questionText);
    setShowSteps(false);
    setShowFinal(false);
    setSavedId(null);
  };

  const analyze = async (corrected?: string) => {
    if (!corrected && !file) return;
    setBusy(true);
    setError("");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      let image: { mediaType: "image/jpeg"; data: string } | undefined;
      if (!corrected && file) {
        const small = await downscaleImage(file);
        const url = await fileToDataUrl(small);
        image = { mediaType: (small.type || "image/jpeg") as "image/jpeg", data: url.split(",")[1] };
      }
      apply(await aiVision({ image, correctedText: corrected, subject: subject?.name, grade }, ctrl.signal));
    } catch (e) {
      if (!(e instanceof DOMException)) setError(e instanceof AiClientError ? e.message : "הניתוח נכשל. נסה שוב.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!result) return;
    let imageId: string | null = null;
    if (file) {
      imageId = uid();
      await saveFile(imageId, file).catch(() => { imageId = null; });
    }
    const r = act.saveExercise({ subjectId: subjectId || null, questionText: editedText || result.questionText, detected: result.detected, hint: result.hint, steps: result.steps, finalAnswer: result.finalAnswer, imageId });
    setSavedId(r.data.savedExercises.at(-1)?.id ?? "saved");
    toast.success("התרגיל נשמר");
  };

  return (
    <>
      <PageHeader title="צלם שאלה" description="צלם תרגיל מהמחברת או מהספר וקבל רמז, פתרון מודרך ותשובה סופית לפי בקשה" />
      {ai.loaded && !ai.configured && <div className="mb-4"><AiUnavailable /></div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>1. הוסף תמונה</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Select aria-label="מקצוע" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">מקצוע: זיהוי אוטומטי</option>
              {data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pick(e.target.files)} aria-label="צילום באמצעות המצלמה" />
            <input ref={upRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files)} aria-label="העלאת תמונה מהמכשיר" />
            {preview ? (
              <div className="relative overflow-hidden rounded-xl border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="תצוגה מקדימה של התרגיל" className="mx-auto max-h-80 w-auto object-contain" />
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center text-sm text-muted-foreground">
                <Camera className="size-8" aria-hidden /> אין עדיין תמונה
                <span className="max-w-xs px-4 text-xs">טיפ: צלם באור טוב, ישר מלמעלה, כך שכל התרגיל נכנס בפריים.</span>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => camRef.current?.click()}><Camera /> צלם</Button>
              <Button variant="outline" onClick={() => upRef.current?.click()}><ImageUp /> העלה תמונה</Button>
              {file && <Button variant="ghost" onClick={reset}><Trash2 /> הסר</Button>}
            </div>
            <Button variant="gradient" size="lg" className="w-full" disabled={!file || busy || !ai.configured} onClick={() => void analyze()}>
              {busy ? <Loader2 className="animate-spin" /> : <Sparkles />} {busy ? "מנתח…" : "נתח את התרגיל"}
            </Button>
            {error && <p role="alert" className="flex items-start gap-2 text-sm font-semibold text-destructive"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{error}</p>}
          </CardContent>
        </Card>

        <div className="space-y-4" aria-live="polite">
          {busy && !result && <Card className="p-6"><div className="skeleton mb-3 h-6 w-40" /><div className="skeleton mb-2 h-4 w-full" /><div className="skeleton h-4 w-2/3" /></Card>}

          {result && !result.readable && (
            <Card className="border-warning/50 p-5" data-testid="scan-unreadable">
              <p className="flex items-center gap-2 font-bold"><AlertTriangle className="size-5 text-warning" /> לא הצלחנו לקרוא את התרגיל</p>
              <p className="mt-2 text-sm text-muted-foreground">{result.note || "התמונה אינה ברורה מספיק."}</p>
              <p className="mt-2 text-sm text-muted-foreground">נסה לצלם שוב מקרוב יותר, באור טוב ובלי טשטוש. לא מציגים ניתוח כשאי אפשר לקרוא את השאלה.</p>
              <Button className="mt-3" variant="outline" onClick={() => camRef.current?.click()}><RefreshCw /> צלם שוב</Button>
            </Card>
          )}

          {result?.readable && (
            <>
              <Card data-testid="scan-result">
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>2. מה זיהינו</CardTitle>
                  <Badge variant={result.confidence === "high" ? "success" : result.confidence === "medium" ? "warning" : "destructive"}>
                    {result.confidence === "high" ? "זיהוי בטוח" : result.confidence === "medium" ? "זיהוי חלקי" : "זיהוי לא בטוח"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.detected && <p className="text-sm text-muted-foreground">{result.detected}{result.topic ? ` · ${result.topic}` : ""}</p>}
                  <div>
                    <p className="mb-1 text-sm font-semibold">נוסח השאלה (אפשר לתקן אם הזיהוי שגוי)</p>
                    <Textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} aria-label="נוסח השאלה" dir="auto" />
                    {editedText.trim() !== result.questionText.trim() && (
                      <Button className="mt-2" size="sm" variant="secondary" disabled={busy || editedText.trim().length < 3} onClick={() => void analyze(editedText.trim())}>
                        {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />} פתור מחדש לפי הנוסח המתוקן
                      </Button>
                    )}
                    <div className="mt-2 rounded-lg bg-muted/60 p-3"><Markdown>{editedText}</Markdown></div>
                  </div>
                  {result.note && <p className="flex items-start gap-2 text-sm text-warning"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{result.note}</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="size-5 text-warning" /> 3. רמז</CardTitle></CardHeader>
                <CardContent><Markdown>{result.hint || "אין רמז זמין. נסה את הפתרון המודרך."}</Markdown></CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>4. פתרון מודרך</CardTitle></CardHeader>
                <CardContent>
                  {showSteps ? (
                    <ol className="space-y-3">
                      {result.steps.map((s, i) => <li key={i} className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-bold text-primary">{i + 1}</span><Markdown className="flex-1">{s}</Markdown></li>)}
                    </ol>
                  ) : (
                    <Button variant="outline" onClick={() => setShowSteps(true)}><Eye /> נסה קודם בעצמך, ואז הצג פתרון מודרך</Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>5. תשובה סופית</CardTitle></CardHeader>
                <CardContent>
                  {showFinal ? <div className="rounded-lg bg-success/10 p-3 font-semibold"><Markdown>{result.finalAnswer || "לא התקבלה תשובה סופית."}</Markdown></div> : <Button variant="outline" onClick={() => setShowFinal(true)}><Eye /> הצג תשובה סופית</Button>}
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void save()} disabled={!!savedId}><Bookmark /> {savedId ? "נשמר" : "שמור את התרגיל"}</Button>
                <Link href={`/tutor?mode=explain&subject=${subjectId}&ask=${encodeURIComponent(`אני צריך עזרה בתרגיל הזה:\n${editedText}\nתכוון אותי בלי לתת את התשובה המלאה מיד.`)}`} className={buttonVariants({ variant: "secondary" })}><Sparkles /> המשך עם המורה</Link>
              </div>
            </>
          )}
        </div>
      </div>

      <section className="mt-10" aria-labelledby="saved">
        <h2 id="saved" className="mb-3 text-lg font-bold">תרגילים שמורים</h2>
        {data.savedExercises.length === 0 ? (
          <EmptyState icon={<Bookmark />} title="אין תרגילים שמורים" description="אחרי ניתוח אפשר לשמור תרגיל כדי לחזור אליו לפני מבחן." />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {[...data.savedExercises].reverse().map((ex) => (
              <li key={ex.id}>
                <Card className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1"><Markdown>{ex.questionText}</Markdown></div>
                    <Button variant="ghost" size="icon-sm" aria-label="מחק תרגיל שמור" onClick={() => { if (ex.imageId) void deleteFile(ex.imageId); act.removeExercise(ex.id); toast.info("התרגיל נמחק"); }}><Trash2 className="text-destructive" /></Button>
                  </div>
                  {ex.imageId && <FileChip id={ex.imageId} />}
                  <details className="text-sm"><summary className="cursor-pointer font-semibold text-primary">הצג פתרון</summary><div className="mt-2 space-y-2">{ex.steps.map((s, i) => <Markdown key={i}>{`${i + 1}. ${s}`}</Markdown>)}<p className="font-bold">תשובה: </p><Markdown>{ex.finalAnswer}</Markdown></div></details>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
