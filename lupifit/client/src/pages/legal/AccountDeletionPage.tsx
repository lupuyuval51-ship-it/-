import { LegalPage } from '../../features/legal/LegalDocument';

/**
 * Public deletion instructions (/account-deletion), the URL Google Play asks for. Hosted service: deleting the
 * account. Device mode: there is no account, so it explains erasing the data on the phone. The step labels
 * are read from the real settings strings so they always match the app (features/legal/documents.ts).
 */
export default function AccountDeletionPage() {
  return <LegalPage name="deletion" />;
}
