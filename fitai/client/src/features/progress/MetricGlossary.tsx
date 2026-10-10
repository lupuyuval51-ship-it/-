import { Card } from '../../components/ui';
import { useI18n } from '../../i18n';
import '../../styles/ux-progress.css';

const TERMS = ['volume', 'est1rm', 'consistency', 'previous', 'adherence', 'proteinDays', 'bodyWeight'] as const;

/** "What do these numbers mean?" — a collapsed, keyboard-operable glossary of every metric on the page. */
export function MetricGlossary() {
  const { t } = useI18n();
  return (
    <Card className="progress-glossary">
      <details>
        <summary>{t('progress.glossary.title')}</summary>
        <dl className="progress-glossary-list">
          {TERMS.map((term) => (
            <div key={term}>
              <dt>{t(`progress.glossary.terms.${term}.name`)}</dt>
              <dd>{t(`progress.glossary.terms.${term}.body`)}</dd>
            </div>
          ))}
        </dl>
      </details>
    </Card>
  );
}
