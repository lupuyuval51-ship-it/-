import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import type { IdeaIdentity } from '@/data/types';
import { fonts } from '@/theme/fonts';
import { identityTint, useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

export interface IdeaTileProps {
  identity: IdeaIdentity;
  size?: number;
}

function Pattern({ pattern, color, size }: { pattern: IdeaIdentity['pattern']; color: string; size: number }) {
  if (pattern === 'none') return null;
  const s = size;
  if (pattern === 'grid') {
    const step = s / 4;
    return (
      <Svg width={s} height={s} style={StyleSheet.absoluteFill}>
        {[1, 2, 3].map((i) => (
          <Line key={`v${i}`} x1={i * step} y1={0} x2={i * step} y2={s} stroke={color} strokeWidth={1} />
        ))}
        {[1, 2, 3].map((i) => (
          <Line key={`h${i}`} x1={0} y1={i * step} x2={s} y2={i * step} stroke={color} strokeWidth={1} />
        ))}
      </Svg>
    );
  }
  if (pattern === 'dots') {
    const step = s / 4;
    const dots: { x: number; y: number }[] = [];
    for (let x = 1; x < 4; x += 1) for (let y = 1; y < 4; y += 1) dots.push({ x: x * step, y: y * step });
    return (
      <Svg width={s} height={s} style={StyleSheet.absoluteFill}>
        {dots.map((d, i) => (
          <Circle key={i} cx={d.x} cy={d.y} r={1.5} fill={color} />
        ))}
      </Svg>
    );
  }
  if (pattern === 'diagonal') {
    return (
      <Svg width={s} height={s} style={StyleSheet.absoluteFill}>
        {[-0.5, 0, 0.5, 1].map((offset, i) => (
          <Line key={i} x1={offset * s} y1={s} x2={(offset + 1) * s} y2={0} stroke={color} strokeWidth={1} />
        ))}
      </Svg>
    );
  }
  if (pattern === 'ring') {
    return (
      <Svg width={s} height={s} style={StyleSheet.absoluteFill}>
        <Circle cx={s * 0.72} cy={s * 0.28} r={s * 0.42} stroke={color} strokeWidth={1} fill="none" />
        <Circle cx={s * 0.72} cy={s * 0.28} r={s * 0.26} stroke={color} strokeWidth={1} fill="none" />
      </Svg>
    );
  }
  // wave
  const d = `M0 ${s * 0.72} C ${s * 0.25} ${s * 0.55}, ${s * 0.5} ${s * 0.9}, ${s * 0.75} ${s * 0.72} S ${s * 1.1} ${s * 0.55}, ${s * 1.25} ${s * 0.72}`;
  return (
    <Svg width={s} height={s} style={StyleSheet.absoluteFill}>
      <Path d={d} stroke={color} strokeWidth={1} fill="none" />
      <Path d={d} stroke={color} strokeWidth={1} fill="none" transform={`translate(0, ${-s * 0.18})`} />
      <Path d={d} stroke={color} strokeWidth={1} fill="none" transform={`translate(0, ${-s * 0.36})`} />
    </Svg>
  );
}

/**
 * The idea's visual identity: a tinted tile with a quiet geometric pattern and
 * a serif monogram. No illustrations, no gradients – just type and geometry.
 */
export function IdeaTile({ identity, size = 56 }: IdeaTileProps) {
  const { scheme } = useTheme();
  const tint = identityTint(identity.hue, scheme);
  const fontSize = Math.round(size * 0.36);
  return (
    <View style={[styles.tile, { width: size, height: size, backgroundColor: tint.background, borderColor: tint.border, borderRadius: size >= 72 ? radius.xl : radius.md }]}>
      <Pattern pattern={identity.pattern} color={tint.border} size={size} />
      <AppText forceLtr align="center" style={{ fontFamily: fonts.serifBold, fontSize, lineHeight: fontSize * 1.15, color: tint.foreground, letterSpacing: -0.5 }}>
        {identity.glyph}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
