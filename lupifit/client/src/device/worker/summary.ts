/**
 * What a device snapshot holds, for the confirmation before a restore (page) and the result after it
 * (worker). Pure: imported by the page bundle, so it must never import server code.
 */
import type { DeviceSnapshot, RestoreSummary } from './protocol';

export function summarizeSnapshot(snapshot: Pick<DeviceSnapshot, 'tables'>): RestoreSummary {
  const rows = (table: string) => (Array.isArray(snapshot.tables[table]) ? snapshot.tables[table]! : []);
  return {
    plans: rows('workout_plans').length,
    workouts: rows('workout_sessions').filter((s) => s.status === 'completed').length,
    foods: rows('food_log_entries').length,
    weights: rows('body_weight_entries').length,
    coachThreads: rows('coach_threads').length,
  };
}
