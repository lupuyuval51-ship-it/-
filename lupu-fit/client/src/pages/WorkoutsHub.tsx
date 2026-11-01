import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { useLang } from '../i18n/index.tsx';
import { LinkButton, Loading, Tabs } from '../ui/kit.tsx';
import { GeneratorTab } from '../components/workouts/GeneratorTab.tsx';
import { PlansTab } from '../components/workouts/PlansTab.tsx';
import { ReadyTab } from '../components/workouts/ReadyTab.tsx';
import { usePlans } from '../components/workouts/plansApi.ts';
import '../styles/workouts.css';

type Tab = 'plans' | 'generator' | 'ready';
const isTab = (v: string | null): v is Tab => v === 'plans' || v === 'generator' || v === 'ready';

export default function WorkoutsHub(): ReactNode {
  const { t } = useLang();
  const [params, setParams] = useSearchParams();
  const plans = usePlans();
  const raw = params.get('tab');
  // Default: plans when the person has any, otherwise ready workouts.
  const tab: Tab | null = isTab(raw) ? raw : plans.isLoading ? null : (plans.data?.length ?? 0) > 0 ? 'plans' : 'ready';
  const go = (v: Tab) => setParams({ tab: v }, { replace: true });

  return (
    <div className="stack">
      <div className="wk-head">
        <h1>{t('workouts.title')}</h1>
        <LinkButton to="/workouts/history" size="sm">{t('workouts.historyLink')}</LinkButton>
      </div>
      <Tabs<Tab> label={t('workouts.tabs.label')} value={tab ?? 'ready'} onChange={go} tabs={[
        { value: 'plans', label: t('workouts.tabs.plans') }, { value: 'generator', label: t('workouts.tabs.generator') }, { value: 'ready', label: t('workouts.tabs.ready') },
      ]} />
      <div className="wk-panel" role="tabpanel">
        {tab === null ? <Loading /> : tab === 'plans' ? <PlansTab /> : tab === 'generator' ? <GeneratorTab /> : <ReadyTab />}
      </div>
    </div>
  );
}
