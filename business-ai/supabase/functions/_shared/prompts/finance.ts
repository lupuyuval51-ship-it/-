/**
 * Prompt for the financial assumptions proposal (amounts in MAJOR units of the business
 * currency; converted to integer minor units server-side).
 */
import type { Locale } from '../domain/ai-api.ts';
import type { SystemPrompt } from '../ai/provider.ts';
import { localeInstruction, STABLE_SYSTEM_PROMPT, wrapBusinessData } from './common.ts';

export function financeProposalPrompt(locale: Locale, contextText: string, currency: string): { system: SystemPrompt; user: string } {
  const system: SystemPrompt = {
    stable: STABLE_SYSTEM_PROMPT,
    task: [
      'Task: propose starting assumptions for this business’s simple financial model. The user reviews and accepts each line individually, and the app computes the forecast itself.',
      `All amounts are in ${currency}, in MAJOR units (e.g. 1200.50 means 1,200.50 ${currency}), excluding VAT/sales tax unless the data says otherwise.`,
      `Return JSON with:
- "starting_capital": the starting budget from the data if the user gave one, otherwise null (never invent the founder's savings);
- "startup_costs": one-off launch costs, 3-10 lines (max 15), each {"label", "amount", "category"};
- "recurring_expenses": fixed monthly costs, 3-10 lines (max 15), each {"label", "monthly_amount", "category"};
- "revenue_streams": 1-3 streams (max 6), each {"label", "unit_price", "unit_variable_cost", "monthly_units" (units sold in month 1), "monthly_growth_pct" (month-over-month unit growth, -50 to 100)};
- "notes": 2-4 sentences (max 800 characters) explaining the main assumptions, that every number is a rough estimate to replace with real quotes and prices, and the first 2-3 things to check (e.g. get three supplier quotes, confirm the price with 10 potential customers).`,
      'Be conservative: modest first-month volume, realistic growth (usually 0-15% per month), include easily forgotten costs (payment fees, software, insurance, accounting) where relevant. Keep each "category" a short word or two (max 60 characters). Labels max 120 characters.',
      'Use existing finance lines in the data as the baseline: do not duplicate them; propose only missing or clearly improvable lines.',
      localeInstruction(locale),
    ].join('\n\n'),
  };
  const user = [wrapBusinessData(contextText), 'Propose the financial assumptions now, as JSON only.'].join('\n\n');
  return { system, user };
}
