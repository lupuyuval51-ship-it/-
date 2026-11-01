import type { ReactNode } from 'react';
import { Wizard } from '../components/onboarding/Wizard.tsx';
import { useProfile } from '../app/session.ts';
import { Loading } from '../ui/kit.tsx';
import '../styles/onboarding.css';

/** First-time onboarding, or "redo" from Profile: an existing profile prefills the wizard instead of defaults. */
export default function Onboarding(): ReactNode {
  const profile = useProfile();
  if (profile.isPending) return <Loading />;
  return <Wizard existing={profile.data?.profile ?? null} />;
}
