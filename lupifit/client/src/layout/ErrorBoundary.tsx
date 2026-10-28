import { Component, type ReactNode } from 'react';
import { ErrorState } from '../components/ui';

/** Catches render errors so one broken widget never blanks the whole app. */
export class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { error: unknown }> {
  override state = { error: null as unknown };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  override componentDidCatch(error: unknown) {
    console.error('[ui] render error', error);
  }

  override render() {
    if (this.state.error) {
      return this.props.fallback ?? <ErrorState onRetry={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}
