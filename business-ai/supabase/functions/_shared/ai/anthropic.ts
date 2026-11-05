/**
 * Anthropic implementation of the AI provider, using the official SDK (npm:@anthropic-ai/sdk).
 *
 * Request rules for claude-opus-5-5 (and the rest of the current model family):
 * - thinking is always on: no `thinking` parameter is sent (never `disabled` / `budget_tokens`);
 *   depth is controlled with `output_config.effort`.
 * - no temperature / top_p / top_k, no assistant prefill, `tool_choice` stays `auto`.
 * - structured outputs via `output_config.format` (json_schema); the caller re-validates with zod.
 * - refusal fallbacks are opted in: `fallbacks: "default"` + beta `server-side-fallback-2026-07-01`
 *   (typed in the SDK's beta Messages params since 1.x).
 * - streaming for every call (long outputs), final message via `stream.finalMessage()`.
 * - the stable system prompt is the first system block with `cache_control: ephemeral`.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { AiConfig } from '../config.ts';
import { AppError } from '../errors.ts';
import { AiCallError, mapProviderError } from './errors.ts';
import { usageFromApi, type UsageTotals, ZERO_USAGE } from './pricing.ts';
import type {
  AiProvider,
  ChatMessage,
  ChatStreamRequest,
  ChatStreamResult,
  CompletionRequest,
  CompletionResult,
  SystemPrompt,
  ToolCall,
} from './provider.ts';

export const FALLBACK_BETA = 'server-side-fallback-2026-07-01' as const;

type BetaMessage = Anthropic.Beta.BetaMessage;
type BetaMessageParam = Anthropic.Beta.BetaMessageParam;
type BetaTextBlockParam = Anthropic.Beta.BetaTextBlockParam;

/** Creates the SDK client with explicit key, base URL, retries and timeout (never ambient env). */
export function createAnthropicClient(cfg: AiConfig): Anthropic {
  if (!cfg.apiKey) throw new AppError('not_configured');
  return new Anthropic({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseURL,
    maxRetries: cfg.maxRetries,
    timeout: cfg.timeoutMs,
  });
}

export function systemBlocks(system: SystemPrompt): BetaTextBlockParam[] {
  const blocks: BetaTextBlockParam[] = [{ type: 'text', text: system.stable, cache_control: { type: 'ephemeral' } }];
  if (system.task.trim() !== '') blocks.push({ type: 'text', text: system.task });
  return blocks;
}

function toParams(messages: ChatMessage[]): BetaMessageParam[] {
  return messages.map((m): BetaMessageParam =>
    m.role === 'user' ? { role: 'user', content: m.content } : { role: 'assistant', content: m.content }
  );
}

/** Text of a message: every text block in order (a fallback may continue a partial answer). */
export function messageText(message: Pick<BetaMessage, 'content'>): string {
  let text = '';
  for (const block of message.content) {
    if (block.type === 'text') text += block.text;
  }
  return text;
}

export function messageUsage(
  message: Pick<BetaMessage, 'usage' | 'model'> | undefined,
  requestedModel: string,
): UsageTotals {
  if (!message) return { ...ZERO_USAGE };
  return usageFromApi(message.usage, requestedModel, message.model);
}

/** Throws for stop reasons that make the answer unusable. */
export function assertUsableStop(message: BetaMessage, requestedModel: string): void {
  if (message.stop_reason === 'refusal') {
    const category = message.stop_details?.category ?? null;
    throw new AiCallError('ai_refused', undefined, {
      usage: messageUsage(message, requestedModel),
      details: category ? { category } : undefined,
    });
  }
  if (message.stop_reason === 'max_tokens') {
    throw new AiCallError('ai_invalid_output', 'The AI answer was cut off.', {
      usage: messageUsage(message, requestedModel),
      partialText: messageText(message),
      details: { op: 'stop_reason:max_tokens' },
    });
  }
}

export class AnthropicProvider implements AiProvider {
  readonly model: string;
  readonly #client: Anthropic;

  constructor(client: Anthropic, model: string) {
    this.#client = client;
    this.model = model;
  }

  static fromConfig(cfg: AiConfig): AnthropicProvider {
    return new AnthropicProvider(createAnthropicClient(cfg), cfg.model);
  }

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const stream = this.#client.beta.messages.stream(
      {
        model: this.model,
        max_tokens: req.maxTokens,
        system: systemBlocks(req.system),
        messages: toParams(req.messages),
        output_config: { effort: req.effort, format: { type: 'json_schema', schema: req.jsonSchema } },
        betas: [FALLBACK_BETA],
        fallbacks: 'default',
      },
      { signal: req.signal },
    );
    let message: BetaMessage;
    try {
      message = await stream.finalMessage();
    } catch (err) {
      throw mapProviderError(err, { usage: messageUsage(stream.currentMessage, this.model) });
    }
    assertUsableStop(message, this.model);
    return { text: messageText(message), usage: messageUsage(message, this.model), model: message.model };
  }

  async streamChat(req: ChatStreamRequest): Promise<ChatStreamResult> {
    const stream = this.#client.beta.messages.stream(
      {
        model: this.model,
        max_tokens: req.maxTokens,
        system: systemBlocks(req.system),
        messages: toParams(req.messages),
        output_config: { effort: req.effort },
        tools: req.tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: { ...t.inputSchema, type: 'object' as const },
          strict: true,
        })),
        tool_choice: { type: 'auto' },
        betas: [FALLBACK_BETA],
        fallbacks: 'default',
      },
      { signal: req.signal },
    );
    let streamed = '';
    let message: BetaMessage;
    try {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          streamed += event.delta.text;
          req.onText(event.delta.text);
        }
      }
      message = await stream.finalMessage();
    } catch (err) {
      throw mapProviderError(err, { usage: messageUsage(stream.currentMessage, this.model), partialText: streamed });
    }
    if (message.stop_reason === 'refusal') {
      const category = message.stop_details?.category ?? null;
      throw new AiCallError('ai_refused', undefined, {
        usage: messageUsage(message, this.model),
        partialText: streamed,
        details: category ? { category } : undefined,
      });
    }
    const toolCalls: ToolCall[] = [];
    // A tool call cut off by max_tokens may carry truncated input: never use it.
    if (message.stop_reason !== 'max_tokens') {
      for (const block of message.content) {
        if (block.type === 'tool_use') toolCalls.push({ name: block.name, input: block.input });
      }
    }
    return {
      text: messageText(message),
      toolCalls,
      usage: messageUsage(message, this.model),
      model: message.model,
      stopReason: message.stop_reason,
    };
  }
}
