/**
 * Client sync engine + apiFetch + account actions, driven end-to-end against the real route handlers
 * through a mocked global fetch (cookie jar included). Runs in Node: no window, so the engine's listeners
 * are skipped and syncNow() is called directly.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { setupTestEnv } from "./helpers";

const env = setupTestEnv("clientsync");

import { useAppStore } from "@/store/appStore";
import { apiFetch, ApiError, apiErrorMessage } from "@/store/api";
import { applyRemoteRecords, buildPushRecords, stopSync, syncNow } from "@/store/sync";
import { login as clientLogin, logout as clientLogout, me as clientMe, register as clientRegister } from "@/store/auth";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as me } from "@/app/api/auth/me/route";
import { POST as push } from "@/app/api/sync/push/route";
import { GET as pull } from "@/app/api/sync/pull/route";
import type { Workout } from "@/lib/types";

type Handler = (req: Request) => Promise<Response>;
const ROUTES: Record<string, Handler> = {
  "POST /api/auth/register": register,
  "POST /api/auth/login": login,
  "POST /api/auth/logout": logout,
  "GET /api/auth/me": me,
  "POST /api/sync/push": push,
  "GET /api/sync/pull": pull,
};

let jar: string | null = null;
const realFetch = globalThis.fetch;

beforeAll(() => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, "http://localhost");
    const method = init?.method ?? "GET";
    const handler = ROUTES[`${method} ${url.pathname}`];
    if (!handler) return new Response(JSON.stringify({ ok: false, code: "not_found", message: "no route" }), { status: 404, headers: { "content-type": "application/json" } });
    const headers = new Headers(init?.headers);
    if (jar) headers.set("cookie", jar);
    const res = await handler(new Request(url, { method, headers, body: init?.body as string | undefined }));
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) jar = setCookie.startsWith("dc_session=;") ? null : setCookie.split(";")[0];
    return res;
  }) as typeof fetch;
});

afterAll(async () => {
  globalThis.fetch = realFetch;
  stopSync();
  await env.teardown();
});

function workout(id: string, title: string): Workout {
  return {
    id, source: "custom", title: { he: title, en: title }, goal: { he: "", en: "" }, targetRole: "handler", level: "intermediate", totalDurationMinutes: 90,
    intensity: "medium", participants: "solo", fieldSize: "medium", requiredEquipment: [], coachMessage: { he: "", en: "" }, tags: [], phases: [], expectedMetrics: [],
    includesFitness: false, includesChallenge: false, createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T00:00:00.000Z",
  };
}

describe("client sync engine", () => {
  it("does nothing for guests and builds push records from the queue", async () => {
    const store = useAppStore.getState();
    store.upsert("workouts", workout("wk_local", "Local workout"));
    store.upsert("savedWorkouts", { id: "sv_1", workoutId: "wk_local", savedAt: "2026-09-01T00:00:00.000Z", updatedAt: "" });
    store.updateSettings({ locale: "he" });
    expect(Object.keys(useAppStore.getState().syncQueue).sort()).toEqual(["savedWorkouts:sv_1", "settings:settings", "workouts:wk_local"]);
    const result = await syncNow();
    expect(result.skipped).toBe("guest");
    expect(useAppStore.getState().syncStatus.state).toBe("disabled");

    const state = useAppStore.getState();
    const { records, orphans } = buildPushRecords(state, { ...state.syncQueue, "workouts:missing": { collection: "workouts", id: "missing", updatedAt: "2026-09-01T00:00:00.000Z" }, "bogus:x": { collection: "bogus", id: "x", updatedAt: "2026-09-01T00:00:00.000Z" } });
    expect(orphans.sort()).toEqual(["bogus:x", "workouts:missing"]);
    expect(records.map((r) => `${r.collection}:${r.id}`).sort()).toEqual(["savedWorkouts:sv_1", "settings:settings", "workouts:wk_local"]);
    const settings = records.find((r) => r.collection === "settings")!;
    expect(settings.id).toBe("settings");
    expect((settings.data as { locale: string }).locale).toBe("he");
  });

  it("register moves guest data to the account and syncs", async () => {
    const user = await clientRegister({ email: "client@example.com", password: "client-password-1" });
    expect(user.email).toBe("client@example.com");
    const s = useAppStore.getState();
    expect(s.auth.mode).toBe("account");
    expect(s.auth.userId).toBe(user.id);
    expect(s.auth.role).toBe("admin");
    expect(s.syncStatus.state).toBe("idle");
    expect(s.syncStatus.pending).toBe(0);
    expect(Object.keys(s.syncQueue)).toEqual([]);
    expect(typeof s.auth.lastSyncAt).toBe("string");

    const pulled = await apiFetch<{ records: { collection: string; id: string }[] }>("/api/sync/pull");
    expect(pulled.records.map((r) => `${r.collection}:${r.id}`).sort()).toEqual(["savedWorkouts:sv_1", "settings:settings", "workouts:wk_local"]);
  });

  it("pulls remote changes and lets the newer server version win a conflict", async () => {
    // Another device pushes a newer version of the workout.
    const remote = { ...workout("wk_local", "Renamed elsewhere"), updatedAt: "2030-01-01T00:00:00.000Z" };
    await apiFetch("/api/sync/push", { method: "POST", body: { records: [{ collection: "workouts", id: "wk_local", updatedAt: remote.updatedAt, data: remote }] } });
    const r1 = await syncNow();
    expect(r1.ok).toBe(true);
    expect(useAppStore.getState().collections.workouts.wk_local.title.en).toBe("Renamed elsewhere");

    // A stale local edit (older updatedAt) is pushed: the server keeps its version and the client applies it.
    useAppStore.setState((s) => ({
      collections: { ...s.collections, workouts: { ...s.collections.workouts, wk_local: { ...s.collections.workouts.wk_local, title: { he: "ישן", en: "Stale local" }, updatedAt: "2029-01-01T00:00:00.000Z" } } },
      syncQueue: { ...s.syncQueue, "workouts:wk_local": { collection: "workouts", id: "wk_local", updatedAt: "2029-01-01T00:00:00.000Z" } },
    }));
    const r2 = await syncNow();
    expect(r2.conflicts).toBe(1);
    expect(useAppStore.getState().collections.workouts.wk_local.title.en).toBe("Renamed elsewhere");
    expect(useAppStore.getState().syncQueue["workouts:wk_local"]).toBeUndefined();

    // New local records go up on the next cycle; soft deletes too.
    useAppStore.getState().upsert("workouts", workout("wk_two", "Second"));
    useAppStore.getState().remove("workouts", "wk_two");
    const r3 = await syncNow();
    expect(r3.pushed).toBe(1);
    const pulled = await apiFetch<{ records: { collection: string; id: string; deletedAt: string | null }[] }>("/api/sync/pull");
    expect(pulled.records.find((r) => r.id === "wk_two")?.deletedAt).toBeTruthy();
    expect(useAppStore.getState().collections.workouts.wk_two.deletedAt).toBeTruthy();
  });

  it("applyRemoteRecords never marks records dirty and respects newer local data", () => {
    const before = Object.keys(useAppStore.getState().syncQueue).length;
    const applied = applyRemoteRecords([
      { collection: "workouts", id: "wk_remote", updatedAt: "2026-09-02T00:00:00.000Z", data: workout("wk_remote", "From server") },
      { collection: "workouts", id: "wk_local", updatedAt: "2000-01-01T00:00:00.000Z", data: workout("wk_local", "Ancient") },
      { collection: "settings", id: "settings", updatedAt: "2000-01-01T00:00:00.000Z", data: { locale: "en" } },
    ]);
    expect(applied).toBe(3);
    const s = useAppStore.getState();
    expect(s.collections.workouts.wk_remote.title.en).toBe("From server");
    expect(s.collections.workouts.wk_local.title.en).toBe("Renamed elsewhere");
    expect(s.settings.locale).toBe("he");
    expect(Object.keys(s.syncQueue).length).toBe(before);
  });

  it("apiFetch surfaces typed errors with user-facing messages", async () => {
    let caught: unknown;
    try {
      await apiFetch("/api/auth/login", { method: "POST", body: { email: "client@example.com", password: "wrong-password" } });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ApiError);
    const err = caught as ApiError;
    expect(err.code).toBe("invalid_credentials");
    expect(err.status).toBe(401);
    expect(err.offline).toBe(false);
    expect(apiErrorMessage(err, "he")).toBe("האימייל או הסיסמה שגויים.");
    expect(apiErrorMessage(err, "en")).toBe("Wrong email or password.");
    expect(apiErrorMessage(new Error("x"), "he")).toBe("משהו השתבש. נסו שוב בעוד רגע.");
  });

  it("logout keeps local data, me() restores the account, login re-syncs", async () => {
    await clientLogout();
    let s = useAppStore.getState();
    expect(s.auth.mode).toBe("guest");
    expect(s.collections.workouts.wk_local).toBeDefined();
    expect(s.syncStatus.state).toBe("disabled");
    expect(jar).toBeNull();
    expect(await clientMe()).toBeNull();

    await clientLogin({ email: "client@example.com", password: "client-password-1" });
    s = useAppStore.getState();
    expect(s.auth.mode).toBe("account");
    expect(s.syncStatus.state).toBe("idle");
    expect(await clientMe()).toMatchObject({ email: "client@example.com" });

    await clientLogout({ clearLocalData: true });
    s = useAppStore.getState();
    expect(s.auth.mode).toBe("guest");
    expect(Object.keys(s.collections.workouts)).toEqual([]);
  });
});
