# Feature contracts (cross-feature imports and routes)

Each feature owns `src/features/<feature>/**` and its routes under `src/app/(app)/<feature>/**`.
Tab screens and the onboarding route are thin wrappers wired by the integrator:
`src/app/(app)/(tabs)/<tab>.tsx` → `export { default } from '@/features/<feature>/screens/<Screen>'`.

| Owner | Export (path) | Signature |
|---|---|---|
| onboarding | `@/features/onboarding/screens/OnboardingScreen` (default) | Full 8-step onboarding. Search param `new=1` starts a new additional business. |
| onboarding | routes `/businesses`, `/businesses/[id]` | Business list, switch active, rename, archive, new. |
| plan | `@/features/plan/screens/PlanScreen` (default) | Plan tab. Search param `generate=1` starts generation if no plan exists. |
| plan | `@/features/plan/api` | `usePlanState(businessId)` → `{ plan, currentVersion, latestVersion, sections: Partial<Record<PlanSectionKey, SectionRow>>, isGenerating, isLoading, error, refetch }`; `useStartPlanGeneration(businessId)` mutation. |
| plan | routes `/plan/[section]`, `/plan/history`, `/plan/version/[id]` | |
| roadmap | `@/features/roadmap/api` | `useRoadmap(businessId)` → `{ phases, milestones, tasks, dependencies }`; `useRoadmapProgress(businessId)` → `{ total, done, byPhase: Record<RoadmapPhase,{ total, done }> }`; `useTasksDue(businessId, { through: 'today' })` → tasks due today or overdue, not done; `useToggleTask(businessId)` → mutate(`{ id, done }`) optimistic; `useCreateTask(businessId)`; `useCreateMilestone(businessId)`. |
| roadmap | `@/features/roadmap/components/DateField` (named `DateField`) | `{ label: string; value: string \| null /* YYYY-MM-DD */; onChange(v: string \| null): void; error?: string; hint?: string; clearable?: boolean }` |
| roadmap | `@/features/roadmap/components/TaskRow` (named `TaskRow`) | `{ task: TaskRow; onToggle(): void; onPress(): void; blockedBy?: string[] }` |
| roadmap | routes `/roadmap`, `/roadmap/tasks`, `/roadmap/task/[id]`, `/roadmap/task/new` (params `phase?`, `title?`, `description?`) | |
| finance | `@/features/finance/screens/FinanceScreen` (default) | Finance tab. |
| finance | `@/features/finance/api` | `useFinanceInputs(businessId)` → `{ inputs?: FinanceInputs; model?: FinancialModelRow; currency: string; isLoading; error; refetch }`; `useFinanceSummary(businessId, scenario?: ScenarioKey)` → `FinanceSummary \| undefined`; `useAddStartupCost(businessId)`, `useAddRecurringExpense(businessId)`. |
| finance | routes `/finance/startup-costs`, `/finance/expenses`, `/finance/revenue`, `/finance/line/[kind]/[id]`, `/finance/pricing`, `/finance/scenarios`, `/finance/forecast`, `/finance/proposal` | |
| advisor | `@/features/advisor/screens/AdvisorHomeScreen` (default) | Advisor tab (conversation list + start). |
| advisor | route `/advisor/[conversationId]` | `conversationId = 'new'` starts a conversation; search param `prompt` pre-fills the composer. |
| home | `@/features/home/screens/HomeScreen` (default) | Home tab. |
| home | `@/features/workspace/screens/WorkspaceScreen` (default) | Workspace tab. |
| home | routes `/manage`, `/manage/transactions`, `/manage/transaction/[id]` (`new` allowed), `/manage/goals`, `/manage/goal/[id]` (`new` allowed), `/settings/subscription` | |
| marketing | routes `/marketing`, `/marketing/new`, `/marketing/[id]` | |
| launch | routes `/launch`, `/launch/item/[id]` (`new` allowed) | |

Query keys: `['b', businessId, '<resource>', ...]`. After a mutation, invalidate the narrowest key; a feature
that writes another feature's data (e.g. the advisor adding a task) invalidates `['b', businessId, 'roadmap']`,
`['b', businessId, 'finance']`, etc. Resource names: `plan`, `roadmap`, `finance`, `transactions`, `goals`,
`marketing`, `launch`, `advisor`, `onboarding`.
