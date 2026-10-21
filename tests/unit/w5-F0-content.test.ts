import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { LevelContent, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 5, F0: ten arts, civics and computing topics. A game shows most items of a level together, so no ordering step,
 * number prompt, term description or other question of a level may give away the answer of a choice question of that
 * level. Removed giveaways: Monet's age (now van Gogh's), Warhol in the timeline, the rule of thirds in the width sum,
 * the Golden Gate question (now its colour), the Terracotta Army's year, the Bach-1750 question (Baroque term dates),
 * the meaning of "origami" (term) and the square sheet, the League of Nations in the timeline, the many Security Council
 * prompts (now a question about General Assembly resolutions), the NFC range and the reader's radio waves, the coil
 * power question, UHF range and speed, "flashes of light", "electrical signals" and the continent route, the 36,000 km
 * of the geostationary term, Wi-Fi's radio waves, the switch and MAC terms, the DHCP question (now DNS), WPA3, the font
 * size step and the PDF term. Stoneware's vitrification question (the term says it) became a kiln-cracking question.
 */

const IDS = ["arts-art-styles", "arts-bridges", "arts-ceramics", "arts-classical-music", "arts-origami", "civics-united-nations", "cs-contactless", "cs-data-cables", "cs-networks", "cs-word-processing"] as const;
const LEVELS = ["b", "i", "a"] as const;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

/** Everything a level shows besides its choice questions' own text, in one language (0 = en, 1 = he). */
function otherTexts(lv: LevelContent, lang: 0 | 1): string[] {
  return [
    ...(lv.n ?? []).map((n) => (lang === 0 ? n[1] : n[2])[0]),
    ...(lv.s ?? []).flatMap((o) => o[lang].slice(1)),
    ...(lv.t ?? []).map((t) => t[lang * 2 + 1]!),
  ];
}

function allText(lv: LevelContent, lang: 0 | 1): string {
  return [...otherTexts(lv, lang), ...(lv.q ?? []).map((q) => q[lang][0])].join("\n").toLowerCase();
}

describe("arts, civics and computing topics (F0)", () => {
  it("are all in the catalogue", () => {
    for (const id of IDS) expect(findTopic(id), id).toBeTruthy();
  });

  it.each(IDS)("%s: every level has 8+ items and 4+ questions, numbers or orderings, the same shape in both languages", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      const asked = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
      expect(asked + (lv.t?.length ?? 0), `${id} ${l}`).toBeGreaterThanOrEqual(8);
      expect(asked, `${id} ${l}`).toBeGreaterThanOrEqual(4);
      for (const [en, he] of lv.q ?? []) expect(he[2].length, `${id} ${l} ${en[0]}`).toBe(en[2].length);
      for (const [en, he] of lv.s ?? []) expect(he.length, `${id} ${l} ${en[0]}`).toBe(en.length);
    }
  });

  /**
   * Mentions that were checked and kept: they name a subject without answering its question (a timeline that lists every
   * option of the question, a step that names a style without saying what it looks like, "pottery" in a term).
   */
  const TOPICAL = new Set([
    "arts-art-styles|i|cubism", "arts-art-styles|i|קוביזם", "arts-art-styles|i|pop art", "arts-art-styles|i|פופ ארט",
    "arts-ceramics|b|potter",
    "arts-classical-music|b|ludwig van beethoven", "arts-classical-music|b|לודוויג ואן בטהובן",
    "arts-classical-music|i|baroque period", "arts-classical-music|i|תקופת הבארוק",
  ]);

  it.each(IDS)("%s: no number prompt, ordering step or term of a level contains the answer of one of its choice questions", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      for (const lang of [0, 1] as const) {
        const others = otherTexts(c[l], lang).map((s) => s.toLowerCase());
        for (const [, answer] of (c[l].q ?? []).map((q) => q[lang])) {
          const a = answer.toLowerCase().replace(/^(the|a|an) /, "");
          if (a.length < 6 || /^[\d\s,.−–-]+$/.test(a) || TOPICAL.has(`${id}|${l}|${a}`)) continue;
          for (const o of others) expect(o.includes(a), `${id} ${l} "${answer}" in "${o}"`).toBe(false);
        }
      }
    }
  });

  it("the removed giveaways stay removed", async () => {
    const styles = await load("arts-art-styles");
    expect(allText(styles.i, 0)).not.toContain("claude monet was born");
    expect(allText(styles.i, 0)).not.toContain("pop art with andy warhol");
    expect(allText(styles.a, 0)).not.toContain("rule of thirds, how many");
    expect(allText(styles.a, 0)).not.toContain("blend together");
    expect(styles.i.n?.[0]?.[0]).toBe(37);

    const bridges = await load("arts-bridges");
    const gg = bridges.b.q?.find(([en]) => en[0].includes("Golden Gate"));
    expect(gg?.[0][1]).toBe("Orange-red");

    const ceramics = await load("arts-ceramics");
    expect(allText(ceramics.b, 0)).not.toContain("terracotta army");
    expect(allText(ceramics.b, 1)).not.toContain("צבא הטרקוטה");
    expect(ceramics.a.q?.some(([en]) => en[1].includes("turns to glass"))).toBe(false);

    const music = await load("arts-classical-music");
    expect(music.i.q?.some(([en]) => en[0].startsWith("Bach died in 1750"))).toBe(false);

    const origami = await load("arts-origami");
    expect(origami.b.q?.some(([en]) => en[1] === "Folding paper" || en[1] === "A square")).toBe(false);

    const un = await load("civics-united-nations");
    expect(allText(un.i, 0)).not.toContain("league of nations");
    expect(allText(un.i, 1)).not.toContain("חבר הלאומים");
    expect(un.a.q?.some(([en]) => en[1] === "The Security Council")).toBe(false);

    const contactless = await load("cs-contactless");
    expect(allText(contactless.b, 0)).not.toContain("few centimetres");
    expect(allText(contactless.b, 0)).not.toContain("radio waves wake");
    expect(allText(contactless.i, 0)).not.toContain("tens of metres");
    expect(allText(contactless.a, 0)).not.toContain("uhf tag from 5 m");
    expect(allText(contactless.a, 0)).not.toContain("uhf reader");

    const cables = await load("cs-data-cables");
    expect(allText(cables.b, 0)).not.toContain("flashes of light");
    expect(otherTexts(cables.b, 0).join("\n")).not.toContain("electrical signals");
    expect(allText(cables.b, 0)).not.toContain("undersea fibre-optic cable");
    expect(allText(cables.i, 0)).not.toContain("36,000 km above");

    const networks = await load("cs-networks");
    expect(allText(networks.b, 0)).not.toContain("radio waves instead of wires");
    expect(allText(networks.a, 0)).not.toContain("from its maker");
    expect(allText(networks.a, 0)).not.toContain("only devices with the right key");
    expect(networks.a.q?.some(([en]) => en[1] === "DHCP, in the router")).toBe(false);

    const words = await load("cs-word-processing");
    expect(allText(words.b, 0)).not.toContain("font size");
    expect(allText(words.a, 0)).not.toContain("looking the same on every device");
  });

  it("keeps the corrected sums right", async () => {
    const styles = await load("arts-art-styles");
    expect(styles.i.n?.[0]?.[1][2]).toContain("1890 − 1853 = 37");
    const contactless = await load("cs-contactless");
    const ratio = contactless.a.q?.find(([en]) => en[0].includes("100 m"));
    expect(ratio?.[0][1]).toBe("About 2,500 times");
    expect(ratio?.[1][1]).toBe("פי 2,500 בערך");
  });

  it("writes no < or > and no ? blank in Hebrew", async () => {
    for (const id of IDS) {
      const c = await load(id);
      for (const l of LEVELS) expect(/[<>]/.test(allText(c[l], 1)), `${id} ${l}`).toBe(false);
    }
  });
});
