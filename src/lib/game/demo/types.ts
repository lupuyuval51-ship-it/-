import type { Environment, GameType, SubjectCategory, TimeOfDay } from "../spec/constants";
import type { Lang } from "./builders";

export type RawSpec = Record<string, unknown>;

export interface DemoPack {
  id: string;
  category: SubjectCategory;
  /** Matches the user's subject text (English or Hebrew keywords). */
  keywords: RegExp;
  gameType: GameType;
  environment: Environment;
  timeOfDay: TimeOfDay;
  /** One line describing what the fixed demo content actually teaches (shown to the user). */
  topic(lang: Lang): string;
  title(lang: Lang): string;
  tagline(lang: Lang): string;
  /** The Full Adventure content: multiple areas, missions and challenges. */
  build(lang: Lang): { areas: unknown[]; missions: unknown[]; challenges: unknown[]; objectives: { id: string; text: string }[]; conclusion: string; mechanics: string[] };
  /** Pre-written additions used by "Extend Existing Game" in demo mode. */
  extensions(lang: Lang): { areas: unknown[]; missions: unknown[]; challenges: unknown[]; objectives: { id: string; text: string }[]; conclusion?: string; mechanics: string[] }[];
}
