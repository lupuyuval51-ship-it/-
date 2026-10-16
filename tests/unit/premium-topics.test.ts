import { describe, expect, it } from "vitest";
import { PLANS } from "@/config/plans";
import { TOPICS, TOPIC_CATEGORIES } from "@/lib/game/topics/catalog";
import { PREMIUM_TOPIC_IDS, isPremiumTopic, premiumTopicsPlan, topicOpenFor } from "@/lib/game/topics/premium";

describe("premium topics (Plus and Pro only)", () => {
  it("are real catalogue topics: about a third of every category, never a category's first two", () => {
    const ids = new Set(TOPICS.map((t) => t.id));
    for (const id of PREMIUM_TOPIC_IDS) expect(ids.has(id), id).toBe(true);
    for (const cat of TOPIC_CATEGORIES) {
      const inCat = TOPICS.filter((t) => t.cat === cat);
      const share = inCat.filter((t) => isPremiumTopic(t.id)).length / inCat.length;
      expect(share, cat).toBeGreaterThanOrEqual(0.25);
      expect(share, cat).toBeLessThanOrEqual(0.4);
      expect(isPremiumTopic(inCat[0]!.id), cat).toBe(false);
      expect(isPremiumTopic(inCat[1]!.id), cat).toBe(false);
    }
  });

  it("Free plays every other topic; Plus and Pro play all of them (decided in plans.ts)", () => {
    expect([PLANS.FREE.features.premiumTopics, PLANS.PLUS.features.premiumTopics, PLANS.PRO.features.premiumTopics]).toEqual([false, true, true]);
    const premium = [...PREMIUM_TOPIC_IDS][0]!;
    const free = TOPICS.find((t) => !isPremiumTopic(t.id))!.id;
    expect(topicOpenFor("FREE", premium)).toBe(false);
    expect(topicOpenFor("FREE", free)).toBe(true);
    expect(topicOpenFor("PLUS", premium)).toBe(true);
    expect(topicOpenFor("PRO", premium)).toBe(true);
    expect(premiumTopicsPlan()).toBe("PLUS");
  });
});
