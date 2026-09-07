import { afterAll, describe, expect, it } from "vitest";
import { makeRequest, readJson, registerAccount, setupTestEnv, type TestAccount } from "./helpers";
import type { SyncRecord } from "@/lib/types";
import type { SyncPullResponse, SyncPushResponse } from "@/lib/serverTypes";

const env = setupTestEnv("sync");

import { POST as push } from "@/app/api/sync/push/route";
import { GET as pull } from "@/app/api/sync/pull/route";
import { getDb, schema } from "@/server/db/client";
import { eq } from "drizzle-orm";

afterAll(() => env.teardown());

let account: TestAccount;
const T0 = "2026-09-01T10:00:00.000Z";
const T1 = "2026-09-02T10:00:00.000Z";
const T2 = "2026-09-03T10:00:00.000Z";

function workoutRecord(id: string, updatedAt: string, extra: Record<string, unknown> = {}): SyncRecord {
  return {
    collection: "workouts",
    id,
    updatedAt,
    data: {
      id,
      source: "custom",
      title: { he: "אימון", en: "Workout" },
      totalDurationMinutes: 90,
      phases: [
        { id: "p1", type: "warmup", durationMinutes: 10, exercises: [{ id: "e1", exerciseId: "wu_jog", durationMinutes: 10 }] },
        { id: "p2", type: "throwing", durationMinutes: 80, exercises: [{ id: "e2", durationMinutes: 40 }, { id: "e3", exerciseId: "bh_target", durationMinutes: 40 }] },
      ],
      updatedAt,
      ...extra,
    },
  };
}

async function doPush(records: unknown[], cookie = account.cookie): Promise<{ status: number; body: SyncPushResponse }> {
  const res = await push(makeRequest("/api/sync/push", { body: { records }, cookie }));
  return { status: res.status, body: await readJson<SyncPushResponse>(res) };
}

async function doPull(query: Record<string, string>, cookie = account.cookie): Promise<SyncPullResponse> {
  const qs = new URLSearchParams(query).toString();
  return readJson<SyncPullResponse>(await pull(makeRequest(`/api/sync/pull${qs ? `?${qs}` : ""}`, { cookie })));
}

describe("sync push/pull", () => {
  it("requires an account and the CSRF header", async () => {
    account = await registerAccount("sync@example.com");
    const anon = await push(makeRequest("/api/sync/push", { body: { records: [] } }));
    expect(anon.status).toBe(401);
    const noCsrf = await push(makeRequest("/api/sync/push", { body: { records: [] }, cookie: account.cookie, csrf: false }));
    expect(noCsrf.status).toBe(403);
    const anonPull = await pull(makeRequest("/api/sync/pull"));
    expect(anonPull.status).toBe(401);
  });

  it("accepts records, refreshes derived tables and returns them on pull", async () => {
    const profile: SyncRecord = {
      collection: "profile",
      id: "profile",
      updatedAt: T0,
      data: { id: "profile", name: "Dana", primaryRole: "handler", secondaryRole: "cutter", roleIntent: "current", goals: [{ goal: "accuracy", priority: 1 }, { goal: "forehand", priority: 2 }], equipment: ["cones", "wall"], updatedAt: T0 },
    };
    const session: SyncRecord = {
      collection: "completedSessions",
      id: "cs_1",
      updatedAt: T0,
      data: { id: "cs_1", workoutId: "wk_1", role: "handler", completedAt: T0, actualMinutes: 88, plannedMinutes: 90, throws: 120, catches: 80, replacements: [], updatedAt: T0 },
    };
    const settings: SyncRecord = { collection: "settings", id: "settings", updatedAt: T0, data: { locale: "he", theme: "dark", updatedAt: T0 } };
    const conversation: SyncRecord = { collection: "aiConversations", id: "coach", updatedAt: T0, data: { id: "coach", summary: "…", messages: [], updatedAt: T0 } };
    const { status, body } = await doPush([workoutRecord("wk_1", T0), profile, session, settings, conversation]);
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.accepted.sort()).toEqual(["aiConversations:coach", "completedSessions:cs_1", "profile:profile", "settings:settings", "workouts:wk_1"]);
    expect(body.conflicts).toEqual([]);
    expect(body.rejected).toEqual([]);

    const db = await getDb();
    const roles = await db.select().from(schema.rolePreferences).where(eq(schema.rolePreferences.userId, account.user.id));
    expect(roles[0]).toMatchObject({ primaryRole: "handler", secondaryRole: "cutter", intent: "current" });
    const goals = await db.select().from(schema.goals).where(eq(schema.goals.userId, account.user.id));
    expect(goals.map((g) => g.goal).sort()).toEqual(["accuracy", "forehand"]);
    const equipment = await db.select().from(schema.equipment).where(eq(schema.equipment.userId, account.user.id));
    expect(equipment.map((e) => e.item).sort()).toEqual(["cones", "wall"]);
    const phases = await db.select().from(schema.workoutPhases).where(eq(schema.workoutPhases.userId, account.user.id));
    expect(phases.map((p) => p.type)).toEqual(["warmup", "throwing"]);
    const exercises = await db.select().from(schema.workoutExercises).where(eq(schema.workoutExercises.userId, account.user.id));
    expect(exercises).toHaveLength(3);
    expect(exercises.find((e) => e.id === "e3")?.exerciseId).toBe("bh_target");
    const metrics = await db.select().from(schema.progressMetrics).where(eq(schema.progressMetrics.userId, account.user.id));
    expect(metrics[0]).toMatchObject({ sessions: 1, minutes: 88, throws: 120, catches: 80 });

    const pulled = await doPull({});
    expect(pulled.ok).toBe(true);
    expect(pulled.nextCursor).toBeNull();
    const keys = pulled.records.map((r) => `${r.collection}:${r.id}`).sort();
    expect(keys).toEqual(["aiConversations:coach", "completedSessions:cs_1", "profile:profile", "settings:settings", "workouts:wk_1"]);
    expect(pulled.records.find((r) => r.collection === "profile")?.data).toMatchObject({ name: "Dana" });
  });

  it("keeps the server version when the incoming updatedAt is older and reports it as a conflict", async () => {
    const newer = await doPush([workoutRecord("wk_1", T2, { title: { he: "חדש", en: "Newer" } })]);
    expect(newer.body.accepted).toEqual(["workouts:wk_1"]);
    const older = await doPush([workoutRecord("wk_1", T1, { title: { he: "ישן", en: "Older" } })]);
    expect(older.body.accepted).toEqual([]);
    expect(older.body.conflicts).toHaveLength(1);
    const server = older.body.conflicts[0];
    expect(server.collection).toBe("workouts");
    expect(server.id).toBe("wk_1");
    expect(server.updatedAt).toBe(T2);
    expect((server.data as { title: { en: string } }).title.en).toBe("Newer");
    // Equal timestamps are accepted (idempotent retries).
    const same = await doPush([workoutRecord("wk_1", T2, { title: { he: "חדש", en: "Newer" } })]);
    expect(same.body.accepted).toEqual(["workouts:wk_1"]);
  });

  it("soft-deletes (row stays, deletedAt set) and pages with since/cursor", async () => {
    const del = await doPush([{ ...workoutRecord("wk_1", "2026-09-04T10:00:00.000Z", { deletedAt: "2026-09-04T10:00:00.000Z" }), deletedAt: "2026-09-04T10:00:00.000Z" }]);
    expect(del.body.accepted).toEqual(["workouts:wk_1"]);
    const db = await getDb();
    const rows = await db.select().from(schema.workouts).where(eq(schema.workouts.userId, account.user.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].deletedAt).not.toBeNull();
    const phases = await db.select().from(schema.workoutPhases).where(eq(schema.workoutPhases.userId, account.user.id));
    expect(phases).toHaveLength(0);

    const since = await doPull({ since: T2 });
    expect(since.records.map((r) => `${r.collection}:${r.id}`)).toEqual(["workouts:wk_1"]);
    expect(since.records[0].deletedAt).toBe("2026-09-04T10:00:00.000Z");
    const nothing = await doPull({ since: "2026-09-05T00:00:00.000Z" });
    expect(nothing.records).toEqual([]);

    // Paging: 5 more records, page size 2.
    const many = Array.from({ length: 5 }, (_, i) => ({ collection: "xpEvents", id: `xp_${i}`, updatedAt: `2026-09-06T10:00:0${i}.000Z`, data: { id: `xp_${i}`, amount: 10, reason: "session", at: T0, updatedAt: T0 } }));
    expect((await doPush(many)).body.accepted).toHaveLength(5);
    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const page: SyncPullResponse = await doPull({ since: "2026-09-06T00:00:00.000Z", limit: "2", ...(cursor ? { cursor } : {}) });
      seen.push(...page.records.map((r) => r.id));
      cursor = page.nextCursor;
      pages += 1;
    } while (cursor && pages < 10);
    expect(pages).toBe(3);
    expect(seen).toEqual(["xp_0", "xp_1", "xp_2", "xp_3", "xp_4"]);
  });

  it("rejects malformed records without failing the batch", async () => {
    const { body } = await doPush([{ collection: "nope", id: "x", updatedAt: T0, data: {} }, { collection: "workouts", id: "wk_bad", updatedAt: "not-a-date", data: {} }, { collection: "profile", id: "wrong", updatedAt: T0, data: {} }, workoutRecord("wk_ok", T0)]);
    expect(body.accepted).toEqual(["workouts:wk_ok"]);
    expect(body.rejected.map((r) => r.key).sort()).toEqual(["nope:x", "profile:wrong", "workouts:wk_bad"]);
  });

  it("caps a push at 500 records", async () => {
    const res = await push(makeRequest("/api/sync/push", { body: { records: Array.from({ length: 501 }, (_, i) => workoutRecord(`w${i}`, T0)) }, cookie: account.cookie }));
    expect(res.status).toBe(400);
  });
});
