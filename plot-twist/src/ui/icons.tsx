import type { SVGProps } from 'react';
import type { Kind } from '../../shared/types.ts';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);
export const IconCoin = (p: IconProps) => (
  <Svg {...p}>
    <ellipse cx="12" cy="12" rx="8.5" ry="8.5" />
    <path d="M9 9.2h4.2a1.9 1.9 0 0 1 0 3.8H10.6a1.9 1.9 0 0 0 0 3.8H15M12 7.3v1.9M12 16.8v1.9" />
  </Svg>
);
export const IconHome = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 11.2 12 4.5l8 6.7V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
  </Svg>
);
export const IconOutside = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="16.5" cy="6.5" r="2.5" />
    <path d="M3 19.5 9 11l4 5 2.5-3 5.5 6.5z" />
  </Svg>
);
export const IconSolo = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c.8-3.6 3.5-5.5 7-5.5s6.2 1.9 7 5.5" />
  </Svg>
);
export const IconGroup = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8.5" r="3" />
    <circle cx="16.5" cy="9.5" r="2.5" />
    <path d="M3 19.5c.6-3 2.8-4.8 6-4.8s5.4 1.8 6 4.8M15.5 14.8c2.6.1 4.6 1.7 5.2 4.2" />
  </Svg>
);
export const IconEnvelope = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
  </Svg>
);
export const IconPause = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 6v12M15 6v12" strokeWidth={2.4} />
  </Svg>
);
export const IconPlay = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none" />
  </Svg>
);
export const IconClose = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" strokeWidth={2.2} />
  </Svg>
);
export const IconSwap = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 7h11l-3-3M17 17H6l3 3" />
  </Svg>
);
export const IconPencil = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14.5 5.5 18.5 9.5M4 20l1-4.5L15.5 5a1.4 1.4 0 0 1 2 0l1.5 1.5a1.4 1.4 0 0 1 0 2L8.5 19z" />
  </Svg>
);
export const IconDownload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" />
  </Svg>
);
export const IconShare = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 15V4m0 0L8 8m4-4 4 4M6 12v6.5a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5V12" />
  </Svg>
);
export const IconArrowLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 12H5m0 0 6-6m-6 6 6 6" />
  </Svg>
);
export const IconArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14m0 0-6-6m6 6-6 6" />
  </Svg>
);
export const IconRefresh = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19.5 8.5A8 8 0 0 0 5 9M4.5 15.5A8 8 0 0 0 19 15M19.5 4v4.5H15M4.5 20v-4.5H9" />
  </Svg>
);
export const IconSparkle = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5c.6 4.4 2.1 5.9 6.5 6.5-4.4.6-5.9 2.1-6.5 6.5-.6-4.4-2.1-5.9-6.5-6.5 4.4-.6 5.9-2.1 6.5-6.5zM18.5 15.5c.3 1.8.9 2.4 2.5 2.7-1.6.3-2.2.9-2.5 2.6-.3-1.7-.9-2.3-2.5-2.6 1.6-.3 2.2-.9 2.5-2.7z" />
  </Svg>
);
export const IconFilm = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="4" width="17" height="16" rx="2" />
    <path d="M7.5 4v16M16.5 4v16M3.5 8h4M3.5 12h4M3.5 16h4M16.5 8h4M16.5 12h4M16.5 16h4" />
  </Svg>
);
export const IconGear = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 13.5a7.7 7.7 0 0 0 0-3l2-1.5-2-3.4-2.3.9a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.5A7.6 7.6 0 0 0 6.9 6.5l-2.3-.9-2 3.4 2 1.5a7.7 7.7 0 0 0 0 3l-2 1.5 2 3.4 2.3-.9a7.6 7.6 0 0 0 2.6 1.5l.5 2.5h4l.5-2.5a7.6 7.6 0 0 0 2.6-1.5l2.3.9 2-3.4z" />
  </Svg>
);
export const IconNote = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3.5h9l3.5 3.5v13.5H6z" />
    <path d="M9 10h6M9 13.5h6M9 17h4" />
  </Svg>
);
export const IconBolt = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13 3 5.5 13.5H11L10 21l8-11h-5.5z" />
  </Svg>
);
export const IconInfo = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5M12 8v.01" strokeWidth={2.2} />
  </Svg>
);

/** Wax-seal glyphs per kind of experience. Drawn in a 24×24 box. */
export function KindGlyph({ kind, size = 22, ...rest }: IconProps & { kind: Kind }) {
  switch (kind) {
    case 'detective':
      return (
        <Svg size={size} {...rest}>
          <circle cx="10.5" cy="10.5" r="5.5" />
          <path d="m14.5 14.5 5 5" strokeWidth={2.2} />
        </Svg>
      );
    case 'maker':
      return (
        <Svg size={size} {...rest}>
          <path d="M12 3.5 14.3 9l5.7.4-4.4 3.7 1.4 5.6L12 15.6 7 18.7l1.4-5.6L4 9.4 9.7 9z" />
        </Svg>
      );
    case 'wanderer':
      return (
        <Svg size={size} {...rest}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="m15.5 8.5-2 5-5 2 2-5z" />
        </Svg>
      );
    case 'social':
      return (
        <Svg size={size} {...rest}>
          <circle cx="9" cy="12" r="5" />
          <circle cx="15" cy="12" r="5" />
        </Svg>
      );
    case 'ritual':
      return (
        <Svg size={size} {...rest}>
          <path d="M15.5 4.5a8 8 0 1 0 4 11.5A6.5 6.5 0 0 1 15.5 4.5z" />
        </Svg>
      );
    case 'game':
      return (
        <Svg size={size} {...rest}>
          <rect x="4.5" y="4.5" width="15" height="15" rx="3" />
          <circle cx="9" cy="9" r="0.9" fill="currentColor" />
          <circle cx="15" cy="15" r="0.9" fill="currentColor" />
          <circle cx="15" cy="9" r="0.9" fill="currentColor" />
          <circle cx="9" cy="15" r="0.9" fill="currentColor" />
        </Svg>
      );
  }
}
