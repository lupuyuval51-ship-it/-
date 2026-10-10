import { buildDemoExtension, buildDemoSpec } from "@/lib/game/demo";
import type { GameSpec } from "@/lib/game/spec/schema";
import { providerError } from "@/server/ai/errors";
import type { AiRequest, AiResponse, LlmBackend } from "@/server/ai/types";
import type { GenerationRequest } from "@/lib/schemas/generation";

export type Reply = string | object | AiResponse | Error | "HANG";
export interface MockLlm extends LlmBackend {
  calls: AiRequest[];
}

const usage = { inputTokens: 100, outputTokens: 200 };

/** A scripted model: each call consumes the next reply (the last one repeats). */
export function mockLlm(script: Reply[] | ((req: AiRequest, call: number) => Reply)): MockLlm {
  const calls: AiRequest[] = [];
  return {
    type: "llm",
    info: { id: "mock-ai", kind: "ai", label: "Mock model", model: "mock-1" },
    calls,
    async complete(req) {
      const n = calls.length;
      calls.push(req);
      const reply = typeof script === "function" ? script(req, n) : script[Math.min(n, script.length - 1)]!;
      if (reply === "HANG") {
        await new Promise<never>((_, reject) => req.signal.addEventListener("abort", () => reject(providerError("PROVIDER_TIMEOUT", "aborted")), { once: true }));
      }
      if (reply instanceof Error) throw reply;
      if (typeof reply === "string") return { text: reply, model: "mock-1", finish: "complete", usage };
      if ("text" in reply && "finish" in reply) return reply as AiResponse;
      return { text: JSON.stringify(reply), model: "mock-1", finish: "complete", usage };
    },
  };
}

export const specJson = (req: GenerationRequest): object => buildDemoSpec(req).raw;

/** Blueprint (stage 1) and challenges (stage 2) derived from a demo spec, as a model would return them. */
export function fullStages(req: GenerationRequest): { blueprint: object; challenges: object } {
  const raw = buildDemoSpec(req).raw as Record<string, unknown> & { challenges: Record<string, unknown>[] };
  const { challenges, ...rest } = raw;
  const challengePlan = challenges.map((c) => ({ id: c.id, type: c.type, concept: c.concept, level: c.level, objectiveId: c.objectiveId, easierId: c.easierId, harderId: c.harderId }));
  return { blueprint: { ...rest, challengePlan }, challenges: { challenges } };
}

export function extensionJson(base: GameSpec, req: GenerationRequest): object {
  const built = buildDemoExtension({ ...base, meta: { ...base.meta, generator: { kind: "demo", provider: "demo", model: "t", templateId: "programming", mode: "FULL", generatedAt: "x" } } }, req);
  if (!built) throw new Error("no extension");
  return built.ext;
}

export const isStage = (req: AiRequest, name: "blueprint" | "challenges" | "extension" | "spec"): boolean =>
  ({ blueprint: "BLUEPRINT (stage 1", challenges: "CHALLENGES PAYLOAD", extension: "EXTENSION (additions", spec: "GAME SPECIFICATION" })[name] !== undefined &&
  req.system.includes(({ blueprint: "BLUEPRINT (stage 1", challenges: "CHALLENGES PAYLOAD", extension: "EXTENSION (additions", spec: "GAME SPECIFICATION" })[name]);
