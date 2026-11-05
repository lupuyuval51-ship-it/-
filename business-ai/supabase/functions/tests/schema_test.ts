/**
 * The strict JSON Schemas sent to the model, checked against what structured outputs accepts, and
 * the fake server's sample generator checked against the domain zod schemas (so the integration
 * tests exercise real, schema-valid payloads).
 */
import { assert, assertEquals, assertFalse } from '@std/assert';
import type { z } from 'zod';
// @ts-types="../../../e2e/fake-anthropic/server.d.mts"
import { buildMessage, detectLanguage, generateSample, streamEvents, validateStrictSchema } from '../../../e2e/fake-anthropic/server.mjs';
import { readConstraints, toStrictJsonSchema } from '../_shared/ai/json-schema.ts';
import { AiMarketingContentSchema } from '../_shared/domain/marketing.ts';
import { AiFinanceProposalSchema, AiPlanSectionSchema, AiRoadmapSchema, PLAN_GENERATION_GROUPS } from '../_shared/domain/plan.ts';
import { AiRoadmapSuggestionsSchema, parseProposeActionsInput, planGroupSchema } from '../_shared/outputs.ts';
import { ProposeActionsInputSchema, PROPOSE_ACTIONS_TOOL_SPEC } from '../_shared/prompts/advisor.ts';

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

Deno.test('json schema: enum and const are kept; ranges and lengths move into the description', () => {
  const json = toStrictJsonSchema(AiRoadmapSchema) as Record<string, any>;
  const phases = json.properties.phases;
  assertEquals(phases.type, 'array');
  assertEquals(phases.minItems, 1);
  assertEquals(readConstraints(phases.description), { minItems: 3, maxItems: 3 });
  const phase = phases.items.properties.phase;
  assertEquals(phase.enum, ['days_30', 'days_60', 'days_90']);
  const objective = phases.items.properties.objective;
  assertEquals(readConstraints(objective.description), { maxLength: 400 });
  const milestoneIndex = phases.items.properties.tasks.items.properties.milestone_index;
  assertEquals(milestoneIndex.anyOf[1], { type: 'null' });
  assertEquals(readConstraints(milestoneIndex.anyOf[0].description), { minimum: 0, maximum: 3 });
  assertEquals(phases.items.additionalProperties, false);
  assertEquals(phases.items.required, ['phase', 'objective', 'milestones', 'tasks']);

  const tool = PROPOSE_ACTIONS_TOOL_SPEC.inputSchema as Record<string, any>;
  const variants = tool.properties.actions.items.anyOf as Record<string, any>[];
  assertEquals(variants.map((v) => v.properties.type.const), [
    'add_task',
    'add_milestone',
    'add_recurring_expense',
    'add_startup_cost',
    'open_plan_section',
  ]);
  for (const v of variants) assertFalse('id' in v.properties, 'ids are assigned server-side');
});

Deno.test('fake server: samples are valid for every AI schema in both languages', () => {
  for (const lang of ['he', 'en'] as const) {
    for (const [name, schema] of AI_SCHEMAS) {
      const sample = generateSample(toStrictJsonSchema(schema), { lang });
      const parsed = schema.safeParse(sample);
      assert(parsed.success, `${name}/${lang}: ${parsed.success ? '' : JSON.stringify(parsed.error.issues.slice(0, 3))}`);
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
