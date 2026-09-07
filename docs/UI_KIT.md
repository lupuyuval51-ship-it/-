# DiscCoach UI kit – one-line usage per component

Everything below is exported from `@/components/ui` (kit) or `@/components/<Name>` (feature components).
Read this instead of the sources. All components are RTL/LTR-safe, use colour tokens only, and keep tap
targets ≥ 44 px. Strings come from `useT()`; add keys to `src/i18n/messages/<feature>.ts` in **both** `he` and `en`.

```tsx
import { Button, Card, Sheet, useToast, useConfirm } from "@/components/ui";
import { PageHeader } from "@/components/PageHeader";
```

## Conventions (read once)

* **Tokens only**: `bg-bg bg-surface bg-surface-2 bg-surface-3 border-border border-border-strong text-text text-muted text-subtle`
  `bg-primary text-primary-fg bg-primary-soft text-primary-strong bg-accent text-accent-fg bg-accent-soft` + `success / warning / danger / info` (+ `-soft`).
  Radii: `rounded-sm|md|lg|xl` (8/12/16/22 px). Shadows: `shadow-card`, `shadow-raised`. Nothing else.
* **Logical utilities only**: `ms- me- ps- pe- start- end- text-start text-end border-s border-e`. Never `ml/mr/left/right`.
  Directional icons flip with `className="rtl:rotate-180"` (chevrons/arrows) – the kit already does this.
* **Layout**: pages are rendered inside `<AppShell>` (max-w-3xl column, bottom nav padding included). A page = `<PageHeader …/>` + content.
* **States**: every screen needs loading (`<Skeleton>` / `<SkeletonCard>` until `hydrated`), empty (`<EmptyState action=…>`), error (`<Alert tone="danger" action={<Button>נסו שוב</Button>}>`).
* **Motion**: 150–200 ms only; helper classes `animate-fade-in`, `animate-slide-up`. Respects `prefers-reduced-motion`.
* **Session outdoor mode**: add `session-hc` to the session root to switch the palette to high contrast.

## Providers (already mounted in `src/components/Providers.tsx`)

| Hook | Usage |
|---|---|
| `useToast()` | `const { success, error, info, toast, dismiss } = useToast(); success("נשמר"); error("…", { duration: 0, action: { label: "נסו שוב", onClick } })` – returns the toast id; `duration: 0` = sticky. |
| `useConfirm()` | `const confirm = useConfirm(); if (await confirm({ title: "למחוק את האימון?", description: "…", tone: "danger", confirmLabel: "מחיקה" })) …` |

## Kit components (`@/components/ui`)

| Component | One-line usage | Notes |
|---|---|---|
| `Button` | `<Button variant="primary" size="lg" icon={<Play/>} loading={saving} fullWidth onClick={…}>התחלה</Button>` | variants `primary secondary ghost danger accent`; sizes `sm md lg xl` (md+ ≥ 44 px); `href` → renders `<Link>`; `iconEnd`, `pill`, `type`. forwardRef. |
| `IconButton` | `<IconButton label="סגירה" icon={<X/>} variant="ghost" size="md" onClick={…}/>` | `label` is required (aria-label + title). variants `ghost soft secondary primary accent danger`; `pressed` (aria-pressed), `href`, `loading`. |
| `Card` | `<Card padding="md" tone="surface" onClick={…} header={<h3/>} footer={…}>…</Card>` | `padding none sm md lg`; `tone surface muted primary accent outline`; `href` → Link; `onClick` → role=button + keyboard; `interactive` forces hover affordance. |
| `Input` | `<Input label="שם" hint="…" error={errors.name} startIcon={<User/>} endSlot={<IconButton…/>} size="lg" numeric/>` | Native input props pass through; auto id; `wrapperClassName`; `numeric` = `text-end tabular-nums` + decimal keyboard. forwardRef. |
| `Textarea` | `<Textarea label="הערות" rows={3} maxLength={300} showCount value={v} onChange={…}/>` | Same label/hint/error API as Input. forwardRef. |
| `Select` | `<Select label="תפקיד" options={[{ value: "wing", label: "כנף" }]} value={role} onChange={(v) => setRole(v)} placeholder="בחירה…"/>` | Native `<select>` (OS picker). `onChange(value, event)` is typed by the options' `value` union. |
| `SearchInput` | `<SearchInput value={q} onChange={setQ} onDebouncedChange={runFilter} placeholder="חיפוש תרגיל…"/>` | Controlled; clear button; `debounceMs` (250). forwardRef. |
| `NumberStepper` | `<NumberStepper label="דקות" value={n} onChange={setN} min={5} max={60} step={5} unit="דק׳" size="lg" editable/>` | 48/56 px ± buttons, clamps, disables at bounds, `format`, `fullWidth`. |
| `Chip` | `<Chip selected={on} onSelect={setOn} icon={<Wind/>} size="md" tone="primary">רוח</Chip>` | Check icon when selected (`hideCheck` to suppress); `static` renders a non-interactive tag. |
| `ChipGroup` | `<ChipGroup mode="multi" options={opts} value={skills} onChange={setSkills} max={3} label="מיומנויות" scroll/>` | `mode="single"` → `value: V \| null`, `onChange(v)`, `allowEmpty`. `scroll` = one horizontal strip. |
| `Toggle` | `<Toggle checked={on} onChange={setOn} label="תזכורות" description="…" labelPosition="start" size="lg"/>` | role=switch; whole row is the tap target. forwardRef. |
| `SegmentedControl` | `<SegmentedControl options={[{ value: "90", label: "90" }]} value={d} onChange={setD} label="משך" size="lg"/>` | Radio group with arrow-key navigation (RTL aware); `fullWidth` default true. |
| `Slider` | `<Slider label="אנרגיה" value={e} onChange={setE} min={1} max={5} labels={["נמוכה","","בינונית","","גבוהה"]}/>` | Native range, big thumb, 44 px tall; `valueText` for aria/output. |
| `ProgressBar` | `<ProgressBar value={62} label="שבוע 2" showPercent tone="primary" size="md"/>` | 0–100, clamped; `valueText="3/8"` replaces percent; tones `primary accent success warning danger info`. |
| `Tabs` + `tabPanelProps` | `<Tabs id="prog" items={[{ value: "week", label: "שבוע", count: 3 }]} value={tab} onChange={setTab} variant="underline"/>` then `<div {...tabPanelProps("prog", tab)}>…</div>` | Tab list only; `variant="pills"`, `fill`, arrow keys. |
| `DayPicker` | `<DayPicker value={days} onChange={setDays} max={5} label="ימי אימון"/>` / `<DayPicker mode="single" value={day} onChange={setDay}/>` | 7 chips, Sunday first, labels from `domain.dayShort.*`. |
| `Sheet` | `<Sheet open={open} onClose={close} title="…" description="…" size="md" footer={<Button fullWidth>שמירה</Button>}>…</Sheet>` | Bottom sheet on mobile / centred dialog ≥ md. Focus trap, Escape, scroll lock, portal. `dismissible={false}` for blocking flows; `initialFocusRef`; `hideClose`; sizes `sm md lg full`. Content is not rendered while closed. |
| `ConfirmDialog` | `<ConfirmDialog open={open} title="למחוק?" tone="danger" onConfirm={…} onCancel={…} loading={busy}/>` | Controlled variant; prefer `useConfirm()`. |
| `ToastProvider` / `useToast` | see Providers | Max 3 visible; bottom on phones (above the nav), top-end on desktop; `aria-live="polite"`, errors are `role="alert"`. |
| `Skeleton` | `<Skeleton height={140}/>` · `<Skeleton variant="text" lines={3}/>` · `<Skeleton variant="circle" width={44}/>` | `SkeletonCard` = avatar + two lines in a card. Never render fake numbers. |
| `EmptyState` | `<EmptyState icon={<Dumbbell/>} title="עדיין אין אימונים" description="…" action={<Button href="/workouts/new">בניית אימון</Button>} bordered/>` | sizes `sm md lg`; `secondaryAction`. |
| `Alert` | `<Alert tone="warning" title="רוח חזקה" action={<Button variant="ghost" size="sm">…</Button>} onDismiss={…}>…</Alert>` | tones `info success warning danger`; warning/danger are `role="alert"`. |
| `Badge` | `<Badge tone="success" size="sm" dot icon={<Check/>} solid>הושלם</Badge>` | Non-interactive; tones `neutral primary accent success warning danger info`. |
| `Stat` | `<Stat label="דיוק Backhand" value="72" unit="%" delta={+4} positiveIsGood hint="10 זריקות" size="lg"/>` | Presentational (no card). `positiveIsGood={false}` for times. `deltaLabel` overrides the number. |
| `ListRow` | `<ListRow leading={<Settings/>} title="הגדרות" subtitle="…" trailing="3" href="/settings"/>` | Link / button / div depending on `href` / `onClick`; chevron auto; `leadingTone`, `divider`, `disabled`. |
| `Divider` | `<Divider/>` · `<Divider label="או" spacing="lg"/>` · `<Divider orientation="vertical"/>` | |
| `Spinner` | `<Spinner size="md" tone="primary" label="טוען…"/>` | Inherits text colour by default (works inside any Button). |
| `Field` | `<Field id="x" label="…" hint="…" error="…">{control}</Field>` | Low-level label/hint/error wrapper (used by Input/Select/…); exposes `controlBaseClasses` for custom controls. |

## Feature components (`@/components/<Name>`)

| Component | One-line usage | Notes |
|---|---|---|
| `AppShell` | Applied by `src/app/(app)/layout.tsx` – do not wrap again. `<AppShell width="lg" immersive>` | Skip link, `OfflineBanner`, desktop `Sidebar`, mobile `BottomNav`, `SyncIndicator`. Routes under `/session` are immersive (no nav). |
| `PageHeader` | `<PageHeader title="אימונים" subtitle="…" back backHref="/home" actions={<IconButton…/>} size="lg">{tabs}</PageHeader>` | `back` alone → `router.back()`; `onBack`; `leading` slot (avatar). |
| `Logo` | `<Logo variant="wordmark" size={36} tone="brand"/>` · `<Logo size={24}/>` | Inline SVG; `tone="current"` inherits colour; `filled={false}` = line disc; `title=""` hides from SR. Same geometry as `public/logo.svg`. |
| `FieldDiagram` | `<FieldDiagram spec={exercise.diagram} title={l(exercise.name)} legend/>` | Renders `DiagramSpec` (lane/square/half/strip). Never mirrored (`dir="ltr"`). Legend labels from `ui.field.*`. |
| `HydrationGate` | Applied by the (app) layout. `<HydrationGate fallback={<MySkeleton/>}>…</HydrationGate>` | Also exports `FullPageSkeleton`. |
| `OfflineBanner` | Rendered by AppShell. | Uses `useOnline()`; shows the spec text while offline and a 2.5 s "back online" confirmation. |
| `SyncIndicator` | `<SyncIndicator variant="dot"/>` | Account users only; nothing when idle/synced; syncing / offline / error / pending. |
| `ExerciseCard` | `<ExerciseCard exercise={ex} href={`/exercises/${ex.id}`} favorite={fav} onToggleFavorite={(id, next) => …} compact action={<Button size="sm">החלפה</Button>}/>` | Accepts full `Exercise` or the `ExerciseCardData` subset; `onClick(exercise)` instead of `href`; `selected`. Exports `EQUIPMENT_ICONS`, `PARTICIPANT_ICONS`. |
| `WorkoutCard` | `<WorkoutCard workout={w} href={`/workouts/${w.id}`} primaryAction={{ label: "התחלה", onClick: start }} highlighted compact/>` | `primaryAction={null}` hides the button; `secondaryAction` slot. Exports `INTENSITY_TONES`. |
| `RoleBadge` | `<RoleBadge role="handler" size="sm" solid prefix="תפקיד ראשי:"/>` | Label from `ROLE_LABELS`, colour from `ROLE_TONES`, description as tooltip. |
| `StatTile` | `<StatTile label="רצף" value="5" unit="ימים" delta={1} href="/progress" loading={!hydrated}/>` | `Stat` inside a `Card`; `tone` = Card tone. |

## Hooks & i18n helpers

| Helper | Usage |
|---|---|
| `useOnline()` (`@/components/hooks/useOnline`) | `const online = useOnline();` – `navigator.onLine` + online/offline events; SSR = online. |
| `useT()` (`@/i18n/useT`) | `const { t, l, locale, dir, isRtl } = useT(); t("nav.home"); l(exercise.name)` |
| `@/i18n/domain` | `roleLabel(t, role)`, `roleDescription(t, role)`, `skillLabel(t, skill)`, `metricLabel(t, key)`, `metricUnit(t, key)`, `metricValueWithUnit(t, key, v)`, `enumLabel(t, kind, value)`, `kindLabel(t, kind)`, `dayLabel(t, day, short?)`. Kinds: `role roleIntent level ageGroup hand years playContext participants equipment fieldSize wind intensity intensityShort goal skill phase category offenseDefense windSuitability template sessionStatus source period metric metricUnit day dayShort`. |
| Nav items | `NAV_ITEMS` + `isNavActive(pathname, href)` from `@/components/BottomNav` (routes: `/home /workouts /coach /progress /profile`). |

## Recipes

```tsx
// Filter strip + list with all states
const { t } = useT();
const hydrated = useAppStore((s) => s.hydrated);
if (!hydrated) return <><SkeletonCard/><SkeletonCard/></>;
if (items.length === 0) return <EmptyState icon={<Search/>} title={t("library.empty.title")} action={<Button onClick={reset}>{t("common.clear")}</Button>}/>;
return <div className="flex flex-col gap-3">{items.map((ex) => <ExerciseCard key={ex.id} exercise={ex} href={`/exercises/${ex.id}`}/>)}</div>;
```

```tsx
// Destructive action with confirmation + toast
const confirm = useConfirm(); const { success } = useToast();
async function onDelete() {
  if (!(await confirm({ title: t("workouts.delete.title"), tone: "danger", confirmLabel: t("common.delete") }))) return;
  remove("workouts", id); success(t("common.saved"));
}
```
