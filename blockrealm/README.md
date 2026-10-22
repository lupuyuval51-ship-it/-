# BlockRealm · ממלכת הקוביות

A realistic, Minecraft-style voxel sandbox that runs in the browser with **zero dependencies** — no engine, no libraries, no image or sound files. Every texture, sound, and piece of terrain is generated in code at startup. The interface is Hebrew/RTL by default, with English/LTR available from the menu.

## Play

- **Easiest:** open `dist/blockrealm.html` in a current Chrome, Edge, Firefox or Safari (a single self-contained file — double-click works).
- **From source:** open `index.html` directly, or serve the folder: `npx serve blockrealm`.
- Rebuild the single-file version after editing `src/`: `node blockrealm/build.mjs`.

WebGL2 is required (all current desktop and mobile browsers support it).

## What's in it

**World**
- Infinite procedural terrain streamed in 16×16×128 chunks: continents, oceans, beaches, plains, forests, deserts, taiga, snowy tundra and ridged mountains with snow caps.
- Spaghetti and cavern caves, lava lakes deep underground, coal / iron / gold / diamond ore veins, bedrock.
- Oak, birch and spruce trees, cacti, tall grass, flowers and dead bushes; per-biome grass and foliage tint.
- Seeded worlds: the same seed always produces the same world.

**Rendering (WebGL2)**
- Real-time sun and moon shadow mapping with soft PCF filtering.
- Normal-mapped, specular textures (32px, procedurally drawn; normal maps derived from each texture's height field).
- Per-vertex ambient occlusion and smooth skylight (flood-fill light propagation, so caves are dark).
- Physically-inspired sky: day/night cycle, sunsets, sun and moon discs, twinkling stars, drifting volumetric-looking clouds.
- Reflective water with animated waves, Fresnel, sun glints and depth-based colour/opacity; underwater fog.
- Flickering torch and glowstone point lights, glowing lava; swaying leaves and grass.
- Atmospheric fog, ACES tone mapping, night-vision desaturation, first-person held item with swing and walk bob.

**Gameplay**
- **Creative:** every block, instant breaking, free flight (double-tap Space or `F`), middle-click to copy a block.
- **Survival:** health, fall damage, drowning, lava and cactus damage, timed block breaking with crack overlay, drops collected into a 36-slot inventory, 17 crafting recipes, edible meat.
- Pigs, cows and sheep that wander and flee; zombies at night that chase you and burn at sunrise.
- Falling sand and gravel, simple water flow, plants and torches pop when their support is removed.
- Procedural audio: material-specific digging and footsteps, birds by day, crickets at night, wind, mob calls, underwater muffling.
- Automatic saving in the browser (position, inventory, time and every block you changed).

## Controls

| Desktop | Action |
| --- | --- |
| `W A S D` / arrows | Move (double-tap `W` or hold `Ctrl` to sprint) |
| Mouse | Look (click the world to capture the mouse) |
| `Space` | Jump; double-tap to fly in Creative |
| `Shift` | Sneak / fly down |
| Left click | Break / attack (hold in Survival) |
| Right click | Place block / eat |
| `1`–`9`, wheel | Pick hotbar slot |
| `E` | Inventory and crafting |
| `F3` | Debug overlay |
| `Esc` | Pause |

On phones and tablets: left-side joystick to move (push to the edge to sprint), drag on the right to look, short tap to place, long press to break, plus on-screen jump / sneak / fly / inventory buttons.

## Code layout

| File | Responsibility |
| --- | --- |
| `src/core.js` | Seeded RNG, simplex noise, matrix math, frustum culling |
| `src/blocks.js` | Procedural textures, block/item catalogue, recipes, HUD icons |
| `src/world.js` | Chunk generation, biomes, caves, ores, trees, skylight, edits, fluids, raycasting, save format |
| `src/mesher.js` | Chunk meshing with AO and smooth lighting (16-byte packed vertices) |
| `src/render.js` | WebGL2 renderer: shaders, shadow pass, sky, water, entities, particles |
| `src/entities.js` | AABB physics, player, mobs, particles |
| `src/audio.js` | Procedural WebAudio |
| `src/ui.js` | Strings (he/en), HUD, menus, inventory UI, keyboard/mouse/touch input |
| `src/main.js` | Game state machine, interaction, survival inventory, persistence, main loop |

The game is a standalone module: it does not touch the LEVELUP AI server, plans or payments.
