import { useI18n } from '../../i18n';
import '../../styles/ux-onboarding.css';
import { passwordChecks, passwordStrength } from './password';

/**
 * Live checklist for a new password. Every rule has a words state (not colour-only) and a
 * polite live region announces only the overall level, so typing is not noisy.
 */
export function PasswordStrength({ password, id }: { password: string; id: string }) {
  const { t } = useI18n();
  const checks = passwordChecks(password);
  const level = passwordStrength(password);
  const rules = [
    { key: 'length', ok: checks.length, label: t('auth.password.rules.length') },
    { key: 'letter', ok: checks.letter, label: t('auth.password.rules.letter') },
    { key: 'number', ok: checks.number, label: t('auth.password.rules.number') },
  ] as const;
  return (
    <div className="password-strength" id={id} data-level={level}>
      <p className="field-hint">{level === 'empty' ? t('auth.fields.passwordHint') : `${t('auth.password.strengthLabel')}: ${t(`auth.password.level.${level}`)}`}</p>
      <span className="visually-hidden" role="status" aria-live="polite">
        {level === 'empty' ? '' : t(`auth.password.level.${level}`)}
      </span>
      <ul className="password-rules">
        {rules.map((r) => (
          <li key={r.key} data-ok={r.ok}>
            <span aria-hidden="true">{r.ok ? '✓' : '○'}</span> {r.label}
            <span className="visually-hidden"> — {r.ok ? t('auth.password.met') : t('auth.password.unmet')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
