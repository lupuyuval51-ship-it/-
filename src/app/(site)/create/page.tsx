import { CreateForm } from "@/components/create/CreateForm";
import { GENERATION_MODES, MECHANICS, type GenerationModeId } from "@/lib/game/spec/constants";
import { getAllowanceSummary } from "@/server/allowance/summary";
import { describeBackend } from "@/server/ai/registry";
import { requireUser } from "@/server/auth/current";
import { FEATURE_TIERS, defaultLevel, featureShare, levelUnlocking, planUnlocking, planUnlockingLevel } from "@/config/plans";
import { levelCost, levelsForPlan, maxLevelForPlan } from "@/server/games/feature-tier";
import { gameTypeAllowed, gameTypeFeature, modeAllowed } from "@/lib/game/spec/tier";
import { GAME_TYPES } from "@/lib/game/spec/constants";
import { listGames } from "@/server/games/library";
import { getT } from "@/server/i18n";
import { titleFor } from "@/components/layout/pageTitle";

export const generateMetadata = titleFor("create.title");
export const dynamic = "force-dynamic";

/** Mechanics that can be requested for an extension (the rest are implied by the content). */
const EXTENSION_MECHANICS = MECHANICS.filter((m) => ["hazards", "checkpoints", "timed_bonus", "adaptive_difficulty", "gates"].includes(m));

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ mode?: string; game?: string }> }) {
  const user = await requireUser("/create");
  const { t } = await getT();
  const sp = await searchParams;
  const [allowance, games] = await Promise.all([getAllowanceSummary(user.id), listGames(user.id)]);
  const backend = describeBackend();
  const plan = allowance.plan;
  const offered = levelsForPlan(plan);
  const requested = (GENERATION_MODES as readonly string[]).includes(sp.mode ?? "") ? (sp.mode as GenerationModeId) : "FAST";
  const mode = modeAllowed(maxLevelForPlan(plan), requested) ? requested : "FAST";
  // Everything below is derived from the plan config on the server; the form only explains and disables (the server enforces).
  const levels = [...FEATURE_TIERS].reverse().map((level) => {
    const cost = levelCost(plan, level);
    return {
      level, share: featureShare(level), cost,
      allowed: offered.includes(level),
      affordable: cost !== null && cost <= allowance.remaining,
      unlockPlan: offered.includes(level) ? null : planUnlockingLevel(level),
      fullAllowed: modeAllowed(level, "FULL"),
      gameTypes: GAME_TYPES.map((g) => ({ id: g, allowed: gameTypeAllowed(level, g), level: levelUnlocking(gameTypeFeature(g)) })),
    };
  });
  const defaultFor = (m: GenerationModeId) => offered.length === 1 ? offered[0]! : defaultLevel(plan, allowance.remaining, (l) => modeAllowed(l, m));
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold">{t("create.title")}</h1>
        <p className="text-muted">{t("create.subtitle")}</p>
      </header>
      <CreateForm
        backend={{ kind: backend.kind, provider: backend.provider, label: backend.label, reason: backend.reason }}
        allowance={{ remaining: allowance.remaining, limit: allowance.limit, periodEnd: allowance.periodEnd, plan, activeJobId: allowance.activeJobId }}
        games={games.map((g) => ({ id: g.id, title: g.title, subject: g.subject, generatorKind: g.generator.kind, level: g.level, extendCost: levelCost(plan, g.level) }))}
        extensionMechanics={EXTENSION_MECHANICS}
        levels={{
          options: levels,
          defaults: { FAST: defaultFor("FAST"), FULL: defaultFor("FULL") },
          // the cheapest plan whose highest level has several areas (for the locked Full Adventure / Extend modes)
          fullAllowed: modeAllowed(maxLevelForPlan(plan), "FULL"),
          unlockPlan: planUnlocking("system:multi_area"),
        }}
        initialMode={mode}
        initialGameId={sp.game}
      />
    </div>
  );
}
