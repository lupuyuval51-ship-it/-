/**
 * Test seam: ready-made sample games for the test suites and the balance simulation. The product never registers one, so a
 * request that has neither the learner's own material nor a topic from the library is refused (nothing is built from a
 * subject alone). The samples live in `tests/support/samples`.
 */
import type { GenerationRequest } from "@/lib/schemas/generation";
import type { GameExtension, GameSpec } from "./spec/schema";

export interface SampleBuilder {
  spec(req: GenerationRequest): { raw: Record<string, unknown>; templateId: string; notes: string[] };
  extension(spec: GameSpec, req: GenerationRequest): { ext: GameExtension; templateId: string } | null;
}

let current: SampleBuilder | null = null;

export function setSampleBuilderForTests(builder: SampleBuilder | null): void {
  current = builder;
}

export const sampleBuilder = (): SampleBuilder | null => current;
