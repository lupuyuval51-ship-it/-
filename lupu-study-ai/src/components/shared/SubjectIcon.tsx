import type { Subject } from "@/types";
import { colorOf } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

export function SubjectIcon({ subject, size = "md", className }: { subject: Pick<Subject, "icon" | "color"> | null; size?: "sm" | "md" | "lg"; className?: string }) {
  const c = colorOf(subject?.color ?? "violet");
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl ring-1",
        c.bg, c.text, c.ring,
        size === "sm" && "size-8 rounded-lg [&_svg]:size-4",
        size === "md" && "size-10 [&_svg]:size-5",
        size === "lg" && "size-14 rounded-2xl [&_svg]:size-7",
        className,
      )}
    >
      <Icon name={subject?.icon ?? "BookOpen"} />
    </span>
  );
}

export function SubjectChip({ subject }: { subject: Subject | null | undefined }) {
  if (!subject) return null;
  const c = colorOf(subject.color);
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", c.bg, c.text)}>{subject.name}</span>;
}
