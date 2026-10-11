import { Component, type ReactNode } from "react";
import { useT } from "@/components/I18nProvider";
import { Button } from "@/components/ui";
import { secondaryLink, StateView } from "@/components/ui/StateView";

export function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <main className="mx-auto max-w-3xl px-4 py-5">
      <StateView
        kind="error"
        data-testid="app-error"
        title={t("mob.error.title")}
        text={t("mob.error.text")}
        actions={
          <>
            <Button onClick={onRetry} data-testid="app-error-retry">{t("common.retry")}</Button>
            <a href="#/" className={secondaryLink} onClick={onRetry}>{t("res.library")}</a>
          </>
        }
      />
    </main>
  );
}

/**
 * A screen that throws while rendering would otherwise leave the phone showing a blank page with no way out.
 * This shows a plain message with a retry and a way back to the library. App.tsx re-keys it on every route change.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } { return { failed: true }; }
  render() {
    return this.state.failed ? <ErrorFallback onRetry={() => this.setState({ failed: false })} /> : this.props.children;
  }
}
