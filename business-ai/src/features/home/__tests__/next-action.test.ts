import { translate } from '@/i18n/translate';
import { daysBetween, dayNumber, nextAction, overdueTasks, type NextActionInput, type NextActionTask } from '../next-action';

const TODAY = '2026-11-05';

function task(partial: Partial<NextActionTask> & { id: string }): NextActionTask {
  return {
    title: `Task ${partial.id}`,
    status: 'todo',
    priority: 'medium',
    due_date: null,
    blocked: false,
    ...partial,
  };
}

function input(partial: Partial<NextActionInput> = {}): NextActionInput {
  return {
    onboardingComplete: true,
    planStatus: 'ready',
    hasRoadmap: true,
    tasks: [],
    milestones: [],
    hasFinanceInputs: true,
    today: TODAY,
    ...partial,
  };
}

describe('date helpers', () => {
  it('counts calendar days independent of time zone and DST', () => {
    expect(daysBetween('2026-03-26', '2026-03-30')).toBe(4); // across EU/IL DST change
    expect(daysBetween('2026-11-05', '2026-11-01')).toBe(-4);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2); // leap year
  });

  it('rejects invalid dates', () => {
    expect(dayNumber('2026-02-31')).toBeNull();
    expect(dayNumber('nope')).toBeNull();
    expect(dayNumber(null)).toBeNull();
    expect(daysBetween('bad', TODAY)).toBeNull();
  });

  it('accepts timestamp-prefixed strings', () => {
    expect(dayNumber('2026-11-05T23:59:59Z')).toBe(dayNumber('2026-11-05'));
  });
});

describe('nextAction — rule order', () => {
  it('1. onboarding incomplete wins over everything', () => {
    const a = nextAction(input({ onboardingComplete: false, planStatus: 'none', hasRoadmap: false, hasFinanceInputs: false }));
    expect(a.kind).toBe('continue_onboarding');
    expect(a.href).toBe('/onboarding');
  });

  it('2. no plan → generate', () => {
    const a = nextAction(input({ planStatus: 'none', hasRoadmap: false }));
    expect(a).toMatchObject({ kind: 'generate_plan', href: '/plan?generate=1', titleKey: 'home.next.generatePlan.title' });
  });

  it('3. generating → view progress', () => {
    expect(nextAction(input({ planStatus: 'generating' }))).toMatchObject({ kind: 'plan_generating', href: '/plan' });
  });

  it('4. failed → retry', () => {
    expect(nextAction(input({ planStatus: 'failed' }))).toMatchObject({ kind: 'retry_plan', href: '/plan?generate=1' });
  });

  it('5. ready plan without roadmap → create roadmap', () => {
    const a = nextAction(input({ hasRoadmap: false, tasks: [task({ id: 'a', due_date: '2026-11-01' })] }));
    expect(a).toMatchObject({ kind: 'create_roadmap', href: '/roadmap' });
  });

  it('6. overdue task beats an earlier-dated task that is not overdue and the finance nudge', () => {
    const a = nextAction(
      input({
        hasFinanceInputs: false,
        tasks: [task({ id: 'today', due_date: TODAY, priority: 'high' }), task({ id: 'late', due_date: '2026-11-03', priority: 'low' })],
      }),
    );
    expect(a).toMatchObject({ kind: 'overdue_task', taskId: 'late', href: '/roadmap/task/late', vars: { title: 'Task late', count: 2 } });
  });

  it('6. among overdue tasks: high priority first, then most overdue', () => {
    const tasks = [
      task({ id: 'm-very-late', due_date: '2026-10-01', priority: 'medium' }),
      task({ id: 'h-late', due_date: '2026-11-02', priority: 'high' }),
      task({ id: 'h-later', due_date: '2026-10-20', priority: 'high' }),
    ];
    expect(nextAction(input({ tasks })).taskId).toBe('h-later');
    expect(overdueTasks(tasks, TODAY).map((t) => t.id)).toEqual(['h-later', 'h-late', 'm-very-late']);
  });

  it('6. skips blocked and done overdue tasks', () => {
    const tasks = [
      task({ id: 'blocked', due_date: '2026-10-01', priority: 'high', blocked: true }),
      task({ id: 'done', due_date: '2026-10-01', priority: 'high', status: 'done' }),
      task({ id: 'ok', due_date: '2026-11-04', priority: 'low' }),
    ];
    expect(nextAction(input({ tasks }))).toMatchObject({ kind: 'overdue_task', taskId: 'ok', vars: { count: 1 } });
  });

  it('7. next unblocked task by due date, then priority; undated last', () => {
    const tasks = [
      task({ id: 'undated-high', priority: 'high' }),
      task({ id: 'later', due_date: '2026-11-20', priority: 'high' }),
      task({ id: 'soon-low', due_date: '2026-11-08', priority: 'low' }),
      task({ id: 'soon-high', due_date: '2026-11-08', priority: 'high' }),
      task({ id: 'soon-blocked', due_date: '2026-11-06', priority: 'high', blocked: true }),
    ];
    const a = nextAction(input({ tasks }));
    expect(a).toMatchObject({ kind: 'next_task', taskId: 'soon-high', bodyKey: 'home.next.nextTask.dueInDays', vars: { count: 3 } });
  });

  it('7. due today / tomorrow / undated bodies', () => {
    expect(nextAction(input({ tasks: [task({ id: 'a', due_date: TODAY })] })).bodyKey).toBe('home.next.nextTask.dueToday');
    expect(nextAction(input({ tasks: [task({ id: 'a', due_date: '2026-11-06' })] })).bodyKey).toBe('home.next.nextTask.dueTomorrow');
    expect(nextAction(input({ tasks: [task({ id: 'a' })] })).bodyKey).toBe('home.next.nextTask.noDate');
  });

  it('7. undated task in a milestone mentions the milestone', () => {
    const a = nextAction(
      input({
        tasks: [task({ id: 'a', milestone_id: 'm1' })],
        milestones: [{ id: 'm1', title: 'First customer', target_date: null, achieved_at: null }],
      }),
    );
    expect(a).toMatchObject({ bodyKey: 'home.next.nextTask.milestone', vars: { title: 'Task a', milestone: 'First customer' } });
  });

  it('7. ties are broken by sort order, then id (deterministic)', () => {
    const tasks = [task({ id: 'b', sort_order: 1 }), task({ id: 'c', sort_order: 0 }), task({ id: 'a', sort_order: 1 })];
    expect(nextAction(input({ tasks })).taskId).toBe('c');
    expect(nextAction(input({ tasks: [...tasks].reverse() })).taskId).toBe('c');
    const sameOrder = [task({ id: 'b' }), task({ id: 'a' })];
    expect(nextAction(input({ tasks: sameOrder })).taskId).toBe('a');
  });

  it('7. in-progress tasks count as open', () => {
    expect(nextAction(input({ tasks: [task({ id: 'a', status: 'in_progress' })] })).taskId).toBe('a');
  });

  it('8. all tasks done and no finance inputs → set up finances', () => {
    const a = nextAction(input({ hasFinanceInputs: false, tasks: [task({ id: 'a', status: 'done' })] }));
    expect(a).toMatchObject({ kind: 'setup_finances', href: '/finance' });
  });

  it('9. everything done → ask the advisor with a localized prompt', () => {
    const he = nextAction(input({ tasks: [task({ id: 'a', status: 'done' })] }));
    expect(he.kind).toBe('ask_advisor');
    expect(he.href.startsWith('/advisor/new?prompt=')).toBe(true);
    const prompt = decodeURIComponent(he.href.slice('/advisor/new?prompt='.length));
    expect(prompt).toBe(translate('he', 'home.next.askAdvisor.prompt'));

    const en = nextAction(input({ locale: 'en' }));
    expect(decodeURIComponent(en.href.split('prompt=')[1] ?? '')).toBe(translate('en', 'home.next.askAdvisor.prompt'));
  });

  it('task ids are URL-encoded in links', () => {
    expect(nextAction(input({ tasks: [task({ id: 'a/b' })] })).href).toBe('/roadmap/task/a%2Fb');
  });

  it('is pure: does not mutate the input and returns equal output for equal input', () => {
    const tasks = Object.freeze([task({ id: 'b', due_date: '2026-11-09' }), task({ id: 'a', due_date: '2026-11-07' })]);
    const i = input({ tasks });
    expect(nextAction(i)).toEqual(nextAction(i));
    expect(tasks.map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('every returned key translates in both languages', () => {
    const cases: NextActionInput[] = [
      input({ onboardingComplete: false }),
      input({ planStatus: 'none' }),
      input({ planStatus: 'generating' }),
      input({ planStatus: 'failed' }),
      input({ hasRoadmap: false }),
      input({ tasks: [task({ id: 'a', due_date: '2026-11-01' })] }),
      input({ tasks: [task({ id: 'a', due_date: '2026-11-10' })] }),
      input({ hasFinanceInputs: false }),
      input(),
    ];
    for (const c of cases) {
      const a = nextAction(c);
      for (const locale of ['he', 'en'] as const) {
        for (const key of [a.titleKey, a.bodyKey, a.ctaKey]) {
          const text = translate(locale, key, a.vars);
          expect(text).not.toBe(key);
          expect(text).not.toMatch(/\{\w+\}/);
        }
      }
    }
  });
});
