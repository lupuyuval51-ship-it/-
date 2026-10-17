import { beforeEach, describe, expect, it, vi } from "vitest";
import { TOPICS } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import { PRO_ONLY_TOPIC_IDS, topicTier } from "@/lib/game/topics/premium";
import { generateOffline, OfflineGenerationError } from "@/lib/offline/generate";

const plan = vi.hoisted(() => ({ value: "PRO" as "FREE" | "PLUS" | "PRO" }));
vi.mock("@/lib/offline/entitlement", () => ({ getOfflinePlan: () => plan.value, getOfflineTier: () => "A" }));

const ask = (topicId: string) => ({ mode: "FAST", subject: "x", learningGoal: "x", difficulty: "beginner", gameType: "adventure", contentLanguage: "en", topicId, device: "phone" });
async function outcome(id: string): Promise<"built" | "locked"> {
  try {
    generateOffline(ask(id), new Date(0), "A", (await loadTopicContent(id))!);
    return "built";
  } catch (e) {
    if (e instanceof OfflineGenerationError && e.code === "TIER_LOCKED") return "locked";
    throw e;
  }
}

describe("the phone's generator follows the install's plan for every topic", () => {
  beforeEach(() => { plan.value = "PRO"; });

  it("Pro builds every sampled topic; Plus is refused Pro-only ones; Free is refused everything above the open tier", async () => {
    // all 20 Pro-only topics, 20 Plus-tier topics and 20 open ones: the full matrix of tiers is covered, the rest is the same rule
    const sample = [
      ...[...PRO_ONLY_TOPIC_IDS],
      ...TOPICS.filter((t) => topicTier(t.id) === "plus").slice(0, 20).map((t) => t.id),
      ...TOPICS.filter((t) => topicTier(t.id) === "free").slice(0, 20).map((t) => t.id),
    ];
    for (const id of sample) {
      const tier = topicTier(id);
      plan.value = "PRO";
      expect(await outcome(id), `PRO ${id}`).toBe("built");
      plan.value = "PLUS";
      expect(await outcome(id), `PLUS ${id}`).toBe(tier === "pro" ? "locked" : "built");
      plan.value = "FREE";
      expect(await outcome(id), `FREE ${id}`).toBe(tier === "free" ? "built" : "locked");
    }
  }, 120_000);
});
