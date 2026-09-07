"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { BrickWall, Clock, Disc, Grid2x2, Heart, LandPlot, Layers, Repeat, Target, Timer, TrafficCone, User, Users, UsersRound, type LucideIcon } from "lucide-react";
import type { Equipment, Exercise, Participants } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";
import { enumLabel, skillLabel } from "@/i18n/domain";
import { Badge } from "./ui/Badge";
import { IconButton } from "./ui/IconButton";
import { RoleBadge } from "./RoleBadge";

export const EQUIPMENT_ICONS: Record<Equipment, LucideIcon> = {
  disc: Disc,
  discs: Layers,
  cones: TrafficCone,
  target: Target,
  ladder: Grid2x2,
  stopwatch: Timer,
  wall: BrickWall,
  field_lines: LandPlot,
};
export const PARTICIPANT_ICONS: Record<Participants, LucideIcon> = { solo: User, pair: Users, group: UsersRound };

export type ExerciseCardData = Pick<Exercise, "id" | "name" | "category" | "skills" | "roles" | "durationMinutes" | "sets" | "reps" | "participants" | "equipment"> & Partial<Pick<Exercise, "goal" | "intensity">>;

export interface ExerciseCardProps {
  exercise: ExerciseCardData;
  favorite?: boolean;
  /** Called with the exercise id and the next favourite state. */
  onToggleFavorite?: (id: string, next: boolean) => void;
  onClick?: (exercise: ExerciseCardData) => void;
  /** Details link – the title becomes the link and covers the whole card. */
  href?: string;
  /** Hide goal text and secondary meta. */
  compact?: boolean;
  selected?: boolean;
  /** Extra control at the end of the footer (e.g. a "החלפה" button in pickers). */
  action?: ReactNode;
  className?: string;
}

/** Catalog card: name, category + skill tags, duration / sets × reps, roles, participants and equipment icons. */
export function ExerciseCard({ exercise, favorite, onToggleFavorite, onClick, href, compact, selected, action, className }: ExerciseCardProps) {
  const { t, l } = useT();
  const name = l(exercise.name);
  const skills = exercise.skills.slice(0, compact ? 2 : 3);
  const roles = exercise.roles.slice(0, 3);
  const interactive = !!href || !!onClick;
  const cover = "after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none";
  const title = href ? (
    <Link href={href} className={cn("text-start", cover)}>
      {name}
    </Link>
  ) : onClick ? (
    <button type="button" onClick={() => onClick(exercise)} className={cn("text-start", cover)}>
      {name}
    </button>
  ) : (
    name
  );

  return (
    <article
      className={cn(
        "relative flex flex-col gap-3 rounded-lg border bg-surface p-4 shadow-card transition-[border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none",
        selected ? "border-primary ring-2 ring-primary/30" : "border-border",
        interactive && "hover:border-border-strong hover:shadow-raised focus-within:border-border-strong",
        className,
      )}
      aria-current={selected ? "true" : undefined}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-snug text-text">{title}</h3>
          {!compact && exercise.goal && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{l(exercise.goal)}</p>}
        </div>
        {onToggleFavorite && (
          <IconButton
            label={favorite ? t("ui.favorite.remove") : t("ui.favorite.add")}
            icon={<Heart className={cn(favorite && "fill-current")} />}
            pressed={favorite}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(exercise.id, !favorite);
            }}
            className={cn("relative z-10 -me-2 -mt-2", favorite ? "text-accent" : "text-muted")}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge tone="primary" size="sm">{enumLabel(t, "category", exercise.category)}</Badge>
        {skills.map((s) => (
          <Badge key={s} size="sm">{skillLabel(t, s)}</Badge>
        ))}
        {exercise.skills.length > skills.length && <Badge size="sm">+{exercise.skills.length - skills.length}</Badge>}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted [&_svg]:size-4">
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Clock aria-hidden />
          {t("ui.exerciseCard.minutes", { count: exercise.durationMinutes })}
        </span>
        {exercise.sets > 0 && (
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Repeat aria-hidden />
            {exercise.reps > 0 ? t("ui.exerciseCard.setsReps", { sets: exercise.sets, reps: exercise.reps }) : t("ui.exerciseCard.sets", { count: exercise.sets })}
          </span>
        )}
        <span className="inline-flex items-center gap-1" role="list" aria-label={t("domain.kind.participants")}>
          {exercise.participants.map((p) => {
            const Icon = PARTICIPANT_ICONS[p];
            return <Icon key={p} role="listitem" aria-label={enumLabel(t, "participants", p)}><title>{enumLabel(t, "participants", p)}</title></Icon>;
          })}
        </span>
        <span className="inline-flex items-center gap-1" role="list" aria-label={t("domain.kind.equipment")}>
          {exercise.equipment.length === 0 ? (
            <span className="text-xs">{t("ui.exerciseCard.noEquipment")}</span>
          ) : (
            exercise.equipment.map((e) => {
              const Icon = EQUIPMENT_ICONS[e];
              return <Icon key={e} role="listitem" aria-label={enumLabel(t, "equipment", e)}><title>{enumLabel(t, "equipment", e)}</title></Icon>;
            })
          )}
        </span>
      </div>

      {(roles.length > 0 || !compact || action) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {roles.length === 0 ? (
            <span className="text-xs text-muted">{t("ui.exerciseCard.everyone")}</span>
          ) : (
            roles.map((r) => <RoleBadge key={r} role={r} size="sm" />)
          )}
          {exercise.roles.length > roles.length && <Badge size="sm">+{exercise.roles.length - roles.length}</Badge>}
          {action && <span className="relative z-10 ms-auto">{action}</span>}
        </div>
      )}
    </article>
  );
}
