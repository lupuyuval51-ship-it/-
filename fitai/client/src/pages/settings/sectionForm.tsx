/**
 * Per-section form state for the profile page: each card edits its own copy of the server
 * data, knows whether it is dirty, and reports that to the page so navigation away with
 * unsaved changes can be confirmed.
 */
import { createContext, useContext, useEffect, useState, type ReactNode, type RefObject } from 'react';
import { Badge, Button, Card, Notice } from '../../components/ui';
import { useI18n } from '../../i18n';

interface PageGuard {
  setDirty(id: string, dirty: boolean): void;
  /** Lets the next navigation through without the unsaved-changes prompt (logout, deletion). */
  allowLeave(): void;
}

export const PageGuardContext = createContext<PageGuard | null>(null);

export function usePageGuard(): PageGuard {
  const ctx = useContext(PageGuardContext);
  return ctx ?? { setDirty: () => undefined, allowLeave: () => undefined };
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Local editable copy of `source`. When the server data changes, a clean form follows it;
 * a dirty form keeps the user's edits. `commit` adopts saved values as the new baseline.
 */
export function useSectionForm<T extends object>(id: string, source: T) {
  const key = JSON.stringify(source);
  const [state, setState] = useState(() => ({ values: source, base: source, key }));
  let current = state;
  if (state.key !== key) {
    current = { values: same(state.values, state.base) ? source : state.values, base: source, key };
    setState(current);
  }
  const dirty = !same(current.values, current.base);
  const { setDirty } = usePageGuard();
  useEffect(() => {
    setDirty(id, dirty);
  }, [id, dirty, setDirty]);
  useEffect(() => () => setDirty(id, false), [id, setDirty]);

  return {
    values: current.values,
    base: current.base,
    dirty,
    set: (patch: Partial<T>) => setState((s) => ({ ...s, values: { ...s.values, ...patch } })),
    reset: () => setState((s) => ({ ...s, values: s.base })),
    commit: (next: T) => setState({ values: next, base: next, key: JSON.stringify(next) }),
  };
}

/** A settings card containing one form with its own save / discard buttons. */
export function SectionCard({
  id,
  title,
  subtitle,
  dirty,
  saving,
  error,
  onSubmit,
  onDiscard,
  formRef,
  children,
  saveLabel,
  cancelLabel,
}: {
  id: string;
  title: ReactNode;
  subtitle?: ReactNode;
  dirty: boolean;
  saving: boolean;
  error?: string | null;
  onSubmit(): void;
  onDiscard(): void;
  formRef?: RefObject<HTMLFormElement | null>;
  children: ReactNode;
  saveLabel?: string;
  /** Always-visible cancel button (replaces "Discard changes"), e.g. to close an inline editor. */
  cancelLabel?: string;
}) {
  const { t } = useI18n();
  return (
    <Card
      id={id}
      title={title}
      subtitle={subtitle}
      className="settings-section"
      actions={
        dirty ? (
          <Badge tone="warning" icon="edit">
            {t('settings.unsaved')}
          </Badge>
        ) : null
      }
    >
      <form
        ref={formRef}
        noValidate
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!saving) onSubmit();
        }}
      >
        {children}
        {error && <Notice tone="danger">{error}</Notice>}
        <div className="settings-actions">
          {(dirty || cancelLabel) && (
            <Button variant="ghost" onClick={onDiscard} disabled={saving}>
              {cancelLabel ?? t('settings.discard')}
            </Button>
          )}
          <Button type="submit" variant="primary" icon="check" loading={saving} disabled={!dirty}>
            {saveLabel ?? t('common.actions.save')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
