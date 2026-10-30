import type { ReactNode } from 'react';
import { Skeleton } from '../../components/ui';
import { useI18n } from '../../i18n';

function Busy({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div role="status" aria-live="polite" className="stack-lg">
      <span className="visually-hidden">{t('common.states.loading')}</span>
      {children}
    </div>
  );
}

/** Placeholder shaped like the plans tab (active plan hero + two plan cards). */
export function PlanListSkeleton() {
  return (
    <Busy>
      <div className="card stack">
        <Skeleton height={24} width="50%" />
        <div className="plan-facts">
          {[70, 90, 80, 90].map((w, i) => (
            <Skeleton key={i} height={24} width={w} radius={999} />
          ))}
        </div>
        <div className="next-workout">
          <Skeleton height={64} />
        </div>
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="card stack">
          <Skeleton height={20} width="40%" />
          <Skeleton height={24} width="75%" radius={999} />
        </div>
      ))}
    </Busy>
  );
}

/** Placeholder shaped like a plan page (hero, week strip, day cards). */
export function PlanDetailSkeleton() {
  return (
    <Busy>
      <div className="stack">
        <Skeleton height={32} width="55%" />
        <div className="grid-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={72} radius={12} />
          ))}
        </div>
      </div>
      <div className="week-strip">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={92} radius={12} />
        ))}
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="card stack">
          <Skeleton height={22} width="35%" />
          {[0, 1, 2].map((j) => (
            <div key={j} className="exercise-row">
              <Skeleton height={72} width={72} radius={12} />
              <div className="exercise-body">
                <Skeleton height={18} width="60%" />
                <Skeleton height={14} width="40%" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </Busy>
  );
}
