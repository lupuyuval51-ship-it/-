import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeRequest, readJson, registerAccount, setupTestEnv, type TestAccount } from "./helpers";
import { MANIFEST_EXERCISES } from "../fixtures/manifestExercises";
import type { AdminExercisesResponse, AdminOverviewResponse, AdminSettingsResponse, AdminUsersResponse, CatalogOverridesResponse } from "@/lib/serverTypes";

const env = setupTestEnv("admin");

import { requireAdmin } from "@/server/auth/session";
import { setBuiltinCatalogForTests } from "@/server/catalog";
import { GET as overview } from "@/app/api/admin/overview/route";
import { GET as logs } from "@/app/api/admin/logs/route";
import { GET as getSettings, PUT as putSettings } from "@/app/api/admin/settings/route";
import { GET as listExercises, POST as createExercise, PUT as updateExercise, DELETE as deleteExercise } from "@/app/api/admin/exercises/route";
import { GET as listBlocks, POST as createBlock, DELETE as deleteBlock } from "@/app/api/admin/blocks/route";
import { GET as listUsers } from "@/app/api/admin/users/route";
import { GET as overrides } from "@/app/api/catalog/overrides/route";
import { GET as health } from "@/app/api/health/route";

afterAll(() => env.teardown());

let admin: TestAccount;
let user: TestAccount;

beforeAll(async () => {
  setBuiltinCatalogForTests(MANIFEST_EXERCISES.slice(0, 12));
  admin = await registerAccount("admin@example.com");
  user = await registerAccount("plain@example.com");
});

describe("admin access", () => {
  it("requireAdmin denies guests and normal users, allows admins", async () => {
    expect(admin.user.role).toBe("admin");
    expect(user.user.role).toBe("user");
    await expect(requireAdmin(makeRequest("/api/admin/overview"))).rejects.toMatchObject({ status: 401 });
    await expect(requireAdmin(makeRequest("/api/admin/overview", { cookie: user.cookie }))).rejects.toMatchObject({ status: 403, code: "forbidden" });
    await expect(requireAdmin(makeRequest("/api/admin/overview", { cookie: admin.cookie }))).resolves.toMatchObject({ role: "admin" });

    const denied = await overview(makeRequest("/api/admin/overview", { cookie: user.cookie }));
    expect(denied.status).toBe(403);
    expect((await readJson(denied)).code).toBe("forbidden");
    expect((await overview(makeRequest("/api/admin/overview"))).status).toBe(401);
    expect((await listUsers(makeRequest("/api/admin/users", { cookie: user.cookie }))).status).toBe(403);
    expect((await putSettings(makeRequest("/api/admin/settings", { method: "PUT", body: { claude_model: "x" }, cookie: user.cookie }))).status).toBe(403);
  });

  it("overview and logs respond for admins", async () => {
    const res = await overview(makeRequest("/api/admin/overview", { cookie: admin.cookie }));
    expect(res.status).toBe(200);
    const body = await readJson<AdminOverviewResponse>(res);
    expect(body.windows.map((w) => w.window)).toEqual(["24h", "7d", "30d"]);
    expect(body.usersTotal).toBe(2);
    expect(body.claudeConfigured).toBe(false);
    expect(body.model).toBe("claude-opus-5");
    const logRes = await logs(makeRequest("/api/admin/logs?limit=10", { cookie: admin.cookie }));
    expect(logRes.status).toBe(200);
    expect(Array.isArray((await readJson(logRes)).logs)).toBe(true);
  });

  it("settings override env at runtime", async () => {
    const before = await readJson<AdminSettingsResponse>(await getSettings(makeRequest("/api/admin/settings", { cookie: admin.cookie })));
    expect(before.effective.model).toBe("claude-opus-5");
    const put = await putSettings(makeRequest("/api/admin/settings", { method: "PUT", body: { claude_model: "claude-sonnet-5", ai_rate_limit_per_hour: 5, maintenance_notice: "" }, cookie: admin.cookie }));
    expect(put.status).toBe(200);
    const after = await readJson<AdminSettingsResponse>(put);
    expect(after.settings.claude_model).toBe("claude-sonnet-5");
    expect(after.effective.model).toBe("claude-sonnet-5");
    expect(after.effective.perHour).toBe(5);
    expect(after.effective.maintenanceNotice).toBeNull();
    const bad = await putSettings(makeRequest("/api/admin/settings", { method: "PUT", body: { unknown_key: 1 }, cookie: admin.cookie }));
    expect(bad.status).toBe(400);
    const reset = await readJson<AdminSettingsResponse>(await putSettings(makeRequest("/api/admin/settings", { method: "PUT", body: { claude_model: null, ai_rate_limit_per_hour: null }, cookie: admin.cookie })));
    expect(reset.effective.model).toBe("claude-opus-5");
  });

  it("manages catalog exercises and exposes overrides publicly", async () => {
    const list = await readJson<AdminExercisesResponse>(await listExercises(makeRequest("/api/admin/exercises", { cookie: admin.cookie })));
    expect(list.exercises.length).toBe(12);
    expect(list.exercises.every((e) => e.source === "builtin" && e.enabled)).toBe(true);

    const custom = { ...MANIFEST_EXERCISES[20], id: "admin_custom_drill", name: { he: "תרגיל אדמין", en: "Admin drill" } };
    const created = await createExercise(makeRequest("/api/admin/exercises", { body: custom, cookie: admin.cookie }));
    expect(created.status).toBe(201);
    const dup = await createExercise(makeRequest("/api/admin/exercises", { body: custom, cookie: admin.cookie }));
    expect(dup.status).toBe(409);
    const invalid = await createExercise(makeRequest("/api/admin/exercises", { body: { ...custom, id: "bad_one", skills: [] }, cookie: admin.cookie }));
    expect(invalid.status).toBe(400);
    expect((await readJson(invalid)).code).toBe("validation");

    const builtinId = MANIFEST_EXERCISES[0].id;
    const toggled = await updateExercise(makeRequest("/api/admin/exercises", { method: "PUT", body: { id: builtinId, enabled: false }, cookie: admin.cookie }));
    expect(toggled.status).toBe(200);

    const after = await readJson<AdminExercisesResponse>(await listExercises(makeRequest("/api/admin/exercises", { cookie: admin.cookie })));
    expect(after.exercises.length).toBe(13);
    expect(after.exercises.find((e) => e.exercise.id === builtinId)?.enabled).toBe(false);
    expect(after.exercises.find((e) => e.exercise.id === "admin_custom_drill")?.source).toBe("admin");

    const pub = await overrides(makeRequest("/api/catalog/overrides"));
    expect(pub.status).toBe(200);
    expect(pub.headers.get("cache-control")).toContain("max-age=300");
    const pubBody = await readJson<CatalogOverridesResponse>(pub);
    expect(pubBody.disabledIds).toEqual([builtinId]);
    expect(pubBody.enabled.map((e) => e.id)).toEqual(["admin_custom_drill"]);

    const removed = await deleteExercise(makeRequest("/api/admin/exercises?id=admin_custom_drill", { method: "DELETE", cookie: admin.cookie }));
    expect(await readJson(removed)).toMatchObject({ ok: true, deleted: true });
    const disabled = await deleteExercise(makeRequest(`/api/admin/exercises?id=${MANIFEST_EXERCISES[1].id}`, { method: "DELETE", cookie: admin.cookie }));
    expect(await readJson(disabled)).toMatchObject({ ok: true, disabled: true });
    expect((await deleteExercise(makeRequest("/api/admin/exercises?id=does_not_exist", { method: "DELETE", cookie: admin.cookie }))).status).toBe(404);
  });

  it("creates and removes abuse blocks", async () => {
    const created = await createBlock(makeRequest("/api/admin/blocks", { body: { subject: "guest:abuser", reason: "spam", hours: 3 }, cookie: admin.cookie }));
    expect(created.status).toBe(201);
    const list = await readJson<{ blocks: { subject: string }[] }>(await listBlocks(makeRequest("/api/admin/blocks", { cookie: admin.cookie })));
    expect(list.blocks.map((b) => b.subject)).toEqual(["guest:abuser"]);
    expect((await createBlock(makeRequest("/api/admin/blocks", { body: { subject: "nonsense" }, cookie: admin.cookie }))).status).toBe(400);
    const removed = await readJson<{ blocks: unknown[] }>(await deleteBlock(makeRequest("/api/admin/blocks?subject=guest:abuser", { method: "DELETE", cookie: admin.cookie })));
    expect(removed.blocks).toEqual([]);
  });

  it("lists users with masked emails only", async () => {
    const body = await readJson<AdminUsersResponse>(await listUsers(makeRequest("/api/admin/users", { cookie: admin.cookie })));
    expect(body.count).toBe(2);
    expect(body.users.map((u) => u.emailMasked).sort()).toEqual(["a***@e***.com", "p***@e***.com"]);
    expect(JSON.stringify(body)).not.toContain("admin@example.com");
    expect(body.users.every((u) => typeof u.sessionsCount === "number")).toBe(true);
  });

  it("health reports the embedded database", async () => {
    const body = await readJson<{ ok: boolean; db: string; claudeConfigured: boolean; version: string }>(await health(makeRequest("/api/health")));
    expect(body).toMatchObject({ ok: true, db: "pglite", claudeConfigured: false });
    expect(body.version).toMatch(/^\d+\.\d+\.\d+/);
  });
});
