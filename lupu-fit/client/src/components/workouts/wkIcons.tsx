import type { ReactNode, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = (d: ReactNode) => function Icon(p: P): ReactNode {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...p}>{d}</svg>;
};
export const IconGym = base(<><path d="M6 7v10M18 7v10M3 9.500v5M21 9.500v5M6 12h12" /></>);
export const IconHouse = base(<><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>);
export const IconTree = base(<><path d="M12 21v-6" /><path d="M12 3c3.500 3 5.500 6 5.500 8.500a5.500 5.500 0 0 1-11 0C6.500 9 8.500 6 12 3z" /><path d="M7 21h10" /></>);
export const IconBody = base(<><circle cx="12" cy="5" r="2" /><path d="M12 8v6M7 10l5-2 5 2M9 21l3-7 3 7" /></>);
export const IconKettle = base(<><path d="M9 7a3 3 0 0 1 6 0" /><path d="M7 11a6 6 0 0 1 10 0c2 2 1.500 9-5 9s-7-7-5-9z" /></>);
export const IconNone = base(<><circle cx="12" cy="12" r="8" /><path d="M6.500 6.500l11 11" /></>);
