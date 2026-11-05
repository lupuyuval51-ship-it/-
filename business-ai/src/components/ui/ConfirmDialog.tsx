import { createContext, use, useCallback, useRef, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useT } from '@/i18n/I18nProvider';
import { useReducedMotion } from '@/lib/a11y';
import { useTheme } from '@/theme/ThemeProvider';
import { layout, radii, spacing } from '@/theme/tokens';
import { Button } from './Button';
import { DirectionRoot } from './DirectionRoot';
import { Text } from './Text';

export interface ConfirmOptions {
  title: string;
  message?: string;
  /** Default: "Confirm". */
  confirmLabel?: string;
  /** Default: "Cancel". */
  cancelLabel?: string;
  /** Destructive actions use the destructive button style. */
  destructive?: boolean;
}

export interface ConfirmDialogProps extends ConfirmOptions {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Shows a spinner on the confirm button (when the caller awaits work before closing). */
  confirming?: boolean;
}

/**
 * Modal confirmation that works on iOS, Android and web (never relies on Alert.alert).
 * Back button / Escape / tapping the scrim cancels.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
  confirming = false,
}: ConfirmDialogProps) {
  const { colors } = useTheme();
  const t = useT();
  const reduced = useReducedMotion();
  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduced ? 'none' : 'fade'}
      onRequestClose={onCancel}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <DirectionRoot style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={cancelLabel ?? t('common.confirm.cancel')}
          onPress={onCancel}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
        />
        <View
          accessibilityViewIsModal
          accessibilityRole={Platform.OS === 'web' ? undefined : 'alert'}
          style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}
          testID="confirm-dialog"
        >
          <View style={styles.text}>
            <Text variant="heading">{title}</Text>
            {message ? (
              <Text variant="callout" tone="secondary">
                {message}
              </Text>
            ) : null}
          </View>
          <View style={styles.actions}>
            <Button variant="quiet" label={cancelLabel ?? t('common.confirm.cancel')} onPress={onCancel} testID="confirm-cancel" />
            <Button
              variant={destructive ? 'destructive' : 'primary'}
              label={confirmLabel ?? t('common.confirm.confirm')}
              onPress={onConfirm}
              loading={confirming}
              testID="confirm-accept"
            />
          </View>
        </View>
      </DirectionRoot>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* useConfirm(): (opts) => Promise<boolean>                            */
/* ------------------------------------------------------------------ */

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (next) =>
      new Promise<boolean>((resolve) => {
        resolverRef.current?.(false); // only one dialog at a time
        resolverRef.current = resolve;
        setOptions(next);
      }),
    [],
  );

  const settle = useCallback((value: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setOptions(null);
    resolve?.(value);
  }, []);

  return (
    <ConfirmContext value={confirm}>
      {children}
      <ConfirmDialog
        visible={options !== null}
        title={options?.title ?? ''}
        message={options?.message}
        confirmLabel={options?.confirmLabel}
        cancelLabel={options?.cancelLabel}
        destructive={options?.destructive}
        onConfirm={() => settle(true)}
        onCancel={() => settle(false)}
      />
    </ConfirmContext>
  );
}

/**
 * `const confirm = useConfirm(); if (await confirm({ title, message, destructive: true })) { … }`
 */
export function useConfirm(): ConfirmFn {
  const ctx = use(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: layout.gutter },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radii.surface,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing[6],
    gap: spacing[6],
  },
  text: { gap: spacing[2] },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' },
});
