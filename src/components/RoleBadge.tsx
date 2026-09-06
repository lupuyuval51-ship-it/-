"use client";
import { ROLE_LABELS, type Role } from "@/lib/types";
import { useT } from "@/i18n/useT";
import { roleDescription } from "@/i18n/domain";
import { Badge, type BadgeSize, type BadgeTone } from "./ui/Badge";

export const ROLE_TONES: Record<Role, BadgeTone> = {
  handler: "primary",
  cutter: "accent",
  wing: "info",
  runner: "success",
  defender: "danger",
  hybrid: "warning",
  allround: "neutral",
};

export interface RoleBadgeProps {
  role: Role;
  size?: BadgeSize;
  solid?: boolean;
  /** Prefix such as "תפקיד ראשי:" rendered muted before the label. */
  prefix?: string;
  className?: string;
}

/** Coloured role label from ROLE_LABELS; the short role description is exposed as a tooltip. */
export function RoleBadge({ role, size = "md", solid, prefix, className }: RoleBadgeProps) {
  const { t, l } = useT();
  return (
    <Badge tone={ROLE_TONES[role]} size={size} solid={solid} dot={!solid} title={roleDescription(t, role)} className={className}>
      {prefix && <span className="font-normal opacity-80">{prefix}</span>}
      {l(ROLE_LABELS[role])}
    </Badge>
  );
}
