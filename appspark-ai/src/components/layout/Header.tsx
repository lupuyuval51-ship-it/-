import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/IconButton';
import { useI18n } from '@/i18n';
import { layout, space } from '@/theme/tokens';

export interface HeaderProps {
  title?: string;
  /** Show a back button. Falls back to the Discover tab when there is no history. */
  back?: boolean;
  right?: ReactNode;
  left?: ReactNode;
  /** Small label rendered above the title (e.g. the idea name in Prompt Studio). */
  eyebrow?: string;
}

/** In-screen header used instead of the native stack header for full design control. */
export function Header({ title, back = false, right, left, eyebrow }: HeaderProps) {
  const router = useRouter();
  const { t } = useI18n();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.side}>{back ? <IconButton icon="chevron-left" accessibilityLabel={t('a11y.back')} onPress={goBack} /> : left}</View>
        <View style={styles.center}>
          {eyebrow ? (
            <AppText variant="caption" color="textTertiary" align="center" numberOfLines={1}>
              {eyebrow}
            </AppText>
          ) : null}
          {title ? (
            <AppText variant="subheading" weight="semibold" align="center" numberOfLines={1}>
              {title}
            </AppText>
          ) : null}
        </View>
        <View style={[styles.side, styles.sideEnd]}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.gutter - space.xs,
  },
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  side: {
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  sideEnd: {
    justifyContent: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
