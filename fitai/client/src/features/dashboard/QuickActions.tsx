import { Button, Card, LinkButton } from '../../components/ui';
import { useI18n } from '../../i18n';

export function QuickActions({ onLogWeight }: { onLogWeight(): void }) {
  const { t } = useI18n();
  return (
    <Card title={t('dashboard.quick.title')} className="dash-quick">
      <div className="quick-actions">
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
      </div>
    </Card>
  );
}
