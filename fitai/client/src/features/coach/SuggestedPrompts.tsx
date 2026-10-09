import { useI18n, type TKey } from '../../i18n';

const SUGGESTIONS: TKey[] = [
  'coach.suggestions.technique',
  'coach.suggestions.alternatives',
  'coach.suggestions.progress',
  'coach.suggestions.nutrition',
  'coach.suggestions.meals',
  'coach.suggestions.principles',
  'coach.suggestions.plan',
];

/** Localized starter questions for an empty conversation; picking one sends it. */
export function SuggestedPrompts({ onPick, disabled }: { onPick(text: string): void; disabled?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="coach-suggestions" role="group" aria-label={t('coach.suggestionsLabel')}>
      {SUGGESTIONS.map((key) => (
        <button key={key} type="button" className="chip coach-suggestion" disabled={disabled} onClick={() => onPick(t(key))}>
          {t(key)}
        </button>
      ))}
    </div>
  );
}
