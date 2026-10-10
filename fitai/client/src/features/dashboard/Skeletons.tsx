import { Card, Skeleton } from '../../components/ui';
import { useI18n } from '../../i18n';

/** Layout-matching placeholders so the page does not jump when data arrives. */
export function DashboardSkeleton() {
  const { t } = useI18n();
  return (
    <div className="dash-layout" role="status" aria-busy="true" aria-label={t('dashboard.loading')}>
      <div className="dash-hero">
        <Card className="dash-next">
          <div className="stack-sm">
            <Skeleton height={14} width={96} />
            <Skeleton height={30} width="70%" />
            <Skeleton height={14} width="40%" />
            <div className="row">
              <Skeleton height={24} width={96} radius={999} />
              <Skeleton height={24} width={72} radius={999} />
            </div>
            <Skeleton height={44} width={180} radius={12} />
          </div>
        </Card>
        <Card className="dash-weekly">
          <div className="weekly-hero">
            <Skeleton height={132} width={132} radius={999} />
            <div className="stack-sm" style={{ flex: 1 }}>
              <Skeleton height={20} width="80%" />
              <Skeleton height={14} width="60%" />
              <Skeleton height={28} width="100%" radius={14} />
            </div>
          </div>
        </Card>
      </div>
      <div className="dash-grid">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <div className="stack-sm">
              <Skeleton height={18} width="45%" />
              <Skeleton height={64} />
              <Skeleton height={64} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ProgressSkeleton() {
  const { t } = useI18n();
  return (
    <div className="stack" role="status" aria-busy="true" aria-label={t('progress.loading')}>
      <Card>
        <div className="summary-grid">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height={72} radius={12} />
          ))}
        </div>
      </Card>
      <Card>
        <div className="stack-sm">
          <Skeleton height={18} width="30%" />
          <Skeleton height={180} radius={12} />
        </div>
      </Card>
    </div>
  );
}
