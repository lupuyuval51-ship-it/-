/** Physics constants shared by the simulation and the world builder (so platform gaps are always jumpable). */
export const PLAYER_RADIUS = 0.4;
export const PLAYER_HEIGHT = 1.7;
export const STEP_UP = 0.45;
export const WALK_SPEED = 6;
export const SPRINT_SPEED = 9;
export const JUMP_VELOCITY = 9.2;
export const GRAVITY = 26;
export const TERMINAL_VELOCITY = -40;
/** A platform supports the player while the player's centre is within this margin of its footprint. */
export const SUPPORT_MARGIN = 0.15;
export const INTERACT_RADIUS = 2.4;
export const PICKUP_RADIUS = 1.1;
export const KILL_Y_MARGIN = 9;

export const MAX_JUMP_HEIGHT = (JUMP_VELOCITY * JUMP_VELOCITY) / (2 * GRAVITY);
export const AIR_TIME = (2 * JUMP_VELOCITY) / GRAVITY;
/** Longest edge-to-edge gap a player can clear at walking speed (conservative: 70% of the ballistic distance). */
export const MAX_COMFORT_GAP = WALK_SPEED * AIR_TIME * 0.6;
