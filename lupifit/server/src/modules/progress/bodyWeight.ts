/**
 * Body-weight log. One entry per calendar day (upsert by date). The most recent entry is
 * the user's current weight: it is mirrored into `profiles.weight_kg` and the computed
 * nutrition targets are re-synced.
 */
import { addDays } from '@shared/dates';
import type { BodyWeightInput } from '@shared/schemas/progress';
import type { BodyWeightEntryDTO, RewardResultDTO } from '@shared/types';
import type { Sql } from '../../db/pool';
import { notFound, unprocessable } from '../../lib/errors';
import { onBodyWeightLogged } from '../gamification/hooks';
import { enforceCustomTargetSafety, syncStoredTargets } from '../profile/repository';
import type { UserContext } from './data';

interface EntryRow {
  id: string;
  measured_on: string;
  weight_kg: number;
  note: string;
}

const toDTO = (r: EntryRow): BodyWeightEntryDTO => ({ id: r.id, date: r.measured_on, weightKg: Number(r.weight_kg), note: r.note });

export async function listBodyWeight(sql: Sql, ctx: UserContext, period: number): Promise<BodyWeightEntryDTO[]> {
  const rows = await sql.many<EntryRow>(
    `SELECT id, measured_on, weight_kg, note FROM body_weight_entries
      WHERE user_id = $1 AND measured_on BETWEEN $2 AND $3 ORDER BY measured_on`,
    [ctx.userId, addDays(ctx.today, -(period - 1)), ctx.today],
  );
  return rows.map(toDTO);
}

/** Serializes body-weight writes per user (the profile row is the lock). */
async function lockProfile(tx: Sql, userId: string) {
  await tx.exec('INSERT INTO profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [userId]);
  await tx.one('SELECT user_id FROM profiles WHERE user_id = $1 FOR UPDATE', [userId]);
}

/**
 * Mirrors the latest entry into the profile and recomputes stored targets. Like a weight
 * change on the profile page, custom targets that are no longer safe for the new weight
 * (below the calorie minimum / protein minimum) are replaced by the computed ones.
 */
async function syncProfileWeight(tx: Sql, userId: string) {
  const latest = await tx.maybeOne<{ weight_kg: number }>(
    'SELECT weight_kg FROM body_weight_entries WHERE user_id = $1 ORDER BY measured_on DESC LIMIT 1',
    [userId],
  );
  if (!latest) return;
  await tx.exec('UPDATE profiles SET weight_kg = $2 WHERE user_id = $1 AND weight_kg IS DISTINCT FROM $2', [userId, latest.weight_kg]);
  await enforceCustomTargetSafety(tx, userId);
  await syncStoredTargets(tx, userId);
}

export async function logBodyWeight(
  tx: Sql,
  ctx: UserContext,
  input: BodyWeightInput,
): Promise<{ entry: BodyWeightEntryDTO; created: boolean; rewards: RewardResultDTO }> {
  if (input.date > ctx.today) throw unprocessable('future_date', 'Body weight cannot be logged for a future date');
  await lockProfile(tx, ctx.userId);
  const row = await tx.one<EntryRow & { inserted: boolean }>(
    `INSERT INTO body_weight_entries (user_id, measured_on, weight_kg, note) VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, measured_on) DO UPDATE SET weight_kg = EXCLUDED.weight_kg, note = EXCLUDED.note
     RETURNING id, measured_on, weight_kg, note, (xmax = 0) AS inserted`,
    [ctx.userId, input.date, input.weightKg, input.note],
  );
  const newer = await tx.maybeOne('SELECT 1 FROM body_weight_entries WHERE user_id = $1 AND measured_on > $2 LIMIT 1', [ctx.userId, input.date]);
  if (!newer) await syncProfileWeight(tx, ctx.userId);
  const rewards = await onBodyWeightLogged(tx, { userId: ctx.userId, date: input.date });
  return { entry: toDTO(row), created: row.inserted, rewards };
}

export async function deleteBodyWeight(tx: Sql, ctx: UserContext, id: string): Promise<void> {
  await lockProfile(tx, ctx.userId);
  const deleted = await tx.maybeOne<{ measured_on: string }>(
    'DELETE FROM body_weight_entries WHERE id = $1 AND user_id = $2 RETURNING measured_on',
    [id, ctx.userId],
  );
  if (!deleted) throw notFound('body_weight_not_found');
  const newer = await tx.maybeOne('SELECT 1 FROM body_weight_entries WHERE user_id = $1 AND measured_on > $2 LIMIT 1', [ctx.userId, deleted.measured_on]);
  if (!newer) await syncProfileWeight(tx, ctx.userId);
}
