/**
 * Query key helpers (docs/ARCHITECTURE.md §6).
 * - User-scoped:     ['me', <resource>]
 * - Business-scoped: ['b', businessId, <resource>, ...rest]
 * `queryClient.invalidateQueries({ queryKey: qk.b(id) })` invalidates everything of one business;
 * `queryClient.removeQueries({ queryKey: qk.b(id) })` drops it (archive / delete / switch).
 */
export const qk = {
  me: {
    all: ['me'] as const,
    profile: () => ['me', 'profile'] as const,
    businesses: () => ['me', 'businesses'] as const,
    entitlement: () => ['me', 'entitlement'] as const,
    aiUsage: () => ['me', 'aiUsage'] as const,
  },
  /**
   * Business-scoped key: `qk.b(id)` → ['b', id]; `qk.b(id, 'tasks')` → ['b', id, 'tasks'];
   * `qk.b(id, 'plan', 'version', versionId)` → ['b', id, 'plan', 'version', versionId].
   */
  b: <const R extends readonly unknown[]>(businessId: string, ...rest: R) => ['b', businessId, ...rest] as const,
} as const;
