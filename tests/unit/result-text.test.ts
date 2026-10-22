import { describe, expect, it } from "vitest";
import { repeatsLabel } from "@/components/game/hud/result-text";
import { generateOffline } from "@/lib/offline/generate";
import { OfflineStore, memoryKV } from "@/lib/offline/store";
import { NOTES, PREFIX } from "./offline-helpers";
import { request } from "./helpers";

describe("a result line that only repeats the heading", () => {
  it("is left out; a line that adds something stays", () => {
    expect(repeatsLabel("נכון!", "נכון!")).toBe(true);
    expect(repeatsLabel("Correct", "Correct!")).toBe(true);
    expect(repeatsLabel("נכון — כי המכנה הוא למטה.", "נכון!")).toBe(false);
    expect(repeatsLabel("", "נכון!")).toBe(false);
  });
});

describe("the library card of a finished game", () => {
  it("shows the missions of its latest finished run, not an empty bar", () => {
    const kv = memoryKV();
    const store = new OfflineStore(kv, () => 1_000);
    const { spec } = generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" }));
    const game = store.addGame(spec);
    expect(store.listGames().find((g) => g.id === game.id)?.percent).toBe(0);
    const { session } = store.startSession(game.id, false);
    kv.set(`${PREFIX}session.${session.id}`, JSON.stringify({ ...session, status: "COMPLETED", finishedAt: 2_000, state: { ...session.state, missionsDone: spec.missions.map((m) => m.id) } }));
    const row = store.listGames().find((g) => g.id === game.id)!;
    expect(row).toMatchObject({ completed: true, inProgress: false, percent: 100 });
  });
});
