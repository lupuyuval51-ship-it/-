import type { InsightDTO } from '@shared/types';
import { Icon, type IconName } from '../../components/ui';
import { insightMessage, useFmt } from './format';

const TONE_ICON: Record<InsightDTO['tone'], IconName> = { positive: 'sparkles', neutral: 'info', attention: 'warning' };

/** Data-driven insights; unknown codes (from a newer server) are skipped. */
export function InsightList({ insights, limit }: { insights: InsightDTO[]; limit?: number }) {
  const fmt = useFmt();
  const items = insights
    .map((insight) => ({ insight, text: insightMessage(insight, fmt) }))
    .filter((x) => x.text)
    .slice(0, limit);
  return (
    <ul className="insight-list" aria-live="polite">
      {items.map(({ insight, text }, i) => (
        <li key={`${insight.code}-${i}`} className={`insight insight-${insight.tone}`}>
          <span className="insight-icon">
            <Icon name={TONE_ICON[insight.tone]} size={18} />
          </span>
          <p>{text}</p>
        </li>
      ))}
    </ul>
  );
}
