/** Demo availability flags that must be importable without pulling in the animation data (avoids import cycles). */

/** id -> reason. A blocked exercise has a known-bad animation and is not offered as a demonstration. */
export const BLOCKED: Record<string, string> = {
  worlds_greatest_stretch:
    'Multi-phase flow whose deep lunge, rotation and hamstring phases break joint limits (hip 170+ degrees, shoulder/elbow hyperextension), cause a 13-unit knee pop and sink the thigh into the floor; needs a full rewrite before it can be shown.',
};

export const isBlocked = (id: string): boolean => id in BLOCKED;
