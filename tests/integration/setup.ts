import { beforeEach } from "vitest";
import { setFeatureTierForTests } from "@/server/games/feature-tier";

// Most suites test generation, play, billing and allowances, not the feature tiers: they run at the fullest tier, so
// they keep creating Full Adventures for their Free test users. tests/integration/feature-tier.test.ts exercises the
// real tiers (it clears this override and uses the plans' own tiers).
beforeEach(() => setFeatureTierForTests("A"));
