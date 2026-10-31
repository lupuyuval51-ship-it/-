import { describe, expect, it } from "vitest";
import { toPublicSpec } from "@/lib/game/spec/public";
import { buildUnityScene } from "@/lib/game/unity/scene";
import { directScene } from "@/lib/game/unity/director";
import { buildFrame, parseUnityMessage } from "@/lib/game/unity/bridge";
import { buildWorld } from "@/lib/game/world/build";
import { buildMaterialSpec } from "@/lib/game/material/build";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { request, validDemoSpec } from "./helpers";

const MATERIAL = `Photosynthesis: the process plants use to turn light into chemical energy.
Chlorophyll: the green pigment in leaves that absorbs light.
Stomata: tiny pores on a leaf that let gases in and out.
Xylem: the tissue that carries water from the roots up the plant.
Phloem: the tissue that carries sugar around the plant.
Glucose: the sugar plants make during photosynthesis.`;

describe("unity scene export", () => {
  const spec = validDemoSpec();
  const pub = toPublicSpec(spec);

  it("is deterministic and versioned", () => {
    const a = buildUnityScene(pub, pub.areas[0]!.id);
    const b = buildUnityScene(pub, pub.areas[0]!.id);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.schema).toBe("levelup.unity-scene");
    expect(a.version).toBe(1);
    expect(a.stations.length).toBe(buildWorld(pub, pub.areas[0]!.id).stations.length);
  });

  it("never contains challenge content (prompts, answers, hints, explanations)", () => {
    for (const area of pub.areas) {
      const json = JSON.stringify(buildUnityScene(pub, area.id));
      for (const ch of spec.challenges) {
        expect(json).not.toContain(ch.prompt);
        expect(json).not.toContain(ch.explanation);
        if (ch.hint) expect(json).not.toContain(ch.hint);
        if (ch.type === "choice") for (const o of ch.options) expect(json).not.toContain(o.feedback);
      }
      expect(json).not.toMatch(/correctOptionId|"solution"|"explanation"/);
    }
  });

  it("director props are render-only and sit near their station", () => {
    const world = buildWorld(pub, pub.areas[0]!.id);
    const d = directScene(pub, world);
    expect(d.props.length).toBeGreaterThan(0);
    for (const p of d.props) {
      expect(p.decorative).toBe(true);
      const st = world.stations.find((s) => s.stationId === p.stationId)!;
      expect(Math.hypot(p.x - st.x, p.z - st.z)).toBeLessThan(4);
    }
    expect(d.signs.map((s) => s.stationId).sort()).toEqual(world.stations.map((s) => s.stationId).sort());
  });
});

describe("director builds scenery from the learner's material", () => {
  it("picks the plant motif for a photosynthesis lesson", () => {
    const req = request({ material: MATERIAL, subject: "Photosynthesis and plants", learningGoal: "Understand how plants make food" } as never);
    const res = validateGameSpec(buildMaterialSpec(req).raw, { alignGameType: req.gameType });
    if (!res.ok) throw new Error(res.errors.join("; "));
    const spec = toPublicSpec(res.spec);
    const d = directScene(spec, buildWorld(spec, spec.areas[0]!.id));
    expect(d.motifs).toContain("plants");
    expect(d.props.some((p) => ["Prop_Sprout", "Prop_Fern", "Prop_Blossom"].includes(p.prefab))).toBe(true);
  });
});

describe("unity bridge", () => {
  it("accepts only well-formed messages from Unity", () => {
    expect(parseUnityMessage('{"type":"ready","version":"1"}')).toEqual({ type: "ready", version: "1" });
    expect(parseUnityMessage('{"type":"stats","fps":58}')).toEqual({ type: "stats", fps: 58 });
    expect(parseUnityMessage('{"type":"score","points":999}')).toBeNull();
    expect(parseUnityMessage('{"type":"ready","extra":1}')).toBeNull();
    expect(parseUnityMessage("not json")).toBeNull();
    expect(parseUnityMessage(`{"type":"error","message":"${"x".repeat(5000)}"}`)).toBeNull();
    expect(parseUnityMessage({ type: "ready" })).toBeNull();
  });

  it("builds a compact frame", () => {
    const frame = buildFrame(
      {
        sim: { time: 1.23456, player: { x: 1.00049, y: 0, z: 2, yaw: 0.5, speed: 3, grounded: true } },
        nearby: { kind: "station", id: "s1" },
        client: { collected: ["c1"] },
        world: { stations: [{ stationId: "s1" }], gates: [{ id: "g1" }, { id: "g2" }] },
        stationStatus: () => "active",
        gateOpen: (id) => id === "g2",
      },
      { x: 0, y: 5, z: 0, lx: 1, ly: 1, lz: 1 },
    );
    expect(frame.t).toBe(1.235);
    expect(frame.player.x).toBe(1);
    expect(frame.stations).toEqual({ s1: "active" });
    expect(frame.openGates).toEqual(["g2"]);
  });
});
