import type { StyleProp, ViewStyle } from 'react-native';
import { useT } from '@/i18n/I18nProvider';
import { toAppError } from '@/lib/errors';
import { EmptyState } from './EmptyState';

export interface ErrorStateProps {
  /** Anything thrown or returned as `query.error`. Mapped through toAppError(). */
  error: unknown;
  /** Shows a "Try again" button. */
  onRetry?: () => void;
  retrying?: boolean;
  /** Overrides the default title. */
  title?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Translated, actionable error. Network failures get an offline-specific icon and title. */
export function ErrorState({ error, onRetry, retrying, title, style, testID }: ErrorStateProps) {
  const t = useT();
  const appError = toAppError(error);
  const offline = appError.code === 'network' || appError.code === 'offline';
  return (
    <EmptyState
      icon={offline ? 'wifi-off' : 'alert-circle'}
      title={title ?? (offline ? t('common.states.offlineTitle') : t('common.states.errorTitle'))}
      body={t(appError.messageKey)}
      action={onRetry ? { label: t('common.actions.retry'), onPress: onRetry, loading: retrying } : undefined}
      style={style}
      testID={testID}
    />
  );
}
