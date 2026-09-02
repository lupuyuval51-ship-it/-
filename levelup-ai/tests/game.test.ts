import assert from "node:assert/strict";
import test from "node:test";
import { arenaAim, arenaLayout, arenaLineBlocked, bossPhase, circleTouchesCover, clampMovement, GAME_MODES, isQuestionComplete, lanePosition, nearestLane, normalizeInput, seededRandom, segmentGameText, slideArenaMovement, WORLD_PALETTES, WORLD_THEMES, type ArenaCover } from "../src/lib/game";

test("same daily seed produces the same environment without leaking answers", () => {
  const first = seededRandom("2026-09-02:html:beginner:league-a");
  const replay = seededRandom("2026-09-02:html:beginner:league-a");
  const different = seededRandom("2026-09-03:html:beginner:league-a");
  const values = Array.from({ length: 50 }, () => first());
  assert.deepEqual(values, Array.from({ length: 50 }, () => replay()));
  assert.notDeepEqual(values, Array.from({ length: 50 }, () => different()));
  assert.ok(values.every((value) => value >= 0 && value < 1));
});

test("gate collision chooses the actual nearest lane at both edges", () => {
  for (const count of [2, 3, 4]) for (let lane = 0; lane < count; lane++) {
    assert.equal(nearestLane(lanePosition(lane, count), count), lane);
    assert.equal(nearestLane(lanePosition(lane, count) + 1.9, count), lane);
    assert.equal(nearestLane(lanePosition(lane, count) - 1.9, count), lane);
  }
  assert.equal(nearestLane(-100, 4), 0);
  assert.equal(nearestLane(100, 4), 3);
});

test("keyboard plus joystick cannot create diagonal speed advantage or leave arena", () => {
  const diagonal = normalizeInput(2, 2);
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.z) - 1) < 1e-10);
  assert.deepEqual(normalizeInput(0, 0), { x: 0, z: 0 });
  assert.deepEqual(normalizeInput(0.2, -0.3), { x: 0.2, z: -0.3 });
  assert.deepEqual(clampMovement(-100, 99), { x: -9, z: 10 });
  assert.deepEqual(clampMovement(100, -99), { x: 9, z: -22 });
});

test("boss has three bounded phases and completion only after all questions", () => {
  assert.equal(bossPhase(0, 8), 1);
  assert.equal(bossPhase(3, 8), 2);
  assert.equal(bossPhase(6, 8), 3);
  assert.equal(bossPhase(8, 8), 3);
  assert.equal(isQuestionComplete(7, 8), false);
  assert.equal(isQuestionComplete(8, 8), true);
});

test("the action arena preserves all five original modes and five themes", () => {
  assert.equal(new Set(GAME_MODES).size, 6);
  assert.ok(GAME_MODES.includes("knowledge-arena"));
  assert.equal(new Set(WORLD_THEMES).size, 5);
  for (const theme of WORLD_THEMES) assert.ok(Object.values(WORLD_PALETTES[theme]).every(Number.isFinite));
  assert.equal(new Set(WORLD_THEMES.map((theme) => WORLD_PALETTES[theme].sky)).size, 5);
});

test("arena layout is deterministic, bounded and keeps the entrance clear", () => {
  for(const layout of ["courtyard","crossroads","islands"]){
    assert.deepEqual(arenaLayout("lesson-4",layout,9),arenaLayout("lesson-4",layout,9));
    assert.equal(arenaLayout("lesson-4",layout,99).length,12);
    assert.equal(arenaLayout("lesson-4",layout,0).length,4);
    for(const cover of arenaLayout("lesson-4",layout,12))assert.equal(circleTouchesCover({x:0,z:7.4},.6,cover),false);
    assert.equal(arenaLineBlocked({x:0,z:7.4},{x:-6.1,z:-9},arenaLayout("lesson-4",layout,6),.13),false,"The first target must be reachable from the entrance.");
  }
  assert.notDeepEqual(arenaLayout("same","courtyard",6),arenaLayout("same","crossroads",6));
});

test("cover blocks energy bolts from either direction without blocking a clear lane", () => {
  const covers:ArenaCover[]=[{x:0,z:0,width:2,depth:2,style:"stone"}];
  assert.equal(arenaLineBlocked({x:0,z:5},{x:0,z:-5},covers),true);
  assert.equal(arenaLineBlocked({x:0,z:-5},{x:0,z:5},covers),true);
  assert.equal(arenaLineBlocked({x:3,z:5},{x:3,z:-5},covers),false);
  assert.equal(arenaLineBlocked({x:0,z:0},{x:0,z:0},covers),true);
});

test("dash cannot tunnel through cover and diagonal movement slides along its side", () => {
  const covers:ArenaCover[]=[{x:0,z:0,width:2,depth:2,style:"stone"}];
  const dash=slideArenaMovement({x:0,z:4},{x:0,z:-8},covers);
  assert.ok(dash.z>=1.48);
  const slide=slideArenaMovement({x:1.5,z:2},{x:-.3,z:-2},covers);
  assert.ok(slide.z<1.8);
  assert.equal(circleTouchesCover(slide,.48,covers[0]),false);
  const bounds=slideArenaMovement({x:0,z:0},{x:100,z:-100},[]);
  assert.ok(bounds.x<=9.22&&bounds.z>=-12.32);
});

test("auto aim returns a stable unit vector even for a coincident target", () => {
  assert.deepEqual(arenaAim({x:2,z:3},{x:2,z:3}),{x:0,z:-1});
  const direction=arenaAim({x:1,z:1},{x:4,z:5});
  assert.ok(Math.abs(Math.hypot(direction.x,direction.z)-1)<1e-10);
  assert.equal(direction.x,.6);assert.equal(direction.z,.8);
});

test("RTL text isolates subtraction and division without changing operand order", () => {
  for(const expression of ["20 − 3", "20 / 5", "(20 − 3) ÷ 2", "-20 - -3", "20 − 3 = 17"]){
    const input=`תרגיל 1: כמה הם ${expression}?`;
    const segments=segmentGameText(input);
    assert.equal(segments.map(segment=>segment.text).join(""),input);
    assert.deepEqual(segments.filter(segment=>segment.ltr).map(segment=>segment.text),[expression]);
  }
});

test("mixed code and math remain literal directional text, including HTML-like snippets", () => {
  for(const code of ["const result = 20 − 3;", "array.map(x => x - 2)", '<img src="x" onerror="alert(1)">']){
    const input=`בדקו את הקוד ${code} ואז המשיכו.`;
    const segments=segmentGameText(input);
    assert.equal(segments.map(segment=>segment.text).join(""),input);
    assert.deepEqual(segments.filter(segment=>segment.ltr).map(segment=>segment.text),[code]);
  }
  assert.deepEqual(segmentGameText("תרגיל 1: המשיכו"),[{text:"תרגיל 1: המשיכו",ltr:false}]);
  assert.deepEqual(segmentGameText(""),[]);
});
