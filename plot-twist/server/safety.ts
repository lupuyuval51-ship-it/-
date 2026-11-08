/**
 * Defense-in-depth screen for generated episodes. The system prompt is the main
 * safety mechanism; this catches clear violations so they are repaired or
 * replaced by curated content instead of shown to the user.
 */
import type { Adventure } from '../shared/types.ts';

interface Rule {
  pattern: RegExp;
  reason: string;
}

const RULES: Rule[] = [
  { pattern: /\btrespass/i, reason: 'mentions trespassing' },
  { pattern: /\b(?:train|railway|rail|tram) tracks?\b/i, reason: 'involves rail tracks' },
  { pattern: /\brooftops?\b|\bon(?:to)? the roof\b/i, reason: 'involves a rooftop' },
  { pattern: /\bclimb(?:ing)? (?:up |onto |over )?(?:a |the )?(?:fence|wall|roof|building|scaffold|pole|tree|bridge)/i, reason: 'involves climbing structures' },
  { pattern: /\b(?:middle of|into|onto|stand in|lie (?:down )?(?:in|on)) the (?:road|street|traffic)\b/i, reason: 'involves traffic' },
  { pattern: /\b(?:secretly|covertly|without (?:them|anyone) (?:noticing|knowing)) (?:photograph|film|record|follow)/i, reason: 'involves covert surveillance of people' },
  { pattern: /\b(?:photograph|film|record|video)(?:ing)? (?:a |the |random )?(?:strangers?|passers-?by|people you don't know)\b/i, reason: 'involves recording strangers' },
  { pattern: /\bfollow(?:ing)? (?:a |the )?strangers?\b|\bfollow(?:ing)? (?:someone|a person|people) (?:home|for|down|around|without)\b/i, reason: 'involves following people' },
  { pattern: /\b(?:alcohol|alcoholic|beer|vodka|whisk(?:e)?y|cocktails?|shots of|tequila)\b/i, reason: 'involves alcohol' },
  { pattern: /\b(?:drugs?|weed|cannabis)\b/i, reason: 'involves drugs' },
  { pattern: /\b(?:knife|knives|lighter|box of matches|light a match|bonfire|set (?:it |something )?on fire)\b/i, reason: 'involves fire or blades' },
  { pattern: /\b(?:gamble|gambling|casino|lottery|betting)\b/i, reason: 'involves gambling' },
  { pattern: /\b(?:prank|pranking|pranks)\b/i, reason: 'involves pranks' },
  { pattern: /\bswim(?:ming)?\b|\binto the (?:sea|water|river|lake)\b/i, reason: 'involves water hazards' },
];

function allText(adv: Adventure): string[] {
  const out = [adv.title, adv.tagline, adv.intro, ...adv.items];
  for (const n of adv.nodes) {
    out.push(n.title, n.narrative, n.action, n.alternative);
    if (n.amplify) out.push(n.amplify);
    if (n.crewTip) out.push(n.crewTip);
    if (n.capture) out.push(n.capture.label, n.capture.placeholder);
    if (n.choice) {
      out.push(n.choice.prompt);
      for (const o of n.choice.options) out.push(o.label, o.description);
    }
  }
  for (const e of adv.endings) out.push(e.title, e.twist, e.closingLine);
  return out;
}

/** Returns a list of safety problems ("stage text involves alcohol"), empty when clean. */
export function screenAdventure(adv: Adventure): string[] {
  const problems = new Set<string>();
  for (const text of allText(adv)) {
    for (const rule of RULES) {
      if (rule.pattern.test(text)) problems.add(`Safety: the episode ${rule.reason} ("${text.slice(0, 80)}")`);
    }
  }
  return [...problems];
}
