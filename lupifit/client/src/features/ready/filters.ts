/**
 * Pure logic of the ready-workouts tab: which gear each place offers, how saved choices and the profile become
 * the filters, and how filters become API query strings and detail-page links. No React, no I/O.
 */
import {
  DEFAULT_EQUIPMENT_BY_LOCATION,
  DIFFICULTIES,
  EQUIPMENT,
  LOCATIONS,
  READY_FOCUSES,
  SPORTS,
  type Difficulty,
  type Equipment,
  type ReadyFocus,
  type SportId,
  type TrainingLocation,
  type TrainingMode,
} from '@shared/constants';
import type { ProfileDTO } from '@shared/types';
import type { GearPlace, ReadyPrefs } from './prefs';

// Mirrors HOME_GEAR / PARK_GEAR / RESISTANCE_GEAR in server/src/modules/ready/rules.ts (filters.test.ts compares them).
/** Equipment a person can reasonably have at home. */
export const HOME_GEAR: readonly Equipment[] = [
  'dumbbells', 'kettlebell', 'resistance_bands', 'pull_up_bar', 'bench', 'jump_rope', 'ab_wheel', 'suspension_trainer', 'medicine_ball', 'gymnastic_rings',
];
/** Fixed bars of a park / street-workout area plus what can be carried there. */
export const PARK_GEAR: readonly Equipment[] = [
  'pull_up_bar', 'dip_bars', 'bench', 'dumbbells', 'kettlebell', 'resistance_bands', 'jump_rope', 'medicine_ball', 'suspension_trainer', 'gymnastic_rings',
];
/** Gear that makes a workout "weights" rather than "bodyweight". */
export const RESISTANCE_GEAR: readonly Equipment[] = [
  'barbell', 'dumbbells', 'kettlebell', 'ez_bar', 'cable_machine', 'lat_pulldown_machine', 'leg_press_machine', 'leg_curl_machine',
  'leg_extension_machine', 'chest_press_machine', 'smith_machine', 'resistance_bands', 'medicine_ball',
];
/** The gear we ask people to tick for weight workouts at home or in the park. */
export const WEIGHT_GEAR: readonly Equipment[] = ['dumbbells', 'kettlebell', 'resistance_bands'];

/** "Up to N minutes" choices. */
export const LENGTH_OPTIONS = [20, 30, 45, 60] as const;
/** Workouts per page. */
export const READY_PAGE_SIZE = 24;

export const sortGear = (list: readonly Equipment[]): Equipment[] =>
  Array.from(new Set(list)).sort((a, b) => EQUIPMENT.indexOf(a) - EQUIPMENT.indexOf(b));

/** Equipment offered as chips for a place (none at the gym: everything is assumed). */
export const gearOptions = (place: TrainingLocation): readonly Equipment[] => (place === 'home' ? HOME_GEAR : place === 'outdoor' ? PARK_GEAR : []);

export const asGearPlace = (place: TrainingLocation): GearPlace | null => (place === 'gym' ? null : place);

// ---------------------------------------------------------------- Context: where, gear, mode, sport

export interface ReadyContext {
  location: TrainingLocation;
  /** Ticked equipment; always `[]` at the gym (not asked). */
  equipment: Equipment[];
  mode: TrainingMode;
  sport: SportId | null;
}

type ProfileGear = Pick<ProfileDTO, 'trainingLocation' | 'equipment'>;

/** The profile's gear when it was entered for this very place, else the app default for the place; only offered gear. */
export function prefillEquipment(place: TrainingLocation, profile?: ProfileGear | null): Equipment[] {
  const offered = gearOptions(place);
  const source = profile && profile.trainingLocation === place ? profile.equipment : DEFAULT_EQUIPMENT_BY_LOCATION[place];
  return sortGear(source.filter((q) => offered.includes(q)));
}

/** Weights at the gym; elsewhere weights when the starting gear includes dumbbells, a kettlebell or bands. */
export function defaultMode(place: TrainingLocation, prefilled: readonly Equipment[]): TrainingMode {
  return place === 'gym' || prefilled.some((q) => WEIGHT_GEAR.includes(q)) ? 'weights' : 'bodyweight';
}

/** Saved choices over the profile over the app defaults. */
export function resolveContext(prefs: ReadyPrefs, profile?: ProfileGear | null): ReadyContext {
  const location = prefs.location ?? profile?.trainingLocation ?? 'home';
  const prefilled = prefillEquipment(location, profile);
  const gearPlace = asGearPlace(location);
  const offered = gearOptions(location);
  const ticked = gearPlace ? prefs.equipment[gearPlace] : undefined;
  const equipment = gearPlace ? sortGear((ticked ?? prefilled).filter((q) => offered.includes(q))) : [];
  return { location, equipment, mode: prefs.mode ?? defaultMode(location, prefilled), sport: prefs.sport };
}

// ---------------------------------------------------------------- List filters kept in the address (focus, level, length)

export interface ListFilters {
  focus: ReadyFocus | null;
  level: Difficulty | null;
  maxMinutes: number | null;
}

export const NO_LIST_FILTERS: ListFilters = { focus: null, level: null, maxMinutes: null };

export function readListFilters(params: URLSearchParams): ListFilters {
  const max = Number(params.get('max'));
  return {
    focus: READY_FOCUSES.find((f) => f === params.get('focus')) ?? null,
    level: DIFFICULTIES.find((l) => l === params.get('level')) ?? null,
    maxMinutes: LENGTH_OPTIONS.find((n) => n === max) ?? null,
  };
}

/** A copy of `params` with the three filters set (or removed); other parameters such as `tab` stay. */
export function withListFilters(params: URLSearchParams, f: ListFilters): URLSearchParams {
  const next = new URLSearchParams(params);
  const put = (key: string, value: string | null) => (value ? next.set(key, value) : next.delete(key));
  put('focus', f.focus);
  put('level', f.level);
  put('max', f.maxMinutes ? String(f.maxMinutes) : null);
  return next;
}

/** Filters beyond the muscle focus that are switched on (the count on "More filters"). */
export const activeMoreFilters = (f: ListFilters): number => (f.level ? 1 : 0) + (f.maxMinutes ? 1 : 0);

// ---------------------------------------------------------------- API strings

/**
 * Query string of `GET /api/ready-workouts`. The gym sends no equipment; home and park always send it, empty
 * when nothing is ticked (the server reads `equipment=` as "no equipment", while leaving it out means the
 * place's default gear).
 */
export function listSearch(ctx: Pick<ReadyContext, 'location' | 'equipment' | 'mode'>, f: ListFilters, page: number): string {
  const parts = [`location=${ctx.location}`];
  if (ctx.location !== 'gym') parts.push(`equipment=${sortGear(ctx.equipment).join(',')}`);
  parts.push(`mode=${ctx.mode}`);
  if (f.focus) parts.push(`focus=${f.focus}`);
  if (f.level) parts.push(`level=${f.level}`);
  if (f.maxMinutes) parts.push(`maxMinutes=${f.maxMinutes}`);
  parts.push(`page=${page}`, `pageSize=${READY_PAGE_SIZE}`);
  return parts.join('&');
}

/** What a detail page needs to know besides the workout id. `equipment: null` = the place's default gear. */
export interface DetailContext {
  location: TrainingLocation;
  equipment: Equipment[] | null;
  sport: SportId | null;
}

/** `?location=home&equipment=dumbbells,bench&sport=soccer` (parts that do not apply are left out). */
export function detailSearch(ctx: DetailContext): string {
  const parts = [`location=${ctx.location}`];
  if (ctx.location !== 'gym' && ctx.equipment) parts.push(`equipment=${sortGear(ctx.equipment).join(',')}`);
  if (ctx.sport) parts.push(`sport=${ctx.sport}`);
  return `?${parts.join('&')}`;
}

function parseGear(csv: string): Equipment[] {
  return sortGear(csv.split(',').flatMap((x) => EQUIPMENT.filter((q) => q === x.trim())));
}

/** Context of a detail page: the address wins, then the saved choices, then the server's defaults. */
export function readDetailContext(params: URLSearchParams, prefs: ReadyPrefs): DetailContext {
  const location = LOCATIONS.find((l) => l === params.get('location')) ?? prefs.location ?? 'home';
  const gearPlace = asGearPlace(location);
  const fromAddress = params.get('equipment');
  const saved = gearPlace ? prefs.equipment[gearPlace] : undefined;
  const equipment = !gearPlace ? null : fromAddress != null ? parseGear(fromAddress) : saved ? sortGear(saved) : null;
  return { location, equipment, sport: SPORTS.find((s) => s === params.get('sport')) ?? prefs.sport };
}

// ---------------------------------------------------------------- Empty states

export type EmptyKind = 'weights_without_gear' | 'filtered' | 'none';

/** Why the list is empty, so the empty state can say what to change. */
export function emptyKind(ctx: ReadyContext, f: ListFilters): EmptyKind {
  if (ctx.mode === 'weights' && ctx.location !== 'gym' && !ctx.equipment.some((q) => WEIGHT_GEAR.includes(q))) return 'weights_without_gear';
  if (f.focus || f.level || f.maxMinutes) return 'filtered';
  return 'none';
}
