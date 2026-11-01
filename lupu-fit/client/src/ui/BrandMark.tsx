import type { ReactNode } from 'react';

/**
 * The LUPU-FIT mark: four hand-drawn marker strokes (--text) crossed by one orange slash (--primary), drawn inline so it
 * follows the theme. `animate` draws the strokes in once (disabled by prefers-reduced-motion).
 */
export function BrandMark({ size = 32, animate = false, className }: { size?: number; animate?: boolean; className?: string }): ReactNode {
  return (
    <svg className={`brand-mark${animate ? ' brand-anim' : ''}${className ? ` ${className}` : ''}`} viewBox="0 0 120 120" width={size} height={size} aria-hidden="true" focusable="false">
      <path className="bm-stroke" d="M14 22 L22 18 L26 24 L25 52 L27 78 L24 101 L16 103 L15 80 L17 54 L13 36 Z" />
      <path className="bm-stroke" d="M38 20 L47 17 L50 26 L49 55 L51 82 L48 102 L40 100 L41 78 L39 56 L40 38 Z" />
      <path className="bm-stroke" d="M62 19 L71 17 L73 30 L72 58 L74 84 L70 101 L63 103 L62 80 L64 60 L61 40 Z" />
      <path className="bm-stroke" d="M86 24 L95 18 L98 28 L96 58 L97 80 L94 100 L87 98 L88 76 L86 56 L89 40 Z" />
      <path className="bm-slash" d="M2 86 L20 80 L36 74 L52 68 L66 56 L84 50 L102 40 L112 33 L118 42 L108 52 L88 62 L70 70 L52 80 L34 88 L16 96 L6 98 Z" />
    </svg>
  );
}

/** Mark + LUPU-FIT wordmark. The wordmark text is a brand name, not translatable copy. */
export function Brand({ size = 28 }: { size?: number }): ReactNode {
  return <span className="brand"><BrandMark size={size} /><span className="wordmark">LUPU<b>-</b>FIT</span></span>;
}
