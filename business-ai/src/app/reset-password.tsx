import { ResetPasswordView } from '@/features/auth/components/ResetPasswordView';

/**
 * Outside the (auth) group on purpose: the recovery link signs the user in, and this screen must
 * stay reachable while signed in (the root guards would otherwise redirect away from (auth)).
 */
export default function ResetPasswordRoute() {
  return <ResetPasswordView />;
}
