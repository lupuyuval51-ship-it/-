import type { Tables } from '@db';
import type { RoadmapPhase, TaskPriority, TaskStatus } from '@domain/plan';

export type { RoadmapPhase, TaskPriority, TaskStatus };

/** Who created a roadmap item (DB CHECK: ai | user | advisor). */
export type ItemSource = 'ai' | 'user' | 'advisor';

type Narrow<T, K extends keyof T, V> = Omit<T, K> & V;

export type RoadmapPhaseRow = Narrow<Tables<'roadmap_phases'>, 'phase', { phase: RoadmapPhase }>;

export type MilestoneRow = Narrow<Tables<'milestones'>, 'phase' | 'source', { phase: RoadmapPhase; source: ItemSource }>;

export type TaskRow = Narrow<
  Tables<'tasks'>,
  'phase' | 'priority' | 'status' | 'source',
  { phase: RoadmapPhase | null; priority: TaskPriority; status: TaskStatus; source: ItemSource }
>;

export interface TaskDependencyRow {
  task_id: string;
  depends_on_task_id: string;
}

export interface Roadmap {
  phases: RoadmapPhaseRow[];
  milestones: MilestoneRow[];
  tasks: TaskRow[];
  dependencies: TaskDependencyRow[];
}

export interface PhaseProgress {
  total: number;
  done: number;
}

export interface RoadmapProgress extends PhaseProgress {
  byPhase: Record<RoadmapPhase, PhaseProgress>;
}
