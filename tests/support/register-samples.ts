import { setSampleBuilderForTests } from "@/lib/game/sample-builder";
import { buildDemoExtension, buildDemoSpec } from "./samples";

/** The test suites (and the balance script) build games from a subject alone through these samples; the product never does. */
export function registerSamples(): void {
  setSampleBuilderForTests({ spec: (req) => buildDemoSpec(req), extension: (spec, req) => buildDemoExtension(spec, req) });
}

registerSamples();
