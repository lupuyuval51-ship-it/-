/**
 * Device mode, first run: a short welcome that asks only for a name (the display name of the hidden device
 * account), then the onboarding questionnaire. Someone moving from another phone can restore a backup file
 * here instead. Never shown in server mode (the route redirects) or after onboarding.
 */
import { useMutation } from '@tanstack/react-query';
import { useRef, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '../../auth/AuthProvider';
import { Button, Icon, Notice, TextField } from '../../components/ui';
import { DeviceRestoreButton } from '../../features/device/DeviceRestore';
import { markWelcomed } from '../../features/device/control';
import { updateSettings } from '../../features/profile/api';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { translate, useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import '../../styles/device.css';

/** The name the device account was created with ("Me" / "אני"): not a name the person chose. */
const isDefaultName = (name: string) => name === translate('en', 'device.defaultName') || name === translate('he', 'device.defaultName');

export default function WelcomePage() {
  const i18n = useI18n();
  const { t, locale } = i18n;
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(() => (user && !isDefaultName(user.displayName) ? user.displayName : ''));
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useDocumentTitle(t('device.welcome.title'));

  const save = useMutation({
    // The language picked on this screen becomes the account's (the app follows the account's language).
    mutationFn: (displayName: string) => updateSettings({ displayName, locale }),
    onSuccess: (res) => {
      setUser(res.user);
      markWelcomed(res.user.id);
      navigate('/onboarding', { replace: true });
    },
    onError: (err) => setError(errorMessage(err, i18n, 'settings')),
  });

  if (!user) return null;
  if (user.onboardingCompleted) return <Navigate to="/" replace />;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (save.isPending) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('device.welcome.nameRequired'));
      inputRef.current?.focus();
      return;
    }
    setError(null);
    save.mutate(trimmed.slice(0, 60));
  };

  return (
    <div className="welcome">
      <section className="welcome-intro">
        <h1 className="welcome-title">{t('device.welcome.title')}</h1>
        <p className="welcome-lead">{t('device.welcome.body')}</p>
      </section>
      <form className="welcome-form" onSubmit={onSubmit} noValidate>
        <TextField
          ref={inputRef}
          label={t('device.welcome.nameLabel')}
          hint={t('device.welcome.nameHint')}
          name="displayName"
          autoComplete="nickname"
          enterKeyHint="go"
          maxLength={60}
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          error={error && !save.isError ? error : undefined}
        />
        {save.isError && error && <Notice tone="danger">{error}</Notice>}
        <Button type="submit" variant="primary" size="lg" block iconEnd="chevronRight" loading={save.isPending}>
          {t('device.welcome.start')}
        </Button>
        <p className="welcome-local small muted">
          <Icon name="info" size={16} />
          <span>{t('device.welcome.local')}</span>
        </p>
      </form>
      <section className="welcome-restore" aria-labelledby="welcome-restore-title">
        <h2 id="welcome-restore-title" className="section-title">
          {t('device.welcome.restoreTitle')}
        </h2>
        <p className="small muted">{t('device.welcome.restoreBody')}</p>
        <div>
          <DeviceRestoreButton replacing={false} />
        </div>
      </section>
    </div>
  );
}
