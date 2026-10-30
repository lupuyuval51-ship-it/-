/**
 * Animation QA gate. Usage: tsx scripts/animation-qa.ts [--write] [--verbose]
 * Measures ROM, IK reach, loop pops, penetration and motion uniqueness for every built-in
 * exercise animation and writes reports/animation-coverage.md.
 * Fails on any finding that is not an exercise marked `draft`/`blocked` in the manifest,
 * and on any `verified` exercise that has findings.
 */
import fs from 'node:fs';
import path from 'node:path';
import { EXERCISE_LIBRARY } from '../server/src/data/exercises/index';
import { ANIMATIONS } from '../shared/animation/data/index';
import { QA_EXCEPTIONS } from '../shared/animation/qa-exceptions';
import { QA_VERSION, ROM_LIMITS, analyzeAnimation, describeKeyframes, similarPairs, visualSignature, type AnimationQa, type QaIssue } from '../shared/animation/qa';
import { getManifestEntry } from '../shared/animation/manifest';
const MANIFEST: Record<string, NonNullable<ReturnType<typeof getManifestEntry>>> = Object.fromEntries([...ANIMATIONS.keys()].map((id) => [id, getManifestEntry(id)!]));

const verbose = process.argv.includes('--verbose');
const only = process.argv.find((a) => a.startsWith('--id='))?.slice(5);
if (only) {
  const a = ANIMATIONS.get(only);
  if (!a) throw new Error(`unknown animation ${only}`);
  console.log(describeKeyframes(a).join('\n'));
  console.log(analyzeAnimation(a, QA_EXCEPTIONS[only] ?? []).issues.map((i) => `! ${i.detail}`).join('\n'));
  process.exit(0);
}
const started = Date.now();
const anims = [...ANIMATIONS.values()];
const byLib = new Map(EXERCISE_LIBRARY.map((e) => [e.id, e]));

const results: AnimationQa[] = anims.map((a) => analyzeAnimation(a, QA_EXCEPTIONS[a.id] ?? []));
const issuesById = new Map<string, QaIssue[]>(results.map((r) => [r.id, [...r.issues]]));

// Uniqueness.
const pairs = similarPairs(anims);
const unresolved: typeof pairs = [];
const documented: (typeof pairs[number] & { differs: string })[] = [];
for (const p of pairs) {
  const A = ANIMATIONS.get(p.a)!;
  const B = ANIMATIONS.get(p.b)!;
  const declared = A.sharedMotionWith?.id === B.id ? A.sharedMotionWith : B.sharedMotionWith?.id === A.id ? B.sharedMotionWith : null;
  if (declared && visualSignature(A) !== visualSignature(B)) documented.push({ ...p, differs: declared.differs });
  else {
    unresolved.push(p);
    const why = declared ? ' (declared sharedMotionWith, but props/view are identical)' : '';
    for (const [id, other] of [[p.a, p.b], [p.b, p.a]] as const) {
      issuesById.get(id)!.push({ check: 'unique', key: 'unique', detail: `motion ${(p.similarity * 100).toFixed(1)}% identical to ${other}${why}` });
    }
  }
}

const BASELINE_FILE = path.join(process.cwd(), 'scripts', 'animation-qa-baseline.json');
const baseline: string[] = fs.existsSync(BASELINE_FILE) ? (JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8')) as { failing: string[] }).failing : [];
const failing = anims.filter((a) => issuesById.get(a.id)!.length > 0);
const count = (check: QaIssue['check']) => failing.reduce((n, a) => n + issuesById.get(a.id)!.filter((i) => i.check === check).length, 0);
const status = (id: string) => MANIFEST[id]?.status ?? 'draft';
const verified = anims.filter((a) => status(a.id) === 'verified');
const problems: string[] = [];
for (const a of anims) {
  const issues = issuesById.get(a.id)!;
  const m = MANIFEST[a.id];
  if (!m && true) problems.push(`${a.id}: missing manifest entry`);
  else if (m && m.status === 'verified' && issues.length) problems.push(`${a.id}: marked verified but has ${issues.length} QA finding(s): ${issues.map((i) => i.detail).join('; ')}`);
  else if (m && m.status === 'verified' && m.qaVersion !== QA_VERSION) problems.push(`${a.id}: verified at qaVersion ${m.qaVersion}, current is ${QA_VERSION}`);
  else if (m && m.status !== 'verified' && !issues.length && m.status === 'blocked') problems.push(`${a.id}: blocked but QA is clean`);
}
// Ratchet: an exercise with findings must already be in the baseline (the list may only shrink).
for (const a of failing) if (!baseline.includes(a.id)) problems.push(`${a.id}: new QA finding(s) not in scripts/animation-qa-baseline.json (run with --id=${a.id}): ${issuesById.get(a.id)!.map((i) => i.detail).join('; ')}`);
const fixed = baseline.filter((id) => !failing.some((a) => a.id === id));
if (process.argv.includes('--update')) {
  fs.writeFileSync(BASELINE_FILE, JSON.stringify({ note: 'Exercises that still have animation QA findings. Only shrink this list (run animation-qa --update after fixing).', failing: failing.map((a) => a.id).sort() }, null, 2) + '\n');
  console.log(`baseline updated: ${failing.length} exercises`);
} else if (fixed.length) problems.push(`baseline lists exercises that are now clean (run \`tsx scripts/animation-qa.ts --update\`): ${fixed.join(', ')}`);
for (const id of Object.keys(MANIFEST)) if (!ANIMATIONS.has(id)) problems.push(`${id}: manifest entry without animation`);

// ---------------------------------------------------------------- report
const lines: string[] = [];
lines.push('# Exercise animation coverage', '');
lines.push(`Generated by \`scripts/animation-qa.ts\` (QA version ${QA_VERSION}). Do not edit by hand.`, '');
lines.push('| | |', '|---|---|');
lines.push(`| Library exercises | ${EXERCISE_LIBRARY.length} |`);
lines.push(`| Animations | ${anims.length} |`);
lines.push(`| Verified (QA clean + contact sheet reviewed) | ${verified.length} |`);
lines.push(`| Draft | ${anims.filter((a) => status(a.id) === 'draft').length} |`);
lines.push(`| Blocked | ${anims.filter((a) => status(a.id) === 'blocked').length} |`);
lines.push(`| Exercises with QA findings | ${failing.length} |`);
lines.push(`| ROM findings | ${count('rom')} |`);
lines.push(`| IK reach findings (> 1.5 units) | ${count('reach')} |`);
lines.push(`| Loop pop findings (> 4x median step) | ${count('pop')} |`);
lines.push(`| Penetration findings | ${count('penetration')} |`);
lines.push(`| Duplicate-motion findings (>= 0.98) | ${count('unique')} |`, '');
lines.push(`Thresholds: knee <= ${ROM_LIMITS.knee.flex}, hip <= ${ROM_LIMITS.hip.flex}, shoulder <= ${ROM_LIMITS.shoulder.flex}, elbow <= ${ROM_LIMITS.elbow.flex} degrees flexion; hyperextension <= ${ROM_LIMITS.knee.ext} (knee, elbow), ${ROM_LIMITS.hip.ext} (hip), ${ROM_LIMITS.shoulder.ext} (shoulder extension). IK reach <= 1.5 units, pop <= 4x median step, penetration <= 1.5 units, motion similarity < 0.98.`, '');
const exc = Object.entries(QA_EXCEPTIONS);
if (exc.length) {
  lines.push('## Documented exceptions', '', '| Exercise | Check | Limit | Reason |', '|---|---|---|---|');
  for (const [id, list] of exc) for (const e of list) lines.push(`| ${id} | ${e.key} | ${e.limit} | ${e.reason} |`);
  lines.push('');
}
if (documented.length) {
  lines.push('## Shared motion (declared)', '', '| Pair | Similarity | Visible difference |', '|---|---|---|');
  for (const d of documented) lines.push(`| ${d.a} / ${d.b} | ${(d.similarity * 100).toFixed(1)}% | ${d.differs} |`);
  lines.push('');
}
lines.push('## Findings', '');
if (!failing.length) lines.push('None.', '');
else {
  lines.push('| Exercise | Status | Findings |', '|---|---|---|');
  for (const a of failing) lines.push(`| ${a.id} | ${status(a.id)} | ${issuesById.get(a.id)!.map((i) => i.detail).join('<br>')} |`);
  lines.push('');
}
lines.push('## All exercises', '', '| Exercise | Name | View | Status | Knee | Hip | Shoulder | Elbow | Reach | Pop | Pen |', '|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of results) {
  const n = byLib.get(r.id)?.name.en ?? '?';
  const f = (k: keyof AnimationQa['rom']) => `${r.rom[k].maxFlex.toFixed(0)}/${(-r.rom[k].maxExt).toFixed(0)}`;
  lines.push(`| ${r.id} | ${n} | ${r.view} | ${status(r.id)} | ${f('knee')} | ${f('hip')} | ${f('shoulder')} | ${f('elbow')} | ${r.maxReachError.toFixed(1)} | ${r.maxPopRatio.toFixed(1)} | ${r.maxPenetration.toFixed(1)} |`);
}
lines.push('', 'ROM columns show max flexion / max extension in degrees (a negative second value = joint stays flexed).', '');
fs.mkdirSync(path.join(process.cwd(), 'reports'), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), 'reports', 'animation-coverage.md'), lines.join('\n'));

console.log(`animation-qa: ${anims.length} animations, ${verified.length} verified, ${failing.length} with findings (rom ${count('rom')}, reach ${count('reach')}, pop ${count('pop')}, penetration ${count('penetration')}, unique ${count('unique')}) in ${Date.now() - started} ms`);
if (verbose) for (const a of failing) console.log(`  ${a.id} [${status(a.id)}]\n    ${issuesById.get(a.id)!.map((i) => i.detail).join('\n    ')}`);
if (problems.length) {
  console.error('animation-qa FAILED:\n  ' + problems.join('\n  '));
  process.exit(1);
}
