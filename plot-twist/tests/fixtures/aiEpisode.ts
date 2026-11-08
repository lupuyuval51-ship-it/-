import { adventureToAiEpisode, type AiEpisode } from '../../shared/aiEpisode.ts';
import exemplar from '../../src/content/adventures/undercover-tourist.ts';

/**
 * A valid AI-shape episode for tests and the mock provider, derived from the
 * exemplar with a distinct title, and stage minutes scaled to `minutes`.
 */
export function mockAiEpisode(minutes = 30): AiEpisode {
  const base = adventureToAiEpisode(exemplar);
  if (!base) throw new Error('exemplar is not canonical');
  const ep: AiEpisode = structuredClone(base);
  ep.title = 'The Borrowed Postcard';
  ep.tagline = 'Someone mailed your street a postcard. It is addressed to you.';
  ep.narrator = 'The AI Director';
  const longest = Math.max(
    ep.stage1.minutes + ep.pathA.stage2.minutes + ep.pathA.stage3.minutes,
    ep.stage1.minutes + ep.pathB.stage2.minutes + ep.pathB.stage3.minutes,
  );
  const factor = Math.min(1, (minutes * 0.9) / longest);
  for (const s of [ep.stage1, ep.pathA.stage2, ep.pathA.stage3, ep.pathB.stage2, ep.pathB.stage3]) {
    s.minutes = Math.max(1, Math.floor(s.minutes * factor));
  }
  return ep;
}
