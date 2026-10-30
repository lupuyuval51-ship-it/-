import { useSearchParams } from 'react-router';
import { LinkButton, PageHeader, Tabs } from '../../components/ui';
import { GeneratorForm } from '../../features/workouts/GeneratorForm';
import { ReadyTab } from '../../features/ready/ReadyTab';
import { PlanList } from '../../features/workouts/PlanList';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';
import '../../styles/workouts.css';
import '../../styles/ux-workouts.css';

type Tab = 'plans' | 'generate' | 'ready';

/** /workouts — "My plans", the AI workout generator (`?tab=generate`) and the ready workouts (`?tab=ready`). */
export default function WorkoutsPage() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const tab: Tab = tabParam === 'generate' || tabParam === 'ready' ? tabParam : 'plans';
  const tabLabel = { plans: t('workouts.tabs.plans'), generate: t('workouts.tabs.generate'), ready: t('ready.tab') }[tab];
  useDocumentTitle(tab === 'plans' ? t('workouts.title') : tabLabel);

  const setTab = (next: Tab) => {
    setParams(next === 'plans' ? {} : { tab: next }, { replace: false });
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
        wrap
        tabs={[
          { value: 'plans', label: t('workouts.tabs.plans') },
          { value: 'generate', label: t('workouts.tabs.generate') },
          { value: 'ready', label: t('ready.tab') },
        ]}
      />
      <div role="tabpanel" aria-label={tabLabel}>
        {tab === 'ready' ? <ReadyTab /> : tab === 'generate' ? <GeneratorForm /> : <PlanList onGenerate={() => setTab('generate')} />}
      </div>
    </div>
  );
}
