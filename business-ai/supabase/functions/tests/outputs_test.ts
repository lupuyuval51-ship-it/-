import { assert, assertEquals, assertThrows } from '@std/assert';
import { AiCallError } from '../_shared/ai/errors.ts';
import { validateStructured } from '../_shared/ai/structured.ts';
import { AdvisorActionSchema } from '../_shared/domain/ai-api.ts';
import { AiRoadmapSchema, PlanSectionContentSchema } from '../_shared/domain/plan.ts';
import { MarketingContentSchema } from '../_shared/domain/marketing.ts';
import {
  addDaysIso,
  normalizeRoadmap,
  parseProposeActionsInput,
  planGroupSchema,
  toFinanceProposal,
  toMarketingContent,
  toPlanSectionContent,
  toRoadmapSuggestions,
} from '../_shared/outputs.ts';

let seq = 0;
const ids = () => `id${++seq}`;

Deno.test('plan section: ids assigned server-side, blank blocks dropped, limits applied', () => {
  const content = toPlanSectionContent({
    summary: '  A lede.  ',
    blocks: [
      { text: '  First  ', basis: 'user_provided' },
      { text: '   ', basis: 'assumption' },
      { text: 'x'.repeat(2000), basis: 'ai_estimate' },
    ],
  });
  assertEquals(content.summary, 'A lede.');
  assertEquals(content.blocks.map((b) => b.id), ['b1', 'b2']);
  assertEquals(content.blocks[0], { id: 'b1', text: 'First', basis: 'user_provided' });
  assert(PlanSectionContentSchema.safeParse(content).success);
});

Deno.test('plan section: nothing usable → ai_invalid_output', () => {
  const err = assertThrows(() => toPlanSectionContent({ summary: 'x', blocks: [{ text: ' ', basis: 'assumption' }] }));
  assert(err instanceof AiCallError && err.code === 'ai_invalid_output');
});

Deno.test('structured validation: JSON parse and zod errors become ai_invalid_output with usage', () => {
  const schema = planGroupSchema(['executive_summary']);
  const usage = { inputTokens: 1, outputTokens: 1, cacheReadTokens: 0, cacheWriteTokens: 0, costMicros: 24 };
  for (const text of ['not json', '{"sections":{}}', '{"sections":{"executive_summary":{"summary":"s","blocks":[{"text":"t","basis":"verified"}]}}}']) {
    const err = assertThrows(() => validateStructured(schema, text, usage));
    assert(err instanceof AiCallError);
    assertEquals(err.code, 'ai_invalid_output');
    assertEquals(err.usage, usage);
  }
  const ok = validateStructured(schema, '```json\n{"sections":{"executive_summary":{"summary":"s","blocks":[{"text":"t","basis":"ai_estimate"}]}}}\n```', null);
  assertEquals(ok.sections.executive_summary?.blocks.length, 1);
});

Deno.test('roadmap: phases normalized to canonical order; missing phase rejected', () => {
  const phase = (p: 'days_30' | 'days_60' | 'days_90') => ({
    phase: p,
    objective: 'o',
    milestones: [],
    tasks: [{ ref: 't', title: 't', description: '', priority: 'high' as const, offset_days: 1, milestone_index: null, depends_on: [] }],
  });
  const ordered = normalizeRoadmap({ phases: [phase('days_90'), phase('days_30'), phase('days_60')] });
  assertEquals(ordered.phases.map((p) => p.phase), ['days_30', 'days_60', 'days_90']);
  const dup = { phases: [phase('days_30'), phase('days_30'), phase('days_60')] };
  assert(AiRoadmapSchema.safeParse(dup).success); // the zod schema allows it…
  assertThrows(() => normalizeRoadmap(dup), AiCallError); // …the server does not
});

Deno.test('dates: addDaysIso crosses month and year boundaries in UTC', () => {
  assertEquals(addDaysIso('2026-11-05', 0), '2026-11-05');
  assertEquals(addDaysIso('2026-11-05', 30), '2026-12-05');
  assertEquals(addDaysIso('2026-12-20', 15), '2027-01-04');
  assertEquals(addDaysIso('2028-02-28', 1), '2028-02-29');
});

Deno.test('finance proposal: major units → integer minor units, clamped, ids, blank labels dropped', () => {
  const p = toFinanceProposal(
    {
      starting_capital: 20000.5,
      startup_costs: [
        { label: ' Oven ', amount: 1234.567, category: 'equipment' },
        { label: '  ', amount: 10, category: '' },
      ],
      recurring_expenses: [{ label: 'Rent', monthly_amount: 0.1 + 0.2, category: 'premises' }],
      revenue_streams: [{ label: 'Bread', unit_price: 12.345, unit_variable_cost: 4, monthly_units: 100.555, monthly_growth_pct: 5.555 }],
      notes: 'Estimates only.',
    },
    ids,
  );
  assertEquals(p.startingCapitalMinor, 2000050);
  assertEquals(p.startupCosts.length, 1);
  assertEquals(p.startupCosts[0]?.label, 'Oven');
  assertEquals(p.startupCosts[0]?.amountMinor, 123457);
  assertEquals(p.recurringExpenses[0]?.monthlyAmountMinor, 30);
  assertEquals(p.revenueStreams[0]?.unitPriceMinor, 1235);
  assertEquals(p.revenueStreams[0]?.unitVariableCostMinor, 400);
  assertEquals(p.revenueStreams[0]?.monthlyUnits, 100.56);
  assertEquals(p.revenueStreams[0]?.monthlyGrowthPct, 5.56);
  for (const v of [p.startupCosts[0]?.amountMinor, p.recurringExpenses[0]?.monthlyAmountMinor, p.revenueStreams[0]?.unitPriceMinor]) {
    assert(Number.isInteger(v));
  }
  assert(p.startupCosts[0]?.id);
  const none = toFinanceProposal({ starting_capital: null, startup_costs: [], recurring_expenses: [], revenue_streams: [], notes: '' }, ids);
  assertEquals(none.startingCapitalMinor, null);
  const huge = toFinanceProposal({ starting_capital: 1e20, startup_costs: [], recurring_expenses: [], revenue_streams: [], notes: '' }, ids);
  assertEquals(huge.startingCapitalMinor, 10_000_000_000_000);
});

Deno.test('marketing: item ids, empty label omitted, default title by locale', () => {
  const { title, content } = toMarketingContent(
    { title: '  ', summary: 'S', items: [{ heading: 'H', body: 'B', label: '' }, { heading: ' ', body: ' ', label: 'x' }] },
    'taglines',
    'he',
  );
  assertEquals(title, 'סלוגנים');
  assertEquals(content.items, [{ id: 'i1', heading: 'H', body: 'B' }]);
  assert(MarketingContentSchema.safeParse(content).success);
  assertThrows(() => toMarketingContent({ title: 't', summary: 's', items: [{ heading: '', body: '', label: '' }] }, 'taglines', 'en'), AiCallError);
});

Deno.test('roadmap suggestions: ids, clamped due days, blank titles dropped', () => {
  const s = toRoadmapSuggestions(
    {
      suggestions: [
        { title: ' Call ', description: 'd', phase: 'days_30', priority: 'high', due_in_days: 7, rationale: 'r' },
        { title: '', description: 'd', phase: 'days_60', priority: 'low', due_in_days: 7, rationale: 'r' },
      ],
    },
    ids,
  );
  assertEquals(s.length, 1);
  assertEquals(s[0]?.title, 'Call');
  assertEquals(s[0]?.dueInDays, 7);
});

Deno.test('advisor actions: invalid actions dropped, ids assigned, long strings clipped, follow-ups capped', () => {
  const { actions, followUps } = parseProposeActionsInput(
    {
      actions: [
        { type: 'add_task', label: 'Add task', title: 'Call five cafés', description: 'x', phase: 'days_30', priority: 'high', dueInDays: 3.4 },
        { type: 'add_task', label: 'Bad phase', title: 't', description: '', phase: 'days_120', priority: 'high', dueInDays: 1 },
        { type: 'delete_everything', label: 'Nope' },
        { type: 'add_recurring_expense', label: 'L'.repeat(300), expenseLabel: 'Rent', monthlyAmountMinor: 250000 },
        { type: 'add_startup_cost', label: 'Oven', costLabel: 'Oven', amountMinor: -5 },
        { type: 'open_plan_section', label: 'Open pricing', sectionKey: 'pricing_strategy' },
        { type: 'open_plan_section', label: 'Bad key', sectionKey: 'secrets' },
        'not an object',
        { type: 'add_milestone', label: '   ', title: 'x', phase: 'days_60', dueInDays: null },
      ],
      follow_ups: ['  a  ', 'a', 'b', 'c', 'd', 42],
    },
    ids,
  );
  assertEquals(actions.map((a) => a.type), ['add_task', 'add_recurring_expense', 'add_startup_cost', 'open_plan_section']);
  for (const a of actions) {
    assert(AdvisorActionSchema.safeParse(a).success);
    assert(a.id.length > 0);
  }
  assertEquals(new Set(actions.map((a) => a.id)).size, actions.length);
  const task = actions[0];
  if (task?.type === 'add_task') assertEquals(task.dueInDays, 3);
  const exp = actions[1];
  if (exp?.type === 'add_recurring_expense') assertEquals(exp.label.length, 140);
  const cost = actions[2];
  if (cost?.type === 'add_startup_cost') assertEquals(cost.amountMinor, 0);
  assertEquals(followUps, ['a', 'b', 'c']);
  assertEquals(parseProposeActionsInput(null, ids), { actions: [], followUps: [] });
  assertEquals(parseProposeActionsInput({ actions: 'x' }, ids), { actions: [], followUps: [] });
});
