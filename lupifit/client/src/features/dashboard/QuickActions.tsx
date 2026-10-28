import { Button, LinkButton } from '../../components/ui';
import { useI18n } from '../../i18n';

/** One slim row of shortcuts under the hero (wraps to a 2x2 grid on phones). */
export function QuickActions({ onLogWeight }: { onLogWeight(): void }) {
  const { t } = useI18n();
  return (
    <nav className="quick-actions" aria-label={t('dashboard.quick.title')}>
      <Button icon="scale" onClick={onLogWeight}>
        {t('dashboard.quick.logWeight')}
      </Button>
      <LinkButton to="/coach" icon="chat">
        {t('dashboard.quick.askCoach')}
      </LinkButton>
      <LinkButton to="/exercises" icon="list">
        {t('dashboard.quick.library')}
      </LinkButton>
      <LinkButton to="/progress" icon="chart">
        {t('dashboard.quick.progress')}
      </LinkButton>
    </nav>
  );
}
