import type { ReactNode, SVGProps } from 'react';

const svg = (p: SVGProps<SVGSVGElement>, d: ReactNode): ReactNode => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...p}>{d}</svg>
);
export const IconMore = (p: SVGProps<SVGSVGElement>): ReactNode => svg(p, <><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></>);
export const IconBarbell = (p: SVGProps<SVGSVGElement>): ReactNode => svg(p, <path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12" />);
export const IconSwap = (p: SVGProps<SVGSVGElement>): ReactNode => svg(p, <path d="M4 8h14l-4-4M20 16H6l4 4" />);
export const IconList = (p: SVGProps<SVGSVGElement>): ReactNode => svg(p, <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />);
