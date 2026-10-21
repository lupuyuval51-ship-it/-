import { afterAll, describe, expect, it } from "vitest";
import { PATCH } from "@/app/api/account/route";
import { db, disconnectDb } from "@/server/db";
import { createTestUser, makeRequest, readJson } from "./helpers";

afterAll(disconnectDb);

describe("PATCH /api/account: the display name follows the sign-up rules", () => {
  it("a name with a control character (a NUL) is a 400, never a server error, and nothing is saved", async () => {
    const u = await createTestUser({ name: "Dana" });
    for (const displayName of ["Da\u0000na", "Da\u0007na"]) {
      const res = await PATCH(makeRequest("PATCH", "/api/account", { cookie: u.cookie, body: { displayName } }));
      expect(res.status, displayName).toBe(400);
    }
    expect((await db.userProfile.findUniqueOrThrow({ where: { userId: u.id } })).displayName).toBe("Dana");
  });

  it("a normal name is saved, trimmed", async () => {
    const u = await createTestUser({ name: "Dana" });
    const res = await PATCH(makeRequest("PATCH", "/api/account", { cookie: u.cookie, body: { displayName: "  נועה  " } }));
    expect(res.status).toBe(200);
    expect((await readJson<{ displayName: string }>(res)).displayName).toBe("נועה");
  });
});
