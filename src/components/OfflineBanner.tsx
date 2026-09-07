"use client";
import { useEffect, useRef, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";
import { useOnline } from "./hooks/useOnline";

/** Sticky strip shown while offline; briefly confirms when the connection returns. */
export function OfflineBanner({ className }: { className?: string }) {
  const { t } = useT();
  const online = useOnline();
  const wasOffline = useRef(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      return;
    }
    if (!wasOffline.current) return;
    wasOffline.current = false;
    setRestored(true);
    const timer = setTimeout(() => setRestored(false), 2500);
    return () => clearTimeout(timer);
  }, [online]);

  if (online && !restored) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "sticky top-0 z-40 flex items-center justify-center gap-2 px-4 py-2 text-center text-sm font-medium animate-fade-in [&_svg]:size-4 [&_svg]:shrink-0",
        online ? "bg-success-soft text-success" : "bg-warning-soft text-text",
        className,
      )}
    >
      {online ? <Wifi aria-hidden /> : <WifiOff aria-hidden />}
      <span>{online ? t("ui.online.restored") : t("ui.offline.banner")}</span>
    </div>
  );
}
