import { SPORTS, type SportId } from '@shared/constants';
import { Card } from '../../components/ui';
import { useI18n } from '../../i18n';
import { ChoiceChips } from '../exercises/ChoiceChips';

/**
 * "Do you train a specific sport?" - None plus every sport. Choosing one adds the 10-minute finisher at the
 * end of the workout; the choice is remembered by the caller.
 */
export function SportPicker({ value, onChange, busy }: { value: SportId | null; onChange(sport: SportId | null): void; busy?: boolean }) {
  const { t } = useI18n();
  return (
    <Card as="section" title={t('ready.sport.question')} subtitle={t('ready.sport.hint')} className="ready-sport">
      <ChoiceChips<SportId>
        label={t('ready.sport.question')}
        value={value}
        onChange={onChange}
        options={[{ value: null, label: t('ready.sport.none') }, ...SPORTS.map((s) => ({ value: s, label: t(`enums.sport.${s}`) }))]}
      />
      {busy && (
        <p className="small muted" role="status">
          {t('ready.sport.updating')}
        </p>
      )}
    </Card>
  );
}
