import { memo } from "react";
import { Backdrop } from "./Backdrop";
import { Life } from "./Life";
import { Particles } from "./Particles";
import { PlayerAvatar } from "./PlayerAvatar";
import { Lights, Sky } from "./Sky";
import { WorldView } from "./WorldView";

/**
 * The parts of the scene that never read progress: they follow the player, the gates and the clock inside their own frame
 * callbacks, straight from the runtime. Every pick-up, talk, checkpoint and autosave hands the canvas a new `client`, and without
 * `memo` each of them reconciled every box, tree and light of the world again for nothing. Their props (runtime, world, theme,
 * materials, emitter) are stable and change only when the quality steps down, which is exactly when they must redraw.
 */
export const StaticSky = memo(Sky);
export const StaticLights = memo(Lights);
export const StaticBackdrop = memo(Backdrop);
export const StaticLife = memo(Life);
export const StaticWorldView = memo(WorldView);
export const StaticParticles = memo(Particles);
export const StaticPlayerAvatar = memo(PlayerAvatar);
