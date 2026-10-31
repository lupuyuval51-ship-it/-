import { describe, expect, it } from "vitest";
import { PLANS, PLAN_IDS } from "@/config/plans";
import { TOPICS, TOPIC_CATEGORIES } from "@/lib/game/topics/catalog";
import { PLUS_PRO_TOPICS } from "@/lib/game/topics/catalog-plus-pro";
import { PREMIUM_TOPIC_IDS, PRO_ONLY_TOPIC_IDS, isPremiumTopic, planOpeningTopic, premiumTopicsPlan, topicOpenFor, topicTier } from "@/lib/game/topics/premium";

describe("topic tiers: open, Plus and up, Pro only", () => {
  const ids = new Set(TOPICS.map((t) => t.id));
  const collection = new Set(PLUS_PRO_TOPICS.map((t) => t.id));

  it("are real catalogue topics, and Pro-only topics are a subset of the non-free ones", () => {
    for (const id of PREMIUM_TOPIC_IDS) expect(ids.has(id), id).toBe(true);
    for (const id of PRO_ONLY_TOPIC_IDS) { expect(ids.has(id), id).toBe(true); expect(PREMIUM_TOPIC_IDS.has(id), id).toBe(true); }
  });

  it("in every category of the original library: about a third is not free, never a category's first two, and exactly two topics are Pro-only", () => {
    for (const cat of TOPIC_CATEGORIES) {
      // (course chapters are free on every plan and not part of a category's share)
      const inCat = TOPICS.filter((t) => t.cat === cat && !t.course && !collection.has(t.id));
      const share = inCat.filter((t) => isPremiumTopic(t.id)).length / inCat.length;
      expect(share, cat).toBeGreaterThanOrEqual(0.25);
      expect(share, cat).toBeLessThanOrEqual(0.4);
      expect(isPremiumTopic(inCat[0]!.id), cat).toBe(false);
      expect(isPremiumTopic(inCat[1]!.id), cat).toBe(false);
      expect(inCat.filter((t) => topicTier(t.id) === "pro").length, cat).toBe(2);
      expect(inCat.filter((t) => topicTier(t.id) === "plus").length, cat).toBeGreaterThanOrEqual(1);
    }
    expect(PRO_ONLY_TOPIC_IDS.size).toBe(TOPIC_CATEGORIES.length * 2 + PLUS_PRO_TOPICS.length / 2);
  });

  it("the Plus and Pro collection is never free: in every category half of it needs Plus or Pro and half (the more advanced topics) needs Pro", () => {
    expect(PLUS_PRO_TOPICS.length).toBe(260);
    for (const cat of TOPIC_CATEGORIES) {
      const inCat = PLUS_PRO_TOPICS.filter((t) => t.cat === cat);
      const plus = inCat.filter((t) => topicTier(t.id) === "plus");
      const pro = inCat.filter((t) => topicTier(t.id) === "pro");
      expect(plus.length + pro.length, cat).toBe(inCat.length);
      expect(Math.abs(plus.length - pro.length), cat).toBeLessThanOrEqual(1);
      expect(inCat.some((t) => t.course), cat).toBe(false);
      // Pro gets the more advanced half: no Plus topic is for older learners than every Pro topic
      const oldest = (l: typeof inCat) => Math.max(...l.map((t) => t.ages[1]));
      expect(oldest(pro), cat).toBeGreaterThanOrEqual(oldest(plus));
    }
    expect(PLUS_PRO_TOPICS.filter((t) => topicTier(t.id) === "pro").length).toBe(PLUS_PRO_TOPICS.length / 2);
  });

  it("the plans decide which tiers they play (plans.ts)", () => {
    expect(PLANS.FREE.features.topicTiers).toEqual(["free"]);
    expect(PLANS.PLUS.features.topicTiers).toEqual(["free", "plus"]);
    expect(PLANS.PRO.features.topicTiers).toEqual(["free", "plus", "pro"]);
  });

  it("every topic against every plan: Free = open only, Plus = open + Plus, Pro = everything", () => {
    for (const t of TOPICS) {
      const tier = topicTier(t.id);
      expect(topicOpenFor("FREE", t.id), t.id).toBe(tier === "free");
      expect(topicOpenFor("PLUS", t.id), t.id).toBe(tier !== "pro");
      expect(topicOpenFor("PRO", t.id), t.id).toBe(true);
    }
  });

  it("names the cheapest plan that opens a topic, and never a plan that does not", () => {
    for (const t of TOPICS) {
      const plan = planOpeningTopic(t.id);
      expect(topicOpenFor(plan, t.id), t.id).toBe(true);
      for (const lower of PLAN_IDS.slice(0, PLAN_IDS.indexOf(plan))) expect(topicOpenFor(lower, t.id), `${t.id} ${lower}`).toBe(false);
      expect(plan, t.id).toBe({ free: "FREE", plus: "PLUS", pro: "PRO" }[topicTier(t.id)]);
    }
    expect(premiumTopicsPlan()).toBe("PLUS");
  });

  it("course chapters are free on every plan", () => {
    const chapters = TOPICS.filter((t) => t.course);
    expect(chapters.length).toBeGreaterThanOrEqual(8);
    for (const t of chapters) expect(topicTier(t.id), t.id).toBe("free");
  });

  it("counts: Free 146, Plus 320, Pro all 470", () => {
    const open = (plan: "FREE" | "PLUS" | "PRO") => TOPICS.filter((t) => topicOpenFor(plan, t.id)).length;
    expect([open("FREE"), open("PLUS"), open("PRO")]).toEqual([TOPICS.length - PREMIUM_TOPIC_IDS.size, TOPICS.length - PRO_ONLY_TOPIC_IDS.size, TOPICS.length]);
    expect([open("FREE"), open("PLUS"), open("PRO")]).toEqual([146, 320, 470]);
  });
});
