// Concurrency checks against the LOCAL Supabase stack (never a hosted project).
// Fires the same approval many times in parallel and verifies that each proposal is applied
// exactly once:
//   1. apply_advisor_action   — 10× an expense proposal + 10× a task proposal, in parallel
//   2. accept_finance_proposal — 10× "Accept all" of the same 3 lines + starting capital, in parallel
//   3. accept_finance_proposal — a batch whose last line is invalid saves nothing (all-or-nothing)
// Usage (from business-ai/): node e2e/race-checks.mjs   → prints JSON, exit 1 on any failure.
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');

const status = JSON.parse(execFileSync('supabase', ['status', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(status.API_URL)) throw new Error(`refusing to run against ${status.API_URL}`);

const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const email = `race-${Date.now()}@example.com`;
const password = 'Str0ngPass!';
const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (created.error) throw created.error;
const userId = created.data.user.id;
const user = createClient(status.API_URL, status.ANON_KEY, { auth: { persistSession: false } });
const failures = [];
const report = {};

try {
  const signIn = await user.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;
  const { data: biz, error: bizError } = await user.from('businesses').insert({ name: 'Race bakery' }).select().single();
  if (bizError) throw bizError;
  const count = async (table) => (await user.from(table).select('*', { count: 'exact', head: true }).eq('business_id', biz.id)).count;

  // 1. Advisor actions
  const { data: conv } = await user.from('ai_conversations').insert({ business_id: biz.id, title: 'Race' }).select().single();
  const { data: msg, error: msgError } = await admin
    .from('ai_messages')
    .insert({
      conversation_id: conv.id,
      role: 'assistant',
      content: 'Proposals',
      actions: [
        { type: 'add_recurring_expense', id: 'r1', label: 'Rent', expenseLabel: 'Kitchen rent', monthlyAmountMinor: 300000 },
        { type: 'add_task', id: 't1', label: 'Task', title: 'Call suppliers', description: '', phase: 'days_30', priority: 'high', dueInDays: 3 },
      ],
    })
    .select()
    .single();
  if (msgError) throw msgError;
  const fire = (id) => user.rpc('apply_advisor_action', { p_message_id: msg.id, p_action_id: id });
  const advisor = await Promise.all([...Array(10)].map(() => fire('r1')).concat([...Array(10)].map(() => fire('t1'))));
  const statuses = advisor.map((r) => (r.error ? `error:${r.error.message}` : r.data.status));
  report.advisor = {
    calls: statuses.length,
    applied: statuses.filter((s) => s === 'applied').length,
    alreadyApplied: statuses.filter((s) => s === 'already_applied').length,
    errors: statuses.filter((s) => s.startsWith('error')),
    expenses: await count('recurring_expenses'),
    tasks: await count('tasks'),
  };
  if (report.advisor.applied !== 2 || report.advisor.expenses !== 1 || report.advisor.tasks !== 1 || report.advisor.errors.length) {
    failures.push('advisor: expected exactly one expense and one task');
  }

  // 2. Finance "Accept all", 10× in parallel (the expense from step 1 has a different source_ref)
  const lines = [
    { kind: 'startup', label: 'Deck oven', category: 'equipment', amount_minor: 2500000, source_ref: 'proposal:race-s1' },
    { kind: 'expense', label: 'Flour', category: 'supplies', monthly_amount_minor: 120000, source_ref: 'proposal:race-e1' },
    { kind: 'revenue', label: 'Sourdough loaf', unit_price_minor: 2800, unit_variable_cost_minor: 900, monthly_units: 600, monthly_growth_pct: 5, source_ref: 'proposal:race-r1' },
  ];
  const accept = () => user.rpc('accept_finance_proposal', { p_business_id: biz.id, p_lines: lines, p_starting_capital_minor: 4000000 });
  const finance = await Promise.all([...Array(10)].map(accept));
  const inserted = finance.reduce((n, r) => n + (r.error ? 0 : r.data.inserted), 0);
  report.financeAcceptAll = {
    calls: finance.length,
    errors: finance.filter((r) => r.error).map((r) => r.error.message),
    totalInserted: inserted,
    startupCosts: await count('startup_costs'),
    recurringExpenses: await count('recurring_expenses'),
    revenueStreams: await count('revenue_streams'),
    startingCapital: (await user.from('financial_models').select('starting_capital_minor').eq('business_id', biz.id).single()).data?.starting_capital_minor,
  };
  if (
    inserted !== 3 ||
    report.financeAcceptAll.errors.length ||
    report.financeAcceptAll.startupCosts !== 1 ||
    report.financeAcceptAll.recurringExpenses !== 2 || // kitchen rent (advisor) + flour
    report.financeAcceptAll.revenueStreams !== 1 ||
    report.financeAcceptAll.startingCapital !== 4000000
  ) {
    failures.push('finance accept all: expected each line exactly once and the capital applied');
  }

  // 3. All-or-nothing: the last line is invalid → nothing from this batch is saved
  const before = await count('startup_costs');
  const bad = await user.rpc('accept_finance_proposal', {
    p_business_id: biz.id,
    p_lines: [
      { kind: 'startup', label: 'Mixer', category: 'equipment', amount_minor: 900000, source_ref: 'proposal:race-s2' },
      { kind: 'revenue', label: '   ', unit_price_minor: 1, unit_variable_cost_minor: 0, monthly_units: 1, monthly_growth_pct: 0, source_ref: 'proposal:race-r2' },
    ],
    p_starting_capital_minor: 1,
  });
  report.financeAllOrNothing = {
    failedAsExpected: Boolean(bad.error),
    startupCostsBefore: before,
    startupCostsAfter: await count('startup_costs'),
    startingCapitalAfter: (await user.from('financial_models').select('starting_capital_minor').eq('business_id', biz.id).single()).data?.starting_capital_minor,
  };
  if (!bad.error || report.financeAllOrNothing.startupCostsAfter !== before || report.financeAllOrNothing.startingCapitalAfter !== 4000000) {
    failures.push('finance all-or-nothing: a failing batch must not save any item');
  }
} finally {
  await admin.auth.admin.deleteUser(userId);
}

console.log(JSON.stringify({ ok: failures.length === 0, failures, ...report }, null, 2));
process.exit(failures.length === 0 ? 0 : 1);
