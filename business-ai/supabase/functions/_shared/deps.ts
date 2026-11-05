/**
 * Injectable dependencies of the Edge Function handlers (production defaults are used when absent).
 */
import type { AiProvider } from './ai/provider.ts';
import { AnthropicProvider } from './ai/anthropic.ts';
import { type AiConfig, type EnvGetter, type FunctionConfig, loadConfig } from './config.ts';
import type { IdFactory } from './outputs.ts';
import type { WaitUntil } from './runtime.ts';

export interface HandlerDeps {
  /** Full configuration (tests); defaults to loadConfig(env). */
  config?: FunctionConfig;
  env?: EnvGetter;
  /** Provider factory (tests may substitute); defaults to the Anthropic SDK implementation. */
  providerFactory?: (cfg: AiConfig) => AiProvider;
  /** Background work for plan.generate; defaults to EdgeRuntime.waitUntil. */
  waitUntil?: WaitUntil;
  now?: () => Date;
  newId?: IdFactory;
}

export function resolveConfig(deps: HandlerDeps): FunctionConfig {
  return deps.config ?? loadConfig(deps.env);
}

export function resolveProvider(deps: HandlerDeps, cfg: AiConfig): AiProvider {
  return deps.providerFactory ? deps.providerFactory(cfg) : AnthropicProvider.fromConfig(cfg);
}
