import { useId } from "react";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  // מזהה ייחודי לכל מופע: אחרת הגרדיאנט נשבר כשהמופע הראשון מוסתר (display:none)
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 48 48" className={cn("size-9", className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill={`url(#${id})`} />
      <path d="M15 12v18c0 3 2 5 5 5h13" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="33" cy="15" r="3.2" fill="#fff" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="leading-none">
        <span className="block text-lg font-extrabold tracking-tight">LUPU</span>{" "}
        <span className="block text-[11px] font-semibold tracking-widest text-muted-foreground">STUDY AI</span>
      </span>
    </span>
  );
}
