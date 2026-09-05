/**
 * XP levels. Cumulative XP required for a level is 50 * level * (level - 1):
 * L1 = 0, L2 = 100, L5 = 1000, L10 = 4500, L20 = 19000, L50 = 122500.
 * Titles come from LEVEL_TITLES in the domain contract; a level keeps the last title reached.
 */
import { LEVEL_TITLES, type Localized } from "@/lib/types";

export const MAX_LEVEL = 99;

export interface LevelInfo {
  level: number;
  title: Localized;
  /** XP earned since the current level started. */
  xpIntoLevel: number;
  /** XP needed to go from the current level to the next one (0 at MAX_LEVEL). */
  xpForNextLevel: number;
  /** 0–100 progress towards the next level (100 at MAX_LEVEL). */
  progressPct: number;
}

export function xpRequiredForLevel(level: number): number {
  const l = Math.max(1, Math.floor(level));
  return 50 * l * (l - 1);
}

export function titleForLevel(level: number): Localized {
  let title = LEVEL_TITLES[0].title;
  for (const entry of LEVEL_TITLES) {
    if (entry.level <= level) title = entry.title;
  }
  return title;
}

export function levelFromXp(totalXp: number): LevelInfo {
  const xp = Number.isFinite(totalXp) ? Math.max(0, Math.floor(totalXp)) : 0;
  // Closed form of 50L(L-1) <= xp, then corrected for rounding.
  let level = Math.floor((1 + Math.sqrt(1 + (4 * xp) / 50)) / 2);
  while (level > 1 && xpRequiredForLevel(level) > xp) level -= 1;
  while (level < MAX_LEVEL && xpRequiredForLevel(level + 1) <= xp) level += 1;
  level = Math.min(MAX_LEVEL, Math.max(1, level));

  const xpIntoLevel = xp - xpRequiredForLevel(level);
  if (level >= MAX_LEVEL) {
    return { level, title: titleForLevel(level), xpIntoLevel, xpForNextLevel: 0, progressPct: 100 };
  }
  const xpForNextLevel = xpRequiredForLevel(level + 1) - xpRequiredForLevel(level);
  const progressPct = Math.min(100, Math.max(0, Math.round((xpIntoLevel / xpForNextLevel) * 100)));
  return { level, title: titleForLevel(level), xpIntoLevel, xpForNextLevel, progressPct };
}
