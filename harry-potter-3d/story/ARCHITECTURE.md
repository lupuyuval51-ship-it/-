# Eldermoor: The Ninth Lantern — Story Mode Architecture & Story Bible

> Hebrew title: **אלדרמור: הפנס התשיעי**. An ORIGINAL story set in an original magic academy.
> No characters, places, plot points, house names or text from any existing book/film franchise.
> The four combat spell names (Stupefy, Expelliarmus, Lumos, Expecto Patronum) are reused as game
> mechanics only. Never use the words Hogwarts, Gryffindor, Slytherin, Ravenclaw, Hufflepuff, Harry,
> Hermione, Ron, Dumbledore, Hagrid, Snape, Voldemort, Muggle, Quidditch, sorting hat, lightning scar,
> or any quotation from existing books inside story mode.

This file is the **interface contract** between the story-mode modules. Every module MUST follow it
exactly — names, signatures, coordinates. If something is missing, choose the simplest behaviour
consistent with this file and leave a short `// CONTRACT-NOTE:` comment.

---------------------------------------------------------------------------------------------------

## 1. Files and load order

```
harry-potter-3d/story.html          shell: DOM, CSS, script tags         (owner: CORE)
harry-potter-3d/story/core.js       engine, input, player, UI, combat    (owner: CORE)
harry-potter-3d/story/characters.js NPC/enemy/prop models + portraits    (owner: CHARACTERS)
harry-potter-3d/story/world.js      the 7 areas (exterior + interiors)   (owner: WORLD)
harry-potter-3d/story/story.js      chapters, dialogue, quests, boss     (owner: STORY)
```

`story.html` loads, in this order, classic scripts (no ES modules, no other libraries):

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="story/core.js"></script>
<script src="story/characters.js"></script>
<script src="story/world.js"></script>
<script src="story/story.js"></script>
<script>window.ELD && ELD.boot();</script>
```

* Three.js **r128** API only (BoxGeometry, CylinderGeometry, ConeGeometry, SphereGeometry, PlaneGeometry,
  CircleGeometry, RingGeometry, TorusGeometry, LatheGeometry, ExtrudeGeometry, Shape, BufferGeometry,
  CanvasTexture, Sprite, SpriteMaterial, Points, InstancedMesh (set `frustumCulled=false` on InstancedMesh —
  r128 culls them by the base geometry's bounding sphere), MeshStandardMaterial, MeshLambertMaterial,
  MeshBasicMaterial, MeshPhongMaterial, FogExp2, HemisphereLight, PointLight, SpotLight, DirectionalLight,
  AdditiveBlending, DoubleSide). `THREE.Geometry` does not exist. No addons (no loaders, no controls,
  no TextGeometry, no composer).
* Each JS file is one IIFE: `(function(){ 'use strict'; const ELD = window.ELD; ... })();`
  `core.js` creates `window.ELD = window.ELD || {}` first. Modules only touch `ELD.*` and never other globals.
* `characters.js`, `world.js`, `story.js` must not run heavy work at load time — only register things.
  Building happens when core calls them after `ELD.boot()`.
* Plain ES2018. dt-based logic; dt clamped to 0.05 s.

## 2. Conventions

* Units = metres, Y up. Every area's walkable floor is at **y = 0**. `ELD.player.pos` is the FEET position;
  camera eye height 1.65.
* **Yaw**: 0 faces **−Z ("north")**. Forward = `(-sin(yaw), 0, -cos(yaw))`. yaw = π faces +Z (south),
  yaw = π/2 faces −X (west), yaw = −π/2 faces +X (east).
* Bilingual text object: `{ he: string | {m: string, f: string}, en: string }`. `he` may be gendered
  (m = addressing a male player, f = female player). Placeholder `{name}` is replaced with the player's name.
  Resolve with `ELD.tx(obj)`. Address the player in Hebrew with correct gender (use `{m,f}` whenever the line
  is gendered); neutral lines may be a plain string.
* Colliders: axis-aligned boxes on XZ `{minX,maxX,minZ,maxZ,h}` (h = height in metres, default 99; bolts pass
  over a collider when bolt.y > h). Player radius 0.4. The player is also clamped inside `area.bounds`.
* Shared (cached, module-level) geometries/materials/textures MUST be marked `obj.userData.keep = true`.
  Core disposes everything else in an area's group when the area unloads.

## 3. CORE (`story.html` + `core.js`)

### 3.1 Namespace utilities
```
ELD.version = '1.0'
ELD.lang                         'he' | 'en' (default 'he', persisted in localStorage 'eld_lang', try/catch)
ELD.setLang(l)                   updates <html lang dir>, all [data-i18n] nodes, emits 'lang'
ELD.t(key)                       UI string from ELD.STRINGS[lang][key] (core-owned UI strings)
ELD.tx(textObj|string)           resolves bilingual/gendered text + {name}
ELD.profile = { name: string, gender: 'm'|'f' }   default {name:'אריאל'/'Ariel' per lang, gender:'m'}
ELD.on(evt, fn) / ELD.off(evt, fn) / ELD.emit(evt, data)
ELD.util = { rand(a,b), randInt(a,b), clamp(v,a,b), lerp(a,b,t), damp(a,b,lambda,dt),
             canvasTexture(w, h, draw(ctx2d,w,h)) -> CanvasTexture,
             glowTexture(cssColor, size=128) -> CanvasTexture (radial gradient, cached, keep=true),
             glowSprite(cssColor, scale, opacity=1) -> Sprite (additive, depthWrite false),
             noiseTexture(baseCss, speckCss, size=256, repeat) -> CanvasTexture,
             keep(obj) -> marks obj.userData.keep = true and returns obj }
ELD.three = { renderer, scene, camera }       created in ELD.boot()
ELD.state                         'title' | 'playing' | 'paused' | 'ended'
```

### 3.2 Boot
`ELD.boot()`: if `THREE` missing or WebGL unavailable → bilingual fallback message. Else create renderer
(antialias, pixelRatio ≤ 2, shadowMap on, sRGB-ish `outputEncoding = THREE.sRGBEncoding`), scene, camera
(FOV 70), the wand (child of camera, lower right; tip glow + Lumos PointLight that ALWAYS exists in the scene
with intensity 0 when off — never add/remove lights at runtime to avoid shader recompiles), the objective
marker sprite, resize handling, the RAF loop, the title screen. Debug hook `window.__eldDebug` (§3.10).

### 3.3 Areas
```
ELD.registerArea(id, buildFn)    buildFn(ctx) -> AreaDef ; ctx = { THREE, util: ELD.util, ELD }
ELD.loadArea(id, spawnName) -> Promise   fade out (350 ms), unload old (remove group, dispose non-keep,
                                         combat.clear(), clear interactables, run old.dispose?.()),
                                         build new, add group, apply ambient, place player at spawn,
                                         emit 'areaLoaded' {id, spawn}, fade in. Re-entrant safe (queue).
ELD.area                          current AreaDef (null before first load)
ELD.getAnchor(name) -> {x,y,z,yaw?} | null   (from current area)
ELD.getDoor(doorId) -> door | null           (from current area)
ELD.setDoor(doorId, locked:boolean, msg?:textObj)   persistent door lock table ELD.doorLocks
```
AreaDef (returned by world builders):
```
{ id, group: THREE.Group,
  bounds: {minX,maxX,minZ,maxZ},
  colliders: [ {minX,maxX,minZ,maxZ,h} ],        // mutable: world api may push/splice at runtime
  spawns:   { name: {x, z, yaw} },
  doors:    [ {id, x, z, radius, to, toSpawn, label: textObj} ],
  anchors:  { name: {x, y, z, yaw?} },
  ambient:  { background: 0xRRGGBB, fogColor, fogDensity, hemiSky, hemiGround, hemiIntensity,
              music: 'night'|'hall'|'calm'|'crypt'|'feast' },
  api:      { ...area-specific functions, see §5 },
  update(dt, t) (optional), dispose() (optional) }
```
Doors: core shows the prompt "E — <label>" when the player is within `radius`. On E: if
`ELD.doorLocks[id]?.locked` → toast its msg (or default "locked" UI string) + soft thud; else
`ELD.loadArea(door.to, door.toSpawn)`. Emits 'doorUsed' {id}. Doors are disabled while a dialogue is open
or while `ELD.player.frozen`.

### 3.4 Player & input
```
ELD.player = { pos: Vector3, yaw, pitch, vel: Vector3, onGround, health, maxHealth: 100,
               frozen: false,                   // true = no move/look/cast (dialogue, cutscenes)
               teleport(x, z, yaw), faceTowards(x, z, ms=400) -> Promise (smooth yaw turn, pitch→0),
               heal(n), damage(n, source) }     // health clamped 0..100; reaching 0 emits 'playerDown' once
```
Controls: WASD/arrows move (4.5 m/s, Shift 7.5), Space jump, mouse look (pointer lock; if lock is refused the
game keeps running and plain mouse movement over the canvas still turns the view), **E** interact / advance
dialogue, left click Stupefy, right click Expelliarmus (preventDefault contextmenu), **Q** Expecto Patronum,
**L** Lumos, **Esc/P** pause, **M** mute, **H** language, **1–4** dialogue choices. While a text input is
focused, keys do nothing to the game.

### 3.5 Interactables
```
ELD.addInteractable({ id, pos: {x,y,z} | () => {x,y,z}, radius = 2.2, label: textObj,
                      onInteract: () => void, enabled?: () => boolean }) -> id
ELD.removeInteractable(id)          (all are cleared automatically on area change)
```
Core picks the nearest enabled interactable within radius (doors included; prefer the one most in front of the
camera) and shows one prompt. Interaction requires state 'playing', no dialogue open, not frozen.

### 3.6 UI (all DOM owned by core; story never touches DOM)
```
ELD.ui.dialogue(lines) -> Promise<choiceValue | undefined>
     line = { who: charId | 'player' | null (narrator), text: textObj, choices?: [{text, value}] }
     Bottom dialogue box (RTL/LTR aware) with portrait (ELD.chars.portrait(who)), name + title
     (ELD.chars.info(who)), typewriter text (fast; E/Space/Enter/click completes then advances).
     Choices shown as numbered buttons (keys 1–4 or click; release pointer lock while choices visible).
     Sets player.frozen while open; soft blip per line. Resolves with the LAST chosen value.
ELD.ui.isDialogueOpen()
ELD.ui.toast(textObj|string, ms = 2600)
ELD.ui.setObjective(textObj | null)               top-start objective panel ("משימה" / "Objective")
ELD.ui.setMarker({x,y,z} | null)                  floating golden sparkle beacon (depthTest false)
                                                  + small edge-of-screen arrow when off-screen
ELD.ui.chapterCard(title, subtitle) -> Promise    full-screen card ~3.2 s (player frozen during it)
ELD.ui.fade(toBlack: boolean, ms = 600) -> Promise
ELD.ui.bossBar(nameTextObj | null, frac 0..1)
ELD.ui.showHealth(bool)                           health bar (hidden outside combat chapters is fine)
ELD.ui.setShards(n | null)                        shard counter "רסיסים 2/3"
ELD.ui.credits(sections) -> Promise               scrolling credits; sections [{title, lines:[textObj]}];
                                                  resolves at end or on E/Esc
ELD.ui.showTitle()                                back to title screen (state 'title')
```
Title screen: logo/title (both languages), tagline, buttons **New Game**, **Continue** (only if
`ELD.save.load()` exists and `!completed`), **Language**, link **"Courtyard Survival mode"** → `index.html`,
note "Designed for desktop keyboard & mouse". New Game opens a small form: name input (max 14 chars, default
per language) + "address me as" male/female → sets `ELD.profile`, calls `ELD.story.start(null)`.
Continue → `ELD.story.start(save)` (story restores profile from save).
Pause overlay: Resume, Restart chapter (calls `ELD.story.restartStep()`), Language, Mute, Quit to title.
HUD: health bar, Patronus cooldown ring, Lumos/mute indicators, spell hint row for UNLOCKED spells only,
crosshair, objective panel, shard counter, toasts, interaction prompt, boss bar, damage vignette, flash.
Visual style: parchment + gold (match `index.html` courtyard mode), serif titles; HUD fits at 375 px wide.

### 3.7 Spells & combat (core)
```
ELD.spells.unlocked = { lumos:false, stupefy:false, expelliarmus:false, patronum:false }
ELD.spells.unlock(id)             also shows a toast "New spell: X" and the key hint
ELD.spells.lumosOn               boolean
ELD.combat.enemies               array of Enemy
ELD.combat.spawnEnemy(def) -> Enemy
   def = { kind:'shade'|'boss'|'dummy', model: Npc (from ELD.chars.create), x, y, z, hp, speed = 2.4,
           hover = 1.4, drainRange = 1.9, drainDps = 10, radius = 1.1, tag, invulnerable = false,
           onHit?(enemy, spellId) -> boolean (true = apply default effect), update?(enemy, dt, t) }
   Enemy = { def, model, pos: Vector3, hp, maxHp, stunned (seconds), shielded:false, alive, tag, data:{} }
ELD.combat.spawnShade(x, y, z, opts={tag}) -> Enemy        hp 2, chases player, drains on contact
ELD.combat.spawnDummy(x, z, opts={tag, moving:false}) -> Enemy   never dies; emits 'dummyHit'
ELD.combat.enemyBolt({ from:{x,y,z}, to:{x,y,z}, speed = 14, damage = 12, color = '#b06cff' })
ELD.combat.kill(enemy) ; ELD.combat.clear() ; ELD.combat.count(tag?) -> alive count
```
Spells (bolts from wand tip along camera forward, speed 40, life 1.4 s, stopped by colliders with h > bolt.y):
* **Stupefy** (left click, 0.35 s cd): default = damage 1, stun 1.2 s.
* **Expelliarmus** (right click, 0.8 s cd): default = damage 1, knockback 6 m, stun 2.5 s.
* **Expecto Patronum** (Q, 12 s cd): silver ring + stag-shaped glowing sprite; for every enemy within 22 m:
  if `def.onHit` → call `onHit(e,'patronum')` and apply default only if it returns true; default = kill
  (dummies: just 'dummyHit').
* **Lumos** (L): toggles wand light (PointLight distance 14, intensity 1.6) — essential in the crypt.
* Casting requires the spell unlocked, state 'playing', no dialogue, not frozen.
* Enemy bolts hitting the player (distance < 0.8 to camera) → `player.damage(damage)`.
Events emitted by core: `'tick' (dt, t)` (only while playing), `'areaLoaded' {id, spawn}`, `'doorUsed' {id}`,
`'spellCast' {id}`, `'enemyKilled' {enemy}`, `'dummyHit' {enemy, spellId}`, `'playerHit' {amount}`,
`'playerDown'`, `'lang'`.

### 3.8 Audio (WebAudio, synthesized, lazy on first gesture, try/catch, master 0.25, M = mute)
sfx: cast per spell, hit, shadeDeath, door, pickup (shard chime), blip (dialogue), relight (big major chord),
bossHit, playerHurt. Ambient music per `area.ambient.music`: soft procedural pads (2–3 detuned oscillators
through lowpass + slow LFO), crossfade on area change; 'crypt' eerie, 'feast' warm major, 'night' calm minor.
`ELD.audio.play(name)`, `ELD.audio.music(name)` are public so story can trigger stings.

### 3.9 Save
`ELD.save.load() -> obj | null`, `ELD.save.store(obj)`, `ELD.save.clear()` — localStorage key
`'eld_story_v1'`, JSON, every access in try/catch. Shape (owned by story):
`{ v:1, chapter, step, profile:{name,gender}, flags:{}, completed:false }`.

### 3.10 Debug hook (for automated tests)
```
window.__eldDebug = {
  info()  -> { state, area, chapter, step, stepId, objective (resolved string), health, enemies,
               dialogueOpen, shards, spells:{...}, lang, pos:{x,z} },
  skip()           -> ELD.story.skip()            // complete the current wait
  goto(chapter)    -> ELD.story.goto(chapter)     // jump to chapter index (0-based)
  teleport(xOrAnchor, z?)                         // anchor name or coordinates in current area
  advance()        // advance/choose first option of the open dialogue
  choose(i)        // pick choice i (0-based) of the open dialogue
  killAll()        // kill every non-dummy enemy
  heal()           // full health
  interact()       // trigger the currently prompted interactable/door
  setLang(l)
}
```

## 4. CHARACTERS (`characters.js`)

```
ELD.chars.create(id, opts = {}) -> Npc
   Npc = { id, object3D: THREE.Group (origin at feet, faces −Z by default), height,
           update(dt, t), lookAt(x, z) (smoothly turns body yaw toward point), setTalking(bool),
           setPose('idle' | 'cast' | 'kneel' | 'point' | 'wave'), setVisible(bool), dispose() }
ELD.chars.info(id) -> { name: textObj, title: textObj, color: '#rrggbb' }   ('player' uses ELD.profile.name)
ELD.chars.portrait(id) -> dataURL (128×128 canvas painting of the character's face/bust, cached)
```
Stylised, readable low-poly figures built from primitives (robes via LatheGeometry/cones, heads spheres,
simple eyes, hair shapes, hands, accessories). Idle animation: breathing, subtle sway, blinking where cheap;
talking: head bob + hand gesture. Shared geometries/materials cached and marked keep. ~2–6 draw calls per
mesh group is fine; under ~40 meshes per character.

| id | who (all ORIGINAL) | look |
|---|---|---|
| `pebble` | **Pebble / פבל** — a chatty stone gargoyle guarding the academy gate, dramatic and vain about his "noble profile" | crouched grey stone creature ~1.2 m, small bat-like stone wings, curled tail, horn nubs, glowing amber eyes, jaw moves when talking, moss patches |
| `orla` | **Headmistress Orla Tamsin / המנהלת אורלה טמסין** — astronomer, calm, dry humour, carries a brass astrolabe staff | tall woman, short silver hair, warm brown skin, deep-teal robe with a copper constellation trim, high collar, brass ring-staff with orbiting tiny spheres |
| `dov` | **Professor Dov Arkin / פרופסור דב ארקין** — enthusiastic charms teacher, mixes metaphors, loves clocks | short and round, mustard-orange robe, big curly ginger-brown hair, round green bow tie, pocket watch chain, rosy cheeks |
| `noa` | **Noa Levin / נועה לוין** — the player's first friend, a tinkerer who builds clockwork creatures, talks fast | young student, dark curly hair in two puffs, brass goggles on forehead, forest-green student robe, leather satchel, a tiny clockwork owl "Tik" (טיק) perched on her shoulder that flaps |
| `tal` | **Tal Shaked / טל שקד** — a sarcastic, proud student who hides that he is afraid of the dark; rival → ally | tall lanky student, black hair with a single cobalt-blue streak, slate-grey robe with rolled sleeves, scarf-less, fingerless gloves |
| `elkan` | **Elkan the Scribe / אלקן הסופר** — the ghost of the founders' scribe, grumpy, loves silence and riddles | translucent pale-cyan floating figure (transparent, additive edge glow), long scholar coat, spectacles on a chain, quill, lower body fading into mist, no feet |
| `morrow` | **Sela Morrow / סֵלָה מורו** — the villain: a former apprentice Lantern Keeper expelled 20 years ago | tall, hooded deep-violet coat with jagged hem, pale face, white streak in dark hair, carries a cracked lantern on a chain glowing violet at her side; violet aura sprite |
| `student` | generic students for crowds, `opts.variant` 0–11 changes skin/hair/robe colour | small robed figures, simple faces |
| `shade` | enemy: a shadow creature of "the Gloom" | smoky black torso made of several dark translucent spheres/ribbons that ripple, two violet glowing eyes, ragged trailing wisps, NO hood/robe (must not resemble a hooded wraith) |
| `dummy` | training dummy prop | wooden post + straw sack body + painted target face |
| `shard` | lantern shard prop | glowing amber-gold crystal shard, slowly spinning, glow sprite |
| `player` | portrait + info only (no 3D needed; may return a minimal Group) | portrait: generic student silhouette with the robe colour gold |

## 5. WORLD (`world.js`) — 7 areas

All areas register via `ELD.registerArea(id, build)` and must return exactly the spawns / doors / anchors /
api below (more decoration anchors are fine). Door meshes, arches and signs are built by world. Interiors
should feel like a cosy-gothic castle: stone walls (procedural CanvasTextures), wooden floors or flagstones,
arched windows, banners in the academy colours (deep blue + copper with a lantern emblem — original), candles,
torches, bookshelves, tapestries. Keep each area ≤ 8 real lights (PointLights) and prefer emissive materials
+ glow sprites. Use shadows only in `grounds`.

### `grounds` — exterior, night (music 'night')
bounds x[-40,40] z[-24,78]. Castle facade (huge, towers, lit windows, the academy's 9 lantern-towers silhouette)
fills z < −26. Courtyard circle r=18 at origin with a fountain at (0,0) (collider box ±2.2). Gate: two pillars at
x=±4, z=40 (pillar top y=4) with walls from |x|=5.5 to 40 at z=40. Forest road x[-6,6] from z=41 to 78 (colliders
block x<−7 and x>7 for z 41–78). Lake visible to the west, forest all around.
* spawns: `start` (0, 74, yaw 0) · `fromCastle` (0, −19, yaw π) · `courtyard` (0, 10, yaw 0)
* doors: `grounds.castleDoor` (0, −23, r 2.6) → `entrance`/`fromGrounds`, label {he:'כניסה לטירה', en:'Enter the castle'}
* anchors: `pebble` (−4, 4, 40, yaw π) [on top of left pillar] · `gate` (0,0,42) · `noa_court` (−6,0,6) ·
  `tal_court` (5,0,−6) · `orla_court` (0,0,−16) · `shade1`…`shade8` on a ring r=16 around origin at y=1.5
* api: none required.

### `entrance` — Entrance Hall (music 'hall')
x[-14,14] z[-12,12], ceiling 12; grand staircase at the north (colliders x[-4,4] z[-12,-8]) rising into an arch;
suits of armour, torches, a big lantern-emblem floor mosaic, hanging banners.
* spawns: `fromGrounds` (0, 8, 0) · `fromGreatHall` (10.5, 0, π/2) · `fromClassroom` (−10.5, −5, −π/2) ·
  `fromLibrary` (−10.5, 5, −π/2) · `fromTower` (0, −5.5, π) · `fromCrypt` (8, −7.5, π)
* doors (all r 2): `entrance.toGrounds` (0, 11) → grounds/fromCastle · `entrance.toGreatHall` (13, 0) →
  greathall/fromEntrance · `entrance.toClassroom` (−13, −5) → classroom/fromEntrance · `entrance.toLibrary`
  (−13, 5) → library/fromEntrance · `entrance.toTower` (0, −7.5) → tower/fromEntrance (foot of stairs) ·
  `entrance.toCrypt` (10, −10) → crypt/fromEntrance (iron trapdoor stair in the NE corner)
  Each door gets a small sign plaque; labels: Grounds/השטח, Great Hall/האולם הגדול, Charms Classroom/כיתת הלחשים,
  Library/הספרייה, Common Room/חדר המועדון, Crypt/המרתף.
* anchors: `noa_entrance` (−3, 0, 3) · `tal_entrance` (4, 0, −4)

### `greathall` — Great Hall (music 'hall', or 'feast' after the finale)
x[-10,10] z[-20,20], ceiling 14. Dais z[-20,-15] at height 0.5 (collider h 0.5 blocks the player). Four long
tables + benches along z from −11 to 13 at x = −7, −2.5, 2.5, 7 (colliders width 2.2 incl. benches, h 1).
**Nine great hanging lanterns** at y=10: positions lantern1..9 = x∈{−5,0,5} × z∈{−8,0,8}, the ninth is (0,10,0)
(centre) — ordering: lantern1(−5,−8) lantern2(0,−8) lantern3(5,−8) lantern4(−5,0) lantern5(5,0) lantern6(−5,8)
lantern7(0,8) lantern8(5,8) lantern9(0,0). Each = glass/metal lantern mesh + warm glow sprite + (only 3 real
PointLights shared for the hall). Tall arched windows, staff table on the dais, floating candles.
* spawns: `fromEntrance` (0, 16, 0)
* doors: `greathall.toEntrance` (0, 19) → entrance/fromGreatHall
* anchors: `orla` (0, 0.5, −17.5, yaw 0→ facing +Z i.e. yaw π) · `dov` (−3.5, 0.5, −17.5, π) · `noa` (−0.6, 0, 3) ·
  `tal` (0.7, 0, −5) · `pebble_feast` (−0.7, 0, −12) · `seat1`…`seat24` (bench positions with yaw facing the table)
* api: `setLanternLit(i 1..9, lit:boolean)` (smooth fade, flicker when turning off) · `setFeast(on)`
  (golden plates/food/cups on the tables, warmer light)

### `classroom` — Charms Classroom (music 'calm')
x[-8,8] z[-7,7], ceiling 6. Blackboard on the north wall with chalk drawings (CanvasTexture), teacher's desk,
two rows of student desks in the south half (keep aisle x∈[−1,1] clear and the front zone z<−2 clear), shelves
with clocks (Dov loves clocks), big window.
* spawns: `fromEntrance` (0, 5, 0)
* doors: `classroom.toEntrance` (0, 6.5) → entrance/fromClassroom
* anchors: `dov` (5, 0, −5.5, π/2 facing −X… use yaw toward the room) · `dummy1` (−4,0,−3) · `dummy2` (−1,0,−4.5) ·
  `dummy3` (2.5,0,−3) · `noa` (−2.5, 0, 2.5) · `tal` (2.5, 0, 2.5)
* api: none required.

### `library` — Library (music 'calm')
x[-12,12] z[-10,10], ceiling 9. Shelf rows (colliders) at z∈{−4, 0, 4}, x∈[−11,−3] and [3,11]; centre aisle
x∈[−3,3] clear; north band z∈[−10,−5] open. Reading tables, ladders, floating books, candles, globes.
**Riddle candles**: five stone pedestals in a row at z = −7, x = −8, −4, 0, 4, 8 (anchors `candle1`…`candle5`), each
with an engraved symbol plaque (CanvasTexture): 1 wave 🌊, 2 crescent moon, 3 flame, 4 star, 5 sun. A **secret
shelf** in the north wall centre (0, 0, −9.6) that slides aside revealing a niche with a glow.
* spawns: `fromEntrance` (0, 7.5, 0)
* doors: `library.toEntrance` (0, 9.5) → entrance/fromLibrary
* anchors: `elkan` (0, 1.3, −3) · `candle1`…`candle5` (y = 1.1 = flame height) · `secretShelf` (0, 1.2, −9.2) ·
  `noa` (−2, 0, 4)
* api: `setCandleLit(i 1..5, lit)` · `openSecretShelf()` (animated) · `resetCandles()`

### `tower` — Common Room (music 'calm')
Round room radius 8 (bounds x[-7,7] z[-7,7] + corner colliders so it feels round), fireplace on the north wall
(0,−7.5) with animated flame sprites + flickering PointLight, armchairs, rugs, a window seat, a four-poster bed
alcove.
* spawns: `fromEntrance` (0, 5, 0)
* doors: `tower.toEntrance` (0, 7) → entrance/fromTower
* anchors: `noa` (−2.5, 0, −2) · `bed` (4.5, 0.6, −3.5) (bed collider) · `tal` (2.5, 0, 2)
* api: `setMorning(bool)` (window light night-blue ↔ morning gold)

### `crypt` — Crypt & Lantern Chamber (music 'crypt')
VERY dark (hemiIntensity ≈ 0.06, black fog) — the player needs Lumos. Corridor x∈[−3,3] from z=34 down to z=−6
with an alcove on the west side x∈[−6,−3], z∈[8,12]. Then a sealed **iron gate** at z=−6 (collider x[−3,3]
z[−6.5,−5.5] while closed) and beyond it the circular **Lantern Chamber** centre (0,−18) radius 12 with a stone
**pedestal** in the middle holding the dark, empty Ninth Lantern frame, broken pillars, violet glowing cracks.
Bounds x[−12,12] z[−30,34] with colliders filling everything outside corridor/alcove/chamber.
* spawns: `fromEntrance` (0, 31, 0) · `chamber` (0, −8, 0)
* doors: `crypt.toEntrance` (0, 33) → entrance/fromCrypt
* anchors: `shard3` (−5, 0.9, 10) · `gate` (0, 0, −4) · `pedestal` (0, 1.2, −18) · `morrow` (0, 0, −26, yaw π) ·
  `orla_crypt` (0, 0, −7) · `cshade1`…`cshade5` along the corridor (y 1.5: (0,20),(−1.5,14),(1.5,6),(0,0),(−1,24)) ·
  `bshade1`…`bshade4` around the chamber at radius 8 (y 1.5)
* api: `openGate()` (animated, removes collider) · `setPedestalLit(bool)` (the Ninth Lantern flares gold and
  floods the chamber with light) · `setChamberGlow(bool)` (violet cracks pulse during the boss)

## 6. STORY (`story.js`)

```
ELD.story = {
  start(saveOrNull),     // new game (null) or continue
  restartStep(),         // restart current step from its checkpoint
  skip(),                // debug: resolve the current wait primitive
  goto(chapterIndex),    // debug: start a chapter from step 0
  info() -> { chapter, step, stepId, objective, shards }
}
```
* Structure: `CHAPTERS = [{ id, title:textObj, subtitle:textObj, steps:[{ id, area, spawn, run: async (S) => {} }] }]`.
  Runner: for each step → save checkpoint `{v:1, chapter, step, profile, flags, completed:false}` → ensure the
  step's `area` is loaded (if the current area differs, `ELD.loadArea(area, spawn)`) → `await run(S)`.
* Every wait primitive is abortable via a run token. On `'playerDown'`: abort current run, fade, toast
  ("The Gloom overwhelmed you…"), heal to full, `combat.clear()`, re-run the current step (from its area/spawn).
  `restartStep()` does the same without the toast.
* Helper toolkit `S` (implement in story.js): `S.say(lines)`, `S.talkTo(charId, lines, {marker:true})`
  (marks the NPC with the beacon + objective, resolves after the player presses E on that NPC and the dialogue
  ends), `S.waitArea(id)`, `S.waitNear(x, z, r)`, `S.waitInteract({pos, label, radius})`,
  `S.waitEvent(name, predicate)`, `S.waitKills(tag, n)`, `S.wait(ms)`, `S.objective(textObj)`, `S.guide(areaId)`
  (sets the marker to the door that leads toward `areaId` using a route table: grounds↔entrance↔{greathall,
  classroom, library, tower, crypt}), `S.unlockDoor(id)/lockDoor(id, msg)`, `S.flag(k, v)`, `S.spawnWave(...)`.
* **Cast system**: `castFor(areaId)` returns the NPC placements for the current chapter/step/flags
  (e.g. `[{who:'noa', anchor:'noa_entrance'}]`). On every `'areaLoaded'` and whenever a step starts, story
  (re)spawns the cast into `ELD.area.group`, keeps them updated on `'tick'` (idle + lookAt player when within
  5 m) and registers an interactable per NPC: if a `talkTo` is pending for that NPC → run it; else play a short
  **ambient line** from that character's per-chapter pool (2–3 lines each, so the world feels alive).
  Great Hall crowd = 16–24 `student` variants on seat anchors (decor only, no interactables).
* Door policy (set at each step start; locked doors give an in-character reason): only doors relevant to the
  current goal and already visited places are open.
* Hebrew must be natural, warm, idiomatic modern Hebrew (not translated-sounding); English equally good.
  Gendered addressing of the player via `{m,f}`. Use `{name}` occasionally. Keep each line ≤ ~180 characters,
  2–10 lines per dialogue, humour where it fits.

### 6.1 The story (ORIGINAL) — beats per chapter/step

**Premise.** Eldermoor Academy stands on a cliff above a black lake. Its nine founders forged **Nine
Lanterns** whose light holds back **the Gloom (האופל)** — a hungry darkness from beyond the lake that makes
**shades (צללים)**. The player, `{name}`, is a late-admitted first-year: the acceptance letter arrived folded
as a paper crane that pecked at their window at midnight. On their very first night the Ninth Lantern goes out.

**Ch 0 — "The Gate / השער"** (grounds)
1. `arrive` (grounds/start): chapter card; narrator intro (3 lines: the paper crane, the long road, the
   castle's lights). Objective "Walk to the academy gate"; marker at gate; wait near (0, 42, r 4).
2. `pebble` : talkTo pebble — Pebble wakes up mid-snore, poses dramatically, mistakes the player for a
   delivery, then realises; explains in one breath the academy, the Nine Lanterns ("nine, not eight, don't ask
   about the eighth, it's fine, it's fine"), says the welcome feast already began. Choice: "Are you a statue?" →
   offended reply / "Nice wings." → flattered reply. Objective "Enter the castle", guide → castleDoor.
3. `enter`: waitArea('entrance').

**Ch 1 — "The Feast / המשתה"** (entrance → greathall → tower)
1. `noa` (entrance/fromGrounds): Noa rushes in and almost collides with the player; her clockwork owl Tik
   squawks. She's new too, introduces herself. Choice (friendly / curious about Tik) → flag. She runs ahead.
   Objective "Go to the Great Hall".
2. `toHall`: waitArea('greathall').
3. `feast` (greathall): objective "Sit with Noa" → talkTo noa (she saved a seat). Then cutscene (player faces
   the dais): Orla's welcome speech (6–8 lines: the lanterns, the Gloom, "a light is only as strong as the hands
   that keep it"). Tal makes a sarcastic comment to the player (rival intro; choice: snap back / ignore).
   Then `setLanternLit(9,false)` with flicker; gasps; toast; Orla stays calm: everyone to the common rooms.
   flag `lanternOut`.
4. `toTower`: objective "Go to the common room"; guide('tower'); waitArea('tower').
5. `night` (tower): talkTo noa — she saw a **violet light** slip out of the hall when the lantern died; Tik
   recorded a "click-whirr" of it. Objective "Go to sleep" → waitInteract bed → fade, `setMorning(true)`, card
   "Morning / בוקר".

**Ch 2 — "First Lesson / שיעור ראשון"** (tower → classroom)
1. `wake` (tower): Noa: Charms with Professor Arkin, don't be late! Unlock classroom door. guide('classroom').
2. `toClass`: waitArea('classroom').
3. `lumos` (classroom): talkTo dov — eccentric intro ("magic is like a clock: tick, tock, and occasionally
   a small explosion"). Unlock **Lumos** → objective "Cast Lumos (L)" → waitEvent spellCast lumos.
4. `stupefy`: Dov unlocks **Stupefy**; spawn 3 dummies at dummy anchors (tag 'class'); objective "Hit the
   training dummies with Stupefy (0/3)" — count distinct dummies hit with stupefy, update objective live.
5. `expelliarmus`: Tal mocks ("dummies don't fight back"); Dov enchants a dummy to move (`moving:true`) and
   teaches **Expelliarmus**; objective "Disarm the moving dummy (right click)" → dummyHit with expelliarmus.
   Tal grudgingly impressed. Dov, quietly: the lanterns' secrets are kept by the library's ghost, Elkan.
   Clear dummies. Unlock library. Objective "Visit the library".
6. `toLibrary`: waitArea('library').

**Ch 3 — "The Ghostly Scribe / הסופר הרפאי"** (library)
1. `elkan`: talkTo elkan — grumpy ("shh") then intrigued. Lore: a lantern that dies shatters into three
   **shards**; gather them and it can be rekindled at its **pedestal beneath the castle**. One shard fell into
   the founders' riddle-niche here; one was carried off by shades into the courtyard; one sank into the crypt.
   He recites the riddle (original, 4 lines): first light the one that rules the night, then the one sailors
   steer by, last the one that wakes the day → moon (2), star (4), sun (5). Objective "Light the candles in the
   right order". `ELD.ui.setShards(0)`.
2. `riddle`: interactables on candle1..5. Correct sequence 2→4→5 → `openSecretShelf()`; wrong candle → puff,
   `resetCandles()`, Elkan's grumble toast. Talking to Noa gives a hint. Then pick up the shard at
   `secretShelf` (spawn `shard` prop) → shards 1/3, chime.
3. `alarm`: Noa bursts: Pebble is yelling from the gate — **shades in the courtyard**! Objective "Hurry to the
   courtyard"; guide('grounds'); waitArea('grounds').

**Ch 4 — "Shadows in the Courtyard / צללים בחצר"** (grounds)
1. `tal` (grounds/fromCastle): Tal is surrounded at the fountain, scared but proud ("I had it handled!").
   Short dialogue. `showHealth(true)`.
2. `battle`: 3 waves (3, 4, 5 shades) from shade ring anchors, tag 'court'; objective "Drive back the shades
   (n left)" updated live; brief toasts between waves; Tal "fights" too (cosmetic: he casts sparks).
3. `patronus`: Tal hands over **shard 2** (he grabbed it from a shade — admits he's afraid of the dark). Orla
   arrives (orla_court): teaches **Expecto Patronum** — the light of a memory you would protect; ask the player
   what memory (choice of 3 — flavour flag). Objective "Cast Expecto Patronum (Q)". She gives the crypt key:
   unlock `entrance.toCrypt`; warns that the violet light came from inside the walls. Objective "Descend into
   the crypt"; guide('crypt').
4. `toCrypt`: waitArea('crypt').

**Ch 5 — "Beneath the Castle / מתחת לטירה"** (crypt)
1. `dark`: it's pitch black. Objective "Light your wand (L)" (skip if already on). Noa's voice? No — the player
   is alone; inner-monologue narrator lines.
2. `ambush`: walking past z < 24 triggers 5 shades from cshade anchors (tag 'crypt'); objective live count.
3. `shard3`: objective "Find the third shard" — marker on the alcove; pick up → shards 3/3.
4. `gate`: objective "Open the iron gate" → waitInteract gate → the shards hum → `openGate()`. Objective
   "Enter the Lantern Chamber" → waitNear(0, −12, 5).

**Ch 6 — "The Lantern Keeper / שומרת הפנסים"** (crypt chamber)
1. `reveal`: Sela Morrow steps out of the dark at `morrow`, her cracked violet lantern drinking the light.
   She was the founders' last apprentice keeper, expelled for trying to bind the lanterns' light to herself;
   she put out the Ninth Lantern to pull the Gloom's power into her lantern ("light that only obeys is wasted
   light"). Choice: "Why?" / "Give it back." / "Join you? Never." — each gets a reply. `setChamberGlow(true)`.
2. `boss`: boss fight (model `morrow`, hp 24, `bossBar`). Shield on (violet bubble mesh) → only Expelliarmus
   breaks it for 5 s (stun 1 s). Unshielded: Stupefy −1, Expelliarmus −1, Patronum −4 (and kills her shades).
   Every ~2.4 s she fires an `enemyBolt` (12 dmg); every ~6 s she glides to a new spot on the chamber ring.
   At 50 % and 25 % hp she summons 3 shades (bshade anchors). Taunts as toasts. Death → step retry.
3. `mercy`: Morrow kneels, lantern cracked. Choice: "Give the light back." (mercy flag) / "The Headmistress will
   judge you." Orla arrives (orla_crypt) with Noa and Tal; Morrow releases the stolen light (ending lines vary
   slightly with the mercy flag). Objective "Rekindle the Ninth Lantern".
4. `relight`: waitInteract pedestal → `setPedestalLit(true)`, flash, relight chord; card.

**Epilogue — "The Ninth Light / האור התשיעי"** (greathall)
1. `celebrate` (greathall/fromEntrance): all 9 lanterns lit, `setFeast(true)`, music 'feast'. Orla toasts
   `{name}` before the whole school. Objective "Talk to your friends (0/3)" → Noa, Tal, Pebble (Pebble climbed
   all the stairs, complains, then admits he's proud) — live count.
2. `credits`: `ELD.ui.credits(...)` (original credits: "A story by ... Claude & you", cast list of the original
   characters, "Thanks for playing"), save `completed:true`, `ELD.ui.showTitle()`.

Ambient NPC line pools (2–3 per character for the chapters where they appear) make the world feel alive.
Total dialogue: roughly 120–180 lines per language.
