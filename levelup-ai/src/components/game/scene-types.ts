import type { ArenaTelemetry, GameQuestion } from "@/lib/game";

export interface GameSceneHooks {
  loading: (progress: number) => void;
  ready: (low: boolean) => void;
  answer: (answer: number) => void;
  selection: (index: number) => void;
  opened: (opened: boolean) => void;
  carrying: (carrying: boolean) => void;
  attack: (active: boolean) => void;
  shield: (change: number) => void;
  contextLost: () => void;
  telemetry?: (data: ArenaTelemetry) => void;
  sound?: (kind: "shot" | "dash" | "hit" | "collect") => void;
}
export interface GameScene {
  setPaused(paused: boolean): void;
  setQuestion(question: GameQuestion, index: number): void;
  choose(answer: number): void;
  action(): void;
  resolve(correct: boolean): void;
  jump(): void;
  dodge(): void;
  setJoystick(x: number, z: number): void;
  dispose(): void;
  setFiring?(active: boolean): void;
  setAim?(x: number, z: number): void;
}
