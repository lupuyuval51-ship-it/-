/**
 * Exercise catalog access shared by the library, generator, sessions and coach.
 * The catalog is static between deployments, so it is cached in memory after the
 * first load (call `invalidateExerciseCache()` after re-seeding).
 */
import type { Equipment, InjuryArea } from '@shared/constants';
import type { LocalizedList, LocalizedText } from '@shared/content';
import type { ExerciseDetailDTO, ExerciseSummaryDTO, ExerciseUserContext } from '@shared/types';
import { db, type Sql } from '../../db/pool';

export interface ExerciseRecord {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  primaryMuscles: ExerciseSummaryDTO['primaryMuscles'];
  secondaryMuscles: ExerciseSummaryDTO['secondaryMuscles'];
  equipment: Equipment[];
  category: ExerciseSummaryDTO['category'];
  movementPattern: ExerciseSummaryDTO['movementPattern'];
  difficulty: ExerciseSummaryDTO['difficulty'];
  trackingType: ExerciseSummaryDTO['trackingType'];
  unilateral: boolean;
  isCompound: boolean;
  instructions: LocalizedList;
  mistakes: LocalizedList;
  safety: LocalizedList;
  contraindications: InjuryArea[];
  easierAlternatives: string[];
  harderAlternatives: string[];
  loadIncrementKg: number | null;
  media: ExerciseDetailDTO['media'];
}

interface ExerciseRow {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  primary_muscles: ExerciseRecord['primaryMuscles'];
  secondary_muscles: ExerciseRecord['secondaryMuscles'];
  equipment: Equipment[];
  category: ExerciseRecord['category'];
  movement_pattern: ExerciseRecord['movementPattern'];
  difficulty: ExerciseRecord['difficulty'];
  tracking_type: ExerciseRecord['trackingType'];
  unilateral: boolean;
  is_compound: boolean;
  instructions: LocalizedList;
  mistakes: LocalizedList;
  safety: LocalizedList;
  contraindications: InjuryArea[];
  easier_alternatives: string[];
  harder_alternatives: string[];
  load_increment_kg: number | null;
  media_url: string | null;
  media_type: 'video' | 'animation' | 'image' | null;
  media_credit: string | null;
}

function fromRow(r: ExerciseRow): ExerciseRecord {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    primaryMuscles: r.primary_muscles,
    secondaryMuscles: r.secondary_muscles,
    equipment: r.equipment,
    category: r.category,
    movementPattern: r.movement_pattern,
    difficulty: r.difficulty,
    trackingType: r.tracking_type,
    unilateral: r.unilateral,
    isCompound: r.is_compound,
    instructions: r.instructions,
    mistakes: r.mistakes,
    safety: r.safety,
    contraindications: r.contraindications,
    easierAlternatives: r.easier_alternatives,
    harderAlternatives: r.harder_alternatives,
    loadIncrementKg: r.load_increment_kg != null ? Number(r.load_increment_kg) : null,
    media: r.media_url && r.media_type ? { url: r.media_url, type: r.media_type, credit: r.media_credit } : null,
  };
}

interface Catalog {
  list: ExerciseRecord[];
  byId: Map<string, ExerciseRecord>;
}

let cache: Catalog | null = null;
let loading: Promise<Catalog> | null = null;

export function invalidateExerciseCache() {
  cache = null;
  loading = null;
}

async function load(sql: Sql = db): Promise<Catalog> {
  if (cache) return cache;
  loading ??= (async (): Promise<Catalog> => {
    const rows = await sql.many<ExerciseRow>('SELECT * FROM exercises ORDER BY id');
    const list = rows.map(fromRow);
    const catalog: Catalog = { list, byId: new Map(list.map((e) => [e.id, e])) };
    cache = catalog;
    return catalog;
  })().finally(() => {
    loading = null;
  });
  return loading;
}

export async function getAllExercises(): Promise<ExerciseRecord[]> {
  return (await load()).list;
}

export async function getExerciseMap(): Promise<Map<string, ExerciseRecord>> {
  return (await load()).byId;
}

export async function getExercise(id: string): Promise<ExerciseRecord | null> {
  return (await load()).byId.get(id) ?? null;
}

export function toExerciseSummary(e: ExerciseRecord): ExerciseSummaryDTO {
  return {
    id: e.id,
    name: e.name,
    primaryMuscles: e.primaryMuscles,
    secondaryMuscles: e.secondaryMuscles,
    equipment: e.equipment,
    category: e.category,
    movementPattern: e.movementPattern,
    difficulty: e.difficulty,
    trackingType: e.trackingType,
    unilateral: e.unilateral,
    hasMedia: e.media != null,
  };
}

/** Equipment the user lacks for this exercise, and injury areas it conflicts with. */
export function userContextFor(e: ExerciseRecord, userEquipment: Equipment[], injuries: InjuryArea[]): ExerciseUserContext {
  const missingEquipment = e.equipment.filter((q) => !userEquipment.includes(q));
  return {
    hasRequiredEquipment: missingEquipment.length === 0,
    missingEquipment,
    injuryConflicts: e.contraindications.filter((c) => injuries.includes(c)),
  };
}

export function isExerciseSuitable(e: ExerciseRecord, userEquipment: Equipment[], injuries: InjuryArea[]): boolean {
  const ctx = userContextFor(e, userEquipment, injuries);
  return ctx.hasRequiredEquipment && ctx.injuryConflicts.length === 0;
}
