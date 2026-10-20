import { createElement as h, type ComponentProps, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import { APP_TRACKS } from "@/config/plans";
import { DICTIONARIES } from "@/lib/i18n";
import type { GameSpec } from "@/lib/game/spec/schema";
import { TOPICS, TOPIC_CATEGORIES, searchTopics, type TopicCategory } from "@/lib/game/topics/catalog";
import { COURSES } from "@/lib/game/topics/courses";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import { topicTier } from "@/lib/game/topics/premium";
import { collectibleIds, findArea, stationActive, type ClientState } from "@/lib/game/state/progress";
import { createBackup, importBackup, serializeBackup } from "@/lib/offline/backup";
import { PLAN_GRACE_MS, PLAY_PRODUCTS } from "@/lib/offline/billing-state";
import { getOfflinePlan, getOfflineTier, setDefaultOfflinePlan } from "@/lib/offline/entitlement";
import { generateOffline, OfflineGenerationError } from "@/lib/offline/generate";
import { browserKV, OfflineStore } from "@/lib/offline/store";
import { canStartTopic, counts, halfYear, loadTracks, recordTopic, tracksLeft } from "@/lib/offline/tracks";
import { loadCourseProgress } from "../../mobile/src/course-model";
import { CREATE_DRAFT_KEY, deleteAllGames } from "../../mobile/src/reset";
import { correctAnswer } from "./helpers";

/**
 * The flows a learner lives through on the phone, each one end to end over the real modules (no copies of their logic):
 * topics ("tracks") per half-year, a lapsing subscription and what it does to the New game screen, a backup that
 * carries the course along. Time is a fake `Date` (nothing else is faked), and every test starts from an empty phone.
 */

const plugin = vi.hoisted(() => ({
  getPurchases: vi.fn(), purchaseProduct: vi.fn(), acknowledgePurchase: vi.fn(), restorePurchases: vi.fn(), getProducts: vi.fn(), manageSubscriptions: vi.fn(),
}));
const settings = vi.hoisted(() => ({ interests: [] as string[] }));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock("@capgo/native-purchases", () => ({ NativePurchases: plugin, PURCHASE_TYPE: { INAPP: "inapp", SUBS: "subs" } }));
vi.mock("../../mobile/src/app-state", () => ({ store: { addGame: () => ({ id: "x" }) }, getSettings: () => ({ interests: settings.interests, minutesPerDay: null }) }));
vi.mock("../../mobile/src/cloud/account", () => ({ useAccount: () => ({ session: null }) }));

const { CreatePage } = await import("../../mobile/src/pages/Create");
const play = await import("../../mobile/src/billing/play");

const DAY = 86_400_000;
const OCT_20 = Date.UTC(2026, 9, 20, 12); // second half of 2026: runs to 1 January 2027
const PLUS = PLAY_PRODUCTS.PLUS.productId;

/** What Play on Android lists (no isActive, no expiry date): a paid purchase has purchaseState "1". */
const android = (productIdentifier: string) => ({
  transactionId: "tok", productIdentifier, purchaseDate: "2026-10-01T10:00:00Z", quantity: 1, productType: "subs", orderId: "GPA.1",
  purchaseToken: `token-${productIdentifier}`, isAcknowledged: true, purchaseState: "1", appAccountToken: null, willCancel: null,
});

/** A phone's localStorage: one shared bag of keys, like the real one (plan, tracks, draft and the games all live in it). */
function fakeStorage() {
  const m = new Map<string, string>();
  return {
    m,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
  };
}
type Storage = ReturnType<typeof fakeStorage>;
let ls: Storage;

const setNow = (ms: number) => vi.setSystemTime(ms);

beforeEach(() => {
  ls = fakeStorage();
  vi.stubGlobal("localStorage", ls);
  vi.stubGlobal("window", { location: { hash: "#/create?source=library" }, localStorage: ls, dispatchEvent: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.useFakeTimers({ toFake: ["Date"] });
  setNow(OCT_20);
  setDefaultOfflinePlan("FREE"); // the real app starts as Free until Play says otherwise
  settings.interests = [];
  for (const fn of Object.values(plugin)) fn.mockReset();
  plugin.getPurchases.mockResolvedValue({ purchases: [] });
  plugin.acknowledgePurchase.mockResolvedValue(undefined);
  plugin.restorePurchases.mockResolvedValue(undefined);
  plugin.getProducts.mockResolvedValue({ products: [] });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  setDefaultOfflinePlan("PRO"); // the unit tests and the test builds run as Pro
});

const phone = () => {
  let tick = Date.now();
  const kv = browserKV();
  return { kv, store: new OfflineStore(kv, () => (tick += 1000)) };
};

const topicGame = async (store: OfflineStore, topicId: string, difficulty: "beginner" | "intermediate" | "advanced" = "beginner"): Promise<GameSpec> => {
  const content = (await loadTopicContent(topicId))!;
  return generateOffline({ mode: "FAST", subject: topicId, learningGoal: topicId, difficulty, gameType: "exploration", contentLanguage: "en", topicId, device: "phone" }, new Date(), getOfflineTier(), content).spec;
};

/** The learner taps "Create" on a library topic (the same three steps as the New game screen's submit). */
async function startTopic(store: OfflineStore, topicId: string): Promise<"started" | "refused"> {
  const plan = getOfflinePlan();
  if (!canStartTopic(plan, loadTracks(ls, Date.now()), topicId)) return "refused";
  store.addGame(await topicGame(store, topicId));
  recordTopic(ls, topicId, Date.now());
  return "started";
}

const FREE_TOPICS = TOPICS.filter((t) => counts(t.id) && topicTier(t.id) === "free").map((t) => t.id);

// ───────────────────────────── topics per half-year ─────────────────────────────

describe("topics (tracks) over a learner's half-year", () => {
  it("deleting a topic's games, one by one or all at once, never gives the topic back; replaying it stays open", async () => {
    const { store, kv } = phone();
    const [a, b] = FREE_TOPICS as [string, string];
    expect(APP_TRACKS.FREE).toBe(1);
    expect(await startTopic(store, a)).toBe("started");
    expect(await startTopic(store, b)).toBe("refused"); // Free has one topic per half-year

    const only = store.listGames()[0]!;
    store.deleteGame(only.id);
    expect(store.listGames()).toHaveLength(0);
    expect(loadTracks(ls, Date.now()).topics).toEqual([a]);
    expect(tracksLeft("FREE", loadTracks(ls, Date.now()))).toBe(0);
    expect(await startTopic(store, b)).toBe("refused");
    // the topic the learner already started is still theirs, at any level: a second game, then "Delete all games" in Settings
    expect(await startTopic(store, a)).toBe("started");
    ls.setItem(CREATE_DRAFT_KEY, "{}");
    deleteAllGames(store, kv);
    expect(store.listGames()).toHaveLength(0);
    expect(ls.getItem(CREATE_DRAFT_KEY)).toBeNull();
    expect(loadTracks(ls, Date.now()).topics).toEqual([a]);
    expect(await startTopic(store, b)).toBe("refused");
    expect(await startTopic(store, a)).toBe("started");
  });

  it("a backup restore never touches the history: it is neither reset nor filled in by the file", async () => {
    const { store } = phone();
    const [a, b] = FREE_TOPICS as [string, string];
    await startTopic(store, a);
    const text = serializeBackup(createBackup(store, Date.now()));
    const before = ls.getItem("levelup.tracks.v1");
    expect(importBackup(store, text)).toMatchObject({ gamesAdded: 0, gamesKept: 1, rejectedGames: [] });
    expect(ls.getItem("levelup.tracks.v1")).toBe(before);
    expect(await startTopic(store, b)).toBe("refused");
  });

  it("a plan change inside the half-year keeps what was started: Free to Pro to Plus, nothing is lost or counted twice", () => {
    const ids = TOPICS.filter((t) => counts(t.id)).slice(0, 8).map((t) => t.id);
    recordTopic(ls, ids[0]!, Date.now()); // started on Free
    expect(canStartTopic("FREE", loadTracks(ls, Date.now()), ids[1]!)).toBe(false);
    for (const id of ids.slice(1, 7)) {
      expect(canStartTopic("PRO", loadTracks(ls, Date.now()), id), id).toBe(true); // after upgrading
      recordTopic(ls, id, Date.now());
    }
    const full = loadTracks(ls, Date.now());
    expect(full.topics).toEqual(ids.slice(0, 7));
    expect(tracksLeft("PRO", full)).toBe(0);
    expect(canStartTopic("PRO", full, ids[7]!)).toBe(false);
    // downgrade to Plus (4): the count never goes negative, nothing new opens, every started topic still replays
    expect(tracksLeft("PLUS", full)).toBe(0);
    expect(canStartTopic("PLUS", full, ids[7]!)).toBe(false);
    for (const id of ids.slice(0, 7)) expect(canStartTopic("PLUS", full, id), id).toBe(true);
  });

  it("a new half-year opens at the exact millisecond, on 1 July and on 1 January (UTC), and starts a fresh history", () => {
    const lastOfJune = Date.UTC(2027, 5, 30, 23, 59, 59, 999);
    const firstOfJuly = Date.UTC(2027, 6, 1);
    const lastOfDec = Date.UTC(2027, 11, 31, 23, 59, 59, 999);
    const firstOfJan = Date.UTC(2028, 0, 1);
    expect(halfYear(lastOfJune).end).toBe(firstOfJuly);
    expect(halfYear(firstOfJuly)).toEqual({ start: firstOfJuly, end: firstOfJan });
    expect(halfYear(lastOfDec).end).toBe(firstOfJan);
    expect(halfYear(firstOfJan).start).toBe(firstOfJan);

    const [a, b, c] = TOPICS.filter((t) => counts(t.id)).map((t) => t.id) as [string, string, string];
    recordTopic(ls, a, lastOfJune);
    expect(loadTracks(ls, lastOfJune).topics).toEqual([a]);
    expect(loadTracks(ls, firstOfJuly).topics).toEqual([]);
    expect(canStartTopic("FREE", loadTracks(ls, firstOfJuly), b)).toBe(true);
    // the first topic of the new half-year replaces the old history instead of being added to it
    recordTopic(ls, b, firstOfJuly);
    expect(loadTracks(ls, firstOfJuly).topics).toEqual([b]);
    recordTopic(ls, c, lastOfDec);
    expect(loadTracks(ls, lastOfDec).topics).toEqual([b, c]);
    expect(loadTracks(ls, firstOfJan).topics).toEqual([]);
  });

  it("damaged history is read as far as it is sound, and the next topic writes a valid file again", () => {
    const { start } = halfYear(Date.now());
    const [a, b] = TOPICS.filter((t) => counts(t.id)).map((t) => t.id) as [string, string];
    ls.setItem("levelup.tracks.v1", JSON.stringify({ start, topics: [a, 7, null, { x: 1 }, a] }));
    expect(loadTracks(ls, Date.now()).topics).toEqual([a]);
    for (const bad of ["null", "[]", '{"start":"x","topics":"nope"}', JSON.stringify({ start, topics: "nope" }), JSON.stringify({ topics: [a] })]) {
      ls.setItem("levelup.tracks.v1", bad);
      expect(loadTracks(ls, Date.now()).topics, bad).toEqual([]);
    }
    recordTopic(ls, b, Date.now());
    expect(JSON.parse(ls.getItem("levelup.tracks.v1")!)).toEqual({ start, topics: [b] });
  });

  it("a phone that cannot write (full or blocked storage) never breaks starting a topic", () => {
    const [a] = FREE_TOPICS as [string];
    const full = { getItem: () => null, setItem: () => { throw new DOMException("The quota has been exceeded.", "QuotaExceededError"); } };
    expect(() => recordTopic(full, a, Date.now())).not.toThrow();
    const blocked = { getItem: () => { throw new DOMException("insecure", "SecurityError"); }, setItem: () => undefined };
    expect(loadTracks(blocked, Date.now()).topics).toEqual([]);
    expect(canStartTopic("FREE", loadTracks(blocked, Date.now()), a)).toBe(true);
  });

  it("the course is free and uncounted: every chapter opens on a full Free history and writes nothing", () => {
    const [a] = FREE_TOPICS as [string];
    recordTopic(ls, a, Date.now());
    const kept = ls.getItem("levelup.tracks.v1");
    for (const chapter of COURSES[0]!.chapters) {
      expect(counts(chapter)).toBe(false);
      expect(canStartTopic("FREE", loadTracks(ls, Date.now()), chapter), chapter).toBe(true);
      recordTopic(ls, chapter, Date.now());
    }
    expect(ls.getItem("levelup.tracks.v1")).toBe(kept);
  });
});

// ───────────────────────────── a subscription that lapses ─────────────────────────────

const Provider = I18nProvider as unknown as ComponentType<Omit<ComponentProps<typeof I18nProvider>, "children">>;
/** The New game screen on its topic-library tab, as the phone renders it right now. */
const screen = (): string => renderToStaticMarkup(h(Provider, { locale: "en", dict: DICTIONARIES.en }, h(CreatePage)));
const tracksText = (html: string): string => /data-testid="tracks-left">([^<]*)</.exec(html)?.[1] ?? "";
const locked = (html: string, id: string): boolean => html.includes(`data-testid="topic-locked-${id}"`);
const shown = (html: string, id: string): boolean => html.includes(`data-testid="topic-${id}"`);

/** One category whose first page of the picker holds a topic of every tier (the picker shows 60 at a time, free ones first). */
function pickerSample(): { cat: TopicCategory; free: string; plus: string; pro: string } {
  for (const cat of TOPIC_CATEGORIES) {
    const page = searchTopics("", cat).slice(0, 60).filter((t) => counts(t.id));
    const free = page.find((t) => topicTier(t.id) === "free");
    const plus = page.find((t) => topicTier(t.id) === "plus");
    const pro = page.find((t) => topicTier(t.id) === "pro");
    if (free && plus && pro) return { cat, free: free.id, plus: plus.id, pro: pro.id };
  }
  throw new Error("no category shows a topic of every tier on its first page");
}

describe("a subscription's life on the phone: buy, lapse, grace, renew, and what the New game screen shows", () => {
  it("follows the plan through Google Play's answers and the clock, and keeps what the learner started", async () => {
    const sample = pickerSample();
    settings.interests = [sample.cat];
    const { store } = phone();

    // Free to start with: one topic, only open topics
    expect(getOfflinePlan()).toBe("FREE");
    let html = screen();
    expect(tracksText(html)).toContain("1 of 1 (starts again on 1 January 2027)");
    expect(shown(html, sample.free) && !locked(html, sample.free)).toBe(true);
    expect(locked(html, sample.plus) && locked(html, sample.pro)).toBe(true);

    // buys Plus: four topics, the Plus collection opens, Pro-only stays locked, the level goes up
    plugin.purchaseProduct.mockResolvedValue(android(PLUS));
    plugin.getPurchases.mockResolvedValue({ purchases: [android(PLUS)] });
    expect(await play.buyPlan("PLUS")).toEqual({ ok: true });
    expect(getOfflinePlan()).toBe("PLUS");
    expect(getOfflineTier()).toBe("A");
    html = screen();
    expect(tracksText(html)).toContain("4 of 4");
    expect(!locked(html, sample.plus) && locked(html, sample.pro)).toBe(true);

    // starts two topics, one of them from the Plus collection
    expect(await startTopic(store, sample.plus)).toBe("started");
    expect(await startTopic(store, sample.free)).toBe("started");
    expect(tracksText(screen())).toContain("2 of 4");

    // a day later Play's query fails (the plugin answers [] then): the plan is kept and the grace is NOT restarted by it
    setNow(OCT_20 + DAY);
    plugin.getPurchases.mockResolvedValue({ purchases: [] });
    expect((await play.refreshPlan())?.plan).toBe("PLUS");
    expect(getOfflinePlan()).toBe("PLUS");
    expect(JSON.parse(ls.getItem("levelup.plan.v1")!)).toMatchObject({ plan: "PLUS", checkedAt: OCT_20 });

    // two days in Play confirms it again (a renewal): the grace now counts from this confirmation
    const confirmed = OCT_20 + 2 * DAY;
    setNow(confirmed);
    plugin.getPurchases.mockResolvedValue({ purchases: [android(PLUS)] });
    await play.refreshPlan();
    plugin.getPurchases.mockResolvedValue({ purchases: [] });
    setNow(confirmed + PLAN_GRACE_MS);
    await play.refreshPlan();
    expect(getOfflinePlan()).toBe("PLUS"); // the last millisecond of the grace
    expect(tracksText(screen())).toContain("2 of 4");

    // one millisecond later the grace is over: Free again, with no answer from Play needed and with the history intact
    setNow(confirmed + PLAN_GRACE_MS + 1);
    expect(getOfflinePlan()).toBe("FREE");
    expect(getOfflineTier()).toBe("B");
    html = screen();
    expect(tracksText(html)).toContain("0 of 1");
    expect(locked(html, sample.plus) && locked(html, sample.pro)).toBe(true);
    expect(!locked(html, sample.free)).toBe(true);
    const history = loadTracks(ls, Date.now());
    expect(history.topics).toEqual([sample.plus, sample.free]);
    expect(canStartTopic("FREE", history, sample.free)).toBe(true); // replaying an open topic is still allowed
    // the Plus topic they started stays counted, but the phone no longer builds it (the topic's own tier, not the track count, decides)
    const content = (await loadTopicContent(sample.plus))!;
    const ask = { mode: "FAST", subject: "x", learningGoal: "x", difficulty: "beginner", gameType: "exploration", contentLanguage: "en", topicId: sample.plus, device: "phone" };
    expect(() => generateOffline(ask, new Date(), getOfflineTier(), content)).toThrow(OfflineGenerationError);
    // the games already on the phone are still there
    expect(store.listGames()).toHaveLength(2);

    // an empty answer from Play now is believed (past the grace), and a purchase it lists brings the plan back at once
    await play.refreshPlan();
    expect(JSON.parse(ls.getItem("levelup.plan.v1")!).plan).toBe("FREE");
    plugin.getPurchases.mockResolvedValue({ purchases: [android(PLUS)] });
    await play.refreshPlan();
    expect(getOfflinePlan()).toBe("PLUS");
    expect(tracksText(screen())).toContain("2 of 4");

    // the half-year turns over on 1 January (UTC): the history starts again, the plan carries on
    setNow(Date.UTC(2027, 0, 1));
    await play.refreshPlan();
    expect(getOfflinePlan()).toBe("PLUS");
    html = screen();
    expect(tracksText(html)).toContain("4 of 4 (starts again on 1 July 2027)");
    expect(loadTracks(ls, Date.now()).topics).toEqual([]);
  });

  it("a Pro learner who falls back to Free sees the Pro-only topics locked, and one who never had Pro never sees them open", () => {
    const sample = pickerSample();
    settings.interests = [sample.cat];
    ls.setItem("levelup.plan.v1", JSON.stringify({ plan: "PRO", expiresAt: OCT_20, checkedAt: OCT_20 }));
    let html = screen();
    expect(getOfflinePlan()).toBe("PRO");
    expect(tracksText(html)).toContain("7 of 7");
    expect([sample.free, sample.plus, sample.pro].some((id) => locked(html, id))).toBe(false);
    setNow(OCT_20 + PLAN_GRACE_MS + 1);
    html = screen();
    expect(getOfflinePlan()).toBe("FREE");
    expect(tracksText(html)).toContain("1 of 1");
    expect(locked(html, sample.plus) && locked(html, sample.pro) && !locked(html, sample.free)).toBe(true);
  });
});

// ───────────────────────────── the course, and a backup ─────────────────────────────

type Res = ReturnType<OfflineStore["applyEvent"]>;
/** Plays a game to the end. */
function playThrough(store: OfflineStore, spec: GameSpec, sessionId: string, first: ClientState): Res | null {
  let state = first;
  const box: { last: Res | null } = { last: null };
  const send = (e: Record<string, unknown>): Res => { const r = store.applyEvent(sessionId, e); box.last = r; state = r.state; return r; };
  for (let guard = 0; guard < 30; guard++) {
    const area = findArea(spec, state.areaId)!;
    for (const n of area.npcs) if (send({ type: "talk", npcId: n.id }).completed) return box.last;
    for (const id of collectibleIds(area)) { if (!state.collected.includes(id) && send({ type: "collect", itemId: id }).completed) return box.last; }
    for (const s of area.stations) {
      if (!stationActive(spec, state, s) || state.resolvedStations[s.id] || state.visited.includes(s.id)) continue;
      if (s.kind === "lore") { if (send({ type: "visit", stationId: s.id }).completed) return box.last; continue; }
      const opened = send({ type: "open", stationId: s.id });
      const ch = spec.challenges.find((c) => c.id === (opened.data as { challenge: { id: string } }).challenge.id)!;
      if (send({ type: "answer", stationId: s.id, answer: correctAnswer(ch, sessionId) }).completed) return box.last;
    }
    if (area.portal) { try { send({ type: "enter_area", areaId: area.portal.toAreaId }); } catch { /* locked */ } }
  }
  return box.last;
}

describe("the course and a backup", () => {
  it("a restored backup brings the course progress with it: finished levels, the run to resume and the next chapter", async () => {
    const course = COURSES[0]!;
    const [c1, c2, c3] = course.chapters as [string, string, string];
    const src = phone();
    const finish = async (topicId: string, level: "beginner" | "intermediate" | "advanced") => {
      const game = src.store.addGame(await topicGame(src.store, topicId, level));
      const run = src.store.startSession(game.id, false);
      expect(playThrough(src.store, game.spec, run.session.id, run.client)?.completed, `${topicId} ${level}`).toBe(true);
      return game;
    };
    await finish(c1, "beginner");
    await finish(c1, "advanced");
    await finish(c3, "intermediate");
    const open = src.store.addGame(await topicGame(src.store, c2, "beginner")); // started, not finished
    src.store.startSession(open.id, false);
    // a game from the learner's own notes with the same title words never counts as a chapter
    const own = generateOffline({ mode: "FAST", subject: "Fractions", learningGoal: "Fractions", difficulty: "beginner", gameType: "exploration", contentLanguage: "en", material: "Numerator: the top number.\nDenominator: the bottom number.\nFraction: a part of a whole.\nHalf: one of two equal parts.\nThird: one of three equal parts.\nQuarter: one of four equal parts." }, new Date(), "A").spec;
    src.store.addGame(own);

    const before = loadCourseProgress(src.store, course);
    expect(before.done).toBe(2);
    expect(before.chapters[0]).toMatchObject({ levelsDone: ["beginner", "advanced"], nextLevel: "intermediate" });
    expect(before.chapters[1]).toMatchObject({ levelsDone: [], resume: open.id });
    expect(before.next?.topicId).toBe(c2);

    // a different phone, through the file the app writes
    const text = serializeBackup(createBackup(src.store, Date.now()));
    ls = fakeStorage();
    vi.stubGlobal("localStorage", ls);
    const dst = phone();
    expect(importBackup(dst.store, text)).toMatchObject({ rejectedGames: [], droppedSessions: 0 });
    expect(loadCourseProgress(dst.store, course)).toEqual(before);
    // and the topics the learner started are not counted on the new phone: the history belongs to the phone, not to the file
    expect(loadTracks(ls, Date.now()).topics).toEqual([]);
  }, 60_000);
});
