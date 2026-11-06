import type { ReactNode } from 'react';
import { LegalDoc } from '../components/onboarding/LegalDoc.tsx';
import { IS_DEVICE } from '../env.ts';

/** The standalone Device Mode build has its own text (no account, no server); the hosted build keeps the operator-based one. */
export default function Terms(): ReactNode { return <LegalDoc base={IS_DEVICE ? 'legalDev.terms' : 'legal.terms'} />; }
