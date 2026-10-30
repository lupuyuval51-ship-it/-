import { LegalPage } from '../../features/legal/LegalDocument';

/**
 * Public privacy policy (/privacy). The text depends on the build: the hosted service, or device mode (the
 * app on the phone, no server). Both are in features/legal/documents.ts; every statement must match the code.
 */
export default function PrivacyPage() {
  return <LegalPage name="privacy" />;
}
