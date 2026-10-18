import { beforeEach } from "vitest";
import { setFeatureTierForTests } from "@/server/games/feature-tier";

// Most suites test generation, play, billing and allowances, not the feature tiers: they run at the fullest tier, so
// they keep creating Full Adventures for their Free test users. Every plan then makes only level A games, with the
// plan's largest counted quota as level A's quota (Free 5, Plus 5, Pro 10; `levelQuota` reads it). The tests about the
// real tiers and quotas (feature-tier.test.ts, plans-off.test.ts, parts of allowance.test.ts) clear this override.
beforeEach(() => setFeatureTierForTests("A"));
