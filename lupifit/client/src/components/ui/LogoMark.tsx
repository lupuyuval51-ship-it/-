/** LUPIFIT mark: four tally strokes crossed by an orange fifth — the "gate of five" from a training log. */
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g className="logo-mark-bars">
        <rect x="4" y="4" width="2.25" height="16" />
        <rect x="8.5" y="4" width="2.25" height="16" />
        <rect x="13" y="4" width="2.25" height="16" />
        <rect x="17.5" y="4" width="2.25" height="16" />
      </g>
      <line className="logo-mark-slash" x1="1.5" y1="17.5" x2="22.5" y2="6.5" strokeWidth="2.5" />
    </svg>
  );
}
