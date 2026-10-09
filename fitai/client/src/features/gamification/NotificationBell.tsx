import { Link } from 'react-router';
import { Icon } from '../../components/ui';
import { useI18n } from '../../i18n';

/** Header bell with unread count. Owned by the gamification/progress feature. */
export function NotificationBell() {
  const { t } = useI18n();
  return (
    <Link to="/notifications" className="btn btn-ghost btn-icon" aria-label={t('nav.notifications')} title={t('nav.notifications')}>
      <Icon name="bell" />
    </Link>
  );
}
