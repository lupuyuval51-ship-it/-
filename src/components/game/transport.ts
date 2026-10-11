import type { RenderProfile } from "@/config/graphics";
import type { PublicSpec } from "@/lib/game/spec/public";
import type { ClientState, LearningSummary } from "@/lib/game/state/progress";

export interface StartedSession {
  sessionId: string;
  resumed: boolean;
  game: { id: string; title: string; revision: number; generator: { kind: string; provider: string } };
  spec: PublicSpec;
  state: ClientState;
  maxScore: number;
  render: { tier: "A" | "B" | "C"; plan: string; profile: RenderProfile };
  testHooks: boolean;
}

export interface EventResponse {
  data: Record<string, unknown>;
  state: ClientState;
  newlyCompletedMissions: string[];
  newlyDefeatedBosses?: string[];
  newAchievements: string[];
  completed: boolean;
  summary?: LearningSummary;
}

export class ApiFailure extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

/**
 * Where the play screen sends things. The web app talks to the server (the authority); the offline Android app
 * runs the same pure reducer on the device (`src/lib/offline`).
 */
export interface PlayTransport {
  startSession(gameId: string, restart: boolean): Promise<StartedSession>;
  sendEvent<T extends EventResponse>(sessionId: string, event: Record<string, unknown>): Promise<T>;
  practice<T>(sessionId: string, body: unknown): Promise<T>;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" });
  const json = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string } } & T;
  if (!res.ok) throw new ApiFailure(res.status, json.error?.code ?? "ERROR", json.error?.message ?? "Request failed");
  return json;
}

export const httpTransport: PlayTransport = {
  startSession: (gameId, restart) => post(`/api/games/${gameId}/session`, { restart }),
  sendEvent: (sessionId, event) => post(`/api/play/${sessionId}/events`, event),
  practice: (sessionId, body) => post(`/api/practice/${sessionId}`, body),
};
