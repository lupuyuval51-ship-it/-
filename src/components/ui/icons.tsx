import { Bot, CircleDot, Compass, FlaskConical, Footprints, Gamepad2, Map, PawPrint, Puzzle, UserRound } from "lucide-react";

/** One SVG icon per game type (no emoji: they render differently on every OS and can't follow the theme). */
export function GameTypeIcon({ type, className }: { type: string; className?: string }) {
  const p = { className, "aria-hidden": true as const };
  switch (type) {
    case "exploration": return <Compass {...p} />;
    case "puzzle": return <Puzzle {...p} />;
    case "platformer": return <Footprints {...p} />;
    case "simulation": return <FlaskConical {...p} />;
    case "adventure": return <Map {...p} />;
    default: return <Gamepad2 {...p} />;
  }
}

export function NpcIcon({ shape, className }: { shape: string; className?: string }) {
  const p = { className, "aria-hidden": true as const };
  switch (shape) {
    case "robot": return <Bot {...p} />;
    case "creature": return <PawPrint {...p} />;
    case "orb": return <CircleDot {...p} />;
    default: return <UserRound {...p} />;
  }
}
