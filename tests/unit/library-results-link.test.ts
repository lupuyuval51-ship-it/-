import { describe, expect, it } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { request } from "./helpers";
import { editStored, NOTES, phone } from "./offline-helpers";

describe("a game's Results link while a replay is under way", () => {
  it("the row names the newest finished run apart from the replay that was just started", () => {
    const { store, kv } = phone(1_000_000);
    const g = store.addGame(generateOffline(request({ material: NOTES, subject: "Plants", mode: "FAST" })).spec);
    const first = store.startSession(g.id, false);
    expect(store.listGames().find((x) => x.id === g.id)!.lastDoneSessionId).toBeNull(); // nothing finished yet
    // the first run is finished (as the store leaves a run the player completed)
    editStored(kv, `session.${first.session.id}`, (v) => { v.status = "COMPLETED"; v.finishedAt = 1_000_500; });
    const replay = store.startSession(g.id, true);
    expect(replay.session.id).not.toBe(first.session.id);
    const row = store.listGames().find((x) => x.id === g.id)!;
    expect(row.lastSessionId).toBe(replay.session.id);
    expect(row.lastDoneSessionId).toBe(first.session.id);
    expect(row.inProgress).toBe(true);
  });

  it("the card links Results to the finished run when there is one", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync(new URL("../../mobile/src/pages/library-parts.tsx", import.meta.url), "utf8");
    expect(src).toContain("results/${g.lastDoneSessionId ?? g.lastSessionId}");
  });
});
