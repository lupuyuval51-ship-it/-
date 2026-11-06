import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';

import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

import type { TextColor } from './AppText';

type Shape =
  | { p: string }
  | { c: [number, number, number] }
  | { r: [number, number, number, number, number] }
  | { l: [number, number, number, number] }
  | { pl: number[] }
  | { pg: number[] };

/**
 * Hand-picked 24×24 stroke icons (Feather/Lucide-style geometry). Keeping the
 * set small and consistent is part of the visual identity.
 */
const ICONS = {
  search: [{ c: [11, 11, 8] }, { l: [21, 21, 16.65, 16.65] }],
  sparkles: [{ p: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z' }, { p: 'M19 16.5l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6z' }],
  bookmark: [{ p: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z' }],
  compass: [{ c: [12, 12, 10] }, { pg: [16.24, 7.76, 14.12, 14.12, 7.76, 16.24, 9.88, 9.88] }],
  layers: [{ pg: [12, 2, 2, 7, 12, 12, 22, 7] }, { pl: [2, 17, 12, 22, 22, 17] }, { pl: [2, 12, 12, 17, 22, 12] }],
  user: [{ p: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' }, { c: [12, 7, 4] }],
  sliders: [
    { l: [21, 4, 14, 4] }, { l: [10, 4, 3, 4] }, { l: [21, 12, 12, 12] }, { l: [8, 12, 3, 12] }, { l: [21, 20, 16, 20] }, { l: [12, 20, 3, 20] },
    { l: [14, 2, 14, 6] }, { l: [8, 10, 8, 14] }, { l: [16, 18, 16, 22] },
  ],
  'chevron-left': [{ pl: [15, 18, 9, 12, 15, 6] }],
  'chevron-right': [{ pl: [9, 18, 15, 12, 9, 6] }],
  'chevron-down': [{ pl: [6, 9, 12, 15, 18, 9] }],
  'chevron-up': [{ pl: [18, 15, 12, 9, 6, 15] }],
  'arrow-left': [{ l: [19, 12, 5, 12] }, { pl: [12, 19, 5, 12, 12, 5] }],
  'arrow-right': [{ l: [5, 12, 19, 12] }, { pl: [12, 5, 19, 12, 12, 19] }],
  'arrow-up-right': [{ l: [7, 17, 17, 7] }, { pl: [7, 7, 17, 7, 17, 17] }],
  copy: [{ r: [9, 9, 13, 13, 2] }, { p: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' }],
  check: [{ pl: [20, 6, 9, 17, 4, 12] }],
  x: [{ l: [18, 6, 6, 18] }, { l: [6, 6, 18, 18] }],
  share: [{ c: [18, 5, 3] }, { c: [6, 12, 3] }, { c: [18, 19, 3] }, { l: [8.59, 13.51, 15.42, 17.49] }, { l: [15.41, 6.51, 8.59, 10.49] }],
  edit: [{ p: 'M12 20h9' }, { p: 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' }],
  trash: [{ pl: [3, 6, 5, 6, 21, 6] }, { p: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }, { l: [10, 11, 10, 17] }, { l: [14, 11, 14, 17] }],
  plus: [{ l: [12, 5, 12, 19] }, { l: [5, 12, 19, 12] }],
  refresh: [{ pl: [23, 4, 23, 10, 17, 10] }, { pl: [1, 20, 1, 14, 7, 14] }, { p: 'M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15' }],
  download: [{ p: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }, { pl: [7, 10, 12, 15, 17, 10] }, { l: [12, 15, 12, 3] }],
  sun: [
    { c: [12, 12, 5] }, { l: [12, 1, 12, 3] }, { l: [12, 21, 12, 23] }, { l: [4.22, 4.22, 5.64, 5.64] }, { l: [18.36, 18.36, 19.78, 19.78] },
    { l: [1, 12, 3, 12] }, { l: [21, 12, 23, 12] }, { l: [4.22, 19.78, 5.64, 18.36] }, { l: [18.36, 5.64, 19.78, 4.22] },
  ],
  moon: [{ p: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' }],
  globe: [{ c: [12, 12, 10] }, { l: [2, 12, 22, 12] }, { p: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' }],
  zap: [{ pg: [13, 2, 3, 14, 12, 14, 11, 22, 21, 10, 12, 10] }],
  flame: [{ p: 'M12 22c4 0 7-2.9 7-6.8 0-3-1.6-5.2-3.6-7.4-.4 1.5-1.2 2.6-2.4 3.4C13.2 8.5 13 5 11 2c-.7 2.3-2.2 3.6-3.6 5.2C5.8 9 5 11 5 13.2 5 19.1 8 22 12 22z' }],
  rocket: [
    { p: 'M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z' },
    { p: 'M12 15l-3-3a22 22 0 0 1 2-3.95A12.9 12.9 0 0 1 22 2c0 2.72-.9 7.5-6 11a22.4 22.4 0 0 1-4 2z' },
    { p: 'M9 12H4s.5-3 2-4 5-1 5-1' }, { p: 'M12 15v5s3-.5 4-2 1-5 1-5' },
  ],
  lightbulb: [{ p: 'M9 18h6' }, { p: 'M10 22h4' }, { p: 'M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z' }],
  star: [{ pg: [12, 2, 15.09, 8.26, 22, 9.27, 17, 14.14, 18.18, 21.02, 12, 17.77, 5.82, 21.02, 7, 14.14, 2, 9.27, 8.91, 8.26] }],
  play: [{ pg: [5, 3, 19, 12, 5, 21] }],
  clock: [{ c: [12, 12, 10] }, { pl: [12, 6, 12, 12, 16, 14] }],
  smartphone: [{ r: [5, 2, 14, 20, 2] }, { l: [12, 18, 12.01, 18] }],
  cpu: [
    { r: [4, 4, 16, 16, 2] }, { r: [9, 9, 6, 6, 0] }, { l: [9, 1, 9, 4] }, { l: [15, 1, 15, 4] }, { l: [9, 20, 9, 23] }, { l: [15, 20, 15, 23] },
    { l: [20, 9, 23, 9] }, { l: [20, 14, 23, 14] }, { l: [1, 9, 4, 9] }, { l: [1, 14, 4, 14] },
  ],
  info: [{ c: [12, 12, 10] }, { l: [12, 16, 12, 12] }, { l: [12, 8, 12.01, 8] }],
  alert: [{ c: [12, 12, 10] }, { l: [12, 8, 12, 12] }, { l: [12, 16, 12.01, 16] }],
  lock: [{ r: [3, 11, 18, 11, 2] }, { p: 'M7 11V7a5 5 0 0 1 10 0v4' }],
  mail: [{ p: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' }, { pl: [22, 6, 12, 13, 2, 6] }],
  'log-out': [{ p: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' }, { pl: [16, 17, 21, 12, 16, 7] }, { l: [21, 12, 9, 12] }],
  grid: [{ r: [3, 3, 7, 7, 1] }, { r: [14, 3, 7, 7, 1] }, { r: [14, 14, 7, 7, 1] }, { r: [3, 14, 7, 7, 1] }],
  'external-link': [{ p: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }, { pl: [15, 3, 21, 3, 21, 9] }, { l: [10, 14, 21, 3] }],
  target: [{ c: [12, 12, 10] }, { c: [12, 12, 6] }, { c: [12, 12, 2] }],
  book: [{ p: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' }, { p: 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' }],
  tag: [{ p: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z' }, { l: [7, 7, 7.01, 7] }],
  'more-horizontal': [{ c: [12, 12, 1] }, { c: [19, 12, 1] }, { c: [5, 12, 1] }],
  send: [{ l: [22, 2, 11, 13] }, { pg: [22, 2, 15, 22, 11, 13, 2, 9] }],
  beaker: [{ p: 'M9 3h6' }, { p: 'M10 3v6.5L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9.5V3' }],
  wallet: [{ p: 'M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z' }, { p: 'M16 7V5a2 2 0 0 0-2-2H6' }, { c: [17, 14, 1] }],
  history: [{ p: 'M3 12a9 9 0 1 0 3-6.7' }, { pl: [3, 3, 3, 9, 9, 9] }, { pl: [12, 7, 12, 12, 15, 14] }],
  chart: [{ l: [18, 20, 18, 10] }, { l: [12, 20, 12, 4] }, { l: [6, 20, 6, 14] }],
  'trending-up': [{ pl: [23, 6, 13.5, 15.5, 8.5, 10.5, 1, 18] }, { pl: [17, 6, 23, 6, 23, 12] }],
  folder: [{ p: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' }],
  'file-text': [{ p: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }, { pl: [14, 2, 14, 8, 20, 8] }, { l: [16, 13, 8, 13] }, { l: [16, 17, 8, 17] }],
  wand: [{ p: 'M15 4V2' }, { p: 'M15 16v-2' }, { p: 'M8 9h2' }, { p: 'M20 9h2' }, { p: 'M17.8 11.8L19 13' }, { p: 'M17.8 6.2L19 5' }, { p: 'M3 21l9-9' }, { p: 'M12.2 6.2L11 5' }],
  shield: [{ p: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' }],
  code: [{ pl: [16, 18, 22, 12, 16, 6] }, { pl: [8, 6, 2, 12, 8, 18] }],
  message: [{ p: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' }],
  database: [{ p: 'M12 2c5 0 9 1.3 9 3s-4 3-9 3-9-1.3-9-3 4-3 9-3z' }, { p: 'M21 12c0 1.66-4 3-9 3s-9-1.4-9-3' }, { p: 'M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5' }],
  activity: [{ pl: [22, 12, 18, 12, 15, 21, 9, 3, 6, 12, 2, 12] }],
  users: [{ p: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }, { c: [9, 7, 4] }, { p: 'M23 21v-2a4 4 0 0 0-3-3.87' }, { p: 'M16 3.13a4 4 0 0 1 0 7.75' }],
  briefcase: [{ r: [2, 7, 20, 14, 2] }, { p: 'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' }],
  palette: [{ c: [12, 12, 10] }, { c: [8, 10, 1.2] }, { c: [12, 7, 1.2] }, { c: [16, 10, 1.2] }, { p: 'M12 22a3 3 0 0 0 0-6h-1.5a1.5 1.5 0 0 1 0-3H14' }],
  cloud: [{ p: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z' }],
  home: [{ p: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }, { pl: [9, 22, 9, 12, 15, 12, 15, 22] }],
  eye: [{ p: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' }, { c: [12, 12, 3] }],
  award: [{ c: [12, 8, 7] }, { pl: [8.21, 13.89, 7, 23, 12, 20, 17, 23, 15.79, 13.88] }],
  'map-pin': [{ p: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' }, { c: [12, 10, 3] }],
  list: [{ l: [8, 6, 21, 6] }, { l: [8, 12, 21, 12] }, { l: [8, 18, 21, 18] }, { l: [3, 6, 3.01, 6] }, { l: [3, 12, 3.01, 12] }, { l: [3, 18, 3.01, 18] }],
  hash: [{ l: [4, 9, 20, 9] }, { l: [4, 15, 20, 15] }, { l: [10, 3, 8, 21] }, { l: [16, 3, 14, 21] }],
  minus: [{ l: [5, 12, 19, 12] }],
} satisfies Record<string, Shape[]>;

export type IconName = keyof typeof ICONS;

const MIRRORED: ReadonlySet<IconName> = new Set<IconName>([
  'chevron-left',
  'chevron-right',
  'arrow-left',
  'arrow-right',
  'arrow-up-right',
  'log-out',
  'external-link',
  'send',
  'history',
  'refresh',
]);

export interface IconProps {
  name: IconName;
  size?: number;
  color?: TextColor | string;
  strokeWidth?: number;
  /** Fill the shape with the stroke colour (used for the active bookmark). */
  filled?: boolean;
  /** Mirror horizontally in RTL for directional icons. Defaults to the icon's own setting. */
  mirror?: boolean;
  style?: object;
}

export function Icon({ name, size = 20, color = 'text', strokeWidth = 1.75, filled = false, mirror, style }: IconProps) {
  const { colors } = useTheme();
  const { isRTL } = useI18n();
  const stroke = (color in colors ? colors[color as keyof typeof colors] : color) as string;
  const shouldMirror = (mirror ?? MIRRORED.has(name)) && isRTL;
  const shapes = ICONS[name] as Shape[];

  return (
    <View style={[styles.wrap, { width: size, height: size }, shouldMirror && styles.mirror, style]} accessible={false}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? stroke : 'none'} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {shapes.map((shape, index) => {
          if ('p' in shape) return <Path key={index} d={shape.p} />;
          if ('c' in shape) return <Circle key={index} cx={shape.c[0]} cy={shape.c[1]} r={shape.c[2]} />;
          if ('r' in shape) return <Rect key={index} x={shape.r[0]} y={shape.r[1]} width={shape.r[2]} height={shape.r[3]} rx={shape.r[4]} ry={shape.r[4]} />;
          if ('l' in shape) return <Line key={index} x1={shape.l[0]} y1={shape.l[1]} x2={shape.l[2]} y2={shape.l[3]} />;
          if ('pl' in shape) return <Polyline key={index} points={shape.pl.join(' ')} />;
          return <Polygon key={index} points={shape.pg.join(' ')} />;
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  mirror: { transform: [{ scaleX: -1 }] },
});
