import Feather from '@expo/vector-icons/Feather';
import type { StyleProp, TextStyle } from 'react-native';
import { useLocale } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { toneColor, type TextTone } from './Text';

/** The Feather subset used by the app. Keep icons sparse: typography carries hierarchy. */
export const ICON_NAMES = [
  'home',
  'layers',
  'message-square',
  'pie-chart',
  'grid',
  'settings',
  'chevron-right',
  'chevron-left',
  'chevron-down',
  'chevron-up',
  'arrow-right',
  'arrow-left',
  'arrow-up',
  'arrow-down',
  'check',
  'x',
  'plus',
  'minus',
  'info',
  'alert-circle',
  'alert-triangle',
  'check-circle',
  'circle',
  'wifi-off',
  'eye',
  'eye-off',
  'mail',
  'lock',
  'user',
  'log-out',
  'edit-2',
  'trash-2',
  'more-horizontal',
  'refresh-cw',
  'calendar',
  'clock',
  'file-text',
  'target',
  'flag',
  'send',
  'external-link',
  'copy',
  'share',
  'search',
  'filter',
  'briefcase',
  'archive',
  'bar-chart-2',
  'trending-up',
  'trending-down',
  'list',
  'sliders',
  'globe',
  'moon',
  'sun',
  'book-open',
  'shield',
  'link',
] as const;
export type IconName = (typeof ICON_NAMES)[number];

/** Icons that point along the reading direction and must be mirrored in RTL. */
const DIRECTIONAL: ReadonlySet<IconName> = new Set<IconName>([
  'chevron-right',
  'chevron-left',
  'arrow-right',
  'arrow-left',
  'log-out',
  'send',
  'external-link',
]);

export interface IconProps {
  name: IconName;
  /** Default 20. */
  size?: number;
  tone?: Exclude<TextTone, 'inherit'>;
  /** Explicit color (overrides tone). */
  color?: string;
  /** Force (or prevent) RTL mirroring. Default: mirrored when the icon is directional. */
  mirror?: boolean;
  /** Icons are decorative by default; give a label only when the icon alone carries meaning. */
  accessibilityLabel?: string;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

export function Icon({ name, size = 20, tone = 'default', color, mirror, accessibilityLabel, style, testID }: IconProps) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const flip = isRTL && (mirror ?? DIRECTIONAL.has(name));
  const decorative = !accessibilityLabel;
  return (
    <Feather
      name={name}
      size={size}
      color={color ?? toneColor(colors, tone)}
      style={[flip ? { transform: [{ scaleX: -1 }] } : null, style]}
      accessible={!decorative}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={decorative ? undefined : 'image'}
      aria-hidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
      testID={testID}
    />
  );
}
