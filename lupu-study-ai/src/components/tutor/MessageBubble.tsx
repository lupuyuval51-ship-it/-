"use client";

import { useState } from "react";
import { AlertCircle, Check, Copy, RefreshCw, Sparkles, User } from "lucide-react";
import { Markdown } from "@/components/shared/Markdown";
import { FileChip } from "@/components/shared/FileChip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Message, StudyMaterial } from "@/types";

export function MessageBubble({ m, materials, onRetry }: { m: Pick<Message, "role" | "content" | "imageIds" | "citations" | "isError">; materials: StudyMaterial[]; onRetry?: () => void }) {
  const [copied, setCopied] = useState(false);
  const isUser = m.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")} data-testid={isUser ? "msg-user" : m.isError ? "msg-error" : "msg-ai"}>
      <span className={cn("mt-1 flex size-8 shrink-0 items-center justify-center rounded-full", isUser ? "bg-secondary text-secondary-foreground" : "bg-gradient-to-br from-primary to-accent text-primary-foreground")} aria-hidden>
        {isUser ? <User className="size-4" /> : <Sparkles className="size-4" />}
      </span>
      <div className={cn("group max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[80%]", isUser ? "rounded-te-sm bg-primary text-primary-foreground" : m.isError ? "rounded-ts-sm border border-destructive/40 bg-destructive/8" : "rounded-ts-sm border bg-card")}>
        {m.imageIds.length > 0 && <div className="mb-2 flex flex-wrap gap-2">{m.imageIds.map((id) => <FileChip key={id} id={id} />)}</div>}
        {m.isError ? (
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
            <div>
              <p className="font-semibold">{m.content}</p>
              {onRetry && <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}><RefreshCw /> נסה שוב</Button>}
            </div>
          </div>
        ) : isUser ? (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-7" dir="auto">{m.content}</p>
        ) : (
          <Markdown>{m.content}</Markdown>
        )}
        {m.citations.length > 0 && (
          <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">
            מקורות מחומרי הלימוד:{" "}
            {m.citations.map((c, i) => {
              const mat = materials.find((x) => x.id === c.materialId);
              return <span key={i} className="me-2 inline-block rounded bg-muted px-1.5 py-0.5 font-semibold">{mat?.title ?? "חומר שנמחק"}{c.page ? ` · עמ׳ ${c.page}` : ""}</span>;
            })}
          </p>
        )}
        {!isUser && !m.isError && m.content && (
          <button
            type="button"
            aria-label="העתק תשובה"
            onClick={() => { void navigator.clipboard?.writeText(m.content).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
            className="mt-1 flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "הועתק" : "העתק"}
          </button>
        )}
      </div>
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="flex gap-3" role="status" aria-label="המורה כותב">
      <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground"><Sparkles className="size-4" aria-hidden /></span>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-ts-sm border bg-card px-4 py-4">
        {[0, 1, 2].map((i) => <span key={i} className="size-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: `${i * 0.15}s` }} />)}
      </div>
    </div>
  );
}
