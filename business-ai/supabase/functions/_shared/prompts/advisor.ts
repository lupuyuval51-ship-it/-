/**
 * Advisor chat: system prompt, the strict `propose_actions` tool and conversation history rendering.
 */
import { z } from 'zod';
import type { AdvisorAction, Locale } from '../domain/ai-api.ts';
import { AdvisorActionSchema } from '../domain/ai-api.ts';
import type { ChatMessage, SystemPrompt, ToolSpec } from '../ai/provider.ts';
import { toStrictJsonSchema } from '../ai/json-schema.ts';
import { localeInstruction, STABLE_SYSTEM_PROMPT, truncate, wrapBusinessData } from './common.ts';

export const PROPOSE_ACTIONS_TOOL = 'propose_actions';
export const MAX_ADVISOR_ACTIONS = 5;
export const MAX_FOLLOW_UPS = 3;
export const MAX_HISTORY_MESSAGES = 20;
export const HISTORY_MESSAGE_CHARS = 2_000;

/** Tool input: AdvisorAction without `id` (ids are assigned server-side) + follow-up questions. */
const ToolActionSchema = z.union(
  AdvisorActionSchema.options.map((o) => (o as unknown as z.ZodObject<z.ZodRawShape>).omit({ id: true })) as unknown as [
    z.ZodType,
    z.ZodType,
    ...z.ZodType[],
  ],
);
export const ProposeActionsInputSchema = z.object({
  actions: z.array(ToolActionSchema).max(MAX_ADVISOR_ACTIONS),
  follow_ups: z.array(z.string().max(200)).max(MAX_FOLLOW_UPS),
});

export const PROPOSE_ACTIONS_TOOL_SPEC: ToolSpec = {
  name: PROPOSE_ACTIONS_TOOL,
  description:
    'Show the user up to 5 concrete next steps as buttons they can tap to apply, plus up to 3 short follow-up questions. Nothing is executed until the user taps. Call at most once, at the very end of your reply, and only when concrete steps help. Money amounts are integer minor units of the business currency (e.g. 250.00 ILS = 25000). dueInDays counts days from today (0-365) or null.',
  inputSchema: toStrictJsonSchema(ProposeActionsInputSchema),
};

export function advisorSystemPrompt(locale: Locale, currency: string, today: string): SystemPrompt {
  return {
    stable: STABLE_SYSTEM_PROMPT,
    task: [
      'Task: you are now the BUSINESS AI advisor, a calm and practical business coach chatting with the founder about THEIR business (described in the data).',
      `Today is ${today}. The business currency is ${currency}.`,
      `How to answer:
- Answer the question directly first, then give the reasoning or steps. Be specific to this business: refer to its plan, roadmap, numbers and goals when relevant.
- Usually 60-250 words. Short paragraphs and simple "-" lists. No tables, no headings, no emoji.
- If the question depends on facts you do not have, say what is unknown and how to find out cheaply.
- If the user asks for something unrelated to building or running their business, answer briefly and steer back.
- Never claim that you changed, saved or scheduled anything.`,
      `Suggested actions:
- When concrete next steps would clearly help, call the ${PROPOSE_ACTIONS_TOOL} tool ONCE, after you have written your full answer, with 1-${MAX_ADVISOR_ACTIONS} actions and up to ${MAX_FOLLOW_UPS} follow-up questions the user might ask next. Otherwise do not call it.
- Action types: add_task (a roadmap task: title, description, phase days_30/days_60/days_90, priority, dueInDays), add_milestone, add_recurring_expense / add_startup_cost (amounts in integer minor units of ${currency}; label them as estimates in your text), open_plan_section (point to a plan section by key).
- Each action's "label" is the short button text (max 140 characters) in the user's language.
- Do not mention the tool by name; you may say "you can add these with the suggestions below".`,
      localeInstruction(locale),
    ].join('\n\n'),
  };
}

function describeAction(a: AdvisorAction): string {
  switch (a.type) {
    case 'add_task':
      return `add task "${a.title}"`;
    case 'add_milestone':
      return `add milestone "${a.title}"`;
    case 'add_recurring_expense':
      return `add monthly expense "${a.expenseLabel}"`;
    case 'add_startup_cost':
      return `add startup cost "${a.costLabel}"`;
    case 'open_plan_section':
      return `open plan section ${a.sectionKey}`;
  }
}

export interface StoredMessage {
  role: 'user' | 'assistant';
  content: string;
  actions: unknown;
  status: string;
}

/**
 * Renders stored messages (oldest first) as plain-text chat history. Previously proposed actions
 * become a short note. Failed assistant messages are skipped; history always starts with a user turn.
 */
export function renderHistory(rows: StoredMessage[]): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const row of rows) {
    if (row.role === 'assistant' && row.status !== 'complete') continue;
    let content = truncate(row.content, HISTORY_MESSAGE_CHARS);
    if (row.role === 'assistant' && Array.isArray(row.actions) && row.actions.length > 0) {
      const described: string[] = [];
      for (const raw of row.actions) {
        const parsed = AdvisorActionSchema.safeParse(raw);
        if (parsed.success) described.push(describeAction(parsed.data));
      }
      if (described.length > 0) content += `\n\n(Suggested actions shown with this reply: ${described.join('; ')}.)`;
    }
    if (content.trim() === '') continue;
    if (out.length === 0 && row.role === 'assistant') continue;
    out.push({ role: row.role, content });
  }
  return out;
}

/** The current user turn: business data envelope followed by the user's message. */
export function advisorUserTurn(contextText: string, message: string): string {
  return `${wrapBusinessData(contextText)}\n\nThe user's message:\n${message}`;
}
