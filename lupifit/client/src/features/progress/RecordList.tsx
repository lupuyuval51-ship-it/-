import type { PersonalRecordDTO } from '@shared/types';
import { Icon } from '../../components/ui';
import { useI18n } from '../../i18n';
import { recordValueText, useFmt } from './format';

/** Personal records with type, value and the previous best they beat. */
export function RecordList({ records, showExercise = true, emptyText }: { records: PersonalRecordDTO[]; showExercise?: boolean; emptyText: string }) {
  const { t, tx, lt, formatDate } = useI18n();
  const fmt = useFmt();
  if (!records.length) return <p className="empty-inline">{emptyText}</p>;
  return (
    <ul className="list record-list">
      {records.map((r) => {
        const type = tx(`enums.prType.${r.recordType}`, undefined, r.recordType);
        return (
          <li key={r.id} className="list-item">
            <span className="record-icon">
              <Icon name="trophy" size={18} />
            </span>
            <div className="record-body">
              <strong className="record-name">{showExercise ? lt(r.exerciseName) : type}</strong>
              <span className="muted small">
                {showExercise ? `${type} · ` : ''}
                {formatDate(r.achievedAt)}
              </span>
            </div>
            <div className="record-value">
              <strong className="num">{recordValueText(r.recordType, r.value, fmt)}</strong>
              {r.previousValue != null && (
                <span className="muted small">{t('progress.records.previous', { value: recordValueText(r.recordType, r.previousValue, fmt) })}</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
