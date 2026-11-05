import { assertEquals } from '@std/assert';
import { addUsage, costMicros, DEFAULT_PRICE, priceFor, usageFromApi, ZERO_USAGE } from '../_shared/ai/pricing.ts';

const tokens = (input: number, output: number, cacheRead = 0, cacheWrite = 0) => ({
  inputTokens: input,
  outputTokens: output,
  cacheReadTokens: cacheRead,
  cacheWriteTokens: cacheWrite,
});

Deno.test('pricing: per-model prices (USD per 1M tokens = micros per token)', () => {
  assertEquals(priceFor('claude-opus-5-5'), { input: 4, output: 20 });
  assertEquals(priceFor('claude-sonnet-5-5'), { input: 2, output: 10 });
  assertEquals(priceFor('claude-haiku-5-5'), { input: 0.1, output: 0.5 });
});

Deno.test('pricing: unknown or missing model is priced as Opus 5.5', () => {
  assertEquals(priceFor('some-future-model'), DEFAULT_PRICE);
  assertEquals(priceFor(null), DEFAULT_PRICE);
  assertEquals(costMicros('some-future-model', tokens(1_000, 1_000)), 24_000);
});

Deno.test('pricing: opus input/output cost', () => {
  // 1M input tokens = 4 USD = 4_000_000 micros; 1M output = 20 USD.
  assertEquals(costMicros('claude-opus-5-5', tokens(1_000_000, 0)), 4_000_000);
  assertEquals(costMicros('claude-opus-5-5', tokens(0, 1_000_000)), 20_000_000);
  assertEquals(costMicros('claude-opus-5-5', tokens(1234, 567)), 1234 * 4 + 567 * 20);
});

Deno.test('pricing: cache reads 0.1x and cache writes 1.25x input price', () => {
  assertEquals(costMicros('claude-opus-5-5', tokens(0, 0, 1_000_000, 0)), 400_000);
  assertEquals(costMicros('claude-opus-5-5', tokens(0, 0, 0, 1_000_000)), 5_000_000);
  assertEquals(costMicros('claude-sonnet-5-5', tokens(100, 10, 1000, 1000)), 100 * 2 + 10 * 10 + 1000 * 0.2 + 1000 * 2.5);
});

Deno.test('pricing: fractional micros are rounded up (conservative)', () => {
  // Haiku: 3 input tokens × 0.1 = 0.3 micros → 1
  assertEquals(costMicros('claude-haiku-5-5', tokens(3, 0)), 1);
  // 0.1 × 10 = 1 exactly (no float noise pushing it to 2)
  assertEquals(costMicros('claude-haiku-5-5', tokens(10, 0)), 1);
  assertEquals(costMicros('claude-haiku-5-5', tokens(0, 0)), 0);
});

Deno.test('pricing: negative / NaN token counts count as zero', () => {
  assertEquals(costMicros('claude-opus-5-5', tokens(-5, Number.NaN)), 0);
});

Deno.test('pricing: usageFromApi uses top-level usage priced at the response model', () => {
  const u = usageFromApi(
    { input_tokens: 100, output_tokens: 50, cache_read_input_tokens: 1000, cache_creation_input_tokens: null },
    'claude-opus-5-5',
    'claude-opus-5-5',
  );
  assertEquals(u, { inputTokens: 100, outputTokens: 50, cacheReadTokens: 1000, cacheWriteTokens: 0, costMicros: 100 * 4 + 50 * 20 + 400 });
});

Deno.test('pricing: usageFromApi sums fallback iterations at each attempt model', () => {
  const u = usageFromApi(
    {
      input_tokens: 999,
      output_tokens: 999,
      iterations: [
        { type: 'message', model: null, input_tokens: 100, output_tokens: 0 },
        { type: 'fallback_message', model: 'claude-opus-5', input_tokens: 100, output_tokens: 40, cache_read_input_tokens: 10 },
      ],
    },
    'claude-opus-5-5',
    'claude-opus-5',
  );
  // attempt 1 (opus 5.5): 100 × 4 = 400; attempt 2 (opus 5): 100 × 5 + 40 × 25 + 10 × 0.5 = 1505
  assertEquals(u.costMicros, 400 + 1505);
  assertEquals(u.inputTokens, 200);
  assertEquals(u.outputTokens, 40);
  assertEquals(u.cacheReadTokens, 10);
});

Deno.test('pricing: addUsage and empty usage', () => {
  assertEquals(usageFromApi(null, 'claude-opus-5-5'), { ...ZERO_USAGE });
  const a = { ...tokens(1, 2, 3, 4), costMicros: 5 };
  assertEquals(addUsage(a, a), { ...tokens(2, 4, 6, 8), costMicros: 10 });
});
