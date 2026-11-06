import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert';
import { buildRoadmapPayload, persistRoadmap } from '../ai/actions.ts';
import type { Db } from '../_shared/auth.ts';
import { AiCallError } from '../_shared/ai/errors.ts';
import type { AiRoadmap } from '../_shared/domain/plan.ts';

const STARTS = '2026-11-05';

function roadmap(): AiRoadmap {
  return {
    phases: [
      {
        phase: 'days_30',
        objective: '  Validate demand  ',
        milestones: [{ title: 'Five interviews', offset_days: 10 }, { title: '   ', offset_days: 12 }],
        tasks: [
          {
            ref: 't1',
            title: 'Interview',
            description: '',
            priority: 'high',
            offset_days: 3,
            milestone_index: 0,
            depends_on: [],
          },
          // milestone_index 1 points at a blank (dropped) milestone → no milestone link
          {
            ref: 't2',
            title: 'Price test',
            description: 'Two prices',
            priority: 'medium',
            offset_days: 9,
            milestone_index: 1,
            depends_on: ['t1', 't1', 'nope', 't2'],
          },
          {
            ref: 't1',
            title: 'Duplicate ref',
            description: '',
            priority: 'low',
            offset_days: 5,
            milestone_index: null,
            depends_on: [],
          },
          {
            ref: 't3',
            title: '   ',
            description: '',
            priority: 'low',
            offset_days: 5,
            milestone_index: null,
            depends_on: [],
          },
        ],
      },
      {
        phase: 'days_60',
        objective: 'Launch',
        milestones: [],
        tasks: [
          // t4 → t2 is fine; t1 → t4 would close a cycle t1 → t4 → t2 → t1 and is dropped
          {
            ref: 't4',
            title: 'Launch page',
            description: '',
            priority: 'high',
            offset_days: 35,
            milestone_index: null,
            depends_on: ['t2'],
          },
        ],
      },
      { phase: 'days_90', objective: 'Grow', milestones: [], tasks: [] },
    ],
  };
}

Deno.test('buildRoadmapPayload: dates, milestone keys, refs and dependency filtering', () => {
  const input = roadmap();
  input.phases[0]!.tasks[0]!.depends_on = ['t4'];
  const payload = buildRoadmapPayload(input, STARTS);

  assertEquals(payload.starts_on, STARTS);
  assertEquals(payload.phases.map((p) => p.objective), ['Validate demand', 'Launch', 'Grow']);
  assertEquals(payload.milestones, [
    { key: '0:0', phase: 'days_30', title: 'Five interviews', target_date: '2026-11-15', sort_order: 0 },
  ]);
  // blank titles dropped; second "t1" keeps no ref (refs must be unique)
  assertEquals(payload.tasks.map((t) => [t.ref, t.title, t.milestone_key, t.due_date]), [
    ['t1', 'Interview', '0:0', '2026-11-08'],
    ['t2', 'Price test', null, '2026-11-14'],
    [null, 'Duplicate ref', null, '2026-11-10'],
    ['t4', 'Launch page', null, '2026-12-10'],
  ]);
  // t2 → t1 kept (duplicate, unknown and self refs dropped), t4 → t2 kept,
  // t1 → t4 dropped because t1 → t4 → t2 → t1 would be a cycle (order of processing: t1 first)
  const edges = payload.dependencies.map((d) => `${d.ref}->${d.depends_on}`).sort();
  assert(!edges.some((e) => e === 't2->t2' || e.endsWith('->nope')));
  assertEquals(new Set(edges).size, edges.length, 'no duplicate edges');
  // whichever edge closes the cycle is dropped: the graph stays acyclic
  assertEquals(edges.length, 2);
});

Deno.test('buildRoadmapPayload: a roadmap without any usable task is invalid output', () => {
  const input = roadmap();
  for (const p of input.phases) p.tasks = [];
  assertThrows(() => buildRoadmapPayload(input, STARTS), AiCallError);
});

/** A mock database that records every call (any method) without touching a real database. */
function recordingDb() {
  const calls: { method: string; args: unknown[] }[] = [];
  const handler: ProxyHandler<Record<string, unknown>> = {
    get: (_target, method: string) => (...args: unknown[]) => {
      calls.push({ method, args });
      return Promise.resolve({ data: { phases: 3, milestones: 1, tasks: 1 }, error: null });
    },
  };
  return { db: new Proxy({}, handler) as unknown as Db, calls };
}

Deno.test('persistRoadmap: invalid AI output is rejected before ANY database call', async () => {
  const input = roadmap();
  for (const p of input.phases) p.tasks = [];
  const { db, calls } = recordingDb();
  await assertRejects(() => persistRoadmap(db, 'business-1', input, STARTS, 'create'), AiCallError);
  assertEquals(calls.length, 0, 'no write (or read) was attempted');
});

Deno.test('persistRoadmap: a valid roadmap is written in exactly ONE transactional RPC', async () => {
  const { db, calls } = recordingDb();
  const counts = await persistRoadmap(db, 'business-1', roadmap(), STARTS, 'replace_ai_items');
  assertEquals(calls.length, 1);
  assertEquals(calls[0]!.method, 'rpc');
  assertEquals(calls[0]!.args[0], 'persist_ai_roadmap');
  const params = calls[0]!.args[1] as { p_business_id: string; p_mode: string };
  assertEquals(params.p_business_id, 'business-1');
  assertEquals(params.p_mode, 'replace_ai_items');
  assertEquals(counts, { phases: 3, milestones: 1, tasks: 4 });
});
