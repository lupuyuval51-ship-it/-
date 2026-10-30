import type { DashboardDTO } from '@shared/types';
import { Icon, LinkButton } from '../../components/ui';
import { useI18n } from '../../i18n';

/** Shown while a workout session is open (in progress or paused). */
export function ResumeBanner({ session }: { session: NonNullable<DashboardDTO['activeSession']> }) {
  const { t, formatTime } = useI18n();
  return (
    <section className="resume-banner" aria-labelledby="resume-title">
      <span className="resume-icon" aria-hidden="true">
        <Icon name={session.status === 'paused' ? 'pause' : 'timer'} size={22} />
      </span>
      <div className="resume-body">
        <h2 id="resume-title" className="resume-title">
          {t('dashboard.resume.title')}
        </h2>
        <p className="muted small">
          {session.status === 'paused'
            ? t('dashboard.resume.paused', { name: session.name })
            : t('dashboard.resume.inProgress', { name: session.name, time: formatTime(session.startedAt) })}
        </p>
      </div>
      <LinkButton to="/workouts/session" variant="primary" icon="play">
        {t('dashboard.resume.action')}
      </LinkButton>
    </section>
  );
}
