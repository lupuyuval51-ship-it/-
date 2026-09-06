"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { Clock, Dumbbell, Flag, Layers, Play, Zap } from "lucide-react";
import type { Intensity, Workout } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";
import { enumLabel } from "@/i18n/domain";
import { minutesToHuman } from "@/lib/dates";
import { Badge, type BadgeTone } from "./ui/Badge";
import { Button } from "./ui/Button";
import { RoleBadge } from "./RoleBadge";

export const INTENSITY_TONES: Record<Intensity, BadgeTone> = { low: "success", medium: "warning", high: "danger" };

export type WorkoutCardData = Pick<Workout, "id" | "title" | "targetRole" | "totalDurationMinutes" | "intensity" | "tags" | "phases"> &
  Partial<Pick<Workout, "goal" | "secondaryRole" | "participants" | "includesFitness" | "includesChallenge" | "source" | "level">>;

export interface WorkoutCardAction {
  label?: string;
  onClick?: (workout: WorkoutCardData) => void;
  href?: string;
  icon?: ReactNode;
  loading?: boolean;
  variant?: "primary" | "accent" | "secondary";
}

export interface WorkoutCardProps {
  workout: WorkoutCardData;
  /** Details link – the title becomes the link and covers the card. */
  href?: string;
  onClick?: (workout: WorkoutCardData) => void;
  /** Bottom button; defaults to "התחלת אימון". Pass null to hide. */
  primaryAction?: WorkoutCardAction | null;
  secondaryAction?: ReactNode;
  compact?: boolean;
  /** Emphasised border for "next workout" / recommended. */
  highlighted?: boolean;
  className?: string;
}

/** Workout summary: title, role, duration, intensity, phase count, tags and a primary action. */
export function WorkoutCard({ workout, href, onClick, primaryAction, secondaryAction, compact, highlighted, className }: WorkoutCardProps) {
  const { t, l, locale } = useT();
  const title = l(workout.title);
  const cover = "after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none";
  const heading = href ? (
    <Link href={href} className={cn("text-start", cover)}>{title}</Link>
  ) : onClick ? (
    <button type="button" onClick={() => onClick(workout)} className={cn("text-start", cover)}>{title}</button>
  ) : (
    title
  );
  const action = primaryAction === null ? null : primaryAction ?? {};
  const tags = workout.tags.slice(0, compact ? 2 : 4);

  return (
    <article
      className={cn(
        "relative flex flex-col gap-3 rounded-lg border bg-surface p-4 shadow-card transition-[border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none",
        highlighted ? "border-primary" : "border-border",
        (href || onClick) && "hover:border-border-strong hover:shadow-raised focus-within:border-border-strong",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <RoleBadge role={workout.targetRole} size="sm" />
        {workout.secondaryRole && <RoleBadge role={workout.secondaryRole} size="sm" />}
        {workout.source && workout.source !== "library" && <Badge size="sm" tone="neutral">{enumLabel(t, "source", workout.source)}</Badge>}
      </div>
      <div>
        <h3 className={cn("font-bold leading-snug text-text", compact ? "text-base" : "text-lg")}>{heading}</h3>
        {!compact && workout.goal && <p className="mt-1 line-clamp-2 text-sm text-muted">{l(workout.goal)}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted [&_svg]:size-4">
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Clock aria-hidden />
          {minutesToHuman(workout.totalDurationMinutes, locale)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Zap aria-hidden />
          <Badge size="sm" tone={INTENSITY_TONES[workout.intensity]}>{enumLabel(t, "intensityShort", workout.intensity)}</Badge>
        </span>
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Layers aria-hidden />
          {t("ui.workoutCard.phases", { count: workout.phases.length })}
        </span>
        {workout.participants && <span>{enumLabel(t, "participants", workout.participants)}</span>}
      </div>

      {(tags.length > 0 || workout.includesFitness || workout.includesChallenge) && (
        <div className="flex flex-wrap gap-1.5">
          {workout.includesFitness && <Badge size="sm" tone="info" icon={<Dumbbell aria-hidden />}>{t("ui.workoutCard.fitness")}</Badge>}
          {workout.includesChallenge && <Badge size="sm" tone="accent" icon={<Flag aria-hidden />}>{t("ui.workoutCard.challenge")}</Badge>}
          {tags.map((tag) => (
            <Badge key={tag} size="sm">{tag}</Badge>
          ))}
        </div>
      )}

      {(action || secondaryAction) && (
        <div className="relative z-10 mt-1 flex items-center gap-2">
          {action && (
            <Button
              variant={action.variant ?? "accent"}
              size={compact ? "md" : "lg"}
              fullWidth
              href={action.href}
              loading={action.loading}
              icon={action.icon ?? <Play aria-hidden className="rtl:rotate-180" />}
              onClick={action.onClick ? () => action.onClick?.(workout) : undefined}
            >
              {action.label ?? t("ui.workoutCard.start")}
            </Button>
          )}
          {secondaryAction}
        </div>
      )}
    </article>
  );
}
