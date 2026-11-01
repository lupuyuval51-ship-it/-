import type { Allergen } from '@lupu-fit/shared';
import type { ReactNode } from 'react';
import { useT } from '../../i18n/index.tsx';
import { Banner, Toggle } from '../../ui/kit.tsx';

/** Warns (and requires an explicit acknowledgement) when an item shares an allergen with the user's profile. */
export function AllergenGate({ hits, ack, onAck }: { hits: readonly Allergen[]; ack: boolean; onAck: (v: boolean) => void }): ReactNode {
  const t = useT();
  if (hits.length === 0) return null;
  const list = hits.map((a) => t(`label.allergen.${a}`)).join(', ');
  return (
    <div className="stack-sm" data-testid="allergen-warning">
      <Banner tone="danger">{t('nutrition.allergen.warn', { list })}</Banner>
      <Toggle label={t('nutrition.allergen.ack')} checked={ack} onChange={onAck} />
    </div>
  );
}
