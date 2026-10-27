"use client";

import { useEffect, useState } from "react";
import { FileText, X } from "lucide-react";
import { loadFile } from "@/services/data/files";

/** תצוגה ממוזערת של קובץ מצורף שנשמר ב-IndexedDB; לחיצה פותחת אותו בלשונית חדשה */
export function FileChip({ id, onRemove }: { id: string; onRemove?: () => void }) {
  const [info, setInfo] = useState<{ url: string; name: string; type: string } | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let url = "";
    let alive = true;
    loadFile(id)
      .then((b) => {
        if (!alive) return;
        if (!b) return setMissing(true);
        url = URL.createObjectURL(b);
        setInfo({ url, name: (b as File).name || "קובץ", type: b.type });
      })
      .catch(() => alive && setMissing(true));
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id]);

  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-lg border bg-muted/50 p-1.5 pe-2 text-xs">
      {info?.type.startsWith("image/") ? (
        <a href={info.url} target="_blank" rel="noopener noreferrer" aria-label={`פתח ${info.name}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={info.url} alt={info.name} className="size-9 rounded object-cover" />
        </a>
      ) : (
        <FileText className="size-5 text-primary" aria-hidden />
      )}
      {info ? (
        <a href={info.url} target="_blank" rel="noopener noreferrer" className="max-w-[9rem] truncate font-semibold">
          {info.name}
        </a>
      ) : (
        <span className="text-muted-foreground">{missing ? "הקובץ לא זמין במכשיר זה" : "טוען…"}</span>
      )}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label="הסר קובץ" className="text-muted-foreground hover:text-destructive">
          <X className="size-4" />
        </button>
      )}
    </span>
  );
}
