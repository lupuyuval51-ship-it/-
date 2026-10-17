import "server-only";
import { getEnv, demoTemplatesOn } from "../env";
import { createAnthropicBackend } from "./providers/anthropic";
import { createOpenAiCompatBackend } from "./providers/openai";
import type { GenerationBackend } from "./types";

let override: GenerationBackend | null = null;

/** Test seam: force a specific backend. */
export function setBackendForTests(backend: GenerationBackend | null): void {
  override = backend;
}

const DEMO: GenerationBackend = {
  type: "templates",
  info: { id: "demo", kind: "demo", label: "Demo templates (not AI)", model: "predefined-templates" },
};

/**
 * Choose the generation backend from configuration.
 *  - auto      → a real provider when its key is set, otherwise the labelled DEMO templates;
 *  - anthropic / openai → that provider, or "unavailable" (refuse up front, never silently fall back to demo);
 *  - demo      → templates.
 * Demo output is stored with generatorKind "demo" and is never presented as AI-generated.
 */
export function getBackend(): GenerationBackend {
  if (override) return override;
  const env = getEnv();
  const anthropic = () =>
    env.ANTHROPIC_API_KEY
      ? createAnthropicBackend({ apiKey: env.ANTHROPIC_API_KEY, model: env.ANTHROPIC_MODEL, refusalFallback: env.ANTHROPIC_REFUSAL_FALLBACK })
      : null;
  const openai = () => (env.OPENAI_API_KEY ? createOpenAiCompatBackend({ apiKey: env.OPENAI_API_KEY, baseUrl: env.OPENAI_BASE_URL, model: env.OPENAI_MODEL }) : null);

  switch (env.AI_PROVIDER) {
    case "demo":
      return DEMO;
    case "anthropic":
      return anthropic() ?? unavailable("anthropic", "ANTHROPIC_API_KEY is not set");
    case "openai":
      return openai() ?? unavailable("openai", "OPENAI_API_KEY is not set");
    case "auto":
    default:
      return anthropic() ?? openai() ?? DEMO;
  }
}

function unavailable(id: string, reason: string): GenerationBackend {
  return { type: "unavailable", reason, info: { id, kind: "ai", label: id, model: "n/a" } };
}

/** Safe, client-visible description of what generation will use. No keys. */
export function describeBackend(): { kind: "ai" | "demo" | "unavailable"; provider: string; label: string; model: string; reason?: string; templates?: boolean } {
  const b = getBackend();
  if (b.type === "unavailable") return { kind: "unavailable", provider: b.info.id, label: b.info.label, model: b.info.model, reason: b.reason };
  // `templates`: without AI, whether a subject alone still makes a (labelled) demo-template game (DEMO_TEMPLATES).
  return { kind: b.info.kind, provider: b.info.id, label: b.info.label, model: b.info.model, ...(b.info.kind === "demo" ? { templates: demoTemplatesOn() } : {}) };
}
