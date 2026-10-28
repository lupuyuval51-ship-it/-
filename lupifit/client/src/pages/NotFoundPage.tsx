import { EmptyState, LinkButton } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useI18n } from '../i18n';

export default function NotFoundPage() {
  const { t } = useI18n();
  useDocumentTitle(t('common.states.notFound'));
  return (
    <EmptyState
      icon="warning"
      title={t('common.states.notFound')}
      body={t('common.states.notFoundBody')}
      action={
        <LinkButton to="/" variant="primary">
          {t('common.states.goHome')}
        </LinkButton>
      }
    />
  );
}
