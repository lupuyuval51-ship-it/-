"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, History, ImagePlus, Lightbulb, Paperclip, Send, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { AiUnavailable } from "@/components/shared/AiUnavailable";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConversationList } from "./ConversationList";
import { MaterialPicker } from "./MaterialPicker";
import { MessageBubble, TypingBubble } from "./MessageBubble";
import { useAiStatus } from "@/hooks/useAiStatus";
import { useData, useToday } from "@/hooks/useApp";
import { act } from "@/services/data/actions";
import { saveFile } from "@/services/data/files";
import { aiChatStream, AiClientError } from "@/services/ai/client";
import { buildMaterialContext, resolveCitations } from "@/services/ai/retrieval";
import { parseVerdicts, stripPartialTag } from "@/services/ai/verdicts";
import { checkFile, downscaleImage, fileToDataUrl } from "@/lib/files";
import { toast } from "@/lib/bus";
import { nowIso, uid } from "@/lib/utils";
import type { Citation, Conversation, ExplainLevel, TutorMode } from "@/types";
import { Markdown } from "@/components/shared/Markdown";

const MODES: { value: TutorMode; label: string }[] = [
  { value: "explain", label: "הסבר" },
  { value: "practice", label: "תרגול" },
  { value: "exam", label: "מבחן" },
];

const MODE_HINT: Record<TutorMode, string> = {
  explain: "המורה מסביר את החומר בצורה ברורה ובודק הבנה.",
  practice: "המורה שואל שאלה, ממתין לתשובה שלך, בודק ומתקדם.",
  exam: "שאלות בלי רמזים ובלי פתרונות עד הסוף, כמו במבחן אמיתי.",
};

const QUICK = [
  { label: "תן רמז", text: "תן לי רמז בלבד, בלי הפתרון." },
  { label: "הסבר פשוט יותר", text: "אני לא מבין. תסביר לי שוב בצורה פשוטה יותר." },
  { label: "תן דוגמה", text: "תן לי דוגמה פשוטה." },
  { label: "בדוק את הפתרון שלי", text: "אני רוצה שתבדוק את הפתרון שלי. הנה מה שכתבתי:\n" },
  { label: "פתרון מלא", text: "אני רוצה את הפתרון המלא, שלב אחר שלב." },
];

interface Settings {
  subjectId: string;
  topic: string;
  mode: TutorMode;
  level: ExplainLevel;
}

export default function TutorClient() {
  const data = useData();
  const today = useToday();
  const ai = useAiStatus();
  const router = useRouter();
  const params = useSearchParams();
  const profile = data.profile!;

  const [activeId, setActiveId] = useState<string | null>(params.get("c"));
  const [settings, setSettings] = useState<Settings>({
    subjectId: params.get("subject") ?? "",
    topic: params.get("topic") ?? "",
    mode: (["explain", "practice", "exam"].includes(params.get("mode") ?? "") ? params.get("mode") : "explain") as TutorMode,
    level: "standard",
  });
  const [input, setInput] = useState(params.get("ask") ?? "");
  const [images, setImages] = useState<File[]>([]);
  const [materialIds, setMaterialIds] = useState<string[]>(() => (params.get("material") ? [params.get("material") as string] : []));
  const [pickMaterials, setPickMaterials] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [deleting, setDeleting] = useState<Conversation | null>(null);
  const [streaming, setStreaming] = useState<{ convId: string; text: string } | null>(null);
  const [pending, setPending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const sendingRef = useRef(false);

  const conversation = data.conversations.find((c) => c.id === activeId) ?? null;
  const messages = useMemo(() => data.messages.filter((m) => m.conversationId === activeId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [data.messages, activeId]);
  const subject = data.subjects.find((s) => s.id === (conversation?.subjectId ?? settings.subjectId));
  const topics = data.topics.filter((t) => t.subjectId === (conversation?.subjectId ?? settings.subjectId));
  const cur: Settings = conversation ? { subjectId: conversation.subjectId ?? "", topic: conversation.topic, mode: conversation.mode, level: conversation.level } : settings;
  const librarySelectable = data.studyMaterials.filter((m) => !cur.subjectId || m.subjectId === cur.subjectId || m.subjectId === null);

  // טוען הגדרות משיחה קיימת כשעוברים אליה
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, streaming?.text, pending]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const update = (patch: Partial<Settings>) => {
    if (conversation) {
      act.updateConversation(conversation.id, { ...(patch.subjectId !== undefined ? { subjectId: patch.subjectId || null } : {}), ...(patch.topic !== undefined ? { topic: patch.topic } : {}), ...(patch.mode ? { mode: patch.mode } : {}), ...(patch.level ? { level: patch.level } : {}) });
    } else setSettings((s) => ({ ...s, ...patch }));
  };

  const newConversation = () => {
    setActiveId(null);
    setInput("");
    setImages([]);
    setShowHistory(false);
    router.replace("/tutor");
  };

  const addImages = async (list: FileList | null) => {
    if (!list) return;
    const next: File[] = [];
    for (const f of Array.from(list)) {
      const check = checkFile(f, ["image"]);
      if (!check.ok) { toast.error("אי אפשר לצרף את הקובץ", check.error); continue; }
      next.push(f);
    }
    setImages((cur) => [...cur, ...next].slice(0, 3));
    if (fileRef.current) fileRef.current.value = "";
  };

  const send = useCallback(
    async (text: string, opts: { retryOf?: string } = {}) => {
      const content = text.trim();
      if ((!content && images.length === 0) || sendingRef.current) return;
      if (!ai.configured) return;
      sendingRef.current = true;
      setPending(true);

      // 1) שיחה והודעת משתמש
      let convId = conversation?.id ?? null;
      if (!convId) {
        convId = uid();
        const now = nowIso();
        act.addConversation({
          id: convId, title: content.slice(0, 48) || "שאלה עם תמונה", subjectId: settings.subjectId || null, topic: settings.topic,
          mode: settings.mode, level: settings.level, createdAt: now, updatedAt: now,
        });
        setActiveId(convId);
      }
      const sendImages = opts.retryOf ? [] : images;
      let userMsgId = opts.retryOf;
      if (!userMsgId) {
        const imageIds: string[] = [];
        for (const f of sendImages) {
          const id = uid();
          await saveFile(id, f).catch(() => {});
          imageIds.push(id);
        }
        userMsgId = uid();
        act.addMessage({ id: userMsgId, conversationId: convId, role: "user", content: content || "(שאלה בתמונה)", imageIds, citations: [], isError: false, createdAt: nowIso() });
        setInput("");
        setImages([]);
      }

      // 2) בניית הבקשה: היסטוריה (בלי הודעות שגיאה), חומרי לימוד רלוונטיים ותמונות
      const snapshot = (await new Promise<{ role: "user" | "assistant"; content: string }[]>((resolve) => {
        const all = [...data.messages.filter((m) => m.conversationId === convId && !m.isError && m.id !== userMsgId), { role: "user" as const, content: content || "(שאלה בתמונה)" }];
        resolve(all.slice(-16).map((m) => ({ role: m.role, content: m.content })));
      }));
      const chosen = data.studyMaterials.filter((m) => materialIds.includes(m.id));
      const { ctx, map } = chosen.length ? buildMaterialContext(chosen, content) : { ctx: [], map: {} };
      const encoded = await Promise.all(sendImages.map(async (f) => {
        const small = await downscaleImage(f);
        const url = await fileToDataUrl(small);
        const [, b64] = url.split(",");
        return { mediaType: (small.type || "image/jpeg") as "image/jpeg", data: b64 };
      }));

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setStreaming({ convId, text: "" });
      try {
        const full = await aiChatStream(
          {
            messages: snapshot, mode: cur.mode, level: cur.level, grade: profile.grade, subject: subject?.name, topic: cur.topic || undefined,
            materials: ctx.length ? ctx : undefined, images: encoded.length ? encoded : undefined,
          },
          (_c, all) => setStreaming({ convId: convId!, text: all }),
          ctrl.signal,
        );
        // במצב תרגול/מבחן ה-AI מדווח תוצאת בדיקה בתגית מכונה: מסירים אותה מהטקסט ורושמים בסטטיסטיקות
        const parsed = parseVerdicts(full);
        const verdicts = cur.mode === "explain" ? [] : parsed.verdicts;
        if (verdicts.length) {
          act.recordTutorResults({ subjectId: cur.subjectId || null, fallbackTopic: cur.topic || subject?.name || "", verdicts });
          toast.info(`נרשמו ${verdicts.length} תוצאות בסטטיסטיקות`, "לפי בדיקת המורה AI. זו הערכה ולא ציון רשמי.");
        }
        const resolved = resolveCitations(parsed.text, map);
        act.addMessage({ id: uid(), conversationId: convId, role: "assistant", content: resolved.text, imageIds: [], citations: resolved.citations as Citation[], isError: false, createdAt: nowIso() });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          // עצירה ידנית: שומרים את מה שהתקבל עד כה
          setStreaming((s) => {
            if (s?.text.trim()) act.addMessage({ id: uid(), conversationId: convId!, role: "assistant", content: `${resolveCitations(parseVerdicts(s.text).text, map).text}\n\n*(התשובה נעצרה)*`, imageIds: [], citations: [], isError: false, createdAt: nowIso() });
            return null;
          });
        } else {
          const msg = e instanceof AiClientError ? e.message : "אירעה שגיאה לא צפויה. נסה שוב.";
          act.addMessage({ id: uid(), conversationId: convId, role: "assistant", content: msg, imageIds: [], citations: [], isError: true, createdAt: nowIso() });
        }
      } finally {
        setStreaming(null);
        setPending(false);
        sendingRef.current = false;
        abortRef.current = null;
      }
    },
    [ai.configured, conversation, cur.level, cur.mode, cur.subjectId, cur.topic, data.messages, data.studyMaterials, images, materialIds, profile.grade, settings, subject?.name],
  );

  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const lastIsError = messages.at(-1)?.isError;
  const retry = () => {
    if (!lastUserMsg) return;
    const last = messages.at(-1);
    if (last?.isError) act.removeMessage(last.id);
    void send(lastUserMsg.content, { retryOf: lastUserMsg.id });
  };

  const startPreset = () => {
    const t = cur.topic || subject?.name || "נושא לפי בחירתך";
    void send(cur.mode === "practice" ? `התחל תרגול בנושא: ${t}. שאל אותי שאלה אחת.` : cur.mode === "exam" ? `התחל מבחן קצר של 5 שאלות בנושא: ${t}.` : `הסבר לי את הנושא: ${t}`);
  };

  const canSend = ai.configured && !pending && (input.trim().length > 0 || images.length > 0);
  const empty = messages.length === 0 && !streaming;

  const list = (
    <ConversationList
      conversations={data.conversations}
      subjects={data.subjects}
      activeId={activeId}
      today={today}
      onSelect={(id) => { setActiveId(id); setShowHistory(false); }}
      onNew={newConversation}
      onDelete={setDeleting}
    />
  );

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[17rem_1fr]">
      <h1 className="sr-only">מורה AI</h1>
      <aside className="hidden overflow-hidden rounded-xl border bg-card p-3 lg:block" aria-label="היסטוריית שיחות">{list}</aside>

      <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-soft" aria-label="שיחה עם המורה AI">
        <div className="space-y-3 border-b p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" className="lg:hidden" aria-label="היסטוריית שיחות" onClick={() => setShowHistory(true)}><History /></Button>
            <Tabs<TutorMode> label="מצב שיחה" items={MODES} value={cur.mode} onChange={(mode) => update({ mode })} className="flex-1" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select aria-label="מקצוע" value={cur.subjectId} onChange={(e) => update({ subjectId: e.target.value, topic: "" })} className="h-10 w-auto min-w-32 flex-1 sm:flex-none">
              <option value="">כל מקצוע</option>
              {data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <input list="tutor-topics" aria-label="נושא" placeholder="נושא (אופציונלי)" value={cur.topic} maxLength={120} onChange={(e) => update({ topic: e.target.value })} className="h-10 min-w-32 flex-1 rounded-md border border-input bg-card px-3 text-sm" />
            <datalist id="tutor-topics">{topics.map((t) => <option key={t.id} value={t.name} />)}</datalist>
            <Select aria-label="רמת הסבר" value={cur.level} onChange={(e) => update({ level: e.target.value as ExplainLevel })} className="h-10 w-auto min-w-28">
              <option value="simple">הסבר פשוט</option><option value="standard">הסבר רגיל</option><option value="advanced">הסבר מתקדם</option>
            </Select>
            <Button variant={materialIds.length ? "secondary" : "outline"} size="sm" onClick={() => setPickMaterials(true)}><BookOpen /> חומרים{materialIds.length ? ` (${materialIds.length})` : ""}</Button>
          </div>
          <p className="text-xs text-muted-foreground">{MODE_HINT[cur.mode]}</p>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3 sm:p-4" role="log" aria-live="polite" aria-label="הודעות">
          {ai.loaded && !ai.configured && <AiUnavailable />}
          {empty ? (
            <EmptyState
              icon={<Lightbulb />}
              title={cur.mode === "explain" ? "במה אפשר לעזור?" : cur.mode === "practice" ? "מוכנים לתרגל?" : "מוכנים למבחן?"}
              description={subject ? `${subject.name}${cur.topic ? ` · ${cur.topic}` : ""}. כתוב שאלה, או התחל מיד.` : "בחר מקצוע ונושא, או פשוט כתוב שאלה בכל מקצוע."}
              action={ai.configured && (
                <div className="flex flex-col items-center gap-3">
                  <Button variant="gradient" onClick={startPreset}>{cur.mode === "explain" ? "הסבר לי את הנושא" : cur.mode === "practice" ? "התחל תרגול" : "התחל מבחן קצר"}</Button>
                  {!cur.topic && topics.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2" aria-label="נושאים מוצעים">
                      {topics.slice(0, 5).map((t) => (
                        <button key={t.id} type="button" className="rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-semibold hover:bg-muted" onClick={() => { update({ topic: t.name }); void send(cur.mode === "practice" ? `התחל תרגול בנושא: ${t.name}. שאל אותי שאלה אחת.` : cur.mode === "exam" ? `התחל מבחן קצר של 5 שאלות בנושא: ${t.name}.` : `הסבר לי את הנושא: ${t.name}`); }}>{t.name}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            />
          ) : (
            <>
              {messages.map((m, i) => <MessageBubble key={m.id} m={m} materials={data.studyMaterials} onRetry={m.isError && i === messages.length - 1 ? retry : undefined} />)}
              {streaming && streaming.convId === activeId && (streaming.text ? (
                <div className="flex gap-3" data-testid="msg-streaming">
                  <span className="mt-1 size-8 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent" aria-hidden />
                  <div className="max-w-[88%] rounded-2xl rounded-ts-sm border bg-card px-4 py-3 sm:max-w-[80%]"><Markdown>{stripPartialTag(streaming.text)}</Markdown></div>
                </div>
              ) : <TypingBubble />)}
              {pending && !streaming && <TypingBubble />}
            </>
          )}
          <div ref={endRef} />
        </div>

        {!empty && !pending && !lastIsError && ai.configured && (
          <div className="flex gap-2 overflow-x-auto border-t px-3 py-2 no-scrollbar" aria-label="פעולות מהירות">
            {QUICK.map((q) => (
              <button key={q.label} type="button" className="shrink-0 rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-semibold hover:bg-muted" onClick={() => q.label === "בדוק את הפתרון שלי" ? (setInput(q.text), taRef.current?.focus()) : void send(q.text)}>
                {q.label}
              </button>
            ))}
          </div>
        )}

        <form className="border-t p-3" onSubmit={(e) => { e.preventDefault(); if (canSend) void send(input); }}>
          {(images.length > 0 || materialIds.length > 0) && (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {images.map((f, i) => <ImagePreview key={i} file={f} onRemove={() => setImages(images.filter((_, j) => j !== i))} />)}
              {materialIds.map((id) => <span key={id} className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2 py-1 text-xs font-semibold">📎 {data.studyMaterials.find((m) => m.id === id)?.title}<button type="button" aria-label="הסר חומר" onClick={() => setMaterialIds(materialIds.filter((x) => x !== id))}><X className="size-3" /></button></span>)}
            </div>
          )}
          <div className="flex items-end gap-2">
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => void addImages(e.target.files)} aria-label="צירוף תמונה" />
            <Button type="button" variant="outline" size="icon" aria-label="צרף תמונה" onClick={() => fileRef.current?.click()} disabled={!ai.configured || ai.vision === false} title={ai.vision === false ? "המודל המחובר אינו תומך בתמונות" : undefined}><ImagePlus /></Button>
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (canSend) void send(input); } }}
              placeholder={ai.configured ? (cur.mode === "exam" ? "כתוב את תשובתך…" : "כתוב שאלה או תשובה… (Enter לשליחה, Shift+Enter לשורה חדשה)") : "המורה AI לא מחובר עדיין"}
              aria-label="הודעה למורה"
              rows={1}
              maxLength={8000}
              disabled={!ai.configured}
              dir="auto"
              className="max-h-40 min-h-11 flex-1 resize-none rounded-md border border-input bg-card px-3 py-2.5 text-[15px] leading-6 disabled:opacity-60"
            />
            {pending ? (
              <Button type="button" variant="destructive" size="icon" aria-label="עצור תשובה" onClick={() => abortRef.current?.abort()}><Square /></Button>
            ) : (
              <Button type="submit" variant="gradient" size="icon" aria-label="שלח" disabled={!canSend}><Send className="rtl:-scale-x-100" /></Button>
            )}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Paperclip className="size-3" aria-hidden />המורה AI יכול לטעות. כדאי לבדוק תשובות חשובות מול הספר או המורה בכיתה.</p>
        </form>
      </section>

      <Dialog open={showHistory} onOpenChange={setShowHistory} title="היסטוריית שיחות" side="sheet"><div className="h-[60dvh]">{list}</div></Dialog>
      <MaterialPicker open={pickMaterials} onOpenChange={setPickMaterials} materials={librarySelectable} selected={materialIds} onChange={setMaterialIds} />
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title={`למחוק את השיחה "${deleting?.title}"?`} description="כל ההודעות בשיחה יימחקו." onConfirm={() => { if (deleting) { act.removeConversation(deleting.id); if (deleting.id === activeId) newConversation(); toast.info("השיחה נמחקה"); } }} />
    </div>
  );
}

function ImagePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return (
    <span className="relative inline-block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && <img src={url} alt="תמונה מצורפת" className="size-14 rounded-lg border object-cover" />}
      <button type="button" aria-label="הסר תמונה" onClick={onRemove} className="absolute -end-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"><X className="size-3" /></button>
    </span>
  );
}
