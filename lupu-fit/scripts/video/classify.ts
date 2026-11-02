/** Maps an exercise to a motion program. Rules are ordered, specific first; unmatched exercises fall back by pattern. */
import type { ExerciseContent } from '../../shared/src/content/types.ts';
import * as M from './motions.ts';
import * as N from './motions2.ts';
import type { Motion } from './motions.ts';

export type ClipMode = 'rep' | 'cycle' | 'hold' | 'stretch';
export type Fidelity = 'specific' | 'approximate' | 'generic';
export interface Plan { motion: Motion; mode: ClipMode; fidelity: Fidelity; rule: string }

type Rule = [string, RegExp, (id: string) => Motion, ClipMode, Fidelity];
const has = (id: string, w: string): boolean => id.includes(w);
const impOf = (id: string): M.Implement => (has(id, 'barbell') || has(id, 'ez_bar') ? 'barbell' : has(id, 'kettlebell') ? 'kettlebell' : has(id, 'band') ? 'band' : has(id, 'cable') ? 'cable' : has(id, 'dumbbell') ? 'dumbbell' : 'none');

const RULES: Rule[] = [
  // ---- core
  ['hang_knee', /hanging_knee_raise/, () => N.hangRaise(true), 'rep', 'specific'],
  ['hang_leg', /hanging_leg_raise|toes_to_bar/, () => N.hangRaise(false), 'rep', 'specific'],
  ['ab_wheel', /ab_wheel/, () => N.rollout(true), 'rep', 'specific'],
  ['nordic', /nordic/, () => N.rollout(false, true), 'rep', 'specific'],
  ['reverse_crunch', /reverse_crunch/, () => M.crunch('reverse'), 'rep', 'specific'],
  ['crunch_plain', /^crunch$/, () => M.crunch('crunch'), 'rep', 'specific'],
  ['crunch', /(^|_)crunch$|cable_crunch|swiss_ball_crunch|^oblique_crunch/, () => M.crunch('crunch'), 'rep', 'approximate'],
  ['situp', /sit_up/, () => M.crunch('situp'), 'rep', 'specific'],
  ['vup', /^v_up/, () => M.crunch('vup'), 'rep', 'specific'],
  ['leg_raise', /lying_leg_raise/, () => M.crunch('legraise'), 'rep', 'specific'],
  ['dead_bug', /dead_bug/, () => M.crunch('deadbug'), 'rep', 'specific'],
  ['hollow_hold', /hollow_body_hold/, () => M.crunch('hollow'), 'hold', 'specific'],
  ['hollow_rock', /hollow_body_rock/, () => M.crunch('hollowRock'), 'rep', 'specific'],
  ['flutter', /flutter_kick/, () => N.kicks('flutter'), 'cycle', 'specific'],
  ['scissor', /scissor_kick/, () => N.kicks('scissor'), 'cycle', 'specific'],
  ['wipers', /windshield/, () => N.wipers(), 'rep', 'approximate'],
  ['heel_touch', /heel_touch|bicycle/, () => M.crunch('bicycle'), 'cycle', 'approximate'],
  ['russian', /russian_twist/, () => M.russianTwist(), 'rep', 'approximate'],
  ['side_plank_knee', /side_plank_knee/, () => N.sidePlank('knee'), 'hold', 'specific'],
  ['side_plank_dip', /side_plank_hip_dip/, () => N.sidePlank('dip'), 'rep', 'specific'],
  ['side_plank_lift', /side_plank_leg_lift/, () => N.sidePlank('lift'), 'rep', 'specific'],
  ['side_plank', /side_plank/, () => N.sidePlank('plain'), 'hold', 'specific'],
  ['plank_taps', /plank_shoulder_tap/, () => N.plankTap('taps'), 'rep', 'specific'],
  ['plank_lift', /plank_leg_lift/, () => N.plankTap('legLift'), 'rep', 'specific'],
  ['plank_forearm', /forearm_plank|rkc_plank|long_lever_plank/, () => M.plank('forearm'), 'hold', 'specific'],
  ['plank_high', /high_plank/, () => M.plank('high'), 'hold', 'specific'],
  ['bear_hold', /bear_crawl_hold|^bear_crawl/, () => N.quadruped('bear'), 'hold', 'specific'],
  ['bird_dog', /bird_dog/, () => M.birdDog(), 'rep', 'specific'],
  ['v_sit', /v_sit/, () => N.lSit(true), 'hold', 'specific'],
  ['l_sit', /l_sit/, () => N.lSit(false), 'hold', 'specific'],
  ['pallof', /pallof/, (id) => M.palloff(impOf(id)), 'rep', 'specific'],
  ['wood_chop', /wood_chop/, (id) => M.woodChop(impOf(id)), 'rep', 'specific'],
  ['side_bend', /side_bend/, () => N.sideBend(), 'rep', 'specific'],
  // ---- legs
  ['wall_sit', /wall_sit/, () => M.wallSit, 'hold', 'specific'],
  ['sissy', /sissy_squat/, () => N.sissySquat(), 'rep', 'specific'],
  ['assisted_pistol', /assisted_pistol/, () => M.squat({ load: 'none', single: true, assist: true, depth: 0.3 }), 'rep', 'specific'],
  ['shrimp', /shrimp_squat/, () => M.squat({ load: 'none', shrimp: true, depth: 0.27 }), 'rep', 'specific'],
  ['pistol', /pistol/, () => M.squat({ load: 'none', single: true, depth: 0.27 }), 'rep', 'specific'],
  ['bulgarian', /bulgarian/, (id) => M.lunge({ kind: 'bulgarian', imp: impOf(id) }), 'rep', 'specific'],
  ['step_up', /step_up/, () => M.lunge({ kind: 'stepup', imp: 'none' }), 'rep', 'specific'],
  ['lateral_lunge', /lateral_lunge/, () => N.lateral('lunge'), 'rep', 'specific'],
  ['cossack', /cossack/, () => N.lateral('cossack'), 'rep', 'specific'],
  ['lunge', /lunge|split_squat/, (id) => M.lunge({ kind: has(id, 'reverse') ? 'reverse' : 'forward', imp: impOf(id) }), 'rep', 'specific'],
  ['box_squat', /box_squat/, () => M.squat({ load: 'none', box: 0.3, depth: 0.31 }), 'rep', 'specific'],
  ['goblet', /goblet|sumo_dumbbell_squat/, (id) => M.squat({ load: 'goblet', imp: has(id, 'kettlebell') ? 'kettlebell' : 'dumbbell' }), 'rep', 'specific'],
  ['front_squat', /front_squat/, () => M.squat({ load: 'front' }), 'rep', 'specific'],
  ['back_squat', /back_squat|smith_machine_squat/, () => M.squat({ load: 'back' }), 'rep', 'specific'],
  ['hack_squat', /hack_squat/, () => N.hackSquat(), 'rep', 'specific'],
  ['leg_press', /leg_press/, () => N.legPress(), 'rep', 'specific'],
  ['leg_ext', /leg_extension/, () => N.legExtension(), 'rep', 'specific'],
  ['spanish', /spanish_squat/, () => N.spanishSquat(), 'rep', 'specific'],
  ['squat', /(^|_)squat$|tempo_squat|air_squat/, () => M.squat({ load: 'none' }), 'rep', 'specific'],
  ['hip_thrust', /hip_thrust/, (id) => M.bridge(true, has(id, 'barbell') ? 'barbell' : 'none'), 'rep', 'specific'],
  ['sl_bridge', /single_leg_glute_bridge/, () => M.bridge(false, 'none', { single: true }), 'rep', 'specific'],
  ['elev_bridge', /feet_elevated_glute_bridge/, () => M.bridge(false, 'none', { elevated: true }), 'rep', 'specific'],
  ['band_bridge', /banded_glute_bridge/, () => M.bridge(false, 'none', { band: true }), 'rep', 'specific'],
  ['ham_bridge', /swiss_ball_hamstring|slider_hamstring/, () => N.hamBridge(), 'rep', 'specific'],
  ['glute_bridge', /glute_bridge/, () => M.bridge(false, 'none'), 'rep', 'specific'],
  ['sl_rdl', /single_leg_rdl|single_leg_romanian/, () => M.hinge({ imp: 'none', bodyweight: true, singleLeg: true, bend: 82 }), 'rep', 'specific'],
  ['sumo', /sumo_deadlift/, () => M.hinge({ imp: 'barbell', fromFloor: true, sumo: true }), 'rep', 'specific'],
  ['deadlift', /conventional_deadlift|(^|_)deadlift$/, () => M.hinge({ imp: 'barbell', fromFloor: true }), 'rep', 'specific'],
  ['rdl', /romanian_deadlift|stiff_leg/, (id) => M.hinge({ imp: impOf(id) === 'none' ? 'barbell' : impOf(id) }), 'rep', 'specific'],
  ['pull_through', /pull_through/, () => N.pullThrough(), 'rep', 'specific'],
  ['lying_curl', /lying_leg_curl/, () => N.lyingCurl(true), 'rep', 'specific'],
  ['donkey', /donkey_kick|glute_kickback/, () => N.quadruped('donkey'), 'rep', 'specific'],
  ['clamshell', /fire_hydrant|clamshell/, () => N.sideLying('clam'), 'rep', 'approximate'],
  ['side_leg_raise', /side_lying_leg_raise/, () => N.sideLying('top'), 'rep', 'specific'],
  ['adductor_raise', /side_lying_adductor/, () => N.sideLying('bottom'), 'rep', 'specific'],
  ['lateral_walk', /lateral_walk/, () => N.lateralWalk(), 'cycle', 'specific'],
  ['hip_abd_machine', /hip_abduction_machine|hip_adduction_machine/, () => N.sideLying('top'), 'rep', 'approximate'],
  ['seated_calf', /seated_calf/, () => N.legExtension(true), 'rep', 'specific'],
  ['tibialis', /tibialis/, () => N.tibialis(), 'rep', 'specific'],
  ['calf', /calf_raise/, (id) => M.calfRaise(impOf(id), has(id, 'single')), 'rep', 'specific'],
  // ---- chest / push
  ['ring_pu', /ring_push_up/, () => M.pushUp({ handH: 0.24, prop: 'rings' }), 'rep', 'specific'],
  ['parallette_pu', /parallette/, () => M.pushUp({ handH: 0.16, prop: 'blocks', deep: true }), 'rep', 'specific'],
  ['pike_press', /pike_push_up|elevated_pike/, () => N.pike(true), 'rep', 'specific'],
  ['pike_hold', /pike_hold/, () => N.pike(false), 'hold', 'specific'],
  ['hspu', /handstand_push_up/, () => N.handstand(true), 'rep', 'specific'],
  ['handstand', /wall_handstand_hold|wall_walk/, () => N.handstand(false), 'hold', 'approximate'],
  ['knee_pu', /knee_push_up|knee_diamond/, () => M.pushUp({ kneel: true }), 'rep', 'specific'],
  ['wall_pu', /wall_push_up|wall_triceps/, () => M.pushUp({ wall: true }), 'rep', 'specific'],
  ['incline_pu', /incline_push_up/, () => M.pushUp({ handH: 0.45 }), 'rep', 'specific'],
  ['decline_pu', /decline_push_up/, () => M.pushUp({ footH: 0.4 }), 'rep', 'specific'],
  ['wide_pu', /archer_push_up|wide_push_up|pseudo_planche/, () => M.pushUp({ wide: true }), 'rep', 'approximate'],
  ['push_up', /push_up/, () => M.pushUp({}), 'rep', 'specific'],
  ['bench_dip', /bench_dip/, () => M.benchDip(), 'rep', 'specific'],
  ['dip', /dip(_|$)|chest_dip|parallel_bar_dip/, () => M.dip(true), 'rep', 'specific'],
  ['incline_press', /incline.*(press|bench)/, (id) => M.benchPress({ imp: has(id, 'dumbbell') ? 'dumbbell' : 'barbell', incline: 32 }), 'rep', 'specific'],
  ['floor_press', /floor_(dumbbell_)?(triceps_)?press|floor_press/, () => M.benchPress({ imp: 'dumbbell', floor: true }), 'rep', 'specific'],
  ['skull', /skull_crusher/, () => M.skullCrusher(), 'rep', 'specific'],
  ['fly_bench', /dumbbell_fly|^fly$/, () => M.benchPress({ imp: 'dumbbell', fly: true }), 'rep', 'approximate'],
  ['cable_fly', /cable_fly|crossover|band_chest_fly/, (id) => N.standingFly(has(id, 'band') ? 'band' : 'cable', has(id, 'low_to_high'), has(id, 'high_to_low')), 'rep', 'specific'],
  ['machine_press', /machine_chest_press|band_chest_press/, (id) => N.machinePress(has(id, 'band'), has(id, 'band') ? 'band' : 'none'), 'rep', 'specific'],
  ['pec_deck', /pec_deck/, (id) => N.machinePress(false, 'none'), 'rep', 'approximate'],
  ['bench_press', /bench_press|dumbbell_press|svend/, (id) => M.benchPress({ imp: has(id, 'dumbbell') || has(id, 'svend') ? 'dumbbell' : 'barbell' }), 'rep', 'specific'],
  // ---- shoulders
  ['machine_sh_press', /machine_shoulder_press/, () => M.press({ imp: 'none', seated: true }), 'rep', 'specific'],
  ['seated_press', /seated_dumbbell_shoulder|arnold/, () => M.press({ imp: 'dumbbell', seated: true }), 'rep', 'specific'],
  ['kb_press', /kettlebell_overhead|bottoms_up/, () => M.press({ imp: 'kettlebell' }), 'rep', 'specific'],
  ['ohp', /overhead_press|push_press|landmine_press/, (id) => M.press({ imp: has(id, 'landmine') ? 'barbell' : 'barbell' }), 'rep', 'specific'],
  ['lat_raise', /lateral_raise/, () => M.lateralRaise('dumbbell'), 'rep', 'specific'],
  ['front_raise', /front_raise|scaption/, (id) => M.frontRaise(has(id, 'band') ? 'none' : 'dumbbell'), 'rep', 'specific'],
  ['upright', /upright_row|cuban/, (id) => M.upright(has(id, 'dumbbell') ? 'dumbbell' : 'barbell'), 'rep', 'approximate'],
  ['rear_fly', /rear_delt|reverse_pec_deck/, (id) => M.rearFly(has(id, 'cable') ? 'cable' : has(id, 'machine') || has(id, 'pec') ? 'none' : 'dumbbell'), 'rep', 'approximate'],
  ['pull_apart', /pull_apart/, () => N.armsFront('pullApart'), 'rep', 'specific'],
  ['ext_rot', /external_rotation/, () => N.armsFront('extRot'), 'rep', 'specific'],
  ['wall_angel', /wall_angel/, () => N.wallAngel(false), 'rep', 'specific'],
  ['wall_slide', /wall_slide/, () => N.wallAngel(true), 'rep', 'specific'],
  ['arm_circles', /arm_circles/, () => N.armsFront('circle'), 'cycle', 'approximate'],
  ['shoulder_pass', /pass_through/, () => N.armsFront('shoulderPass'), 'rep', 'approximate'],
  ['prone_y', /prone_y_raise|prone_y$/, () => N.proneRaise('y'), 'rep', 'specific'],
  ['prone_ytw', /prone_ytw|ytw/, () => N.proneRaise('y'), 'rep', 'approximate'],
  ['prone_t', /prone_t/, () => N.proneRaise('t'), 'rep', 'approximate'],
  ['snow_angel', /snow_angel/, () => N.proneRaise('snow'), 'rep', 'approximate'],
  ['superman_pull', /superman_pull|prone_lat|towel_isometric_lat/, () => N.proneRaise('pull'), 'rep', 'approximate'],
  ['superman', /(^|_)superman$/, () => N.proneRaise('superman'), 'rep', 'specific'],
  // ---- back
  ['dead_hang', /dead_hang/, () => M.pullUp({ hang: true }), 'hold', 'specific'],
  ['scap', /scapular_pull/, () => M.pullUp({ scapular: true }), 'rep', 'specific'],
  ['pullup_band', /band_assisted/, () => M.pullUp({ band: true }), 'rep', 'specific'],
  ['pullup', /pull_up|chin_up/, (id) => M.pullUp({ chin: has(id, 'chin_up'), negative: has(id, 'negative') }), 'rep', 'specific'],
  ['pulldown', /pulldown/, (id) => M.pulldown({ imp: has(id, 'band') ? 'band' : 'cable', straightArm: has(id, 'straight_arm') }), 'rep', 'specific'],
  ['inv_row', /inverted_row|trx_row|trx_lat_pull/, () => N.invertedRowAlias(), 'rep', 'specific'],
  ['seated_row', /seated_cable_row/, () => M.rowBent({ imp: 'cable', seated: true }), 'rep', 'specific'],
  ['face_pull', /face_pull/, () => M.rowBent({ imp: 'cable', face: true }), 'rep', 'specific'],
  ['supported_row', /chest_supported/, (id) => M.rowBent({ imp: has(id, 'dumbbell') ? 'dumbbell' : 'barbell', supported: true }), 'rep', 'specific'],
  ['band_row', /band_row/, () => M.rowBent({ imp: 'band' }), 'rep', 'specific'],
  ['row', /row$|_row_|pendlay|t_bar/, (id) => M.rowBent({ imp: impOf(id) === 'none' ? 'barbell' : impOf(id) }), 'rep', 'specific'],
  ['shrug', /shrug/, (id) => M.shrug(has(id, 'barbell') ? 'barbell' : 'dumbbell'), 'rep', 'specific'],
  ['good_morning', /good_morning/, (id) => M.hinge({ imp: has(id, 'barbell') ? 'barbell' : 'none', goodMorning: !has(id, 'bodyweight'), bodyweight: has(id, 'bodyweight'), bend: 72 }), 'rep', 'specific'],
  ['back_ext', /back_extension/, () => N.backExtensionMachine(), 'rep', 'specific'],
  // ---- arms
  ['wrist_curl', /wrist_curl/, (id) => N.wristCurl(has(id, 'reverse')), 'rep', 'specific'],
  ['static_hold', /static_hold/, () => M.shrug('dumbbell'), 'hold', 'specific'],
  ['iso_towel', /towel_isometric_curl/, () => N.isoCurl('towel'), 'hold', 'specific'],
  ['iso_table', /table_isometric_curl/, () => N.isoCurl('table'), 'hold', 'specific'],
  ['iso_curl', /towel_wring/, () => M.curl({ imp: 'none' }), 'hold', 'approximate'],
  ['incline_curl', /incline_dumbbell_curl/, () => M.curl({ imp: 'dumbbell', incline: true }), 'rep', 'specific'],
  ['preacher', /concentration|preacher/, (id) => M.curl({ imp: has(id, 'ez') ? 'barbell' : 'dumbbell', preacher: true, seated: true }), 'rep', 'specific'],
  ['curl', /curl/, (id) => M.curl({ imp: impOf(id) === 'none' ? 'dumbbell' : impOf(id), hammer: has(id, 'hammer') }), 'rep', 'specific'],
  ['tri_overhead', /overhead.*triceps|triceps.*overhead/, (id) => M.tricepsOverhead(has(id, 'cable') ? 'cable' : 'dumbbell'), 'rep', 'specific'],
  ['pushdown', /pushdown/, (id) => M.pushdown(has(id, 'band') ? 'band' : 'cable'), 'rep', 'specific'],
  ['kickback', /kickback/, (id) => M.kickback(has(id, 'cable') ? 'cable' : has(id, 'band') ? 'band' : 'dumbbell'), 'rep', 'specific'],
  ['close_grip_bench', /close_grip_bench/, () => M.benchPress({ imp: 'barbell' }), 'rep', 'specific'],
  // ---- conditioning / full body / mobility
  ['jump_rope', /jump_rope/, () => N.jumpRope(), 'cycle', 'specific'],
  ['mountain', /mountain_climber/, () => N.mountainClimber(), 'cycle', 'specific'],
  ['high_knees_exact', /^high_knees$/, () => N.runInPlace(true), 'cycle', 'specific'],
  ['high_knees', /high_knees|butt_kick|running_in_place|shuttle|sprint/, (id) => N.runInPlace(has(id, 'high')), 'cycle', 'approximate'],
  ['burpee', /burpee/, () => N.burpee(), 'cycle', 'specific'],
  ['jacks', /jumping_jack/, () => M.jumpingJack(), 'cycle', 'specific'],
  ['rower', /rowing_machine|erg/, () => N.rowCycle(), 'cycle', 'specific'],
  ['bike', /bike|cycling/, () => N.bike(), 'cycle', 'specific'],
  ['box_jump', /box_jump/, () => N.boxJump(), 'cycle', 'specific'],
  ['tuck_jump', /tuck_jump/, () => N.jump('tuck'), 'cycle', 'specific'],
  ['broad_jump', /^broad_jump$/, () => N.jump('broad'), 'cycle', 'specific'],
  ['jump', /jump|bound|hop/, () => N.jump('squat'), 'cycle', 'approximate'],
  ['kb_swing', /kettlebell_swing/, () => N.swing('kettlebell'), 'rep', 'specific'],
  ['slam', /slam/, () => N.ballSlam(), 'rep', 'specific'],
  ['thruster', /thruster/, () => N.thruster(), 'rep', 'specific'],
  ['carry', /carry/, (id) => N.carry(has(id, 'kettlebell') ? 'kettlebell' : 'dumbbell', has(id, 'suitcase')), 'cycle', 'specific'],
  ['sled', /sled/, () => N.sledPush(), 'cycle', 'specific'],
  ['inchworm', /inchworm/, () => N.inchworm(), 'rep', 'specific'],
  ['cat_cow', /cat_cow|cat_camel/, () => N.quadruped('cat'), 'rep', 'specific'],
  ['wgs', /world_greatest|hip_flexor|couch/, () => N.mobilityHold('hipFlexor'), 'stretch', 'specific'],
  ['hamstring_stretch', /hamstring_stretch|hamstring_floss/, () => N.mobilityHold('hamstring'), 'stretch', 'specific'],
  ['child', /child/, () => N.mobilityHold('child'), 'stretch', 'specific'],
  ['pigeon', /pigeon|90_90|ninety_ninety|figure_four/, () => N.mobilityHold('pigeon'), 'stretch', 'approximate'],
  ['open_book', /open_book|thoracic_rotation/, () => N.mobilityHold('openBook'), 'stretch', 'specific'],
  ['cobra', /cobra|prone_press_up/, () => N.cobra(), 'stretch', 'specific'],
  ['turkish', /turkish/, () => N.turkishGetUp(), 'cycle', 'approximate'],
  ['thread_needle', /thread_the_needle/, () => N.mobilityHold('openBook'), 'stretch', 'approximate'],
  ['ankle', /ankle_mobility|ankle_rock/, () => N.mobilityHold('ankle'), 'stretch', 'specific'],
  ['foam', /foam_roll|thoracic_extension/, () => N.mobilityHold('foam'), 'stretch', 'approximate'],
];

/** Pattern-level fallback when no id rule matches: honest 'generic' fidelity. */
function fallback(e: ExerciseContent): Plan {
  const imp = (e.equipment.includes('barbell') ? 'barbell' : e.equipment.includes('kettlebell') ? 'kettlebell' : e.equipment.includes('dumbbell') ? 'dumbbell' : 'none') as M.Implement;
  const mk = (motion: Motion, mode: ClipMode = 'rep'): Plan => ({ motion, mode, fidelity: 'generic', rule: `fallback:${e.pattern}` });
  switch (e.pattern) {
    case 'squat': return mk(M.squat({ load: 'none' }));
    case 'hinge': return mk(M.hinge({ imp, bodyweight: imp === 'none' }));
    case 'lunge': return mk(M.lunge({ kind: 'forward', imp }));
    case 'horizontal_push': return mk(M.pushUp({}));
    case 'vertical_push': return mk(M.press({ imp }));
    case 'horizontal_pull': return mk(M.rowBent({ imp }));
    case 'vertical_pull': return mk(M.pullUp({}));
    case 'carry': return mk(N.carry(imp === 'none' ? 'dumbbell' : imp), 'cycle');
    case 'core_flexion': return mk(M.crunch('crunch'));
    case 'core_rotation': return mk(M.russianTwist());
    case 'core_stability': return mk(M.plank('forearm'), 'hold');
    case 'elbow_flexion': return mk(M.curl({ imp: imp === 'none' ? 'dumbbell' : imp }));
    case 'elbow_extension': return mk(M.pushdown('cable'));
    case 'shoulder_raise': return mk(M.lateralRaise('dumbbell'));
    case 'calf_raise': return mk(M.calfRaise(imp));
    case 'hip_abduction': case 'hip_adduction': return mk(N.sideLying('top'));
    case 'jump': return mk(N.jump('squat'), 'cycle');
    case 'locomotion': return mk(N.runInPlace(false), 'cycle');
    case 'mobility': return mk(N.mobilityHold('openBook'), 'stretch');
    case 'stretch': return mk(N.mobilityHold('hamstring'), 'stretch');
  }
}

export function classify(e: ExerciseContent): Plan {
  for (const [rule, re, make, mode, fidelity] of RULES) if (re.test(e.id)) return { motion: make(e.id), mode, fidelity, rule };
  return fallback(e);
}
