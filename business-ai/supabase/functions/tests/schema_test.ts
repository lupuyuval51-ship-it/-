/**
 * The strict JSON Schemas sent to the model, checked against what structured outputs accepts, and
 * the fake server's sample generator checked against the domain zod schemas (so the integration
 * tests exercise real, schema-valid payloads).
 */
import { assert, assertEquals, assertFalse } from '@std/assert';
import type { z } from 'zod';
// @ts-types="../../../e2e/fake-anthropic/server.d.mts"
import {
  buildMessage,
  detectLanguage,
  generateSample,
  streamEvents,
  validateStrictSchema,
} from '../../../e2e/fake-anthropic/server.mjs';
import { readConstraints, toStrictJsonSchema } from '../_shared/ai/json-schema.ts';
import { AiMarketingContentSchema } from '../_shared/domain/marketing.ts';
import {
  AiFinanceProposalSchema,
  AiPlanSectionSchema,
  AiRoadmapSchema,
  PLAN_GENERATION_GROUPS,
} from '../_shared/domain/plan.ts';
import { AiRoadmapSuggestionsSchema, parseProposeActionsInput, planGroupSchema } from '../_shared/outputs.ts';
import { PROPOSE_ACTIONS_TOOL_SPEC, ProposeActionsInputSchema } from '../_shared/prompts/advisor.ts';

const AI_SCHEMAS: [string, z.ZodType][] = [
  ['AiPlanSection', AiPlanSectionSchema],
  ['AiRoadmap', AiRoadmapSchema],
  ['AiFinanceProposal', AiFinanceProposalSchema],
  ['AiMarketingContent', AiMarketingContentSchema],
  ['AiRoadmapSuggestions', AiRoadmapSuggestionsSchema],
  ['ProposeActionsInput', ProposeActionsInputSchema],
  ...PLAN_GENERATION_GROUPS.map((keys, i): [string, z.ZodType] => [`planGroup${i}`, planGroupSchema(keys)]),
];

Deno.test('json schema: every AI schema is structured-outputs compatible', () => {
  for (const [name, schema] of AI_SCHEMAS) {
    const json = toStrictJsonSchema(schema);
    assertEquals(validateStrictSchema(json), null, name);
    assertFalse(JSON.stringify(json).includes('$schema'), name);
  }
});

/** Walks a JSON Schema by property names / `items` / anyOf indexes, failing loudly on a missing node. */
function at(node: unknown, ...path: (string | number)[]): Record<string, unknown> {
  let cur: unknown = node;
  for (const step of path) {
    const obj = cur as Record<string, unknown> | undefined;
    if (typeof step === 'number') cur = (obj?.anyOf as unknown[] | undefined)?.[step];
    else if (step === 'items') cur = obj?.items;
    else cur = (obj?.properties as Record<string, unknown> | undefined)?.[step];
    if (cur === undefined) throw new Error(`schema path not found: ${path.join('.')}`);
  }
  return cur as Record<string, unknown>;
}

Deno.test('json schema: enum and const are kept; ranges and lengths move into the description', () => {
  const json = toStrictJsonSchema(AiRoadmapSchema);
  const phases = at(json, 'phases');
  assertEquals(phases.type, 'array');
  assertEquals(phases.minItems, 1);
  assertEquals(readConstraints(phases.description), { minItems: 3, maxItems: 3 });
  assertEquals(at(phases, 'items', 'phase').enum, ['days_30', 'days_60', 'days_90']);
  assertEquals(readConstraints(at(phases, 'items', 'objective').description), { maxLength: 400 });
  const milestoneIndex = at(phases, 'items', 'tasks', 'items', 'milestone_index');
  assertEquals(at(milestoneIndex, 1), { type: 'null' });
  assertEquals(readConstraints(at(milestoneIndex, 0).description), { minimum: 0, maximum: 3 });
  assertEquals(at(phases, 'items').additionalProperties, false);
  assertEquals(at(phases, 'items').required, ['phase', 'objective', 'milestones', 'tasks']);

  const items = at(PROPOSE_ACTIONS_TOOL_SPEC.inputSchema, 'actions', 'items');
  const variants = (items.anyOf as unknown[]).map((_, i) => at(items, i));
  assertEquals(variants.map((v) => at(v, 'type').const), [
    'add_task',
    'add_milestone',
    'add_recurring_expense',
    'add_startup_cost',
    'open_plan_section',
  ]);
  for (const v of variants) {
    assertFalse('id' in (v.properties as Record<string, unknown>), 'ids are assigned server-side');
  }
});

Deno.test('fake server: samples are valid for every AI schema in both languages', () => {
  for (const lang of ['he', 'en'] as const) {
    for (const [name, schema] of AI_SCHEMAS) {
      const sample = generateSample(toStrictJsonSchema(schema), { lang });
      const parsed = schema.safeParse(sample);
      assert(
        parsed.success,
        `${name}/${lang}: ${parsed.success ? '' : JSON.stringify(parsed.error.issues.slice(0, 3))}`,
      );
    }
  }
  const roadmap = AiRoadmapSchema.parse(generateSample(toStrictJsonSchema(AiRoadmapSchema), { lang: 'en' }));
  assertEquals(roadmap.phases.map((p) => p.phase), ['days_30', 'days_60', 'days_90']);
  const tool = parseProposeActionsInput(generateSample(PROPOSE_ACTIONS_TOOL_SPEC.inputSchema, { lang: 'he' }));
  assertEquals(tool.actions.length, 2);
  assert(/[֐-׿]/.test(tool.followUps[0] ?? ''));
});

Deno.test('fake server: language detection, rejected parameters and stream shape', () => {
  assertEquals(detectLanguage({ system: [{ type: 'text', text: 'עברית' }], messages: [] }), 'he');
  assertEquals(detectLanguage({ system: 'x', messages: [{ role: 'user', content: 'hello' }] }), 'en');
  const msg = buildMessage({
    model: 'claude-opus-5-5',
    max_tokens: 100,
    messages: [{ role: 'user', content: 'hi' }],
    tools: [{ name: 'propose_actions', input_schema: PROPOSE_ACTIONS_TOOL_SPEC.inputSchema }],
  });
  assertEquals(msg.stop_reason, 'tool_use');
  const names = streamEvents(msg).map(([e]) => e);
  assertEquals(names[0], 'message_start');
  assertEquals(names.at(-2), 'message_delta');
  assertEquals(names.at(-1), 'message_stop');
  assert(names.includes('content_block_delta'));
});
