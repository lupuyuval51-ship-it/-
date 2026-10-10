# LEVEL UP — Unity renderer (optional)

> **Status: not built or run.** The C# in `LevelUpClient/` was written without a Unity Editor and has never been
> compiled. The TypeScript side (scene export, scene director, bridge protocol, API, headless mode) *is* unit-tested.
> Expect to fix small compile errors on first open.

Unity is a **display layer**. The browser keeps running input, physics, guidance and the server keeps grading, scoring,
rewards and hints. Unity receives:

1. **Scene description** (`GET /api/games/{id}/unity?area={areaId}`, Tier A only, decided on the server): geometry,
   placements, theme colours and the *director* output — themed props, station signage and mood derived from the
   learner's own material (subject, area names, station labels, lore titles). It contains **no** challenge prompts,
   options, answers, hints or explanations (asserted in `tests/unit/unity.test.ts`).
2. **Frames** (~20 Hz): player and camera transforms, nearby target, collected ids, station status, open gates.

Unity can send back only `ready`, `error`, `stats`; the page validates them (`src/lib/game/unity/bridge.ts`) and they
cannot change score, progress or access.

## Build

1. Open `unity/LevelUpClient` in Unity (2022.3 LTS or newer; URP + Newtonsoft package are in `Packages/manifest.json`).
2. Create a scene with a `GameObject` named exactly **`LevelUpBridge`** carrying `LevelUpBridge`, `SceneBuilder` and
   `FrameDriver` (assign `builder`/`driver`, the main camera and a player avatar). Optionally add prefabs named like the
   director's (`Prop_Flask`, `Prop_Sprout`, `Prop_Planet`, …); missing ones fall back to cubes.
3. Set `WebGLInput.captureAllKeyboardInput = false` (the page owns the keyboard), keep compression to *Disabled* or
   configure the server for Brotli/Gzip headers.
4. Build for **WebGL** with the name `levelup` and copy the `Build/` folder to `public/unity/levelup/Build/`
   (`levelup.loader.js`, `.framework.js`, `.data`, `.wasm`).
5. Open a game with `?renderer=unity` (e.g. `/play/{id}?renderer=unity`).

Without a deployed build — or below Tier A — the page keeps the built-in Three.js renderer and says so.
