import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { announce, useReducedMotion } from '@/lib/a11y';
import { useTheme } from '@/theme/ThemeProvider';
import { layout, motion, spacing } from '@/theme/tokens';
import { InlineNotice, type NoticeTone } from './InlineNotice';

export interface NoticeOptions {
  message: string;
  /** Default `success`. */
  tone?: NoticeTone;
  title?: string;
  action?: { label: string; onPress: () => void };
  /** Default 3000 ms. */
  durationMs?: number;
}

interface NoticeApi {
  show: (options: NoticeOptions) => void;
  hide: () => void;
}

const NoticeContext = createContext<NoticeApi | null>(null);

interface Current extends NoticeOptions {
  id: number;
}

/** Distance from the bottom edge so notices clear a tab bar. */
const BOTTOM_OFFSET = 64;

/**
 * Quiet feedback after mutations: a single InlineNotice near the bottom for ~3 s.
 * Fades (opacity only) unless reduce motion is on. Also announced to screen readers.
 */
export function NoticeProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Current | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const counter = useRef(0);

  const hide = useCallback(() => setCurrent(null), []);

  const show = useCallback((options: NoticeOptions) => {
    counter.current += 1;
    setCurrent({ ...options, id: counter.current });
    announce(options.title ? `${options.title}. ${options.message}` : options.message);
  }, []);

  useEffect(() => {
    if (!current) return;
    if (reduced) opacity.setValue(1);
    else Animated.timing(opacity, { toValue: 1, duration: motion.base, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      if (reduced) {
        setCurrent(null);
        return;
      }
      Animated.timing(opacity, { toValue: 0, duration: motion.base, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setCurrent((c) => (c?.id === current.id ? null : c));
      });
    }, current.durationMs ?? motion.noticeVisibleMs);
    return () => clearTimeout(timer);
  }, [current, reduced, opacity]);

  const api = useMemo<NoticeApi>(() => ({ show, hide }), [show, hide]);

  return (
    <NoticeContext value={api}>
      {children}
      {current ? (
        <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + BOTTOM_OFFSET }]}>
          <Animated.View style={[styles.notice, { opacity }]}>
            <InlineNotice
              tone={current.tone ?? 'success'}
              title={current.title}
              message={current.message}
              action={current.action}
              onDismiss={hide}
              testID="notice"
              style={[styles.floating, { borderColor: colors.border }]}
            />
          </Animated.View>
        </View>
      ) : null}
    </NoticeContext>
  );
}

/** `const notice = useNotice(); notice.show({ message: t('settings.account.saved') })` */
export function useNotice(): NoticeApi {
  const ctx = use(NoticeContext);
  if (!ctx) throw new Error('useNotice must be used inside <NoticeProvider>');
  return ctx;
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, paddingHorizontal: layout.gutter, alignItems: 'center' },
  notice: { width: '100%', maxWidth: layout.maxContentWidth - spacing[10] },
  floating: { borderWidth: StyleSheet.hairlineWidth },
});
