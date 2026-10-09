import { useSearchParams } from 'react-router';
import { LinkButton, PageHeader, Tabs } from '../../components/ui';
import { GeneratorForm } from '../../features/workouts/GeneratorForm';
import { PlanList } from '../../features/workouts/PlanList';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';
import '../../styles/workouts.css';

type Tab = 'plans' | 'generate';

/** /workouts — "My plans" and the AI workout generator (`?tab=generate` deep link). */
export default function WorkoutsPage() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'generate' ? 'generate' : 'plans';
  useDocumentTitle(tab === 'generate' ? t('workouts.tabs.generate') : t('workouts.title'));

  const setTab = (next: Tab) => {
    setParams(next === 'generate' ? { tab: 'generate' } : {}, { replace: false });
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="stack-lg workouts-page">
      <PageHeader
        title={t('workouts.title')}
        subtitle={t('workouts.subtitle')}
        actions={
          <>
            <LinkButton to="/workouts/history" size="sm" icon="calendar">
              {t('workouts.links.history')}
            </LinkButton>
            <LinkButton to="/exercises" size="sm" icon="list">
              {t('workouts.links.library')}
            </LinkButton>
          </>
        }
      />
      <Tabs<Tab>
        label={t('workouts.tabs.label')}
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'plans', label: t('workouts.tabs.plans') },
          { value: 'generate', label: t('workouts.tabs.generate') },
        ]}
      />
      <div role="tabpanel" aria-label={tab === 'generate' ? t('workouts.tabs.generate') : t('workouts.tabs.plans')}>
        {tab === 'generate' ? <GeneratorForm /> : <PlanList onGenerate={() => setTab('generate')} />}
      </div>
    </div>
  );
}
