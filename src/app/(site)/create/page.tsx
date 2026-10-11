import { CreateForm } from "@/components/create/CreateForm";
import { GENERATION_MODES, MECHANICS, type GenerationModeId } from "@/lib/game/spec/constants";
import { getAllowanceSummary } from "@/server/allowance/summary";
import { describeBackend } from "@/server/ai/registry";
import { requireUser } from "@/server/auth/current";
import { featureShare, planUnlocking } from "@/config/plans";
import { featureTierForPlan } from "@/server/games/feature-tier";
import { gameTypeAllowed, gameTypeFeature, modeAllowed } from "@/lib/game/spec/tier";
import { GAME_TYPES } from "@/lib/game/spec/constants";
import { listGames } from "@/server/games/library";
import { getT } from "@/server/i18n";

export const metadata = { title: "Create a game" };
export const dynamic = "force-dynamic";

/** Mechanics that can be requested for an extension (the rest are implied by the content). */
const EXTENSION_MECHANICS = MECHANICS.filter((m) => ["hazards", "checkpoints", "timed_bonus", "adaptive_difficulty", "gates"].includes(m));

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ mode?: string; game?: string }> }) {
  const user = await requireUser("/create");
  const { t } = await getT();
  const sp = await searchParams;
  const [allowance, games] = await Promise.all([getAllowanceSummary(user.id), listGames(user.id)]);
  const backend = describeBackend();
  const tier = featureTierForPlan(allowance.plan);
  const requested = (GENERATION_MODES as readonly string[]).includes(sp.mode ?? "") ? (sp.mode as GenerationModeId) : "FAST";
  const mode = modeAllowed(featureTierForPlan(allowance.plan), requested) ? requested : "FAST";
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold">{t("create.title")}</h1>
        <p className="text-muted">{t("create.subtitle")}</p>
      </header>
      <CreateForm
        backend={{ kind: backend.kind, provider: backend.provider, label: backend.label, reason: backend.reason }}
        allowance={{ remaining: allowance.remaining, limit: allowance.limit, periodEnd: allowance.periodEnd, plan: allowance.plan, activeJobId: allowance.activeJobId }}
        games={games.map((g) => ({ id: g.id, title: g.title, subject: g.subject, generatorKind: g.generator.kind }))}
        extensionMechanics={EXTENSION_MECHANICS}
        featureTier={{
          tier, share: featureShare(tier),
          // what the plan's tier can build, and which plan unlocks what it cannot
          gameTypes: GAME_TYPES.map((g) => ({ id: g, allowed: gameTypeAllowed(tier, g), plan: gameTypeAllowed(tier, g) ? null : planUnlocking(gameTypeFeature(g)) })),
          fullAllowed: modeAllowed(tier, "FULL"),
          unlockPlan: planUnlocking("system:multi_area"),
        }}
        initialMode={mode}
        initialGameId={sp.game}
      />
    </div>
  );
}
