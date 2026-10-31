/**
 * The topics ("tracks") a learner started in the current half-year on this phone (`APP_TRACKS` in config/plans.ts:
 * Free 1, Plus 4, Pro 7). A track is a library topic; starting it again, at any level, is free. Deleting the games of a topic
 * does not remove it from the history, which starts again on 1 January and 1 July (UTC). Course chapters are not counted.
 * Kept on the phone (and in Android's backup) like everything else in this app. Pure over a key/value store.
 */
import { APP_TRACKS, type PlanId } from "../../config/plans";
import { isCourseChapter } from "../game/topics/courses";
import type { KeyValue } from "./billing-state";

const KEY = "levelup.tracks.v1";

/** Start (inclusive) and end (exclusive) of the half-year containing `now`, UTC. */
export function halfYear(now: number): { start: number; end: number } {
  const d = new Date(now);
  const first = d.getUTCMonth() < 6 ? 0 : 6;
  return { start: Date.UTC(d.getUTCFullYear(), first, 1), end: Date.UTC(d.getUTCFullYear(), first + 6, 1) };
}

export interface TrackHistory { start: number; topics: string[] }

export function loadTracks(store: KeyValue, now: number): TrackHistory {
  const { start } = halfYear(now);
  try {
    const raw = store.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as Partial<TrackHistory>) : null;
    if (!s || s.start !== start || !Array.isArray(s.topics)) return { start, topics: [] };
    return { start, topics: [...new Set(s.topics.filter((x): x is string => typeof x === "string"))] };
  } catch {
    return { start, topics: [] };
  }
}

export const counts = (topicId: string): boolean => !isCourseChapter(topicId);

/** May this topic be started now? A topic already in the history always may; a new one needs a free track. */
export function canStartTopic(plan: PlanId, history: TrackHistory, topicId: string): boolean {
  if (!counts(topicId) || history.topics.includes(topicId)) return true;
  return history.topics.length < APP_TRACKS[plan];
}

/** Adds the topic to this half-year's history (once). */
export function recordTopic(store: KeyValue, topicId: string, now: number): void {
  if (!counts(topicId)) return;
  const h = loadTracks(store, now);
  if (h.topics.includes(topicId)) return;
  h.topics.push(topicId);
  try { store.setItem(KEY, JSON.stringify(h)); } catch { /* optional */ }
}

export function tracksLeft(plan: PlanId, history: TrackHistory): number {
  return Math.max(0, APP_TRACKS[plan] - history.topics.length);
}
